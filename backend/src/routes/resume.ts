import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { tailorResume, generateCoverLetter, applySuggestionsToResume, extractJobDetails } from '../services/groqService';
import { scoreResume } from '../services/atsService';
import { createApplicationFolder, saveApplicationFiles } from '../services/storageService';
import { buildResumeHtml, generatePdfFromHtml } from '../services/pdfService';
import { BASE_RESUME, TailoredResumeData } from '../types';
import path from 'path';
import fs from 'fs';

const router = Router();

// POST /api/resume/tailor — tailor resume to a job
router.post('/tailor', async (req: Request, res: Response) => {
  try {
    let { jobId, jobDescription } = req.body;

    let jd = jobDescription || '';
    let jobRow: any = null;
    let jobData: any = null;

    if (jobId) {
      jobRow = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
      if (!jobRow) return res.status(404).json({ error: 'Job not found' });
      jd = jobRow.description_full || jobRow.description_short || jd;
      jobData = { title: jobRow.title, company: jobRow.company, id: jobRow.id };
    } else if (jd) {
      // It's a manual copy-paste without a pre-linked job. Wait to extract details.
      console.log('No Job ID provided. Extracting company and role from raw text...');
      const { title, company } = await extractJobDetails(jd);
      
      const insertResult = db.prepare(`
        INSERT INTO jobs (title, company, description_full, platform, is_new, is_applied, url, external_id)
        VALUES (?, ?, ?, 'manual', 0, 1, '', ?)
      `).run(title, company, jd, `manual-${Date.now()}`);
      
      jobId = insertResult.lastInsertRowid;
      jobRow = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
      jobData = { title, company, id: jobId };
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
      folderPath,
      processedJob: jobData
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
    
    // Attempt to grab full context from the saved folder if it exists
    const app = db.prepare('SELECT folder_path FROM applications WHERE id = ?').get(req.params.applicationId) as any;
    let jobDescription = '';
    let atsResult = null;

    if (app && app.folder_path) {
      try {
        const jdPath = path.join(app.folder_path, 'job_description.txt');
        if (fs.existsSync(jdPath)) {
          jobDescription = fs.readFileSync(jdPath, 'utf-8');
        }
        
        const atsPath = path.join(app.folder_path, 'ats_score.json');
        if (fs.existsSync(atsPath)) {
          atsResult = JSON.parse(fs.readFileSync(atsPath, 'utf-8'));
        }
      } catch (err) {
        console.error('Error reading context files from application folder:', err);
      }
    }

    res.json({
      resumeData: JSON.parse(resume.resume_json || '{}'),
      resumeHtml: resume.resume_html,
      coverLetter: resume.cover_letter_text,
      jobDescription,
      atsResult
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

// POST /api/resume/apply-suggestions
router.post('/apply-suggestions', async (req: Request, res: Response) => {
  try {
    const { resumeData, suggestions, jobDescription } = req.body;
    if (!resumeData || !suggestions || !jobDescription) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const updatedResume = await applySuggestionsToResume(resumeData, suggestions, jobDescription);
    const atsResult = await scoreResume(updatedResume, jobDescription);

    res.json({
      tailoredResume: updatedResume,
      atsResult
    });
  } catch (err) {
    console.error('Apply suggestions error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/resume/generate-pdf
// Takes raw HTML from the frontend, wraps it in the CV stylesheet, and returns a PDF blob
router.post('/generate-pdf', async (req: Request, res: Response) => {
  try {
    const { htmlBody } = req.body;
    if (!htmlBody) return res.status(400).json({ error: 'Missing htmlBody in request' });

    let processedHtml = htmlBody;
    try {
      const imagePath = path.join(process.cwd(), '../frontend/public/profile.jpeg');
      if (fs.existsSync(imagePath)) {
        const imageBase64 = fs.readFileSync(imagePath, 'base64');
        processedHtml = processedHtml.replace(
          /src="\/profile\.jpeg"/g,
          `src="data:image/jpeg;base64,${imageBase64}"`
        );
      }
    } catch (e) {
      console.warn('Could not inject base64 profile image:', e);
    }

    // Inject the raw HTML body inside a clean print document with the Google Font
    const fullHtml = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Source Sans 3', 'Segoe UI', sans-serif; 
    -webkit-print-color-adjust: exact; 
    print-color-adjust: exact;
    background: linear-gradient(90deg, #1e5f74 35%, #ffffff 35%);
    min-height: 100vh;
  }
  @page { margin: 0; size: A4 portrait; }
</style>
</head>
<body>
  ${processedHtml}
</body>
</html>`;

    // Save temporarily to the system tmp folder
    const tmpPdfPath = path.join('/tmp', `temp_cv_${Date.now()}.pdf`);
    
    // Generate true vector PDF using puppeteer
    await generatePdfFromHtml(fullHtml, tmpPdfPath);

    // Stream to client as blob
    res.download(tmpPdfPath, 'Tamara_Steer_CV.pdf', (err) => {
      if (err) console.error('Error downloading generated PDF:', err);
      // Clean up the temp file after sending
      if (fs.existsSync(tmpPdfPath)) {
        fs.unlinkSync(tmpPdfPath);
      }
    });

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
