import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { getApplicationFolder } from '../services/storageService';

const router = Router();

// GET /api/applications
router.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    let where = '1=1';
    const params: any[] = [];
    if (status) { where += ' AND a.status = ?'; params.push(status); }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM applications a WHERE ${where}`).get(...params) as any).count;
    params.push(limit, offset);

    const applications = db.prepare(`
      SELECT a.*, j.title as job_title, j.company as job_company, j.platform as job_platform, j.url as job_url
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE ${where}
      ORDER BY a.created_at DESC LIMIT ? OFFSET ?
    `).all(...params);

    res.json({ applications, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/applications
router.post('/', (req: Request, res: Response) => {
  try {
    const { jobId, mode } = req.body;
    const result = db.prepare(`
      INSERT INTO applications (job_id, mode, status) VALUES (?, ?, 'pending')
    `).run(jobId, mode || 'manual');
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/applications/:id
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'manually_applied' || status === 'auto_applied') {
        updates.push('applied_at = ?');
        params.push(new Date().toISOString());
      }
    }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

    params.push(req.params.id);
    db.prepare(`UPDATE applications SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // Also update the job's is_applied flag
    if (status === 'manually_applied' || status === 'auto_applied') {
      const app = db.prepare('SELECT job_id FROM applications WHERE id = ?').get(req.params.id) as any;
      if (app?.job_id) {
        db.prepare('UPDATE jobs SET is_applied = 1 WHERE id = ?').run(app.job_id);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/applications/:id/folder
router.get('/:id/folder', (req: Request, res: Response) => {
  try {
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as any;
    if (!app || !app.folder_path) return res.status(404).json({ error: 'Application folder not found' });
    const files = getApplicationFolder(app.folder_path);
    res.json({ folderPath: app.folder_path, files });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
