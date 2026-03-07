import { useAppStore } from '../store/appStore';

export default function CoverLetterPanel() {
  const { coverLetter, setCoverLetter } = useAppStore();

  if (!coverLetter) return null;

  return (
    <div className="animate-fadeIn">
      <h3 className="font-bold text-brand-teal mb-2">📝 Anschreiben (Cover Letter)</h3>
      <textarea
        value={coverLetter}
        onChange={e => setCoverLetter(e.target.value)}
        rows={14}
        className="w-full p-3 text-xs border border-gray-200 rounded-lg font-sans leading-relaxed focus:outline-none focus:border-brand-teal resize-y"
      />
    </div>
  );
}
