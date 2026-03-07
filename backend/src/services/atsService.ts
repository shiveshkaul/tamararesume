import { TailoredResumeData, ATSResult } from '../types';
import { calculateATSScore as groqATS } from './groqService';

export async function scoreResume(resumeData: TailoredResumeData, jobDescription: string): Promise<ATSResult> {
  return groqATS(resumeData, jobDescription);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'amber';
  if (score >= 40) return 'orange';
  return 'red';
}
