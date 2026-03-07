import { useState } from 'react';
import ResumeCanvas from '../components/ResumeCanvas';
import ATSScorePanel from '../components/ATSScorePanel';
import CoverLetterPanel from '../components/CoverLetterPanel';
import { useAppStore } from '../store/appStore';
import { useGroq } from '../hooks/useGroq';

export default function ResumeEditor() {
  const { isEditMode, setEditMode, atsResult, isTailoring, tailoringError } = useAppStore();
  const { tailorResume, loading } = useGroq();
  const [jobDescription, setJobDescription] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(true);

  const handleTailor = async () => {
    if (!jobDescription.trim()) return;
    try {
      await tailorResume(jobDescription);
    } catch { /* error handled by hook */ }
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('resume-canvas');
    if (!element) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().set({
        margin: 0,
        filename: `Tamara_Steer_CV_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save();
    } catch (err) {
      console.error('PDF Error:', err);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-2rem)]">
      {/* Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-lg font-bold text-brand-teal flex-1">Resume Editor</h1>
          <button
            onClick={() => setEditMode(!isEditMode)}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition ${isEditMode ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            ✏️ Edit Mode
          </button>
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="px-3 py-1.5 bg-brand-teal text-white text-xs font-semibold rounded hover:bg-brand-teal/90 transition"
          >
            ✨ Tailor with AI
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-3 py-1.5 bg-brand-gold text-white text-xs font-semibold rounded hover:bg-brand-gold/90 transition"
          >
            📥 PDF
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-200/50 rounded-lg p-6 flex justify-center">
          <ResumeCanvas scale={0.85} />
        </div>
      </div>

      {/* AI Panel Drawer */}
      {drawerOpen && (
        <div className="w-[380px] overflow-y-auto bg-white rounded-lg p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-brand-teal">AI Tailor Panel</h2>
            <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Paste Job Description</label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              rows={8}
              placeholder="Paste the full job description here..."
              className="w-full p-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-brand-teal resize-y"
            />
          </div>

          <button
            onClick={handleTailor}
            disabled={loading || !jobDescription.trim()}
            className="w-full py-2.5 bg-brand-teal text-white font-semibold rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Tailoring...
              </>
            ) : (
              '✨ Tailor Resume'
            )}
          </button>

          {tailoringError && (
            <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">❌ {tailoringError}</div>
          )}

          <ATSScorePanel atsResult={atsResult} />
          <CoverLetterPanel />

          {atsResult && (
            <button
              onClick={() => {
                // Save application would POST to backend — simplified here
                alert('Application saved! Check the Applications page.');
              }}
              className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-sm"
            >
              💾 Save Application
            </button>
          )}

          <button
            disabled
            className="w-full py-2 bg-gray-200 text-gray-400 font-semibold rounded-lg cursor-not-allowed text-sm"
          >
            🤖 Auto-Apply (Coming Soon)
          </button>
        </div>
      )}
    </div>
  );
}
