import { useState } from 'react';
import ResumeCanvas from '../components/ResumeCanvas';
import CoverLetterCanvas from '../components/CoverLetterCanvas';
import ATSScorePanel from '../components/ATSScorePanel';
import { useAppStore } from '../store/appStore';
import { useGroq } from '../hooks/useGroq';

export default function ResumeEditor() {
  const store = useAppStore();
  const { isEditMode, setEditMode, atsResult, isTailoring, tailoringError, tailoredResume, jobDescription, setJobDescription, activeJobDetails } = store;
  const { tailorResume, scoreBaseResume, pushSuggestions, loading } = useGroq();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'resume' | 'coverLetter'>('resume');

  const handleTailor = async () => {
    if (!jobDescription.trim()) return;
    try {
      await tailorResume(jobDescription);
    } catch { /* error handled by hook */ }
  };

  const handleScoreBase = async () => {
    if (!jobDescription.trim()) return;
    try {
      await scoreBaseResume(jobDescription);
    } catch { /* error handled by hook */ }
  };

  const handleDownloadPdf = async () => {
    const targetId = activeTab === 'resume' ? 'resume-canvas' : 'cover-letter-canvas';
    const element = document.getElementById(targetId);
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
      console.error('PDF Error:', err);
      alert('PDF generation failed. Check console for details.');
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-2rem)]">
      {/* Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-lg font-bold text-brand-teal mr-4">Resume Editor</h1>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'resume' ? 'bg-white shadow text-brand-teal' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📄 Resume
            </button>
            <button
              onClick={() => setActiveTab('coverLetter')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'coverLetter' ? 'bg-white shadow text-brand-teal' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📝 Cover Letter
            </button>
          </div>

          <div className="flex-1" />
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

        <div className="flex-1 overflow-auto bg-gray-200/50 rounded-lg p-6 flex justify-center items-start">
          <div style={{ minWidth: 794 * 0.85, minHeight: 1123 * 0.85, flexShrink: 0 }}>
            {activeTab === 'resume' ? (
              <ResumeCanvas scale={0.85} />
            ) : (
              <CoverLetterCanvas scale={0.85} />
            )}
          </div>
        </div>
      </div>

      {/* AI Panel Drawer */}
      {drawerOpen && (
        <div className="w-[380px] overflow-y-auto bg-white rounded-lg p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-brand-teal">AI Tailor Panel</h2>
            <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>

          {activeJobDetails && (
            <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-lg p-3">
              <p className="text-[10px] uppercase font-bold text-brand-teal mb-1">Target Role Recognized</p>
              <h3 className="text-sm font-bold text-brand-slate leading-tight">{activeJobDetails.title}</h3>
              <p className="text-xs text-gray-600 font-medium">{activeJobDetails.company}</p>
            </div>
          )}

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

          <div className="flex gap-2">
            <button
              onClick={handleScoreBase}
              disabled={loading || !jobDescription.trim()}
              className="flex-1 py-2.5 bg-brand-gold text-white font-semibold flex items-center justify-center gap-1 rounded-lg hover:bg-brand-gold/90 disabled:opacity-50 transition text-sm"
            >
              📊 Check Base ATS
            </button>
            <button
              onClick={handleTailor}
              disabled={loading || !jobDescription.trim()}
              className="flex-1 py-2.5 bg-brand-teal text-white font-semibold flex items-center justify-center gap-1 rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 transition text-sm"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                '✨ Tailor Resume'
              )}
            </button>
          </div>

          {tailoringError && (
            <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">❌ {tailoringError}</div>
          )}

          <ATSScorePanel 
            atsResult={atsResult} 
            onPushSuggestions={async (suggestions) => {
              if (!jobDescription.trim()) return;
              try {
                await pushSuggestions(suggestions, jobDescription);
              } catch { /* error handled by hook */ }
            }}
            loading={loading}
          />

          {atsResult && (
            tailoredResume ? (
              <button
                onClick={() => {
                  alert('Application saved! Check the Applications page.');
                }}
                className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-sm flex items-center justify-center gap-2"
              >
                💾 Save Application
              </button>
            ) : (
              <button
                onClick={handleTailor}
                disabled={loading || !jobDescription.trim()}
                className="w-full py-2 bg-brand-teal text-white font-semibold flex items-center justify-center gap-2 rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 transition text-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  '✨ Tailor Now to Improve Score'
                )}
              </button>
            )
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
