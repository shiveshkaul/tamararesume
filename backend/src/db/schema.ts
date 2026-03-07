import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = process.env.DATA_DIR
  ? path.resolve(__dirname, '..', '..', process.env.DATA_DIR)
  : path.resolve(__dirname, '..', '..', '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
fs.mkdirSync(path.join(dataDir, 'applications'), { recursive: true });
fs.mkdirSync(path.join(dataDir, 'jobs'), { recursive: true });

const dbPath = path.join(dataDir, 'tamaraapply.db');
const db: BetterSqlite3.Database = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT,
      salary TEXT,
      posted_date TEXT,
      url TEXT NOT NULL,
      description_short TEXT,
      description_full TEXT,
      platform TEXT,
      scraped_at TEXT,
      is_new INTEGER DEFAULT 1,
      is_applied INTEGER DEFAULT 0,
      is_dismissed INTEGER DEFAULT 0,
      ats_score INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER REFERENCES jobs(id),
      applied_at TEXT,
      status TEXT DEFAULT 'pending',
      mode TEXT,
      tailored_resume_path TEXT,
      cover_letter_path TEXT,
      ats_score INTEGER,
      ats_breakdown TEXT,
      folder_path TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tailored_resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER REFERENCES jobs(id),
      application_id INTEGER REFERENCES applications(id),
      resume_json TEXT,
      resume_html TEXT,
      resume_pdf_path TEXT,
      cover_letter_text TEXT,
      groq_model TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scraper_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT,
      finished_at TEXT,
      platforms_scraped TEXT,
      jobs_found INTEGER DEFAULT 0,
      jobs_new INTEGER DEFAULT 0,
      status TEXT DEFAULT 'running',
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Insert default settings if not present
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('groq_api_key', process.env.GROQ_API_KEY || '');
  insertSetting.run('groq_model', 'openai/gpt-oss-120b');
  insertSetting.run('mode', 'manual');
  insertSetting.run('scrape_interval', '60');
  insertSetting.run('keywords', JSON.stringify([
    "Junior AI", "AI Specialist", "KI Spezialist", "Machine Learning Einsteiger",
    "Data Analyst Junior", "AI Automation", "Prompt Engineer", "Junior Data Scientist",
    "AI Tools Spezialist", "IT Support AI", "Junior NLP", "AI Coordinator",
    "Digitalisierung Junior", "Automation Specialist", "RPA Junior", "Junior MLOps",
    "Junior LLM Engineer", "AI Operations", "Emerging AI", "AI Trainee"
  ]));
  insertSetting.run('platforms', JSON.stringify([
    "stepstone", "indeed", "linkedin", "xing", "monster", "jobware",
    "arbeitsagentur", "stellenanzeigen", "kimeta", "absolventa",
    "get-in-it", "it-jobs", "glassdoor", "jooble", "adzuna", "careerjet"
  ]));

  console.log('✅ Database initialized at', dbPath);
}

export default db;
export { dataDir };
