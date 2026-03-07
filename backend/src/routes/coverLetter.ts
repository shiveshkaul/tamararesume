import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { generateCoverLetter } from '../services/groqService';
import { TailoredResumeData } from '../types';
import fs from 'fs';
import path from 'path';

const router = Router();

// POST /api/cover-letter/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { jobId, applicationId, jobDescription, resumeData } = req.body;

    let jd = jobDescription || '';
    let resume = resumeData as TailoredResumeData;
    let companyName = 'das Unternehmen';

    if (jobId) {
      const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
      if (job) {
        jd = jd || job.description_full || job.description_short || '';
        companyName = job.company;
      }
    }

    if (applicationId && !resume) {
      const tr = db.prepare('SELECT * FROM tailored_resumes WHERE application_id = ?').get(applicationId) as any;
      if (tr) resume = JSON.parse(tr.resume_json || '{}');
    }

    if (!jd) return res.status(400).json({ error: 'No job description provided' });

    const coverLetter = await generateCoverLetter(resume, jd, companyName);

    // Save to application folder if we have one
    if (applicationId) {
      const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as any;
      if (app?.folder_path) {
        fs.writeFileSync(path.join(app.folder_path, 'cover_letter.txt'), coverLetter, 'utf-8');
        db.prepare('UPDATE applications SET cover_letter_path = ? WHERE id = ?')
          .run(path.join(app.folder_path, 'cover_letter.txt'), applicationId);
      }
      db.prepare('UPDATE tailored_resumes SET cover_letter_text = ? WHERE application_id = ?')
        .run(coverLetter, applicationId);
    }

    res.json({ coverLetter });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/cover-letter/:applicationId
router.get('/:applicationId', (req: Request, res: Response) => {
  try {
    const tr = db.prepare('SELECT cover_letter_text FROM tailored_resumes WHERE application_id = ?').get(req.params.applicationId) as any;
    if (!tr) return res.status(404).json({ error: 'Cover letter not found' });
    res.json({ coverLetter: tr.cover_letter_text });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
