// ===== Frontend Types (mirroring backend) =====

export interface BaseJob {
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: string[];
}

export interface Certification {
  name: string;
  provider: string;
  year: string;
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
  location: string;
}

export interface ResumeData {
  title: string;
  profileSummary: string;
  goals: string;
  jobs: BaseJob[];
  education: Education[];
  certifications: Certification[];
  skills: string[];
  achievements: string[];
  awards: string[];
}

export interface TailoredResumeData extends ResumeData {
  tailoringNotes: string;
}

export interface ATSResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  breakdown: {
    titleMatch: number;
    skillsMatch: number;
    experienceMatch: number;
    keywordsMatch: number;
  };
}

export interface JobRow {
  id: number;
  external_id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  posted_date: string | null;
  url: string;
  description_short: string | null;
  description_full: string | null;
  platform: string;
  scraped_at: string;
  is_new: number;
  is_applied: number;
  is_dismissed: number;
  ats_score: number | null;
  created_at: string;
}

export interface ApplicationRow {
  id: number;
  job_id: number;
  applied_at: string | null;
  status: string;
  mode: string;
  tailored_resume_path: string | null;
  cover_letter_path: string | null;
  ats_score: number | null;
  ats_breakdown: string | null;
  folder_path: string | null;
  notes: string | null;
  created_at: string;
  job_title?: string;
  job_company?: string;
  job_platform?: string;
  job_url?: string;
}
