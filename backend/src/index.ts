import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load env before anything else
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { initDb } from './db/schema';
import jobsRouter from './routes/jobs';
import resumeRouter from './routes/resume';
import coverLetterRouter from './routes/coverLetter';
import atsRouter from './routes/ats';
import applicationsRouter from './routes/applications';
import scraperRouter from './routes/scraper';
import settingsRouter from './routes/settings';
import { BASE_RESUME } from './types';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Initialize SQLite
initDb();

// API Routes
app.use('/api/jobs', jobsRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/cover-letter', coverLetterRouter);
app.use('/api/ats', atsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/scraper', scraperRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get base resume data
app.get('/api/base-resume', (_req, res) => {
  res.json(BASE_RESUME);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 TamaraApply Pro Backend running on http://localhost:${PORT}\n`);
});

export default app;
