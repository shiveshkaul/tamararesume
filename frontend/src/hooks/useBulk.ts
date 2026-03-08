import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

export interface QueueStatus {
  isProcessing: boolean;
  currentJobId: number | null;
  currentStatus: string;
  queueLength: number;
  queueDetails: { jobId: number }[];
}

export function useBulk() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/bulk/status');
      setQueueStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch bulk status', err);
    }
  }, []);

  const startBulkTailoring = async (jobIds: number[]) => {
    try {
      await api.post('/bulk/tailor', { jobIds });
      await fetchStatus();
    } catch (err) {
      console.error('Failed to start bulk tailoring', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { queueStatus, startBulkTailoring, fetchStatus };
}
