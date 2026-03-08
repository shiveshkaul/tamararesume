import db, { dataDir } from '../db/schema';
import { extractJobDescription } from './scraperService';
import { tailorResume, generateCoverLetter, calculateATSScore } from './groqService';
import { generatePdfFromHtml, buildResumeHtml, buildCoverLetterHtml } from './pdfService';
import { BASE_RESUME, TailoredResumeData } from '../types';
import path from 'path';
import fs from 'fs';

interface QueueItem {
  jobId: number;
}

const queue: QueueItem[] = [];
let isProcessing = false;
let currentJobId: number | null = null;
let currentStatus = '';

function setStatus(status: string) {
  currentStatus = status;
  console.log(`[BULK] Job ${currentJobId || 'Idle'}: ${status}`);
}

export function addToQueue(jobIds: number[]) {
  for (const id of jobIds) {
    if (!queue.find(q => q.jobId === id) && currentJobId !== id) {
      queue.push({ jobId: id });
    }
  }
  if (!isProcessing) {
    processQueue();
  }
}

export function getQueueStatus() {
  return {
    isProcessing,
    currentJobId,
    currentStatus,
    queueLength: queue.length,
    queueDetails: queue
  };
}

async function processQueue() {
  if (queue.length === 0) {
    isProcessing = false;
    currentJobId = null;
    setStatus('Idle');
    return;
  }

  isProcessing = true;
  const item = queue.shift();
  if (!item) return processQueue();

  currentJobId = item.jobId;
  
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(item.jobId) as any;
    if (!job) throw new Error('Job not found');

    const appDir = path.join(dataDir, 'applications', `job_${job.id}_${Date.now()}`);
    fs.mkdirSync(appDir, { recursive: true });

    // Step 1: Extraction
    let jd = job.description_full;
    if (!jd) {
      setStatus('Extracting Full Job Description via Playwright...');
      jd = await extractJobDescription(job.url, job.platform);
      db.prepare('UPDATE jobs SET description_full = ? WHERE id = ?').run(jd, job.id);
    }
    const extractTextToUse = jd || job.description_short || '';

    // Step 2: Tailoring Resume
    setStatus('Tailoring Resume via Groq...');
    const tailoredResume = await tailorResume(BASE_RESUME, extractTextToUse);

    // Step 3: ATS Scoring
    setStatus('Scoring Resume vs Job...');
    const atsResult = await calculateATSScore(tailoredResume, extractTextToUse);
    db.prepare('UPDATE jobs SET ats_score = ? WHERE id = ?').run(atsResult.score, job.id);

    // Step 4: Generating Cover Letter
    setStatus('Generating Cover Letter via Groq...');
    const coverLetterText = await generateCoverLetter(tailoredResume, extractTextToUse, job.company);

    // Step 5: PDF Assets
    setStatus('Generating PDF Files...');
    const resumeHtml = buildResumeHtml(tailoredResume);
    const resumePdfPath = path.join(appDir, 'Tamara_Steer_Lebenslauf.pdf');
    await generatePdfFromHtml(resumeHtml, resumePdfPath);

    const clHtml = buildCoverLetterHtml(coverLetterText, job.title, job.company);
    const clPdfPath = path.join(appDir, 'Tamara_Steer_Anschreiben.pdf');
    await generatePdfFromHtml(clHtml, clPdfPath);

    // Save context files so Editor can load them later
    fs.writeFileSync(path.join(appDir, 'job_description.txt'), extractTextToUse, 'utf-8');
    fs.writeFileSync(path.join(appDir, 'ats_score.json'), JSON.stringify(atsResult), 'utf-8');

    // Step 6: Database Logging
    setStatus('Saving Application Records...');
    const appId = db.prepare(`
      INSERT INTO applications (job_id, applied_at, status, mode, tailored_resume_path, cover_letter_path, ats_score, ats_breakdown, folder_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(job.id, new Date().toISOString(), 'prepared', 'bulk', resumePdfPath, clPdfPath, atsResult.score, JSON.stringify(atsResult), appDir).lastInsertRowid;

    db.prepare(`
      INSERT INTO tailored_resumes (job_id, application_id, resume_json, resume_html, resume_pdf_path, cover_letter_text, groq_model)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(job.id, appId, JSON.stringify(tailoredResume), resumeHtml, resumePdfPath, coverLetterText, 'openai/gpt-oss-120b');

    // Update job status to signify it's prepared (not fully applied yet)
    db.prepare('UPDATE jobs SET is_applied = -1 WHERE id = ?').run(job.id); // -1 logic: tailored but not submitted

    setStatus('Complete');
  } catch (err: any) {
    console.error(`[BULK] Error tailoring job ${currentJobId}:`, err);
    setStatus(`Error: ${err.message}`);
    // Wait a brief moment on error so the UI can flash it
    await new Promise(r => setTimeout(r, 2000));
  }

  // Brief pause before next job to prevent rate limits
  await new Promise(r => setTimeout(r, 1000));
  processQueue();
}
