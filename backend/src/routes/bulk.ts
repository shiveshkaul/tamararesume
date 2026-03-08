import { Router } from 'express';
import { addToQueue, getQueueStatus } from '../services/bulkService';

const router = Router();

// Process multiple jobs
router.post('/tailor', (req, res) => {
  const { jobIds } = req.body;
  
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return res.status(400).json({ error: 'Valid jobIds array is required' });
  }

  addToQueue(jobIds);
  res.json({ success: true, message: `Added ${jobIds.length} jobs to the queue.` });
});

// Get real-time queue status
router.get('/status', (req, res) => {
  res.json(getQueueStatus());
});

export default router;
