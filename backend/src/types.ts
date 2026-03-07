// ===== Shared Types for TamaraApply Pro =====

export interface BaseJob {
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: string[];
}

export interface Certification {
  name: string;
  provider: string;
  year: string;
}

export interface ResumeData {
  title: string;
  profileSummary: string;
  jobs: BaseJob[];
  certifications: Certification[];
  skills: string[];
}

export interface TailoredResumeData extends ResumeData {
  tailoringNotes: string;
}

export interface ATSResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  breakdown: {
    titleMatch: number;
    skillsMatch: number;
    experienceMatch: number;
    keywordsMatch: number;
  };
}

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  salary?: string;
  postedDate?: string;
  url: string;
  descriptionShort?: string;
  descriptionFull?: string;
  platform: string;
  scrapedAt: string;
}

export interface JobRow {
  id: number;
  external_id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  posted_date: string | null;
  url: string;
  description_short: string | null;
  description_full: string | null;
  platform: string;
  scraped_at: string;
  is_new: number;
  is_applied: number;
  is_dismissed: number;
  ats_score: number | null;
  created_at: string;
}

export interface ApplicationRow {
  id: number;
  job_id: number;
  applied_at: string | null;
  status: string;
  mode: string;
  tailored_resume_path: string | null;
  cover_letter_path: string | null;
  ats_score: number | null;
  ats_breakdown: string | null;
  folder_path: string | null;
  notes: string | null;
  created_at: string;
}

export interface ApplicationMeta {
  folderPath: string;
  company: string;
  role: string;
  date: string;
  metadata?: Record<string, unknown>;
}

export const BASE_RESUME: ResumeData = {
  title: 'IT-Mitarbeiterin 1st Level Support',
  profileSummary: 'Engagierte IT-Support-Mitarbeiterin mit soliden Kenntnissen in der Betreuung und Administration von IT-Infrastrukturen und Softwarelösungen. Sicher im Umgang mit MS365, SAP ERP, Active Directory (Microsoft Entra ID) sowie cloudbasierten Anwendungen. Aktuell intensive Weiterbildung in IT-Sicherheit, Backend-Entwicklung (AWS, API-Integration) und Prozessautomatisierung. Strukturiertes und lösungsorientiertes Arbeiten, gepaart mit Teamgeist und hoher Lernbereitschaft, zeichnen meinen Arbeitsstil aus.',
  jobs: [
    {
      company: 'Xentasystems GmbH',
      role: 'IT-Mitarbeiterin 1st Level Support / stellvertretende Teamleitung',
      period: '04/2023 – bis dato',
      location: 'Heidenheim, Deutschland',
      bullets: [
        'Erster Ansprechpartner für ein internationales Anwaltsunternehmen',
        'Unterstützung bei MS365, lokalen Microsoft-Apps sowie SAP, Datev, SharePoint und weiteren Anwendungen',
        'Aufnahme, Monitoring und Koordination von Tickets',
        'Planung und Steuerung von Support-Anfragen',
        'Unterstützung durch Microsoft Entra ID (ehem. Azure Active Directory), insbesondere bei Multifaktorauthentifizierung (MFA), Rollenaktivierungen im Rahmen des Privileged Identity Management (PIM) sowie der Verwaltung von Firmen-iPhones (Mobile Device Support)'
      ]
    },
    {
      company: 'Concept & Service GbR',
      role: 'Call Agent',
      period: '12/2021 – 03/2023',
      location: 'Neresheim, Deutschland',
      bullets: [
        'Forderungsmanagement und Kundenservice für Energieversorger',
        'Systemadministrative Aufgaben wie Buchungskorrekturen und Datenpflege in SAP ERP'
      ]
    },
    {
      company: 'Pentz GmbH & Co. KG',
      role: 'Kommissioniererin / Schnittproduktion',
      period: '09/2021 – 12/2021',
      location: 'Essingen, Deutschland',
      bullets: [
        'Aufträge am PC kontrollieren und ausführen',
        'Waren verpacken und etikettieren',
        'Lebensmittel putzen und schneiden',
        'Frischekontrolle',
        'Umsetzung der Hygienevorschriften'
      ]
    },
    {
      company: 'ARAL Tankstellen, Dalacker & Sohn',
      role: 'Tankstellenmitarbeiterin / stellvertretende Stationsleitung',
      period: '07/2019 – 09/2021',
      location: 'Deutschland',
      bullets: [
        'Leitung des Backshop-Bereichs und Verantwortung für Mitarbeiter',
        'Kassenführung und Kundenbetreuung',
        'Bestellungen und Warenmanagement am PC'
      ]
    },
    {
      company: 'ARAL-Center Kling',
      role: 'Tankstellenmitarbeiterin',
      period: '11/2016 – 06/2019',
      location: 'Herbrechtingen, Deutschland',
      bullets: [
        'Kassenführung',
        'Kundenberatung/-betreuung',
        'Annahme und Kontrolle der angelieferten Waren und Zeitungen',
        'Verräumen der Waren',
        'Bestücken des Bistros',
        'MHD Kontrolle',
        'Umsetzung der Hygienevorschriften'
      ]
    }
  ],
  certifications: [],
  skills: [
    'MS365', 'SharePoint', 'SAP ERP', 'Datev',
    'Microsoft Entra ID (Azure AD)', 'MFA/PIM', 'Mobile Device Management',
    'Ticket Systems (JIRA/ServiceNow)', 'Python', 'SQL',
    'AWS Basics', 'REST APIs', 'n8n/Automation', 'Power BI',
    'IT Security Basics', 'Prompt Engineering', 'LLMs', 'AI Tools',
    'Windows Server Basics', 'Active Directory', 'HTML/CSS Basics', 'GitHub Basics'
  ]
};

export const UDEMY_CERT_POOL = [
  'The Complete Python Bootcamp From Zero to Hero in Python',
  'AWS Certified Cloud Practitioner — Full Course',
  'Microsoft Azure Fundamentals AZ-900',
  'Artificial Intelligence A-Z: Learn How To Build An AI',
  'Machine Learning A-Z: AI, Python & R',
  'Deep Learning A-Z: Hands-On Artificial Neural Networks',
  'ChatGPT & LLM Prompt Engineering for Developers',
  'Automate the Boring Stuff with Python',
  'The Complete SQL Bootcamp',
  'IT Support Technical Skills Bootcamp',
  'Cybersecurity for Beginners',
  'n8n — Workflow Automation for Beginners',
  'API Testing with Postman',
  'Linux Command Line Basics',
  'Power BI — Business Intelligence for Beginners'
];
