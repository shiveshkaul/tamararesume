import fs from 'fs';
import path from 'path';

// PDF generation using puppeteer
export async function generatePdfFromHtml(html: string, outputPath: string): Promise<string> {
  // Dynamic import to avoid issues if puppeteer is not installed
  let puppeteer: any;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.warn('Puppeteer not installed. Saving HTML only. Install puppeteer for PDF generation.');
    // Save HTML as fallback
    fs.writeFileSync(outputPath.replace('.pdf', '.html'), html, 'utf-8');
    return outputPath.replace('.pdf', '.html');
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      scale: 1.0
    });
    return outputPath;
  } finally {
    await browser.close();
  }
}

export function buildResumeHtml(resumeData: any): string {
  const jobs = resumeData.jobs || [];
  const certs = resumeData.certifications || [];
  const skills = resumeData.skills || [];

  const jobsHtml = jobs.map((job: any) => `
    <div class="job-entry">
      <div class="job-company">${job.company}</div>
      <div class="job-role">${job.role}</div>
      <div class="job-period">${job.period} | ${job.location}</div>
      <ul class="job-bullets">
        ${job.bullets.map((b: string) => `<li>${b}</li>`).join('\n        ')}
      </ul>
    </div>
  `).join('\n');

  const certsHtml = certs.length > 0 ? `
    <div class="section">
      <div class="section-header-sidebar">📜 ZERTIFIZIERUNGEN</div>
      ${certs.map((c: any) => `
        <div class="cert-item">
          <div class="cert-name">${c.name}</div>
          <div class="cert-detail">${c.provider} | ${c.year}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const skillsHtml = skills.length > 0 ? `
    <div class="skills-container">
      ${skills.map((s: string) => `<span class="skill-tag">${s}</span>`).join(' ')}
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Source Sans 3', 'Segoe UI', sans-serif; }
  .cv-container {
    width: 794px; min-height: 1123px; display: flex;
    background: white; color: #2c2c2c; font-size: 11px; line-height: 1.5;
  }
  .sidebar {
    width: 35%; background: #1e5f74; color: white; padding: 30px 20px;
  }
  .main-content {
    width: 65%; padding: 30px 25px; background: white;
  }
  .name { font-size: 28px; font-weight: 700; margin-bottom: 4px; color: white; }
  .title-text { font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.9); margin-bottom: 20px; }
  .photo-circle {
    width: 120px; height: 120px; border-radius: 50%; background: #c8892a;
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; font-weight: 700; color: white; margin: 0 auto 20px;
  }
  .contact-info { margin-bottom: 25px; font-size: 10.5px; }
  .contact-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .contact-icon { font-size: 12px; width: 16px; text-align: center; }
  .section-header-sidebar {
    background: #c8892a; color: white; padding: 6px 12px; font-size: 11px;
    font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
    margin: 20px -20px; padding-left: 20px; margin-bottom: 12px;
  }
  .section-header-main {
    background: #1e5f74; color: white; padding: 8px 15px; font-size: 12px;
    font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
    margin: 0 -25px 20px; display: flex; align-items: center; gap: 8px;
  }
  .profile-text { font-size: 10.5px; line-height: 1.6; color: rgba(255,255,255,0.92); }
  .lang-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .lang-name { font-size: 11px; }
  .lang-dots { display: flex; gap: 4px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot.filled { background: #c8892a; }
  .dot.empty { background: rgba(255,255,255,0.3); }
  .job-entry { margin-bottom: 18px; }
  .job-company { font-size: 12px; font-weight: 700; color: #2c2c2c; }
  .job-role { font-size: 11px; color: #1e5f74; font-weight: 600; }
  .job-period { font-size: 10px; color: #666; margin-bottom: 5px; }
  .job-bullets { list-style: disc; padding-left: 16px; font-size: 10.5px; line-height: 1.5; }
  .job-bullets li { margin-bottom: 2px; }
  .cert-item { margin-bottom: 8px; }
  .cert-name { font-size: 10px; font-weight: 600; }
  .cert-detail { font-size: 9.5px; color: rgba(255,255,255,0.75); }
  .edu-title { font-size: 11px; font-weight: 700; }
  .edu-detail { font-size: 10px; color: rgba(255,255,255,0.8); }
  .skills-container { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; }
  .skill-tag {
    background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 3px;
    font-size: 9.5px; color: white;
  }
</style>
</head>
<body>
<div class="cv-container">
  <div class="sidebar">
    <div class="name">Tamara Steer</div>
    <div class="title-text">${resumeData.title || 'IT-Mitarbeiterin 1st Level Support'}</div>
    <div class="photo-circle">TS</div>
    <div class="contact-info">
      <div class="contact-item"><span class="contact-icon">✉</span> tamarasteer019@gmail.com</div>
      <div class="contact-item"><span class="contact-icon">📞</span> 016094764310</div>
      <div class="contact-item"><span class="contact-icon">📍</span> Kaffeegäßle 2, 73566 Bartholomä</div>
    </div>
    <div class="section-header-sidebar">💼 BERUFLICHES PROFIL</div>
    <div class="profile-text">${resumeData.profileSummary || ''}</div>
    <div class="section-header-sidebar">🗣 SPRACHEN</div>
    <div class="lang-row"><span class="lang-name">Deutsch</span><div class="lang-dots">${Array(5).fill('<span class="dot filled"></span>').join('')}</div></div>
    <div class="lang-row"><span class="lang-name">Englisch</span><div class="lang-dots">${Array(4).fill('<span class="dot filled"></span>').join('')}${'<span class="dot empty"></span>'}</div></div>
    <div class="section-header-sidebar">🎓 AUSBILDUNG</div>
    <div class="edu-title">Bachelor of Science (B.Sc.) in Wirtschaftsinformatik</div>
    <div class="edu-detail">Fernuniversität Hagen | Campusstandort Stuttgart</div>
    <div class="edu-detail">10/2025 – heute</div>
    ${certsHtml}
    ${skills.length > 0 ? `<div class="section-header-sidebar">⚡ SKILLS</div>${skillsHtml}` : ''}
  </div>
  <div class="main-content">
    <div class="section-header-main">💼 BERUFSERFAHRUNG</div>
    ${jobsHtml}
  </div>
</div>
</body>
</html>`;
}
