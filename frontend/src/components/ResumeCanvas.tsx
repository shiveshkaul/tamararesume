import { useAppStore } from '../store/appStore';

import { ResumeData } from '../types';

interface ResumeCanvasProps {
  scale?: number;
  data?: ResumeData;
  id?: string;
}

export default function ResumeCanvas({ scale = 1, data, id = 'resume-canvas' }: ResumeCanvasProps) {
  const store = useAppStore();
  const d = data || store.resumeData;

  const isEditMode = store.isEditMode && !data;
  const editableProps = isEditMode ? { contentEditable: true, suppressContentEditableWarning: true } : {};
  const editClass = isEditMode ? 'outline outline-2 outline-blue-300/50 outline-offset-2 rounded' : '';

  return (
    <div
      id={id}
      style={{
        width: 794 * scale,
        height: 'max-content',
        minHeight: 1123 * scale,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif",
        fontSize: 11 * scale,
        lineHeight: 1.5,
        display: 'flex',
        background: '#fff',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        borderRadius: 4,
        color: '#2c2c2c',
      }}
    >
      {/* LEFT SIDEBAR */}
      <div style={{ width: '35%', flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#1e5f74', color: '#fff', padding: '30px 20px' }}>
        <div {...editableProps} className={editClass} style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
          Tamara Steer
        </div>
        <div {...editableProps} className={editClass} style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 20 }}>
          {d.title}
        </div>

        {/* Photo */}
        <div style={{
          width: 110, height: 110, borderRadius: '50%', background: '#c8892a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', overflow: 'hidden'
        }}>
          <img src="/profile.jpeg" alt="Tamara Steer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Contact */}
        <div style={{ marginBottom: 20, fontSize: 10.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span>✉</span> tamarasteer019@gmail.com
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span>📞</span> 016094764310
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span>📍</span> Kaffeegäßle 2, 73566 Bartholomä
          </div>
        </div>

        {/* Profil */}
        <div style={{ background: '#c8892a', color: '#fff', padding: '6px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, margin: '20px -20px 12px', paddingLeft: 20 }}>
          💼 BERUFLICHES PROFIL
        </div>
        <div {...editableProps} className={editClass} style={{ fontSize: 10.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.92)' }}>
          {d.profileSummary}
        </div>

        {/* Sprachen */}
        <div style={{ background: '#c8892a', color: '#fff', padding: '6px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, margin: '20px -20px 12px', paddingLeft: 20 }}>
          🗣 SPRACHEN
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11 }}>Deutsch</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4,5].map(i => (
              <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#c8892a', display: 'inline-block' }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11 }}>Englisch</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4].map(i => (
              <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#c8892a', display: 'inline-block' }} />
            ))}
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'inline-block' }} />
          </div>
        </div>

        {/* Ausbildung */}
        {d.education && d.education.length > 0 && (
          <>
            <div style={{ background: '#c8892a', color: '#fff', padding: '6px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, margin: '20px -20px 12px', paddingLeft: 20 }}>
              🎓 AUSBILDUNG
            </div>
            {d.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{edu.degree}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                  {edu.institution} {edu.location ? `| ${edu.location}` : ''}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{edu.period}</div>
              </div>
            ))}
          </>
        )}

        {/* Certifications */}
        {d.certifications && d.certifications.length > 0 && (
          <>
            <div style={{ background: '#c8892a', color: '#fff', padding: '6px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, margin: '20px -20px 12px', paddingLeft: 20 }}>
              📜 ZERTIFIZIERUNGEN
            </div>
            {d.certifications.map((c, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.75)' }}>{c.provider} | {c.year}</div>
              </div>
            ))}
          </>
        )}

        {/* Ziele und Stärken */}
        {d.goals && (
          <>
            <div style={{ background: '#c8892a', color: '#fff', padding: '6px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, margin: '20px -20px 12px', paddingLeft: 20 }}>
              🎯 ZIELE UND STÄRKEN
            </div>
            <div {...editableProps} className={editClass} style={{ fontSize: 10.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.92)' }}>
              {d.goals.split('\n\n').map((para, i) => (
                <p key={i} style={{ marginBottom: 8 }}>{para}</p>
              ))}
            </div>
          </>
        )}

        {/* Skills */}
        {d.skills && d.skills.length > 0 && (
          <>
            <div style={{ background: '#c8892a', color: '#fff', padding: '6px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, margin: '20px -20px 12px', paddingLeft: 20 }}>
              ⚡ SKILLS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {d.skills.map((s, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 3, fontSize: 9.5 }}>
                  {s}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* RIGHT CONTENT */}
      <div style={{ flex: 1, padding: '30px 25px', background: '#fff' }}>
        <div style={{
          background: '#1e5f74', color: '#fff', padding: '8px 15px', fontSize: 12,
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
          margin: '0 -25px 20px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          💼 BERUFSERFAHRUNG
        </div>

        {d.jobs.map((job, i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{job.company}</div>
            <div {...editableProps} className={editClass} style={{ fontSize: 11, color: '#1e5f74', fontWeight: 600 }}>{job.role}</div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 5 }}>{job.period} | {job.location}</div>
            <ul style={{ listStyle: 'disc', paddingLeft: 16, fontSize: 10.5 }}>
              {job.bullets.map((b, j) => (
                <li key={j} {...editableProps} className={editClass} style={{ marginBottom: 2 }}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
