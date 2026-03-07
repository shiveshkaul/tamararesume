import { useCallback, useState } from 'react';
import API from '../api';
import { useAppStore } from '../store/appStore';

export function useGroq() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const store = useAppStore();

  const tailorResume = useCallback(async (jobDescription: string, jobId?: number) => {
    setLoading(true);
    setError(null);
    store.setIsTailoring(true);
    store.setTailoringError(null);

    try {
      const response = await API.post('/resume/tailor', { jobDescription, jobId });
      const { tailoredResume, atsResult, coverLetter } = response.data;
      store.setTailoredResume(tailoredResume);
      store.setAtsResult(atsResult);
      store.setCoverLetter(coverLetter);
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Tailoring failed';
      setError(msg);
      store.setTailoringError(msg);
      throw err;
    } finally {
      setLoading(false);
      store.setIsTailoring(false);
    }
  }, [store]);

  const generateCoverLetter = useCallback(async (jobDescription: string, jobId?: number, applicationId?: number) => {
    setLoading(true);
    try {
      const response = await API.post('/cover-letter/generate', { jobDescription, jobId, applicationId, resumeData: store.tailoredResume });
      store.setCoverLetter(response.data.coverLetter);
      return response.data.coverLetter;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [store]);

  return { tailorResume, generateCoverLetter, loading, error };
}
