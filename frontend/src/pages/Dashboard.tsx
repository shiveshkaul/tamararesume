import { useState } from 'react';
import ResumeCanvas from '../components/ResumeCanvas';
import JobFeed from '../components/JobFeed';
import ATSScorePanel from '../components/ATSScorePanel';
import CoverLetterPanel from '../components/CoverLetterPanel';
import ModeToggle from '../components/ModeToggle';
import { useAppStore, BASE_RESUME } from '../store/appStore';
import { useBulk } from '../hooks/useBulk';

export default function Dashboard() {
  const { isEditMode, setEditMode, isTailoring, tailoringError, atsResult, mode, coverLetter, tailoredResume, activeJobDetails } = useAppStore();
  const { queueStatus } = useBulk();
  const [showPanel, setShowPanel] = useState(false);

  const handleDownloadPdf = async () => {
    const element = document.getElementById('resume-canvas');
    if (!element) return;
    try {
      const { default: API } = await import('../api');
      
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.transform = 'none';
      clone.style.boxShadow = 'none';
      
      const response = await API.post('/resume/generate-pdf', { 
        htmlBody: clone.outerHTML 
      }, { 
        responseType: 'blob' 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      let fileName = `Tamara_Steer_CV_${new Date().toISOString().split('T')[0]}.pdf`;
      if (activeJobDetails) {
        const titleSafe = activeJobDetails.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const companySafe = activeJobDetails.company.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        fileName = `Tamara_Steer_CV_${companySafe}_${titleSafe}.pdf`;
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Check console for details.');
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-2rem)] flex-col lg:flex-row relative">
      
      {/* 🚀 Global Queue Banner */}
      {queueStatus?.isProcessing && (
        <div className="absolute top-0 left-0 right-0 z-50 animate-slideDown flex justify-center mt-2 pointer-events-none">
          <div className="bg-brand-slate/90 backdrop-blur-sm border border-brand-teal text-white shadow-2xl rounded-full px-6 py-2.5 flex items-center gap-4">
            <div className="w-4 h-4 rounded-full border-2 border-brand-teal border-t-transparent animate-spin shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-brand-teal uppercase tracking-wider">
                Background Queue Active ({queueStatus.queueLength} remaining)
              </span>
              <span className="text-[11px] text-gray-300 font-medium truncate max-w-sm">
                {queueStatus.currentStatus}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* LEFT: Resume */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Controls bar */}
        <div className="flex items-center justify-between mb-3 z-10">
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
        <div className="flex-1 overflow-auto bg-gray-200/50 rounded-lg p-4 flex gap-8 justify-center items-start">
          {tailoredResume && (
            <div className="flex flex-col gap-2 items-center">
              <div className="flex items-center justify-between w-full px-2">
                <span className="font-bold text-gray-500 text-sm uppercase tracking-wide">Legacy Resume</span>
                <a href="/Tamara_Steer_Lebenslauf.pdf" target="_blank" className="px-2 py-1 text-[10px] font-bold bg-white text-gray-600 border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition flex items-center gap-1">
                  📄 Open Legacy PDF
                </a>
              </div>
              <div style={{ position: 'relative', width: 794 * 0.52, height: 1123 * 0.52, flexShrink: 0 }} className="opacity-90 grayscale-[0.2]">
                <div style={{ position: 'absolute', top: 0, left: 0 }}>
                  <ResumeCanvas scale={0.52} data={BASE_RESUME} id="base-resume-canvas" />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-2 items-center">
            {tailoredResume && <span className="font-bold text-brand-teal text-sm uppercase tracking-wide">✨ Tailored Resume</span>}
            <div style={{ position: 'relative', width: 794 * (tailoredResume ? 0.52 : 0.75), height: 1123 * (tailoredResume ? 0.52 : 0.75), flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 0, left: 0 }}>
                <ResumeCanvas scale={tailoredResume ? 0.52 : 0.75} />
              </div>
            </div>
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
