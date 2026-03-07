import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { useJobs } from '../hooks/useJobs';
import { useGroq } from '../hooks/useGroq';
import JobCard from './JobCard';
import { JobRow } from '../types';

export default function JobFeed() {
  const { jobs, isScraperRunning } = useAppStore();
  const { fetchJobs, dismissJob, triggerScrape } = useJobs();
  const { tailorResume } = useGroq();
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  useEffect(() => { fetchJobs(); }, []);

  const handleTailor = useCallback(async (job: JobRow) => {
    const jd = job.description_full || job.description_short || job.title + ' at ' + job.company;
    try {
      await tailorResume(jd, job.id);
    } catch (err) {
      console.error('Tailor failed:', err);
    }
  }, [tailorResume]);

  const filtered = jobs.filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = !platformFilter || j.platform === platformFilter;
    return matchSearch && matchPlatform;
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
          filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onTailor={handleTailor}
              onDismiss={dismissJob}
            />
          ))
        )}
      </div>
    </div>
  );
}
