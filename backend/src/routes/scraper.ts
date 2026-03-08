import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { getScraperStatus, startAutoScrape, stopAutoScrape, runScrape, extractJobDescription } from '../services/scraperService';

const router = Router();

// GET /api/scraper/status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = getScraperStatus();
    const lastRunRaw = db.prepare('SELECT * FROM scraper_runs ORDER BY id DESC LIMIT 1').get() as any;
    const runsRaw = db.prepare('SELECT * FROM scraper_runs ORDER BY id DESC LIMIT 20').all() as any[];
    
    // Dynamically patch 'zombie' runs that crashed.
    // If it's still 'running' after 5 minutes, we count the actual jobs it found before dying.
    const now = new Date().getTime();
    
    const patchRun = (run: any) => {
      if (!run) return run;
      if (run.status === 'running') {
        const start = new Date(run.started_at).getTime();
        // If it's been running for > 5 mins, it's definitely a zombie
        if (now - start > 5 * 60 * 1000) {
          // Since it didn't finish cleanly, manually count the jobs found in that timeframe
          const endBound = run.finished_at || new Date().toISOString();
          const jobCount = db.prepare('SELECT COUNT(*) as c FROM jobs WHERE scraped_at >= ? AND scraped_at <= ?').get(run.started_at, endBound) as { c: number };
          return {
            ...run,
            status: 'error (timeout)',
            jobs_found: jobCount.c,
            jobs_new: jobCount.c, // Approximation since we didn't track the deduped set cleanly
            platforms_scraped: jobCount.c > 0 ? 3 : 0 // Rough fallback
          };
        }
      }
      return run;
    };

    const lastRun = patchRun(lastRunRaw);
    const runs = runsRaw.map(patchRun);

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

// GET /api/scraper/runs/:id/jobs
router.get('/runs/:id/jobs', (req: Request, res: Response) => {
  try {
    const runId = req.params.id;
    const run = db.prepare('SELECT * FROM scraper_runs WHERE id = ?').get(runId) as any;
    
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const { started_at, finished_at } = run;
    
    // Fallback if finished_at is null
    const endBound = finished_at || new Date().toISOString();

    const jobs = db.prepare(`
      SELECT * FROM jobs 
      WHERE scraped_at >= ? AND scraped_at <= ? 
      ORDER BY created_at ASC
    `).all(started_at, endBound);

    res.json({ run, jobs });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/scraper/extract
router.post('/extract', async (req: Request, res: Response) => {
  try {
    const { url, platform } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    
    const text = await extractJobDescription(url, platform || '');
    if (!text) {
      return res.status(404).json({ error: 'Failed to extract meaningful text from URL' });
    }
    
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
