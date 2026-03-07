import { useAppStore } from '../store/appStore';

interface ResumeCanvasProps {
  scale?: number;
}

export default function ResumeCanvas({ scale = 1 }: ResumeCanvasProps) {
  const { resumeData, isEditMode } = useAppStore();
  const d = resumeData;

  const editableProps = isEditMode ? { contentEditable: true, suppressContentEditableWarning: true } : {};
  const editClass = isEditMode ? 'outline outline-2 outline-blue-300/50 outline-offset-2 rounded' : '';

  return (
    <div
      id="resume-canvas"
      style={{
        width: 794 * scale,
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
        overflow: 'hidden',
        color: '#2c2c2c',
      }}
    >
      {/* LEFT SIDEBAR */}
      <div style={{ width: '35%', background: '#1e5f74', color: '#fff', padding: '30px 20px' }}>
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
          fontSize: 32, fontWeight: 700, margin: '0 auto 20px', color: '#fff'
        }}>
          TS
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
        <div style={{ background: '#c8892a', color: '#fff', padding: '6px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, margin: '20px -20px 12px', paddingLeft: 20 }}>
          🎓 AUSBILDUNG
        </div>
        <div style={{ fontSize: 11, fontWeight: 700 }}>Bachelor of Science (B.Sc.) in Wirtschaftsinformatik</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Fernuniversität Hagen | Campusstandort Stuttgart</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>10/2025 – heute</div>

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
      <div style={{ width: '65%', padding: '30px 25px', background: '#fff' }}>
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
