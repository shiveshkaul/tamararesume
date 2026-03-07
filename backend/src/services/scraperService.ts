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
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
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
  return delay(1500 + Math.random() * 1500);
}

interface PlatformConfig {
  name: string;
  buildUrl: (keyword: string, page: number) => string;
  parseJobs: (page: any) => Promise<ScrapedJob[]>;
}

// Build the scraper configurations for each platform
function getPlatforms(): PlatformConfig[] {
  return [
    {
      name: 'indeed',
      buildUrl: (kw, pg) => `https://de.indeed.com/jobs?q=${encodeURIComponent(kw)}&l=Deutschland&start=${pg * 10}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.job_seen_beacon, .jobsearch-ResultsList .result, [data-jk]', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, .jobTitle')?.textContent?.trim() || '',
              company: el.querySelector('[data-testid="company-name"], .companyName')?.textContent?.trim() || '',
              location: el.querySelector('[data-testid="text-location"], .companyLocation')?.textContent?.trim() || '',
              url: 'https://de.indeed.com' + (el.querySelector('a')?.getAttribute('href') || ''),
              descriptionShort: el.querySelector('.job-snippet, .underShelfFooter')?.textContent?.trim() || '',
              platform: 'indeed',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'stepstone',
      buildUrl: (kw, pg) => `https://www.stepstone.de/jobs/${encodeURIComponent(kw)}/in-deutschland?page=${pg + 1}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('[data-testid="job-item"], article[data-at], .ResultsSectionContainer-sc [class*="Job"]', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, [data-at="job-item-title"]')?.textContent?.trim() || '',
              company: el.querySelector('[data-at="job-item-company-name"], [class*="company"]')?.textContent?.trim() || '',
              location: el.querySelector('[data-at="job-item-location"], [class*="location"]')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              descriptionShort: el.querySelector('[class*="snippet"], [class*="description"]')?.textContent?.trim() || '',
              platform: 'stepstone',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'linkedin',
      buildUrl: (kw, pg) => `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(kw)}&location=Germany&start=${pg * 25}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.jobs-search__results-list li, .base-card', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('.base-search-card__title, h3')?.textContent?.trim() || '',
              company: el.querySelector('.base-search-card__subtitle, h4')?.textContent?.trim() || '',
              location: el.querySelector('.job-search-card__location')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              descriptionShort: '',
              platform: 'linkedin',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'glassdoor',
      buildUrl: (kw, pg) => `https://www.glassdoor.de/Job/deutschland-${encodeURIComponent(kw)}-jobs-SRCH_IL.0,11_IN96_KO12,${12 + kw.length}.htm?p=${pg + 1}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.react-job-listing, [data-test="jobListing"], li[data-id]', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('[data-test="job-title"], .jobTitle')?.textContent?.trim() || '',
              company: el.querySelector('[data-test="emp-name"], .jobHeader')?.textContent?.trim() || '',
              location: el.querySelector('[data-test="emp-location"], .loc')?.textContent?.trim() || '',
              url: 'https://www.glassdoor.de' + (el.querySelector('a')?.getAttribute('href') || ''),
              descriptionShort: '',
              platform: 'glassdoor',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'jooble',
      buildUrl: (kw, pg) => `https://de.jooble.org/SearchResult?ukw=${encodeURIComponent(kw)}&lokid=0&p=${pg + 1}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('[class*="vacancy_wrapper"], article, .vacancy-card', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, [class*="header"]')?.textContent?.trim() || '',
              company: el.querySelector('[class*="company"]')?.textContent?.trim() || '',
              location: el.querySelector('[class*="location"]')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
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
      buildUrl: (kw, pg) => `https://www.adzuna.de/search?q=${encodeURIComponent(kw)}&p=${pg + 1}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.ui-search-results .a, [data-aid="searchResult"]', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2 a, .a strong')?.textContent?.trim() || '',
              company: el.querySelector('.ui-company-info, .company')?.textContent?.trim() || '',
              location: el.querySelector('.ui-location, .location')?.textContent?.trim() || '',
              url: el.querySelector('h2 a, a')?.href || '',
              descriptionShort: el.querySelector('.ui-description, p')?.textContent?.trim()?.substring(0, 200) || '',
              platform: 'adzuna',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'kimeta',
      buildUrl: (kw, pg) => `https://www.kimeta.de/stellenangebote?q=${encodeURIComponent(kw)}&p=${pg + 1}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.listitem, .job-item, article', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2 a, .job-title, h3')?.textContent?.trim() || '',
              company: el.querySelector('.company, .employer')?.textContent?.trim() || '',
              location: el.querySelector('.location, .place')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              descriptionShort: '',
              platform: 'kimeta',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
    {
      name: 'absolventa',
      buildUrl: (kw, pg) => `https://www.absolventa.de/jobs?utf8=%E2%9C%93&search%5Bkeyword%5D=${encodeURIComponent(kw)}&page=${pg + 1}`,
      parseJobs: async (page) => {
        try {
          return await page.$$eval('.job-item, .job-result, article', (els: any[]) =>
            els.slice(0, 15).map((el: any) => ({
              title: el.querySelector('h2, .job-title')?.textContent?.trim() || '',
              company: el.querySelector('.company, .employer')?.textContent?.trim() || '',
              location: el.querySelector('.location')?.textContent?.trim() || '',
              url: el.querySelector('a')?.href || '',
              descriptionShort: '',
              platform: 'absolventa',
              scrapedAt: new Date().toISOString(),
            }))
          );
        } catch { return []; }
      }
    },
  ];
}

// Scraper state
let scraperInterval: NodeJS.Timeout | null = null;
let isRunning = false;
let lastRunAt: string | null = null;

export function getScraperStatus() {
  return {
    isRunning,
    lastRunAt,
    nextRun: scraperInterval ? 'scheduled' : null
  };
}

export async function runScrape(keywords?: string[], platformFilter?: string[]): Promise<{ jobsFound: number; jobsNew: number }> {
  if (isRunning) {
    return { jobsFound: 0, jobsNew: 0 };
  }

  isRunning = true;
  const runId = db.prepare('INSERT INTO scraper_runs (started_at, status) VALUES (?, ?)').run(
    new Date().toISOString(), 'running'
  ).lastInsertRowid;

  let totalFound = 0;
  let totalNew = 0;
  const platformsScraped: string[] = [];

  try {
    // Try to use Playwright
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

    // Resolve keywords
    const searchKeywords = keywords || JSON.parse(
      (db.prepare("SELECT value FROM settings WHERE key = 'keywords'").get() as any)?.value || '["Junior AI"]'
    );

    // Resolve platform filter  
    const enabledPlatforms = platformFilter || JSON.parse(
      (db.prepare("SELECT value FROM settings WHERE key = 'platforms'").get() as any)?.value || '[]'
    );

    const platforms = getPlatforms().filter(
      p => enabledPlatforms.length === 0 || enabledPlatforms.includes(p.name)
    );

    const browser = await chromium.launch({ headless: true });

    for (const platform of platforms) {
      try {
        const context = await browser.newContext({ userAgent: randomUA() });
        const page = await context.newPage();

        for (const keyword of searchKeywords.slice(0, 5)) { // Limit keywords per run for speed
          for (let pg = 0; pg < 2; pg++) { // First 2 pages
            try {
              const url = platform.buildUrl(keyword, pg);
              await page.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' });
              await randomDelay();

              const jobs = await platform.parseJobs(page);
              const validJobs = jobs.filter(j => j.title && j.company);

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
                } catch (dbErr) {
                  // Duplicate or DB error — skip
                }
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

    // Save daily JSON
    const today = new Date().toISOString().split('T')[0];
    const jobsDir = path.join(dataDir, 'jobs');
    const dailyFile = path.join(jobsDir, `scraped_${today}.json`);
    const existingData = fs.existsSync(dailyFile) ? JSON.parse(fs.readFileSync(dailyFile, 'utf-8')) : [];
    const allJobs = db.prepare("SELECT * FROM jobs WHERE scraped_at LIKE ?").all(`${today}%`);
    fs.writeFileSync(dailyFile, JSON.stringify([...existingData, ...allJobs], null, 2), 'utf-8');

  } catch (err) {
    console.error('Scraper run error:', err);
    db.prepare('UPDATE scraper_runs SET status = ?, error = ?, finished_at = ? WHERE id = ?').run(
      'failed', (err as Error).message, new Date().toISOString(), runId
    );
  } finally {
    isRunning = false;
    lastRunAt = new Date().toISOString();
    db.prepare('UPDATE scraper_runs SET status = ?, finished_at = ?, platforms_scraped = ?, jobs_found = ?, jobs_new = ? WHERE id = ?').run(
      'completed', new Date().toISOString(), JSON.stringify(platformsScraped), totalFound, totalNew, runId
    );
  }

  return { jobsFound: totalFound, jobsNew: totalNew };
}

export function startAutoScrape(intervalSeconds: number = 60): void {
  if (scraperInterval) return;
  scraperInterval = setInterval(() => {
    runScrape().catch(err => console.error('Auto scrape error:', err));
  }, intervalSeconds * 1000);
  // Run immediately too
  runScrape().catch(err => console.error('Initial auto scrape error:', err));
}

export function stopAutoScrape(): void {
  if (scraperInterval) {
    clearInterval(scraperInterval);
    scraperInterval = null;
  }
}
