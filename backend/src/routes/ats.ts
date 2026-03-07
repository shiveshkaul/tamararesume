import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { scoreResume } from '../services/atsService';
import { extractJobDetails } from '../services/groqService';
import { TailoredResumeData } from '../types';

const router = Router();

// POST /api/ats/score
router.post('/score', async (req: Request, res: Response) => {
  try {
    let { jobId, resumeData, jobDescription } = req.body;

    let jd = jobDescription || '';
    let resume = resumeData as TailoredResumeData;
    let jobData: any = null;

    if (jobId) {
      const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
      if (job) {
        jd = jd || job.description_full || job.description_short || '';
        jobData = { title: job.title, company: job.company, id: job.id };
      }
    } else if (jd) {
      console.log('No Job ID provided for ATS. Extracting company and role from raw text...');
      const { title, company } = await extractJobDetails(jd);
      
      const insertResult = db.prepare(`
        INSERT INTO jobs (title, company, description_full, platform, is_new, is_applied, url, external_id)
        VALUES (?, ?, ?, 'manual', 0, 0, '', ?)
      `).run(title, company, jd, `manual-${Date.now()}`);
      
      jobId = insertResult.lastInsertRowid;
      jobData = { title, company, id: jobId };
    }

    if (!jd || !resume) return res.status(400).json({ error: 'Job description and resume data required' });

    const result = await scoreResume(resume, jd);
    
    // Create an application record so Check Base ATS doesn't lose the extraction
    if (jobId) {
      db.prepare(`
        INSERT INTO applications (job_id, status, mode, ats_score, ats_breakdown)
        VALUES (?, 'draft', 'manual', ?, ?)
      `).run(jobId, result.score, JSON.stringify(result.breakdown));
    }

    res.json({ ...result, processedJob: jobData });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/ats/:applicationId
router.get('/:applicationId', (req: Request, res: Response) => {
  try {
    const app = db.prepare('SELECT ats_score, ats_breakdown, folder_path FROM applications WHERE id = ?').get(req.params.applicationId) as any;
    if (!app) return res.status(404).json({ error: 'Application not found' });

    let fullAts = null;
    if (app.folder_path) {
      const fs = require('fs');
      const path = require('path');
      const atsFile = path.join(app.folder_path, 'ats_score.json');
      if (fs.existsSync(atsFile)) {
        fullAts = JSON.parse(fs.readFileSync(atsFile, 'utf-8'));
      }
    }

    res.json(fullAts || { score: app.ats_score, breakdown: JSON.parse(app.ats_breakdown || '{}') });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
