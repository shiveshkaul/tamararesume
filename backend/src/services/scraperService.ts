import crypto from 'crypto';
import db, { dataDir } from '../db/schema';
import fs from 'fs';
import path from 'path';
import { ScrapedJob } from '../types';

// SSE clients for real-time job notifications
const sseClients: Set<any> = new Set();

export function addSSEClient(res: any): void {
  sseClients.add(res);
  res.on('close', () => sseClients.delete(res));
}

export function notifyNewJobs(jobs: ScrapedJob[]): void {
  const data = JSON.stringify(jobs);
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch { /* client disconnected */ }
  }
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function hashJob(url: string, title: string, company: string): string {
  return crypto.createHash('md5').update(`${url}|${title}|${company}`).digest('hex');
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  return delay(1500 + Math.random() * 2000); // 1.5 - 3.5s delay
}

// Check if a date string is strictly older than 7 days
function isTooOld(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = dateStr.toLowerCase();
  
  // Quick string checks for massive age
  if (d.includes('monat') || d.includes('month') || d.includes('30 tage') || d.includes('30+')) return true;
  if (/^([1-9][0-9]+)\s*(days|tage)/.test(d)) return true; // 10+ days (two digits)
  
  // Explicitly check for single digits 8 or 9
  if (/\b[8-9]\s*(days|tage|tag|day)\b/.test(d)) return true;

  // Weeks
  if (d.includes('woche') || d.includes('week')) {
    const match = d.match(/(\d+)\s*(woche|week)/);
    if (match && parseInt(match[1]) >= 1) return true; // Any mention of 'weeks' is generally > 7 days
    if (!match) return true; // "Vor einer Woche"
  }
  
  return false;
}

// Ruthless filter to eliminate student, internship, and trainee roles
function isInternship(job: { title?: string, descriptionShort?: string }): boolean {
  const combinedText = [job.title, job.descriptionShort].join(' ').toLowerCase();
  
  // Highly exhaustive German and English student/internship regex
  const internRegex = /(werkstudent|working\s*student|studentische|internship|\bintern\b|praktikum|praktikant|trainee|ausbildung|schüler|bachelorand|masterand|abschlussarbeit)/i;
  
  return internRegex.test(combinedText);
}

// Highly intelligent post-scrape regex filter for guaranteeing remote roles
function isStrictlyRemote(job: { title?: string, location?: string, descriptionShort?: string }): boolean {
  const combinedText = [job.title, job.location, job.descriptionShort].join(' ').toLowerCase();
  
  // Encompasses common German and English WFH variations
  const remoteRegex = /(remote|home\s*office|home-office|telearbeit|work from home|wfh|mobiles\s*arbeiten|ortsungebunden|100%\s*remote)/i;
  
  // Explicitly reject phrases indicating full on-site requirement masking as remote
  const rejectionRegex = /(kein\s*homeoffice|no\s*remote|100%\s*vor\s*ort|on-site\s*only|ausschließlich\s*vor\s*ort)/i;

  return remoteRegex.test(combinedText) && !rejectionRegex.test(combinedText);
}

// -----------------------------------------------------------------------------
// BIG KEYWORD ARRAY (120+ German IT terms)
// -----------------------------------------------------------------------------
const MASTER_KEYWORDS = [
  "IT", "Informatik", "Information Technology", "IT-Mitarbeiter", "IT-Fachkraft", "IT-Spezialist", "IT-Administrator", "IT-Support", "IT-Koordinator", "IT-Sachbearbeiter", "IT-Quereinsteiger", "IT-Berufseinsteiger", "Digitalisierung", "Digital", "EDV", "EDV-Mitarbeiter", "EDV-Sachbearbeiter", "Datenverarbeitung", "Technischer Support", "Technical Support", "Helpdesk", "Help Desk", "Service Desk", "Servicedesk", "IT-Helpdesk",
  "Systemadministrator", "Systemadministratorin", "Sysadmin", "System Administrator", "Netzwerkadministrator", "Netzwerktechniker", "Network Administrator", "IT-Infrastruktur", "Infrastructure Engineer", "Windows Administrator", "Linux Administrator", "Active Directory", "Azure Administrator", "Cloud Administrator", "Serveradministrator", "IT-Systemtechniker", "IT-Systembetreuer", "IT-Systemkaufmann", "IT-Systemkauffrau", "Fachinformatiker Systemintegration", "Fachinformatikerin Systemintegration", "Fachinformatiker", "Fachinformatikerin",
  "Softwareentwickler", "Softwareentwicklerin", "Software Developer", "Software Engineer", "Junior Developer", "Junior Software Engineer", "Junior Entwickler", "Webentwickler", "Web Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Fullstack Entwickler", "Anwendungsentwickler", "Fachinformatiker Anwendungsentwicklung", "Applikationsentwickler", "Programmierer", "Programmiererin", "Python Entwickler", "Java Entwickler", "Junior Programmer",
  "Datenanalyst", "Data Analyst", "Junior Data Analyst", "Dateningenieur", "Data Engineer", "Junior Data Engineer", "Business Intelligence", "BI Analyst", "BI Entwickler", "Datenbankadministrator", "Datenbankentwickler", "Database Administrator", "SQL Entwickler", "Data Specialist", "Datenmanager", "Datenbeauftragter", "Reporting Analyst", "ETL Entwickler", "Power BI", "Tableau Analyst",
  "Cloud Engineer", "Cloud Specialist", "Cloud Administrator", "DevOps Engineer", "Junior DevOps", "AWS Engineer", "Azure Engineer", "Google Cloud", "Cloud Techniker", "Platform Engineer", "Site Reliability Engineer", "SRE", "Infrastructure as Code", "Kubernetes", "Docker Engineer", "CI/CD",
  "IT-Sicherheit", "IT Security", "Cybersecurity", "Informationssicherheit", "IT-Sicherheitsbeauftragter", "Information Security Officer", "Junior Security Analyst", "Security Analyst", "Datenschutzbeauftragter", "DSGVO Spezialist", "Compliance IT", "Security Engineer", "Penetration Tester", "Junior Pentester",
  "SAP", "SAP Berater", "SAP Consultant", "SAP Anwender", "SAP Administrator", "SAP Key User", "ERP Berater", "ERP Spezialist", "SAP Basis", "SAP MM", "SAP SD", "SAP FI", "SAP HR", "DATEV", "DATEV Anwender", "Odoo", "Microsoft Dynamics", "Navision", "ERP Administrator", "Business Central",
  "Microsoft 365", "MS365 Administrator", "Office 365", "SharePoint Administrator", "SharePoint Entwickler", "Microsoft Teams", "Exchange Administrator", "Intune", "Azure Active Directory", "Microsoft Entra", "M365 Spezialist", "Power Platform", "Power Automate", "Power Apps",
  "Prozessautomatisierung", "Automatisierung", "RPA", "Robotic Process Automation", "IT-Prozessmanager", "Workflow Automation", "n8n", "Zapier Spezialist", "IT-Projektkoordinator", "Digitale Transformation", "Digitalisierungsbeauftragter", "IT-Projektmanager", "Junior IT Projektmanager", "Business Analyst IT", "IT Business Analyst",
  "Künstliche Intelligenz", "KI Spezialist", "KI Koordinator", "AI Specialist", "Machine Learning", "Machine Learning Engineer", "Junior ML Engineer", "Data Scientist", "Junior Data Scientist", "AI Coordinator", "AI Tools", "Prompt Engineer", "LLM Engineer", "NLP Engineer", "AI Operations", "KI Berater", "AI Berater", "KI Einsteiger",
  "IT-Projektleiterin", "Project Manager IT", "Scrum Master", "Junior Scrum Master", "Agile Coach IT", "IT-Teamleiter", "IT-Leitung", "Produktmanager IT", "Product Owner", "Junior Product Owner",
  "Softwaretester", "Software Tester", "QA Engineer", "Qualitätssicherung IT", "Test Analyst", "Junior Tester", "QA Analyst", "Testautomatisierung", "Test Automation Engineer", "UAT Tester",
  "Network Engineer", "Netzwerkingenieur", "VoIP Techniker", "Telekommunikationstechniker", "IT-Netzwerk", "Cisco Administrator", "Firewall Administrator", "Network Specialist",
  "IT-Einkäufer", "IT Asset Management", "IT Lizenzmanager", "Software Asset Manager", "IT Beschaffung", "Vendor Manager IT", "IT-Controller", "IT-Kaufmann", "IT-Kauffrau",
  "Techniker", "Technikerin", "Quereinsteiger IT", "Berufseinsteiger Informatik", "Junior IT", "Junior Informatik", "IT Trainee", "Trainee IT", "IT Werkstudent", "IT Praktikant", "Duales Studium Informatik", "IT Ausbildung", "IT Umschulung", "IT Allrounder", "IT Generalist", "Digitaler Mitarbeiter", "Digital Native", "IT Remote", "Remote IT Deutschland", "Homeoffice IT", "IT teilzeit", "IT Vollzeit", "IT Minijob", "IT Festanstellung"
];

function getRandomKeywords(count: number): string[] {
  const shuffled = [...MASTER_KEYWORDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

interface PlatformConfig {
  name: string;
  buildUrl: (keyword: string, page: number, wfhOnly: boolean) => string;
  parseJobs: (page: any) => Promise<ScrapedJob[]>;
}

// Build the scraper configurations for ALL 29 GERMAN PLATFORMS
function getPlatforms(): PlatformConfig[] {
  return [
    {
      name: 'stepstone',
      buildUrl: (kw, pg, wfh) => `https://www.stepstone.de/jobs/${encodeURIComponent(kw)}/in-deutschland?page=${pg + 1}${wfh ? '&remote=true' : ''}&date=7`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('[data-testid="job-item"], article[data-at], .ResultsSectionContainer-sc [class*="Job"]', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, [data-at="job-item-title"]')?.textContent?.trim() || '',
              company: el.querySelector('[data-at="job-item-company-name"], [class*="company"]')?.textContent?.trim() || '',
              location: el.querySelector('[data-at="job-item-location"], [class*="location"]')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              descriptionShort: el.querySelector('[class*="snippet"], [class*="description"]')?.textContent?.trim() || '',
              postedDate: el.querySelector('[data-at="job-item-time"], time, [class*="date"], [class*="posted"], [class*="ago"], [class*="time"], [class*="Date"]')?.textContent?.trim() || el.querySelector('time')?.getAttribute('datetime') || '',
              platform: 'stepstone',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'indeed',
      buildUrl: (kw, pg, wfh) => `https://de.indeed.com/jobs?q=${encodeURIComponent(kw)}&l=Deutschland&start=${pg * 10}&fromage=7${wfh ? '&sc=0kf%3Aattr(DSQF7)%3B' : ''}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.job_seen_beacon, .jobsearch-ResultsList .result', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, .jobTitle')?.textContent?.trim() || '',
              company: el.querySelector('[data-testid="company-name"], .companyName')?.textContent?.trim() || '',
              location: el.querySelector('[data-testid="text-location"], .companyLocation')?.textContent?.trim() || '',
              url: 'https://de.indeed.com' + (el.querySelector('a')?.getAttribute('href') || ''),
              descriptionShort: el.querySelector('.job-snippet, .underShelfFooter')?.textContent?.trim() || '',
              postedDate: el.querySelector('.date')?.textContent?.trim() || '',
              platform: 'indeed',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'xing',
      buildUrl: (kw, pg, wfh) => `https://www.xing.com/jobs/search?keywords=${encodeURIComponent(kw)}&location=Deutschland${wfh ? '&remote=true' : ''}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('article, .job-card', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, h3, .job-title')?.textContent?.trim() || '',
              company: el.querySelector('.company-name, [class*="company"]')?.textContent?.trim() || '',
              location: el.querySelector('.location, [class*="location"]')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              descriptionShort: '',
              postedDate: el.querySelector('time, [class*="date"], [class*="posted"], [class*="ago"], [class*="time"]')?.textContent?.trim() || el.querySelector('time')?.getAttribute('datetime') || '',
              platform: 'xing',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'linkedin',
      buildUrl: (kw, pg, wfh) => `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(kw)}&location=Germany&f_TPR=r604800&start=${pg * 25}${wfh ? '&f_WT=2' : ''}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.jobs-search__results-list li, .base-card', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('.base-search-card__title, h3')?.textContent?.trim() || '',
              company: el.querySelector('.base-search-card__subtitle, h4')?.textContent?.trim() || '',
              location: el.querySelector('.job-search-card__location')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              postedDate: el.querySelector('.job-search-card__listdate')?.textContent?.trim() || '',
              descriptionShort: '',
              platform: 'linkedin',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'monster',
      buildUrl: (kw, pg, wfh) => `https://www.monster.de/jobs/suche/?q=${encodeURIComponent(kw)}&where=Deutschland&recency=7${wfh ? '&wfh=true' : ''}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('[data-testid="job-card-container"]', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('[data-testid="job-title"]')?.textContent?.trim() || '',
              company: el.querySelector('[data-testid="company-name"]')?.textContent?.trim() || '',
              location: el.querySelector('[data-testid="job-location"]')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              postedDate: el.querySelector('time, [class*="date"], [class*="posted"], [class*="ago"]')?.textContent?.trim() || el.querySelector('time')?.getAttribute('datetime') || '',
              descriptionShort: '',
              platform: 'monster',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'jobware',
      buildUrl: (kw, pg, wfh) => `https://www.jobware.de/search?query=${encodeURIComponent(kw)}${wfh ? '%20Homeoffice' : ''}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('job-lane, .job-box', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, .title')?.textContent?.trim() || '',
              company: el.querySelector('.company, .unternehmen')?.textContent?.trim() || '',
              location: el.querySelector('.location, .ort')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              postedDate: el.querySelector('time, [class*="date"], [class*="posted"], [class*="ago"]')?.textContent?.trim() || el.querySelector('time')?.getAttribute('datetime') || '',
              descriptionShort: '',
              platform: 'jobware',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'arbeitsagentur',
      buildUrl: (kw, pg, wfh) => `https://jobsuche.arbeitsagentur.de/web/suche/bewerber/suche?was=${encodeURIComponent(kw)}&wo=Deutschland${wfh ? '&arbeitgebermodell=HOMEOFFICE' : ''}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('jb-job-listen-eintrag, .result-item, .ergebnisliste-item', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, .ergebnis-titel')?.textContent?.trim() || '',
              company: el.querySelector('.arbeitgeber, .unternehmen')?.textContent?.trim() || '',
              location: el.querySelector('.arbeitsort, .ort')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              postedDate: el.querySelector('.veroeffentlichungsdatum')?.textContent?.trim() || '',
              descriptionShort: '',
              platform: 'arbeitsagentur',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'stellenanzeigen',
      buildUrl: (kw, pg, wfh) => `https://www.stellenanzeigen.de/suche/?q=${encodeURIComponent(kw)}&l=Deutschland${wfh ? '&remote=1' : ''}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.job-list-items article, .job', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, h3')?.textContent?.trim() || '',
              company: el.querySelector('.company, .employer')?.textContent?.trim() || '',
              location: el.querySelector('.location, .city')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              postedDate: el.querySelector('time, [class*="date"], [class*="posted"], [class*="ago"]')?.textContent?.trim() || el.querySelector('time')?.getAttribute('datetime') || '',
              descriptionShort: '',
              platform: 'stellenanzeigen',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'jobs_de',
      buildUrl: (kw, pg, wfh) => `https://www.jobs.de/stellenangebote/?q=${encodeURIComponent(kw)}&l=Deutschland${wfh ? '&remote=true' : ''}`,
      parseJobs: async (page) => { return []; /* Basic fallback as DOM heavily varies */ }
    },
    {
      name: 'jobboerse',
      buildUrl: (kw, pg, wfh) => `https://www.jobbörse.de/suche/?q=${encodeURIComponent(kw)}${wfh ? '&homeoffice=1' : ''}`,
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'kimeta',
      buildUrl: (kw, pg, wfh) => `https://www.kimeta.de/stellenangebote?q=${encodeURIComponent(kw)}${wfh ? '%20homeoffice' : ''}&p=${pg + 1}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.listitem, .job-item, article', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2 a, .job-title, h3')?.textContent?.trim() || '',
              company: el.querySelector('.company, .employer')?.textContent?.trim() || '',
              location: el.querySelector('.location, .place')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              postedDate: el.querySelector('time, [class*="date"], [class*="posted"], [class*="ago"]')?.textContent?.trim() || el.querySelector('time')?.getAttribute('datetime') || '',
              descriptionShort: '',
              platform: 'kimeta',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'yourfirm',
      buildUrl: (kw, pg, wfh) => `https://www.yourfirm.de/stellenangebote/?q=${encodeURIComponent(kw)}${wfh ? '%20Homeoffice' : ''}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('article.job, .job-result', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, .title')?.textContent?.trim() || '',
              company: el.querySelector('.company')?.textContent?.trim() || '',
              location: el.querySelector('.location')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              postedDate: el.querySelector('time, [class*="date"], [class*="posted"], [class*="ago"]')?.textContent?.trim() || el.querySelector('time')?.getAttribute('datetime') || '',
              descriptionShort: '',
              platform: 'yourfirm',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'hogapage',
      buildUrl: (kw, pg, wfh) => `https://www.hogapage.de/jobs/suche?q=${encodeURIComponent(kw)}`,
      // Niche hospitality platform - less likely to yield pure IT, skip heavy DOM
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'academics',
      buildUrl: (kw, pg, wfh) => `https://www.academics.de/jobs/suche?q=${encodeURIComponent(kw)}${wfh ? '&remote=true' : ''}`,
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'experteer',
      buildUrl: (kw, pg, wfh) => `https://www.experteer.de/jobs/search?q=${encodeURIComponent(kw)}${wfh ? '&home_office=true' : ''}`,
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'absolventa',
      buildUrl: (kw, pg, wfh) => `https://www.absolventa.de/jobs?utf8=%E2%9C%93&search%5Bkeyword%5D=${encodeURIComponent(kw)}&page=${pg + 1}${wfh ? '&search%5Bremote%5D=true' : ''}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.job-item, .job-result, article', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, .job-title')?.textContent?.trim() || '',
              company: el.querySelector('.company, .employer')?.textContent?.trim() || '',
              location: el.querySelector('.location')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              postedDate: el.querySelector('time, [class*="date"], [class*="posted"], [class*="ago"]')?.textContent?.trim() || el.querySelector('time')?.getAttribute('datetime') || '',
              descriptionShort: '',
              platform: 'absolventa',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'azubiyo',
      buildUrl: (kw, pg, wfh) => `https://www.azubiyo.de/stellenmarkt/?q=${encodeURIComponent(kw)}`,
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'staufenbiel',
      buildUrl: (kw, pg, wfh) => `https://www.staufenbiel.de/jobsuche?q=${encodeURIComponent(kw)}`,
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'get-in-it',
      buildUrl: (kw, pg, wfh) => `https://www.get-in-it.de/jobs?q=${encodeURIComponent(kw)}${wfh ? '&homeoffice=true' : ''}`,
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'it-jobs',
      buildUrl: (kw, pg, wfh) => `https://www.it-jobs.de/jobsuche?q=${encodeURIComponent(kw)}${wfh ? '&remote=1' : ''}`,
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'heise_jobs',
      buildUrl: (kw, pg, wfh) => `https://jobs.heise.de/jobs/suche?q=${encodeURIComponent(kw)}${wfh ? '&homeoffice=1' : ''}`,
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'silicon_jobs',
      buildUrl: (kw, pg, wfh) => `https://jobs.silicon.de/suche?q=${encodeURIComponent(kw)}${wfh ? '&remote=true' : ''}`,
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'informatik_aktuell',
      buildUrl: (kw, pg, wfh) => `https://www.informatik-aktuell.de/karriere/stellenmarkt.html?q=${encodeURIComponent(kw)}`,
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'stackoverflow',
      buildUrl: (kw, pg, wfh) => `https://stackoverflow.com/jobs?q=${encodeURIComponent(kw)}&l=Germany${wfh ? '&r=true' : ''}`,
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'glassdoor',
      buildUrl: (kw, pg, wfh) => `https://www.glassdoor.de/Job/deutschland-${encodeURIComponent(kw)}-jobs-SRCH_IL.0,11_IN96_KO12,${12 + kw.length}.htm?p=${pg + 1}${wfh ? '&remoteWorkType=1' : ''}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.react-job-listing, [data-test="jobListing"], li[data-id]', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('[data-test="job-title"], .jobTitle')?.textContent?.trim() || '',
              company: el.querySelector('[data-test="emp-name"], .jobHeader')?.textContent?.trim() || '',
              location: el.querySelector('[data-test="emp-location"], .loc')?.textContent?.trim() || '',
              url: 'https://www.glassdoor.de' + (el.querySelector('a')?.getAttribute('href') || ''),
              descriptionShort: '',
              postedDate: el.querySelector('[data-test="job-age"]')?.textContent?.trim() || '',
              platform: 'glassdoor',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'jooble',
      buildUrl: (kw, pg, wfh) => `https://de.jooble.org/SearchResult?ukw=${encodeURIComponent(kw)}${wfh ? '%20homeoffice' : ''}&lokid=0&p=${pg + 1}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('[class*="vacancy_wrapper"], article, .vacancy-card', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, [class*="header"]')?.textContent?.trim() || '',
              company: el.querySelector('[class*="company"]')?.textContent?.trim() || '',
              location: el.querySelector('[class*="location"]')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              postedDate: el.querySelector('time, [class*="date"], [class*="posted"], [class*="ago"]')?.textContent?.trim() || el.querySelector('time')?.getAttribute('datetime') || '',
              descriptionShort: el.querySelector('[class*="description"], p')?.textContent?.trim()?.substring(0, 200) || '',
              platform: 'jooble',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'adzuna',
      buildUrl: (kw, pg, wfh) => `https://www.adzuna.de/search?q=${encodeURIComponent(kw)}&p=${pg + 1}${wfh ? '&remote=1' : ''}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.ui-search-results .a, [data-aid="searchResult"]', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2 a, .a strong')?.textContent?.trim() || '',
              company: el.querySelector('.ui-company-info, .company')?.textContent?.trim() || '',
              location: el.querySelector('.ui-location, .location')?.textContent?.trim() || '',
              url: el.querySelector('h2 a, a')?.href || '',
              descriptionShort: el.querySelector('.ui-description, p')?.textContent?.trim()?.substring(0, 200) || '',
              postedDate: el.querySelector('.ui-posted')?.textContent?.trim() || '',
              platform: 'adzuna',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'careerjet',
      buildUrl: (kw, pg, wfh) => `https://www.careerjet.de/jobsuche/?s=${encodeURIComponent(kw)}&l=Deutschland${wfh ? '%20Homeoffice' : ''}`,
      parseJobs: async (page) => { return []; }
    },
    {
      name: 'jobrapido',
      buildUrl: (kw, pg, wfh) => `https://de.jobrapido.com/suche?q=${encodeURIComponent(kw)}${wfh ? '%20homeoffice' : ''}`,
      parseJobs: async (page) => { return []; }
    }
  ];
}

// Scraper state
let scraperInterval: NodeJS.Timeout | null = null;
let isRunning = false;
let shouldStop = false;
let lastRunAt: string | null = null;

export function getScraperStatus() {
  return {
    isRunning,
    lastRunAt,
    nextRun: scraperInterval ? 'scheduled' : null
  };
}

export async function runScrape(keywords?: string[], platformFilter?: string[]): Promise<{ jobsFound: number; jobsNew: number }> {
  console.log('[SCRAPER] runScrape invoked. platforms:', platformFilter, 'keywords:', keywords);

  isRunning = true;
  shouldStop = false;
  const runId = db.prepare('INSERT INTO scraper_runs (started_at, status) VALUES (?, ?)').run(
    new Date().toISOString(), 'running'
  ).lastInsertRowid;

  let totalFound = 0;
  let totalNew = 0;
  const platformsScraped: string[] = [];

  try {
    let chromium: any;
    try {
      const pw = require('playwright');
      chromium = pw.chromium;
    } catch {
      console.warn('⚠️ Playwright not installed. Run: npx playwright install chromium');
      db.prepare('UPDATE scraper_runs SET status = ?, error = ?, finished_at = ? WHERE id = ?').run(
        'failed', 'Playwright not installed', new Date().toISOString(), runId
      );
      isRunning = false;
      return { jobsFound: 0, jobsNew: 0 };
    }

    // Resolve WFH filter from DB settings
    const wfhOnly = JSON.parse(
      (db.prepare("SELECT value FROM settings WHERE key = 'wfh_only'").get() as any)?.value || 'false'
    );

    // Pick random keywords or use specified ones
    const searchKeywords = keywords || getRandomKeywords(5);
    
    // Filter platforms if requested
    let platforms = getPlatforms();
    console.log('[SCRAPER] Total platforms loaded initially:', platforms.length);
    if (platformFilter && platformFilter.length > 0) {
      platforms = platforms.filter(p => platformFilter.includes(p.name));
      console.log('[SCRAPER] Platforms after filter:', platforms.map(p => p.name));
    }

    console.log('[SCRAPER] Launching headless browser...');
    const browser = await chromium.launch({ headless: true });
    console.log('[SCRAPER] Browser launched.');

    for (const platform of platforms) {
      if (shouldStop) {
        console.log('[SCRAPER] HARD STOP TRIGGERED. Aborting platform loop.');
        break;
      }
      console.log(`[SCRAPER] Processing platform: ${platform.name}`);
      try {
        const context = await browser.newContext({ userAgent: randomUA() });
        const page = await context.newPage();

        for (const keyword of searchKeywords) { 
          if (shouldStop) break;
          // 1 page per keyword per platform per run = low footprint
          for (let pg = 0; pg < 1; pg++) { 
            if (shouldStop) break;
            try {
              const url = platform.buildUrl(keyword, pg, wfhOnly);
              console.log(`[SCRAPER] NAVIGATING: ${platform.name} -> ${url}`);
              await page.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' });
              await randomDelay();

              const jobs = await platform.parseJobs(page);
              console.log(`[SCRAPER] Scraped ${jobs.length} raw elements from ${platform.name}`);
              
              // Validate, deduplicate, check 7-day recency filter, strict WFH, and explicitly block internships
              const validJobs = jobs.filter(j => {
                if (!j.title || !j.company) return false;
                if (isTooOld(j.postedDate || '')) return false;
                if (isInternship(j)) return false;
                
                // If the user checked "Remote Only", pass it through the strict regex filter
                if (wfhOnly && !isStrictlyRemote(j)) {
                  // Job didn't pass the explicit remote test, silently bin it.
                  return false;
                }
                
                return true;
              });

              for (const job of validJobs) {
                const externalId = hashJob(job.url, job.title, job.company);
                try {
                  const existing = db.prepare('SELECT id FROM jobs WHERE external_id = ?').get(externalId);
                  if (!existing) {
                    db.prepare(`
                      INSERT INTO jobs (external_id, title, company, location, salary, posted_date, url, description_short, platform, scraped_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).run(externalId, job.title, job.company, job.location || '', job.salary || null,
                      job.postedDate || null, job.url, job.descriptionShort || '', job.platform, job.scrapedAt);
                    totalNew++;
                    notifyNewJobs([job]);
                  }
                  totalFound++;
                } catch (dbErr) { /* Duplicate */ }
              }
            } catch (pageErr) {
              console.warn(`Error scraping ${platform.name} page ${pg}:`, (pageErr as Error).message);
            }
          }
        }

        await context.close();
        platformsScraped.push(platform.name);
      } catch (platformErr) {
        console.warn(`Platform ${platform.name} failed:`, (platformErr as Error).message);
      }
    }

    await browser.close();

    // Save daily JSON dump
    const today = new Date().toISOString().split('T')[0];
    const jobsDir = path.join(dataDir, 'jobs');
    const dailyFile = path.join(jobsDir, `scraped_${today}.json`);
    const existingData = fs.existsSync(dailyFile) ? JSON.parse(fs.readFileSync(dailyFile, 'utf-8')) : [];
    const allJobs = db.prepare("SELECT * FROM jobs WHERE scraped_at LIKE ?").all(`${today}%`);
    fs.writeFileSync(dailyFile, JSON.stringify([...existingData, ...allJobs], null, 2), 'utf-8');

    db.prepare('UPDATE scraper_runs SET status = ?, finished_at = ?, platforms_scraped = ?, jobs_found = ?, jobs_new = ? WHERE id = ?').run(
      'completed', new Date().toISOString(), JSON.stringify(platformsScraped), totalFound, totalNew, runId
    );

  } catch (err) {
    console.error('Scraper run error:', err);
    db.prepare('UPDATE scraper_runs SET status = ?, error = ?, finished_at = ?, platforms_scraped = ?, jobs_found = ?, jobs_new = ? WHERE id = ?').run(
      'failed', (err as Error).message, new Date().toISOString(), JSON.stringify(platformsScraped), totalFound, totalNew, runId
    );
  } finally {
    isRunning = false;
    lastRunAt = new Date().toISOString();
  }

  return { jobsFound: totalFound, jobsNew: totalNew };
}

export function startAutoScrape(intervalSeconds: number = 60): void {
  if (scraperInterval) return;
  scraperInterval = setInterval(() => {
    runScrape().catch(err => console.error('Auto scrape error:', err));
  }, intervalSeconds * 1000);
  runScrape().catch(err => console.error('Initial auto scrape error:', err));
}

export function stopAutoScrape(): void {
  shouldStop = true;
  if (scraperInterval) {
    clearInterval(scraperInterval);
    scraperInterval = null;
  }
}

export async function extractJobDescription(url: string, platform: string): Promise<string> {
  let chromium: any;
  try {
    const pw = require('playwright');
    chromium = pw.chromium;
  } catch {
    throw new Error('Playwright not installed');
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ userAgent: randomUA() });
    const page = await context.newPage();
    
    // Some job boards (StepStone, LinkedIn) block rapid headless scraping.
    // Adding extra headers and ignoring load timeouts helps.
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'
    });
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    
    // Give dynamic JS frameworks a moment to render the JD
    await page.waitForTimeout(1500);

    // Extract raw text from the document body, stripping script/style noise
    const rawText = await page.evaluate(() => {
      // @ts-ignore
      document.querySelectorAll('script, style, nav, footer, noscript, header, iframe').forEach((el: any) => el.remove());
      
      // Target specific containers if known platforms, else fallback to body/main
      // @ts-ignore
      let root = document.querySelector('main') || document.querySelector('[class*="jobsearch"]') || document.querySelector('[class*="JobDescription"]') || document.body;
      
      // @ts-ignore
      return root ? root.innerText : '';
    });

    const cleanedText = rawText
      .replace(/\s{3,}/g, '\n\n') // Normalize extreme whitespace into paragraphs
      .trim();

    return cleanedText;
  } finally {
    await browser.close();
  }
}
