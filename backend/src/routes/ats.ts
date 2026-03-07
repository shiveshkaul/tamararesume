import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { scoreResume } from '../services/atsService';
import { TailoredResumeData } from '../types';

const router = Router();

// POST /api/ats/score
router.post('/score', async (req: Request, res: Response) => {
  try {
    const { jobId, resumeData, jobDescription } = req.body;

    let jd = jobDescription || '';
    let resume = resumeData as TailoredResumeData;

    if (jobId) {
      const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
      if (job) jd = jd || job.description_full || job.description_short || '';
    }

    if (!jd || !resume) return res.status(400).json({ error: 'Job description and resume data required' });

    const result = await scoreResume(resume, jd);
    res.json(result);
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
