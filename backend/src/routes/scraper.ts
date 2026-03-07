import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { getScraperStatus, startAutoScrape, stopAutoScrape, runScrape } from '../services/scraperService';

const router = Router();

// GET /api/scraper/status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = getScraperStatus();
    const lastRun = db.prepare('SELECT * FROM scraper_runs ORDER BY id DESC LIMIT 1').get();
    const runs = db.prepare('SELECT * FROM scraper_runs ORDER BY id DESC LIMIT 20').all();
    res.json({ ...status, lastRun, runs });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/scraper/start
router.post('/start', (req: Request, res: Response) => {
  try {
    const interval = parseInt(req.body.interval) || 60;
    startAutoScrape(interval);
    res.json({ success: true, message: `Auto scraper started (every ${interval}s)` });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/scraper/stop
router.post('/stop', (req: Request, res: Response) => {
  try {
    stopAutoScrape();
    res.json({ success: true, message: 'Auto scraper stopped' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
