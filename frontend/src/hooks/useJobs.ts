import { useEffect, useCallback, useRef } from 'react';
import API from '../api';
import { useAppStore } from '../store/appStore';

export function useJobs() {
  const store = useAppStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await API.get('/jobs', { params: { limit: 100 } });
      store.setJobs(res.data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  }, [store]);

  const dismissJob = useCallback(async (jobId: number) => {
    try {
      await API.post(`/jobs/${jobId}/dismiss`);
      store.setJobs(store.jobs.filter(j => j.id !== jobId));
    } catch (err) {
      console.error('Failed to dismiss job:', err);
    }
  }, [store]);

  const triggerScrape = useCallback(async () => {
    try {
      store.setScraperRunning(true);
      const res = await API.post('/jobs/scrape');
      await fetchJobs();
      return res.data;
    } catch (err) {
      console.error('Scrape failed:', err);
    } finally {
      store.setScraperRunning(false);
    }
  }, [store, fetchJobs]);

  // SSE connection
  useEffect(() => {
    const es = new EventSource('http://localhost:8000/api/jobs/stream');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;

        // New jobs arrived
        if (Array.isArray(data)) {
          store.addNewJobs(data.map((j: any) => ({
            ...j,
            id: Date.now(), // temp id
            is_new: 1,
            is_applied: 0,
            is_dismissed: 0,
          })));

          // Browser notification
          if (Notification.permission === 'granted' && data.length > 0) {
            const job = data[0];
            new Notification(`${job.company} is hiring!`, {
              body: `${job.title} on ${job.platform}`,
              icon: '💼'
            });
          }

          // Audio chime
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.value = 0.1;
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
          } catch { /* audio not available */ }
        }
      } catch { /* parse error */ }
    };

    es.onerror = () => {
      console.warn('SSE connection error, will retry...');
    };

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => { es.close(); };
  }, []);

  return { fetchJobs, dismissJob, triggerScrape };
}
