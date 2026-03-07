import { useState } from 'react';
import ResumeCanvas from '../components/ResumeCanvas';
import JobFeed from '../components/JobFeed';
import ATSScorePanel from '../components/ATSScorePanel';
import CoverLetterPanel from '../components/CoverLetterPanel';
import ModeToggle from '../components/ModeToggle';
import { useAppStore } from '../store/appStore';

export default function Dashboard() {
  const { isEditMode, setEditMode, isTailoring, tailoringError, atsResult, mode, coverLetter } = useAppStore();
  const [showPanel, setShowPanel] = useState(false);

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
      console.error('PDF generation failed:', err);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-2rem)]">
      {/* LEFT: Resume */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Controls bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(!isEditMode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition ${
                isEditMode ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✏️ Edit Mode
            </button>
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="px-3 py-1.5 bg-brand-teal text-white text-xs font-semibold rounded hover:bg-brand-teal/90 transition"
            >
              ✨ Tailor with AI
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-brand-gold text-white text-xs font-semibold rounded hover:bg-brand-gold/90 transition"
            >
              📥 Download PDF
            </button>
          </div>
        </div>

        {/* Auto mode banner */}
        {mode === 'auto' && (
          <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-lg p-3 mb-3 text-xs text-brand-gold font-medium">
            🤖 Auto Mode Active — New jobs are being scraped and tailored automatically
          </div>
        )}

        {/* Loading / Error */}
        {isTailoring && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-xs text-blue-700">
            ⏳ AI is tailoring your resume... This may take 10–30 seconds.
          </div>
        )}
        {tailoringError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-xs text-red-700">
            ❌ {tailoringError}
          </div>
        )}

        {/* Canvas container */}
        <div className="flex-1 overflow-auto bg-gray-200/50 rounded-lg p-4 flex justify-center">
          <div style={{ width: 794 * 0.68, overflow: 'hidden' }}>
            <ResumeCanvas scale={0.68} />
          </div>
        </div>
      </div>

      {/* RIGHT: Job Feed + AI Panel */}
      <div className="w-[420px] flex flex-col">
        {showPanel ? (
          <div className="flex-1 overflow-y-auto bg-white rounded-lg p-4 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-brand-teal">AI Tailor Panel</h2>
              <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕ Close</button>
            </div>
            <ATSScorePanel atsResult={atsResult} />
            <CoverLetterPanel />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <JobFeed />
          </div>
        )}
      </div>
    </div>
  );
}
