import { Router, Request, Response } from 'express';
import db from '../db/schema';

const router = Router();

router.post('/:key', (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    db.prepare(`
      INSERT INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP) 
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
    `).run(key, JSON.stringify(value));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:key', (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
    if (row) {
      res.json({ value: JSON.parse(row.value) });
    } else {
      res.json({ value: null });
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
