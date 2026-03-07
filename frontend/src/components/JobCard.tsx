import { JobRow } from '../types';

interface Props {
  job: JobRow;
  onTailor: (job: JobRow) => void;
  onDismiss: (jobId: number) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function scoreColor(score: number | null): string {
  if (!score) return 'bg-gray-200 text-gray-500';
  if (score >= 80) return 'bg-green-100 text-green-700 border-green-300';
  if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  return 'bg-red-100 text-red-700 border-red-300';
}

export default function JobCard({ job, onTailor, onDismiss }: Props) {
  return (
    <div className={`bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all ${
      job.is_new ? 'animate-slideDown border-l-4 border-l-brand-gold' : ''
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {job.is_new === 1 && (
              <span className="px-1.5 py-0.5 bg-brand-gold text-white text-[9px] font-bold rounded animate-pulse">
                🆕 NEW
              </span>
            )}
            <span className="px-1.5 py-0.5 bg-brand-teal/10 text-brand-teal text-[9px] font-semibold rounded">
              {job.platform}
            </span>
          </div>
          <h3 className="text-sm font-bold text-brand-slate truncate">{job.title}</h3>
          <p className="text-xs text-gray-600 font-medium">{job.company}</p>
          <p className="text-xs text-gray-400">{job.location} · {timeAgo(job.created_at)}</p>
          {job.description_short && (
            <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{job.description_short}</p>
          )}
        </div>

        {job.ats_score !== null && (
          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-bold ${scoreColor(job.ats_score)}`}>
            {job.ats_score}%
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onTailor(job)}
          className="flex-1 px-3 py-1.5 bg-brand-teal text-white text-xs font-semibold rounded hover:bg-brand-teal/90 transition"
        >
          ✨ Tailor & View
        </button>
        <button
          onClick={() => onDismiss(job.id)}
          className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs rounded hover:bg-gray-200 transition"
        >
          ✕
        </button>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs rounded hover:bg-gray-200 transition"
        >
          ↗
        </a>
      </div>
    </div>
  );
}
