import { create } from 'zustand';
import { TailoredResumeData, ATSResult, JobRow, ResumeData } from '../types';

export const BASE_RESUME: ResumeData = {
  title: 'IT-Mitarbeiterin 1st Level Support',
  profileSummary: 'Engagierte IT-Support-Mitarbeiterin mit soliden Kenntnissen in der Betreuung und Administration von IT-Infrastrukturen und Softwarelösungen. Sicher im Umgang mit MS365, SAP ERP, Active Directory (Microsoft Entra ID) sowie cloudbasierten Anwendungen. Aktuell intensive Weiterbildung in IT-Sicherheit, Backend-Entwicklung (AWS, API-Integration) und Prozessautomatisierung. Strukturiertes und lösungsorientiertes Arbeiten, gepaart mit Teamgeist und hoher Lernbereitschaft, zeichnen meinen Arbeitsstil aus.',
  goals: 'Ich strebe eine langfristige Weiterentwicklung mit Schwerpunkt auf den Bereichen IT-Entwicklung, Backend-Systeme, Projektmanagement sowie Cloud- und Datenintegration an.\n\nMein Ziel ist es, bestehende Kenntnisse in IT-Systemadministration und Netzwerktechnik gezielt auszubauen und diese mit neuen Kompetenzen in Softwareentwicklung, Cloud-Technologien, Künstlicher Intelligenz und Prozessautomatisierung zu verbinden. Ich lege Wert auf praxisorientiertes Lernen und die Mitarbeit an innovativen Projekten, um Fachwissen und Verantwortung schrittweise zu erweitern.\n\nPersönliche Interessen: Yoga, Paartänze (z. B. Salsa), Sprachen lernen, kulturelle Filme und Serien in Originalsprache (z. B. Mandarin, Japanisch, Koreanisch) mit englischem oder deutschem Untertitel sowie private Mitarbeit an einem Softwareprojekt (Versicherungsvergleichsplattform für Indien) mit Schwerpunkt auf API-Integration, AWS Lambda, Backend-Entwicklung und KI-gestützter Datenanalyse – wodurch ich laufend neue praktische Erfahrungen im Bereich moderner Cloud-Architekturen sammle.',
  education: [
    { degree: 'Bachelor of Science (B.Sc.) in Wirtschaftsinformatik', institution: 'Fernuniversität Hagen', period: '10/2025 – Present', location: 'Campusstandort Stuttgart' },
    { degree: 'Rechtsanwaltsfachangestellte', institution: 'Rechtsanwalt Zweifel', period: '2003 – 2006', location: 'Giengen, Deutschland' },
    { degree: 'Staatlich geprüfte Wirtschaftsassistentin', institution: 'Kaufmännisches Berufskolleg Fremdsprachen', period: '2001 – 2003', location: 'Heidenheim, Deutschland' },
    { degree: 'Grund- und Realschule', institution: 'Härtsfeldschule', period: '1991 – 2001', location: 'Neresheim, Deutschland' }
  ],
  jobs: [
    { company: 'Xentasystems GmbH', role: 'IT-Mitarbeiterin 1st Level Support / stellvertretende Teamleitung', period: '04/2023 – bis dato', location: 'Heidenheim, Deutschland', bullets: ['Erster Ansprechpartner für ein internationales Anwaltsunternehmen', 'Unterstützung bei MS365, lokalen Microsoft-Apps sowie SAP, Datev, SharePoint und weiteren Anwendungen', 'Aufnahme, Monitoring und Koordination von Tickets', 'Planung und Steuerung von Support-Anfragen', 'Unterstützung durch Microsoft Entra ID (ehem. Azure Active Directory), insbesondere bei Multifaktorauthentifizierung (MFA), Rollenaktivierungen im Rahmen des Privileged Identity Management (PIM) sowie der Verwaltung von Firmen-iPhones (Mobile Device Support)'] },
    { company: 'Concept & Service GbR', role: 'Call Agent', period: '12/2021 – 03/2023', location: 'Neresheim, Deutschland', bullets: ['Forderungsmanagement und Kundenservice für Energieversorger', 'Systemadministrative Aufgaben wie Buchungskorrekturen und Datenpflege in SAP ERP'] },
    { company: 'Pentz GmbH & Co. KG', role: 'Kommissioniererin / Schnittproduktion', period: '09/2021 – 12/2021', location: 'Essingen, Deutschland', bullets: ['Aufträge am PC kontrollieren und ausführen', 'Waren verpacken und etikettieren', 'Lebensmittel putzen und schneiden', 'Frischekontrolle', 'Umsetzung der Hygienevorschriften'] },
    { company: 'ARAL Tankstellen, Dalacker & Sohn', role: 'Tankstellenmitarbeiterin / stellvertretende Stationsleitung', period: '07/2019 – 09/2021', location: 'Deutschland', bullets: ['Leitung des Backshop-Bereichs und Verantwortung für Mitarbeiter', 'Kassenführung und Kundenbetreuung', 'Bestellungen und Warenmanagement am PC'] },
    { company: 'ARAL-Center Kling', role: 'Tankstellenmitarbeiterin', period: '11/2016 – 06/2019', location: 'Herbrechtingen, Deutschland', bullets: ['Kassenführung', 'Kundenberatung/-betreuung', 'Annahme und Kontrolle der angelieferten Waren und Zeitungen', 'Verräumen der Waren', 'Bestücken des Bistros', 'MHD Kontrolle', 'Umsetzung der Hygienevorschriften'] },
    { company: 'Agentur für Arbeit', role: 'aktive Arbeitssuche', period: '04/2016 – 10/2016', location: 'Heidenheim an der Brenz, Deutschland', bullets: [] },
    { company: 'KIK Textilien- und Non-Food GmbH', role: 'Verkäuferin', period: '09/2015 – 03/2016', location: 'Herbrechtingen, Deutschland', bullets: ['Kassenführung', 'Kundenberatung/-betreuung', 'Warenannahme, -rücknahme und -kontrolle', 'Umsetzung der Hygienevorschriften'] },
    { company: 'Elternzeit / Erziehungszeit', role: 'Elternzeit', period: '05/2011 – 08/2015', location: 'Deutschland', bullets: ['Januar 2015 bis Juli 2015 Seminar „Frau Aktiv“'] },
    { company: 'Bosch und Siemens Hausgeräte GmbH, Firma Edelmann und Firma Hartmann AG', role: 'Produktionsmitarbeiterin / Qualitätsprüferin', period: '04/2009 – 05/2011', location: 'Heidenheim an der Brenz, Deutschland', bullets: ['Zusammenbau von Elektrokleinteilen sowie von Kühl- und Gefriergeräten', 'Aushelfen in verschiedenen Arbeitsbereichen', 'Sichtkontrolle', 'Qualitätskontrolle Einzelverpackungen', 'Verpacken der Produkte', 'Zusammenstellen und Verpacken von OP Materialien'] },
    { company: 'Elternzeit/Erziehungszeit', role: 'Elternzeit', period: '11/2007 – 11/2008', location: 'Heidenheim an der Brenz, Deutschland', bullets: [] },
    { company: 'Bosch und Siemens Hausgeräte GmbH', role: 'Produktionsmitarbeiterin', period: '10/2006 – 10/2007', location: 'Giengen, Deutschland', bullets: ['Zusammenbau von Elektrokleinteilen sowie von Kühl- und Gefriergeräten', 'Aushelfen in verschiedenen Arbeitsbereichen'] }
  ],
  certifications: [],
  achievements: [],
  awards: [],
  skills: ['MS365, SAP, SharePoint, Datev, CaseWare, Ticket-Management-Systeme', 'Python (Grundkenntnisse), API-Integration, AWS Lambda, Postman, VS Code', 'SAP ERP, Grundverständnis Odoo, Prozessautomatisierung, Cloud-Sicherheit', 'Lösungsorientiert, lernbereit, kommunikativ, teamfähig']
};

interface AppState {
  // Resume
  resumeData: ResumeData;
  tailoredResume: TailoredResumeData | null;
  atsResult: ATSResult | null;
  coverLetter: string;
  jobDescription: string;
  isEditMode: boolean;
  isTailoring: boolean;
  tailoringError: string | null;

  // Jobs
  jobs: JobRow[];
  selectedJob: JobRow | null;
  activeJobDetails: { title: string; company: string; id?: number } | null;
  isScraperRunning: boolean;
  newJobCount: number;

  // Mode
  mode: 'manual' | 'auto';
  wfhOnly: boolean;

  // Actions
  setResumeData: (data: ResumeData) => void;
  setTailoredResume: (data: TailoredResumeData | null) => void;
  setAtsResult: (result: ATSResult | null) => void;
  setCoverLetter: (text: string) => void;
  setJobDescription: (jd: string) => void;
  setEditMode: (on: boolean) => void;
  setIsTailoring: (v: boolean) => void;
  setTailoringError: (err: string | null) => void;
  setJobs: (jobs: JobRow[]) => void;
  addNewJobs: (jobs: JobRow[]) => void;
  setSelectedJob: (job: JobRow | null) => void;
  setActiveJobDetails: (details: { title: string; company: string; id?: number } | null) => void;
  setScraperRunning: (v: boolean) => void;
  setMode: (mode: 'manual' | 'auto') => void;
  setWfhOnly: (on: boolean) => void;
  resetToBase: () => void;
  resetNewJobCount: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  resumeData: BASE_RESUME,
  tailoredResume: null,
  atsResult: null,
  coverLetter: '',
  jobDescription: '',
  isEditMode: false,
  isTailoring: false,
  tailoringError: null,
  jobs: [],
  selectedJob: null,
  activeJobDetails: null,
  isScraperRunning: false,
  newJobCount: 0,
  mode: 'manual',
  wfhOnly: false,

  setResumeData: (data) => set({ resumeData: data }),
  setTailoredResume: (data) => set({ tailoredResume: data, resumeData: data ? { ...data } : BASE_RESUME }),
  setAtsResult: (result) => set({ atsResult: result }),
  setCoverLetter: (text) => set({ coverLetter: text }),
  setJobDescription: (jd) => set({ jobDescription: jd }),
  setEditMode: (on) => set({ isEditMode: on }),
  setIsTailoring: (v) => set({ isTailoring: v }),
  setTailoringError: (err) => set({ tailoringError: err }),
  setJobs: (jobs) => set({ jobs }),
  addNewJobs: (newJobs) => set((s) => ({ jobs: [...newJobs, ...s.jobs], newJobCount: s.newJobCount + newJobs.length })),
  setSelectedJob: (job) => set({ selectedJob: job }),
  setActiveJobDetails: (details) => set({ activeJobDetails: details }),
  setScraperRunning: (v) => set({ isScraperRunning: v }),
  setMode: (mode) => set({ mode }),
  setWfhOnly: (wfhOnly) => {
    set({ wfhOnly });
    try {
      fetch('http://localhost:8000/api/settings/wfh_only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: wfhOnly })
      });
    } catch { } // ignore
  },
  resetToBase: () => set({ resumeData: BASE_RESUME, tailoredResume: null, atsResult: null, coverLetter: '', jobDescription: '', activeJobDetails: null }),
  resetNewJobCount: () => set({ newJobCount: 0 }),
}));
