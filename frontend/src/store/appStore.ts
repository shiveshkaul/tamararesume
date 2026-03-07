import { create } from 'zustand';
import { TailoredResumeData, ATSResult, JobRow, ResumeData } from '../types';

export const BASE_RESUME: ResumeData = {
  title: 'IT-Mitarbeiterin 1st Level Support',
  profileSummary: 'Engagierte IT-Support-Mitarbeiterin mit soliden Kenntnissen in der Betreuung und Administration von IT-Infrastrukturen und Softwarelösungen. Sicher im Umgang mit MS365, SAP ERP, Active Directory (Microsoft Entra ID) sowie cloudbasierten Anwendungen. Aktuell intensive Weiterbildung in IT-Sicherheit, Backend-Entwicklung (AWS, API-Integration) und Prozessautomatisierung. Strukturiertes und lösungsorientiertes Arbeiten, gepaart mit Teamgeist und hoher Lernbereitschaft, zeichnen meinen Arbeitsstil aus.',
  jobs: [
    { company: 'Xentasystems GmbH', role: 'IT-Mitarbeiterin 1st Level Support / stellvertretende Teamleitung', period: '04/2023 – bis dato', location: 'Heidenheim, Deutschland', bullets: ['Erster Ansprechpartner für ein internationales Anwaltsunternehmen', 'Unterstützung bei MS365, lokalen Microsoft-Apps sowie SAP, Datev, SharePoint und weiteren Anwendungen', 'Aufnahme, Monitoring und Koordination von Tickets', 'Planung und Steuerung von Support-Anfragen', 'Unterstützung durch Microsoft Entra ID (ehem. Azure Active Directory), insbesondere bei Multifaktorauthentifizierung (MFA), Rollenaktivierungen im Rahmen des Privileged Identity Management (PIM) sowie der Verwaltung von Firmen-iPhones (Mobile Device Support)'] },
    { company: 'Concept & Service GbR', role: 'Call Agent', period: '12/2021 – 03/2023', location: 'Neresheim, Deutschland', bullets: ['Forderungsmanagement und Kundenservice für Energieversorger', 'Systemadministrative Aufgaben wie Buchungskorrekturen und Datenpflege in SAP ERP'] },
    { company: 'Pentz GmbH & Co. KG', role: 'Kommissioniererin / Schnittproduktion', period: '09/2021 – 12/2021', location: 'Essingen, Deutschland', bullets: ['Aufträge am PC kontrollieren und ausführen', 'Waren verpacken und etikettieren', 'Lebensmittel putzen und schneiden', 'Frischekontrolle', 'Umsetzung der Hygienevorschriften'] },
    { company: 'ARAL Tankstellen, Dalacker & Sohn', role: 'Tankstellenmitarbeiterin / stellvertretende Stationsleitung', period: '07/2019 – 09/2021', location: 'Deutschland', bullets: ['Leitung des Backshop-Bereichs und Verantwortung für Mitarbeiter', 'Kassenführung und Kundenbetreuung', 'Bestellungen und Warenmanagement am PC'] },
    { company: 'ARAL-Center Kling', role: 'Tankstellenmitarbeiterin', period: '11/2016 – 06/2019', location: 'Herbrechtingen, Deutschland', bullets: ['Kassenführung', 'Kundenberatung/-betreuung', 'Annahme und Kontrolle der angelieferten Waren und Zeitungen', 'Verräumen der Waren', 'Bestücken des Bistros', 'MHD Kontrolle', 'Umsetzung der Hygienevorschriften'] }
  ],
  certifications: [],
  skills: ['MS365', 'SharePoint', 'SAP ERP', 'Datev', 'Microsoft Entra ID (Azure AD)', 'MFA/PIM', 'Mobile Device Management', 'Ticket Systems (JIRA/ServiceNow)', 'Python', 'SQL', 'AWS Basics', 'REST APIs', 'n8n/Automation', 'Power BI', 'IT Security Basics', 'Prompt Engineering', 'LLMs', 'AI Tools', 'Windows Server Basics', 'Active Directory', 'HTML/CSS Basics', 'GitHub Basics']
};

interface AppState {
  // Resume
  resumeData: ResumeData;
  tailoredResume: TailoredResumeData | null;
  atsResult: ATSResult | null;
  coverLetter: string;
  isEditMode: boolean;
  isTailoring: boolean;
  tailoringError: string | null;

  // Jobs
  jobs: JobRow[];
  selectedJob: JobRow | null;
  isScraperRunning: boolean;
  newJobCount: number;

  // Mode
  mode: 'manual' | 'auto';

  // Actions
  setResumeData: (data: ResumeData) => void;
  setTailoredResume: (data: TailoredResumeData | null) => void;
  setAtsResult: (result: ATSResult | null) => void;
  setCoverLetter: (text: string) => void;
  setEditMode: (on: boolean) => void;
  setIsTailoring: (v: boolean) => void;
  setTailoringError: (err: string | null) => void;
  setJobs: (jobs: JobRow[]) => void;
  addNewJobs: (jobs: JobRow[]) => void;
  setSelectedJob: (job: JobRow | null) => void;
  setScraperRunning: (v: boolean) => void;
  setMode: (mode: 'manual' | 'auto') => void;
  resetToBase: () => void;
  resetNewJobCount: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  resumeData: BASE_RESUME,
  tailoredResume: null,
  atsResult: null,
  coverLetter: '',
  isEditMode: false,
  isTailoring: false,
  tailoringError: null,
  jobs: [],
  selectedJob: null,
  isScraperRunning: false,
  newJobCount: 0,
  mode: 'manual',

  setResumeData: (data) => set({ resumeData: data }),
  setTailoredResume: (data) => set({ tailoredResume: data, resumeData: data ? { ...data } : BASE_RESUME }),
  setAtsResult: (result) => set({ atsResult: result }),
  setCoverLetter: (text) => set({ coverLetter: text }),
  setEditMode: (on) => set({ isEditMode: on }),
  setIsTailoring: (v) => set({ isTailoring: v }),
  setTailoringError: (err) => set({ tailoringError: err }),
  setJobs: (jobs) => set({ jobs }),
  addNewJobs: (newJobs) => set((s) => ({ jobs: [...newJobs, ...s.jobs], newJobCount: s.newJobCount + newJobs.length })),
  setSelectedJob: (job) => set({ selectedJob: job }),
  setScraperRunning: (v) => set({ isScraperRunning: v }),
  setMode: (mode) => set({ mode }),
  resetToBase: () => set({ resumeData: BASE_RESUME, tailoredResume: null, atsResult: null, coverLetter: '' }),
  resetNewJobCount: () => set({ newJobCount: 0 }),
}));
