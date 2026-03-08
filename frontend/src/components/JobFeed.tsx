import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useJobs } from '../hooks/useJobs';
import { useGroq } from '../hooks/useGroq';
import { useBulk } from '../hooks/useBulk';
import JobCard from './JobCard';
import { JobRow } from '../types';
import axios from 'axios';

export default function JobFeed() {
  const navigate = useNavigate();
  const { jobs, isScraperRunning, setSelectedJob, setActiveJobDetails, setJobDescription } = useAppStore();
  const { fetchJobs, dismissJob, triggerScrape } = useJobs();
  const { tailorResume } = useGroq();
  const { startBulkTailoring, queueStatus } = useBulk();
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());

  // Helper: parse posted_date strings to determine if job is under 24 hours old
  function isUnder24Hours(postedDate: string | null | undefined): boolean {
    if (!postedDate) return false;
    const d = postedDate.toLowerCase().trim();
    if (d.includes('just now') || d.includes('gerade') || d === 'today' || d === 'heute') return true;
    if (d.includes('second') || d.includes('sekunde') || d.includes('minute') || d.includes('minuten')) return true;
    const hourMatch = d.match(/(\d+)\s*(hour|stunde|hr|h\b)/i);
    if (hourMatch && parseInt(hourMatch[1]) < 24) return true;
    return false;
  }

  useEffect(() => { fetchJobs(); }, []);

  const handleTailor = useCallback((job: JobRow) => {
    // Stage the job in global state, then explicitly navigate to the editor
    setSelectedJob(job);
    setActiveJobDetails({ title: job.title, company: job.company, id: job.id, url: job.url });
    // If we already have the full description, use it immediately. Otherwise clear it so the auto-extractor can try.
    setJobDescription(job.description_full || '');
    navigate('/editor');
  }, [navigate, setSelectedJob, setActiveJobDetails, setJobDescription]);

  const toggleSelection = useCallback((jobId: number, selected: boolean) => {
    setSelectedJobs(prev => {
      const next = new Set(prev);
      if (selected) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
  }, []);

  const handleBulkApply = async () => {
    try {
      const ids = Array.from(selectedJobs);
      // Open all URLs in new tabs instantly to avoid pop-up blockers (modern browsers may still block some, but user click initiates it)
      const selectedJobObjs = jobs.filter(j => ids.includes(j.id));
      selectedJobObjs.forEach(job => {
        if (job.url) window.open(job.url, '_blank');
      });

      // Mark applied in DB
      await axios.post('http://localhost:8000/api/jobs/bulk-apply', { jobIds: ids });
      fetchJobs();
      setSelectedJobs(new Set());
    } catch (err) {
      console.error('Bulk apply failed:', err);
      alert('Bulk apply log update failed.');
    }
  };

  const filtered = jobs
    .filter(j => {
      const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
      const matchPlatform = !platformFilter || j.platform === platformFilter;
      const matchStatus = statusFilter === 'All' ||
        (statusFilter === 'New Only' && j.is_new === 1) ||
        (statusFilter === 'Under24h' && isUnder24Hours(j.posted_date));
      return matchSearch && matchPlatform && matchStatus;
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at || a.scraped_at || 0).getTime();
      const timeB = new Date(b.created_at || b.scraped_at || 0).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  const platforms = [...new Set(jobs.map(j => j.platform).filter(Boolean))];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-brand-teal">Job Feed</h2>
          {isScraperRunning && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <button
          onClick={triggerScrape}
          disabled={isScraperRunning}
          className="px-3 py-1.5 bg-brand-teal text-white text-xs font-semibold rounded hover:bg-brand-teal/90 disabled:opacity-50 transition"
        >
          🔍 Scrape Now
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-brand-teal"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-2 py-1.5 text-xs border border-gray-200 bg-white rounded focus:outline-none focus:border-brand-teal"
        >
          <option value="All">All Jobs</option>
          <option value="New Only">🆕 New Only</option>
          <option value="Under24h">⚡ Under 24h</option>
        </select>
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}
          className="px-2 py-1.5 text-xs border border-gray-200 bg-white rounded focus:outline-none focus:border-brand-teal"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {/* Platform chips */}
      <div className="flex flex-wrap gap-1 mb-3">
        <button
          onClick={() => setPlatformFilter('')}
          className={`px-2 py-0.5 text-[10px] rounded-full transition ${!platformFilter ? 'bg-brand-teal text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          All
        </button>
        {platforms.map(p => (
          <button
            key={p}
            onClick={() => setPlatformFilter(p === platformFilter ? '' : p)}
            className={`px-2 py-0.5 text-[10px] rounded-full transition capitalize ${p === platformFilter ? 'bg-brand-teal text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Job List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p className="text-2xl mb-2">🔍</p>
            <p>No jobs yet. Click "Scrape Now" or start the auto scraper!</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-gray-800">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedJobs.size === filtered.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedJobs(new Set(filtered.map(j => j.id)));
                    } else {
                      setSelectedJobs(new Set());
                    }
                  }}
                  className="w-4 h-4 text-brand-teal rounded border-gray-300 focus:ring-brand-teal cursor-pointer"
                />
                Select All ({filtered.length})
              </label>
            </div>
            {filtered.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onTailor={handleTailor}
                onDismiss={dismissJob}
                isSelected={selectedJobs.has(job.id)}
                onToggleSelect={toggleSelection}
              />
            ))}
          </>
        )}
      </div>

      {/* Floating Action Bar for Bulk Tailoring */}
      {selectedJobs.size > 0 && (
        <div className="fixed bottom-6 right-6 lg:right-1/2 lg:translate-x-[calc(50%+200px)] bg-brand-slate text-white pl-6 pr-2 py-2 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-slideUp border border-gray-700">
          <span className="font-bold text-sm">{selectedJobs.size} Selected</span>

          <button
            onClick={() => {
              startBulkTailoring(Array.from(selectedJobs));
              setSelectedJobs(new Set());
              navigate('/applications');
            }}
            disabled={queueStatus?.isProcessing}
            className="bg-brand-teal hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-full font-bold text-sm transition flex items-center gap-2 shadow-sm"
          >
            {queueStatus?.isProcessing ? '⏳ Queue Running...' : '✨ Bulk Tailor'}
          </button>

          <button
            onClick={handleBulkApply}
            className="bg-brand-gold hover:bg-brand-gold/90 text-brand-slate px-4 py-2 rounded-full font-bold text-sm transition flex items-center gap-2 shadow-sm"
          >
            🚀 Bulk Apply
          </button>

          <button onClick={() => setSelectedJobs(new Set())} className="p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-white/10 ml-2">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
