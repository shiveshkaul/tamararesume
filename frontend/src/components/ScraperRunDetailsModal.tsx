import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAppStore } from '../store/appStore';
import { JobRow } from '../types';

export default function ScraperRunDetailsModal({ run, onClose }: { run: any, onClose: () => void }) {
  const navigate = useNavigate();
  const { setSelectedJob, setActiveJobDetails, setJobDescription } = useAppStore();

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, New Only

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const res = await API.get(`/scraper/runs/${run.id}/jobs`);
        setJobs(res.data.jobs || []);
      } catch (err) {
        console.error('Failed to load run details:', err);
      } finally {
        setLoading(false);
      }
    }
    if (run) fetchJobs();
  }, [run]);

  if (!run) return null;

  // Helper: parse posted_date strings to determine if job is under 24 hours old
  function isUnder24Hours(postedDate: string | null | undefined): boolean {
    if (!postedDate) return false;
    const d = postedDate.toLowerCase().trim();
    // Matches: "3 hours ago", "vor 5 Stunden", "12h ago", "just now", "today", "heute"
    if (d.includes('just now') || d.includes('gerade') || d === 'today' || d === 'heute') return true;
    if (d.includes('second') || d.includes('sekunde') || d.includes('minute') || d.includes('minuten')) return true;
    // "X hours ago" / "vor X Stunden"
    const hourMatch = d.match(/(\d+)\s*(hour|stunde|hr|h\b)/i);
    if (hourMatch && parseInt(hourMatch[1]) < 24) return true;
    // Explicitly NOT days/weeks/months
    return false;
  }

  // Derive unique platforms for the dropdown
  const uniquePlatforms = Array.from(new Set(jobs.map(j => j.platform))).sort();

  // Apply filters
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = (j.title || '').toLowerCase().includes(search.toLowerCase()) || 
                          (j.company || '').toLowerCase().includes(search.toLowerCase()) ||
                          (j.url || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesPlatform = platformFilter === 'All' || j.platform === platformFilter;
    
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'New Only' && j.is_new === 1) ||
                          (statusFilter === 'Under24h' && isUnder24Hours(j.posted_date));

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const handleTailor = (job: JobRow) => {
    // 1. Set the active job in Zustand
    setSelectedJob(job);
    setActiveJobDetails({ title: job.title, company: job.company, id: job.id });
    setJobDescription(''); // Force clear the old JD to guarantee the auto-extractor fires
    
    // 2. Shut the overlay modal
    onClose();
    
    // 3. Teleport to the AI Dashboard explicitly
    navigate('/editor');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 sm:p-8 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-full max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Scrape Session #{run.id}</h2>
            <div className="text-sm text-gray-500 mt-1 flex gap-4">
              <span><strong className="text-gray-700">Started:</strong> {new Date(run.started_at).toLocaleString()}</span>
              <span><strong className="text-gray-700">Finished:</strong> {run.finished_at ? new Date(run.finished_at).toLocaleString() : 'In Progress'}</span>
              <span><strong className="text-gray-700">Total Found:</strong> {run.jobs_found}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500 hover:text-red-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-white border-b border-gray-100 shrink-0 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <input 
              type="text" 
              placeholder="🔍 Filter by Title, Company, or URL..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-teal focus:outline-none"
            />
          </div>
          <select 
            value={platformFilter} 
            onChange={e => setPlatformFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer outline-none"
          >
            <option value="All">All Platforms</option>
            {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer outline-none"
          >
            <option value="All">All Jobs</option>
            <option value="New Only">🆕 New Jobs Only</option>
            <option value="Under24h">⚡ Under 24 Hours</option>
          </select>
          <button 
            onClick={() => { setSearch(''); setPlatformFilter('All'); setStatusFilter('All'); }}
            className="text-sm text-brand-teal hover:underline font-medium"
          >
            Clear Filters
          </button>
        </div>

        {/* Dynamic Data Table */}
        <div className="flex-1 overflow-auto bg-gray-50/30 p-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div>
            </div>
          ) : (
            <div className="bg-white border text-sm border-gray-200 rounded-lg shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm outline-1 outline-gray-200 outline">
                  <tr>
                    <th className="p-3 font-semibold text-gray-700 whitespace-nowrap">Timestamp</th>
                    <th className="p-3 font-semibold text-gray-700 whitespace-nowrap">Platform</th>
                    <th className="p-3 font-semibold text-gray-700">Role & Company</th>
                    <th className="p-3 font-semibold text-gray-700">Location</th>
                    <th className="p-3 font-semibold text-gray-700 w-1/4">Snippet</th>
                    <th className="p-3 font-semibold text-gray-700 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredJobs.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No jobs match the current filters.</td></tr>
                  ) : (
                    filteredJobs.map(job => (
                      <tr key={job.id} className="hover:bg-brand-teal/5 transition">
                        <td className="p-3 whitespace-nowrap text-xs text-gray-500">
                          {new Date(job.created_at).toLocaleTimeString()}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold capitalize border border-gray-200">
                            {job.platform}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            <a href={job.url} target="_blank" rel="noreferrer" className="hover:text-brand-teal hover:underline">
                              {job.title}
                            </a>
                            {job.is_new === 1 && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider">New</span>
                            )}
                          </div>
                          <div className="text-gray-600 mt-0.5">{job.company}</div>
                          <div className="flex items-center gap-1 mt-1.5">
                            {job.posted_date && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium border border-blue-100">🕒 {job.posted_date}</span>}
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">
                          {job.location || '—'}
                        </td>
                        <td className="p-3">
                           <div className="text-xs text-gray-500 line-clamp-3 leading-relaxed" title={job.description_short}>
                             {job.description_short || 'No snippet available'}
                           </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleTailor(job)}
                            className="bg-brand-teal hover:bg-brand-teal/90 text-white px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 mx-auto whitespace-nowrap shadow-sm"
                          >
                            ✨ Tailor & View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-right text-sm text-gray-500 font-medium">
          Showing {filteredJobs.length} of {jobs.length} jobs retrieved.
        </div>

      </div>
    </div>
  );
}
