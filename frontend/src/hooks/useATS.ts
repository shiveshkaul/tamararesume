import { useCallback, useState } from 'react';
import API from '../api';
import { useAppStore } from '../store/appStore';
import { ATSResult, TailoredResumeData } from '../types';

export function useATS() {
  const [loading, setLoading] = useState(false);
  const store = useAppStore();

  const scoreResume = useCallback(async (jobDescription: string, resumeData?: TailoredResumeData) => {
    setLoading(true);
    try {
      const res = await API.post('/ats/score', {
        jobDescription,
        resumeData: resumeData || store.tailoredResume
      });
      store.setAtsResult(res.data as ATSResult);
      return res.data;
    } catch (err) {
      console.error('ATS scoring failed:', err);
    } finally {
      setLoading(false);
    }
  }, [store]);

  return { scoreResume, loading };
}
