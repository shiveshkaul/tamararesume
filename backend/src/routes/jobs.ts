import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { addSSEClient, runScrape } from '../services/scraperService';

const router = Router();

// GET /api/jobs — paginated job list
router.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const platform = req.query.platform as string;
    const status = req.query.status as string;

    let where = 'WHERE is_dismissed = 0';
    const params: any[] = [];

    if (platform) { where += ' AND platform = ?'; params.push(platform); }
    if (status === 'new') { where += ' AND is_new = 1'; }
    if (status === 'applied') { where += ' AND is_applied = 1'; }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM jobs ${where}`).get(...params) as any).count;
    params.push(limit, offset);
    const jobs = db.prepare(`SELECT * FROM jobs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params);

    res.json({ jobs, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/jobs/stream — SSE
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write('data: {"type":"connected"}\n\n');
  addSSEClient(res);
});

// GET /api/jobs/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/jobs/scrape
router.post('/scrape', async (req: Request, res: Response) => {
  try {
    const { keywords, platforms } = req.body;
    const result = await runScrape(keywords, platforms);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/jobs/:id/dismiss
router.post('/:id/dismiss', (req: Request, res: Response) => {
  try {
    db.prepare('UPDATE jobs SET is_dismissed = 1, is_new = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Evaluate script for Playwright (runs in browser context)
/* eslint-disable */
const EVAL_SCRIPT = [
  '(() => {',
  '  var sels = ["[class*=description]","[class*=jobDescription]","[id*=description]",".job-description","article",".posting-description",".job-details"];',
  '  for (var i = 0; i < sels.length; i++) {',
  '    var el = window["document"]["querySelector"](sels[i]);',
  '    if (el && el.textContent && el.textContent.length > 100) return el.textContent.trim();',
  '  }',
  '  return (window["document"]["body"]["textContent"] || "").substring(0, 3000);',
  '})()',
].join('\n');

// POST /api/jobs/:id/fetch-full-description
router.post('/:id/fetch-full-description', async (req: Request, res: Response) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any;
    if (!job) return res.status(404).json({ error: 'Job not found' });

    let fullDesc = job.description_full || job.description_short || '';
    try {
      const pw = require('playwright');
      const browser = await pw.chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(job.url, { timeout: 15000, waitUntil: 'domcontentloaded' });
      fullDesc = await page.evaluate(EVAL_SCRIPT);
      await browser.close();
    } catch {
      console.warn('Could not fetch full description for job', job.id);
    }

    db.prepare('UPDATE jobs SET description_full = ? WHERE id = ?').run(fullDesc, job.id);
    res.json({ description: fullDesc });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/jobs/bulk-apply
router.post('/bulk-apply', (req: Request, res: Response) => {
  try {
    const { jobIds } = req.body;
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ error: 'Valid jobIds array required' });
    }
    const placeholders = jobIds.map(() => '?').join(',');
    db.prepare(`UPDATE jobs SET is_applied = 1 WHERE id IN (${placeholders})`).run(...jobIds);
    res.json({ success: true, count: jobIds.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
