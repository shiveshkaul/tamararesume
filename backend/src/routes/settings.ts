import { Router, Request, Response } from 'express';
import db from '../db/schema';

const router = Router();

// GET /api/settings
router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM settings').all() as any[];
    const settings: Record<string, any> = {};
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/settings
router.post('/', (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    for (const [key, value] of Object.entries(updates)) {
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      upsert.run(key, val);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
