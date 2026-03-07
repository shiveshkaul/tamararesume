import { useAppStore } from '../store/appStore';

interface CoverLetterCanvasProps {
  scale?: number;
  id?: string;
}

export default function CoverLetterCanvas({ scale = 1, id = 'cover-letter-canvas' }: CoverLetterCanvasProps) {
  const store = useAppStore();
  const d = store.tailoredResume || store.resumeData;
  const coverLetter = store.coverLetter;

  const isEditMode = store.isEditMode;
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
      {/* LEFT SIDEBAR (Matching Resume) */}
      <div style={{ width: '35%', flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#1e5f74', color: '#fff', padding: '30px 20px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
          Tamara Steer
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 20 }}>
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
      </div>

      {/* RIGHT CONTENT (Cover Letter) */}
      <div style={{ flex: 1, padding: '40px 45px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          background: '#1e5f74', color: '#fff', padding: '8px 15px', fontSize: 13,
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
          margin: '0 -45px 30px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          📝 ANSCHREIBEN
        </div>

        {coverLetter ? (
          <div
            {...editableProps}
            className={`whitespace-pre-wrap flex-1 text-justify ${editClass}`}
            style={{ fontSize: 12, lineHeight: 1.7, color: '#333' }}
            onBlur={(e) => {
              if (isEditMode) {
                store.setCoverLetter(e.currentTarget.innerText || '');
              }
            }}
          >
            {coverLetter}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 italic text-sm">
            No cover letter generated yet. Please tailor your resume first.
          </div>
        )}
      </div>
    </div>
  );
}
