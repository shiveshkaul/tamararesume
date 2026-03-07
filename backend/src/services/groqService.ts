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
3. For each job entry: rewrite bullet points to emphasize skills and achievements relevant to the JD — keep number of bullets the same or add 1–2 max, ALL in German.
4. Suggest a new positioning job title for Tamara that fits the JD (e.g., "Junior AI Automation Specialist", "IT Support & AI Tools Coordinator").
5. Select the top 3–5 most relevant Udemy certifications from the approved pool based on JD relevance. List them with year "2024" or "2025".
6. Select and rank the top 10–15 most relevant skills from the provided skills pool based on JD relevance.
7. Return ONLY valid JSON matching the TailoredResumeData interface below. NO markdown code blocks, NO preamble, NO explanation — raw JSON ONLY.

TailoredResumeData interface:
{
  "title": string,
  "profileSummary": string,
  "jobs": [{ "company": string, "role": string, "period": string, "location": string, "bullets": string[] }],
  "certifications": [{ "name": string, "provider": "Udemy", "year": string }],
  "skills": string[],
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
