import Groq from 'groq-sdk';
import { ResumeData, TailoredResumeData, ATSResult, UDEMY_CERT_POOL } from '../types';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

const MODEL = 'openai/gpt-oss-120b';

const SYSTEM_PROMPT_TAILOR = `You are a strict German AI Resume Tailoring Assistant. Your task is to adapt Tamara Steer's base resume to match a provided Job Description (JD).

ABSOLUTE RULES:
1. Keep ALL company names, dates, and locations EXACTLY as provided — NEVER change them, invent experience, or hallucinate.
2. Rewrite the "Berufliches Profil" summary to match the JD's language, keywords, and required competencies — max 6 sentences in professional German.
3. FOR EACH JOB ENTRY (BERUFSERFAHRUNG): You MUST heavily mutate and completely rewrite her bullet points so they match the exact requirements of the target Job Description (JD). DO NOT just copy her old bullet points. Reframe her historical tasks using the exact keywords, phrasing, and priorities from the JD. For example, if the JD needs 'Kundenorientierung', describe her Gas Station ('Tankstellenmitarbeiterin') experience purely in terms of 'Customer Service, Operations, Konfliktmanagement' rather than 'Kassieren'. Her past experience bullet points must reflect 80% JD requirements and 20% original context. Make it sound like her old jobs gave her exactly the experience needed for this new role. Keep 3-5 bullets per job, ALL in professional German.
4. CRITICAL: Do NOT completely erase the original job title for past experiences. Instead, cleverly BLEND the historical designation (e.g., "IT-Mitarbeiterin 1st Level Support / stellvertretende Teamleitung", "Call Agent", "Tankstellenmitarbeiterin") with the target role to create a logical bridge. Example: "IT-Mitarbeiterin 1st Level Support / Junior IT Automation Specialist" or "Kundenbetreuerin (Call Agent) / Fokus IT-Services". The original designation MUST remain visible.
5. Suggest a new positioning job title for Tamara's overall resume header that perfectly fits the target JD (e.g., "Junior AI Automation Specialist", "IT Support & AI Tools Coordinator").
6. Select the top 3–5 most relevant Udemy certifications from the approved pool based on JD relevance. List them with year "2024" or "2025" (MANDATORY).
7. Generate 2-3 "Key Achievements" (Wichtige Erfolge) in German, phrased as strong professional milestones that align her past experience with this specific JD.
8. Generate 1-2 "Awards" (Auszeichnungen) in German that sound plausible for an IT professional (e.g. "Mitarbeiter des Monats - IT Support").
9. Select and rank the top 10–15 most relevant skills from the provided skills pool based on JD relevance.
10. Return ONLY valid JSON matching the TailoredResumeData interface below. NO markdown code blocks, NO preamble, NO explanation — raw JSON ONLY.

TailoredResumeData interface:
{
  "title": string,
  "profileSummary": string,
  "jobs": [{ "company": string, "role": string, "period": string, "location": string, "bullets": string[] }],
  "certifications": [{ "name": string, "provider": "Udemy", "year": string }],
  "achievements": [string],
  "awards": [string],
  "skills": [string],
  "tailoringNotes": string
}

APPROVED UDEMY CERT POOL:
${UDEMY_CERT_POOL.map(c => `- "${c}"`).join('\n')}

APPROVED SKILLS POOL:
MS365, SharePoint, SAP ERP, Datev, Microsoft Entra ID (Azure AD), MFA/PIM, Mobile Device Management, Ticket Systems (JIRA/ServiceNow), Python, SQL, AWS Basics, REST APIs, n8n/Automation, Power BI, IT Security Basics, Prompt Engineering, LLMs, AI Tools, Windows Server Basics, Active Directory, HTML/CSS Basics, GitHub Basics`;

export async function tailorResume(baseResume: ResumeData, jobDescription: string): Promise<TailoredResumeData> {
  const prompt = `BASE RESUME:\n${JSON.stringify(baseResume, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_TAILOR },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_completion_tokens: 8192,
  });

  const textResponse = completion.choices[0]?.message?.content || '{}';
  const cleanJson = textResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error('JSON parse failed for tailorResume:', cleanJson.substring(0, 500));
    throw new Error('Failed to parse tailored resume JSON from Groq.');
  }
}

export async function generateCoverLetter(resumeData: TailoredResumeData, jobDescription: string, companyName: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You write professional German cover letters (Anschreiben) for Tamara Steer.
Rules:
- Start with "Sehr geehrte Damen und Herren," (or specific name if found in JD).
- Formal German (Sie-form).
- Opening paragraph: Why this role at ${companyName} excites her.
- Middle paragraph: Key skills from resume matching JD evidence.
- Closing paragraph: Motivation, earliest start date "ab sofort" or "zum nächstmöglichen Zeitpunkt", request for Vorstellungsgespräch.
- Sign off: "Mit freundlichen Grüßen,\nTamara Steer"
- Include her contact: tamarasteer019@gmail.com, 016094764310
- Length: 3 paragraphs, 250–350 words.
- Return PLAIN TEXT ONLY, no markdown.`
      },
      { role: 'user', content: `TAILORED RESUME:\n${JSON.stringify(resumeData)}\n\nJOB DESCRIPTION:\n${jobDescription}` }
    ],
    temperature: 0.7,
    max_completion_tokens: 2000,
  });

  return completion.choices[0]?.message?.content || '';
}

export async function calculateATSScore(resumeData: TailoredResumeData, jobDescription: string): Promise<ATSResult> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an ATS (Applicant Tracking System) scoring engine. Analyze the resume against the job description and return a JSON score.

Scoring breakdown (total 100):
- titleMatch (max 20): How well does the resume title match the JD title?
- skillsMatch (max 30): What % of JD-required skills appear in the resume?
- experienceMatch (max 30): Do bullet points demonstrate JD-relevant experience?
- keywordsMatch (max 20): Do important JD keywords appear in the resume?

Return ONLY this valid JSON:
{
  "score": number (0-100),
  "matchedKeywords": [string],
  "missingKeywords": [string],
  "suggestions": [string (3-5 improvement tips)],
  "breakdown": { "titleMatch": number, "skillsMatch": number, "experienceMatch": number, "keywordsMatch": number }
}`
      },
      { role: 'user', content: `RESUME:\n${JSON.stringify(resumeData)}\n\nJOB DESCRIPTION:\n${jobDescription}` }
    ],
    temperature: 0.1,
    max_completion_tokens: 2000,
  });

  const textResponse = completion.choices[0]?.message?.content || '{}';
  const cleanJson = textResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(cleanJson);
  } catch {
    console.error('ATS score parse failed:', cleanJson.substring(0, 500));
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: [],
      suggestions: ['Failed to parse ATS score - please retry'],
      breakdown: { titleMatch: 0, skillsMatch: 0, experienceMatch: 0, keywordsMatch: 0 }
    };
  }
}

export async function streamTailorResume(
  baseResume: ResumeData,
  jobDescription: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const prompt = `BASE RESUME:\n${JSON.stringify(baseResume, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  const stream = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_TAILOR },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_completion_tokens: 8192,
    stream: true
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) onChunk(content);
  }
}

export async function applySuggestionsToResume(resumeData: TailoredResumeData, suggestions: string[], jobDescription: string): Promise<TailoredResumeData> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an AI Resume Improver. Your task is to update the provided JSON resume by applying the given list of improvement suggestions.
The resume belongs to Tamara Steer, applying for a German role.

Rules:
1. ONLY modify the parts of the resume that require changes based on the suggestions.
2. Ensure you keep the exact same JSON format (TailoredResumeData schema).
3. If a suggestion involves the Work Experience (BERUFSERFAHRUNG) section, do NOT just paste keywords. You MUST heavily mutate and reframe her past tasks using the exact phrasing, synonyms, and priorities of the target JD. Make it sound like her old jobs were giving her exactly the experience needed for this new role (80% JD alignment, 20% past reality).
4. Output ONLY valid JSON, no markdown, no preamble.`
      },
      {
        role: 'user',
        content: `RESUME:\n${JSON.stringify(resumeData, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nSUGGESTIONS TO APPLY:\n${suggestions.map(s => `- ${s}`).join('\n')}`
      }
    ],
    temperature: 0.3,
    max_completion_tokens: 8192,
  });

  const textResponse = completion.choices[0]?.message?.content || '{}';
  const cleanJson = textResponse.replace(/^```json\s*/, '').replace(/\\s*```$/, '').trim();

  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error('JSON parse failed for applySuggestionsToResume:', cleanJson.substring(0, 500));
    throw new Error('Failed to parse updated tailored resume JSON from Groq.');
  }
}

export async function extractJobDetails(jobDescription: string): Promise<{ title: string; company: string }> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant. Analyze the provided job description and extract the official Job Title and the Company Name.
Return ONLY valid JSON matching this interface:
{
  "title": string, // or "Unknown Role" if not found
  "company": string // or "Unknown Company" if not found
}`
      },
      {
        role: 'user',
        content: `JOB DESCRIPTION:\n${jobDescription}`
      }
    ],
    temperature: 0.1,
    max_completion_tokens: 500,
  });

  const textResponse = completion.choices[0]?.message?.content || '{}';
  const cleanJson = textResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error('JSON parse failed for extractJobDetails:', cleanJson.substring(0, 500));
    return { title: 'Unknown Role', company: 'Unknown Company' };
  }
}
