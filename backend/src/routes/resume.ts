import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { tailorResume, generateCoverLetter } from '../services/groqService';
import { scoreResume } from '../services/atsService';
import { createApplicationFolder, saveApplicationFiles } from '../services/storageService';
import { buildResumeHtml, generatePdfFromHtml } from '../services/pdfService';
import { BASE_RESUME, TailoredResumeData } from '../types';
import path from 'path';

const router = Router();

// POST /api/resume/tailor — tailor resume to a job
router.post('/tailor', async (req: Request, res: Response) => {
  try {
    const { jobId, jobDescription } = req.body;

    let jd = jobDescription || '';
    let jobRow: any = null;

    if (jobId) {
      jobRow = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
      if (!jobRow) return res.status(404).json({ error: 'Job not found' });
      jd = jobRow.description_full || jobRow.description_short || jd;
    }

    if (!jd) return res.status(400).json({ error: 'No job description provided' });

    // Run tailoring
    const tailoredResume = await tailorResume(BASE_RESUME, jd);

    // Calculate ATS score
    const atsResult = await scoreResume(tailoredResume, jd);

    // Generate cover letter
    const companyName = jobRow?.company || 'das Unternehmen';
    const coverLetter = await generateCoverLetter(tailoredResume, jd, companyName);

    // Create application folder
    const today = new Date().toISOString().split('T')[0];
    const folderPath = createApplicationFolder(today, companyName, tailoredResume.title);

    // Build HTML
    const resumeHtml = buildResumeHtml(tailoredResume);

    // Save files
    await saveApplicationFiles(folderPath, {
      jobDescription: jd,
      tailoredResumeHtml: resumeHtml,
      coverLetterText: coverLetter,
      atsScore: atsResult,
      metadata: {
        jobId: jobRow?.id || null,
        company: companyName,
        role: tailoredResume.title,
        platform: jobRow?.platform || 'manual',
        url: jobRow?.url || '',
        appliedAt: null,
        mode: 'manual',
        status: 'draft'
      }
    });

    // Create application record
    const appResult = db.prepare(`
      INSERT INTO applications (job_id, status, mode, tailored_resume_path, cover_letter_path, ats_score, ats_breakdown, folder_path)
      VALUES (?, 'draft', 'manual', ?, ?, ?, ?, ?)
    `).run(
      jobRow?.id || null,
      path.join(folderPath, 'tailored_resume.html'),
      path.join(folderPath, 'cover_letter.txt'),
      atsResult.score,
      JSON.stringify(atsResult.breakdown),
      folderPath
    );

    // Save tailored resume record
    db.prepare(`
      INSERT INTO tailored_resumes (job_id, application_id, resume_json, resume_html, cover_letter_text, groq_model)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      jobRow?.id || null,
      appResult.lastInsertRowid,
      JSON.stringify(tailoredResume),
      resumeHtml,
      coverLetter,
      'openai/gpt-oss-120b'
    );

    // Mark job as applied
    if (jobRow) {
      db.prepare('UPDATE jobs SET is_new = 0, ats_score = ? WHERE id = ?').run(atsResult.score, jobRow.id);
    }

    res.json({
      applicationId: appResult.lastInsertRowid,
      tailoredResume,
      atsResult,
      coverLetter,
      folderPath
    });
  } catch (err) {
    console.error('Tailor error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/resume/:applicationId
router.get('/:applicationId', (req: Request, res: Response) => {
  try {
    const resume = db.prepare('SELECT * FROM tailored_resumes WHERE application_id = ?').get(req.params.applicationId) as any;
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.json({
      resumeData: JSON.parse(resume.resume_json || '{}'),
      resumeHtml: resume.resume_html,
      coverLetter: resume.cover_letter_text
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/resume/:applicationId/pdf
router.post('/:applicationId/pdf', async (req: Request, res: Response) => {
  try {
    const resume = db.prepare('SELECT * FROM tailored_resumes WHERE application_id = ?').get(req.params.applicationId) as any;
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.applicationId) as any;
    const folderPath = app?.folder_path || '/tmp';
    const pdfPath = path.join(folderPath, 'tailored_resume.pdf');

    await generatePdfFromHtml(resume.resume_html, pdfPath);

    db.prepare('UPDATE tailored_resumes SET resume_pdf_path = ? WHERE application_id = ?').run(pdfPath, req.params.applicationId);

    res.download(pdfPath);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
