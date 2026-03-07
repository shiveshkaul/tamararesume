import fs from 'fs';
import path from 'path';
import { dataDir } from '../db/schema';
import { ApplicationMeta } from '../types';

function sanitize(str: string): string {
  return str.replace(/[^a-zA-Z0-9äöüÄÖÜß\-_]/g, '_').substring(0, 50);
}

export function createApplicationFolder(date: string, company: string, role: string): string {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(8, 14);
  const folderName = `${sanitize(company)}_${sanitize(role)}_${timestamp}`;
  const folderPath = path.join(dataDir, 'applications', date, folderName);
  fs.mkdirSync(folderPath, { recursive: true });
  return folderPath;
}

export interface ApplicationFiles {
  jobDescription?: string;
  tailoredResumeHtml?: string;
  coverLetterText?: string;
  atsScore?: object;
  metadata?: object;
}

export async function saveApplicationFiles(folderPath: string, files: ApplicationFiles): Promise<void> {
  if (files.jobDescription) {
    fs.writeFileSync(path.join(folderPath, 'job_description.txt'), files.jobDescription, 'utf-8');
  }
  if (files.tailoredResumeHtml) {
    fs.writeFileSync(path.join(folderPath, 'tailored_resume.html'), files.tailoredResumeHtml, 'utf-8');
  }
  if (files.coverLetterText) {
    fs.writeFileSync(path.join(folderPath, 'cover_letter.txt'), files.coverLetterText, 'utf-8');
  }
  if (files.atsScore) {
    fs.writeFileSync(path.join(folderPath, 'ats_score.json'), JSON.stringify(files.atsScore, null, 2), 'utf-8');
  }
  if (files.metadata) {
    fs.writeFileSync(path.join(folderPath, 'metadata.json'), JSON.stringify(files.metadata, null, 2), 'utf-8');
  }
}

export function listApplicationFolders(): ApplicationMeta[] {
  const appsDir = path.join(dataDir, 'applications');
  if (!fs.existsSync(appsDir)) return [];

  const results: ApplicationMeta[] = [];
  const dateDirs = fs.readdirSync(appsDir).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));

  for (const dateDir of dateDirs) {
    const datePath = path.join(appsDir, dateDir);
    if (!fs.statSync(datePath).isDirectory()) continue;

    const appDirs = fs.readdirSync(datePath);
    for (const appDir of appDirs) {
      const appPath = path.join(datePath, appDir);
      if (!fs.statSync(appPath).isDirectory()) continue;

      let metadata: Record<string, unknown> = {};
      const metaFile = path.join(appPath, 'metadata.json');
      if (fs.existsSync(metaFile)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
        } catch { /* ignore */ }
      }

      const parts = appDir.split('_');
      results.push({
        folderPath: appPath,
        company: (metadata.company as string) || parts[0] || 'Unknown',
        role: (metadata.role as string) || parts[1] || 'Unknown',
        date: dateDir,
        metadata
      });
    }
  }

  return results.sort((a, b) => b.date.localeCompare(a.date));
}

export function getApplicationFolder(folderPath: string): Record<string, string> {
  const files: Record<string, string> = {};
  if (!fs.existsSync(folderPath)) return files;

  const entries = fs.readdirSync(folderPath);
  for (const entry of entries) {
    const fp = path.join(folderPath, entry);
    if (fs.statSync(fp).isFile()) {
      files[entry] = fs.readFileSync(fp, 'utf-8');
    }
  }
  return files;
}
