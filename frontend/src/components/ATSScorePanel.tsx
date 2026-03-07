import { ATSResult } from '../types';

interface Props {
  atsResult: ATSResult | null;
  onPushSuggestions?: (suggestions: string[]) => Promise<void>;
  loading?: boolean;
}

function ScoreArc({ score }: { score: number }) {
  const r = 50;
  const c = 2 * Math.PI * r;
  const pct = (score / 100) * c;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';

  return (
    <svg width="130" height="130" viewBox="0 0 130 130" className="mx-auto">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${pct} ${c}`} strokeLinecap="round"
        transform="rotate(-90 65 65)"
        style={{ transition: 'stroke-dasharray 1s ease-out' }}
      />
      <text x="65" y="65" textAnchor="middle" dominantBaseline="central" fontSize="24" fontWeight="700" fill={color}>
        {score}%
      </text>
    </svg>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : value >= 40 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ATSScorePanel({ atsResult, onPushSuggestions, loading }: Props) {
  if (!atsResult) return null;

  return (
    <div className="animate-fadeIn">
      <h3 className="font-bold text-brand-teal mb-3">ATS Match Score</h3>
      <ScoreArc score={atsResult.score} />

      <div className="mt-4">
        <BreakdownBar label="Title Match" value={atsResult.breakdown.titleMatch} />
        <BreakdownBar label="Skills Match" value={atsResult.breakdown.skillsMatch} />
        <BreakdownBar label="Experience Match" value={atsResult.breakdown.experienceMatch} />
        <BreakdownBar label="Keywords Match" value={atsResult.breakdown.keywordsMatch} />
      </div>

      {atsResult.matchedKeywords.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-green-700 mb-1">✅ Matched Keywords</h4>
          <div className="flex flex-wrap gap-1">
            {atsResult.matchedKeywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] rounded-full">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {atsResult.missingKeywords.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-red-700 mb-1">❌ Missing Keywords</h4>
          <div className="flex flex-wrap gap-1">
            {atsResult.missingKeywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] rounded-full">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {atsResult.suggestions.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-brand-teal mb-1">💡 Suggestions</h4>
          <ul className="text-xs text-gray-600 space-y-1 mb-2">
            {atsResult.suggestions.map((s, i) => <li key={i}>• {s}</li>)}
          </ul>
          {onPushSuggestions && (
            <button
              onClick={() => onPushSuggestions(atsResult.suggestions)}
              disabled={loading}
              className="w-full py-1.5 bg-brand-gold/10 text-brand-gold border border-brand-gold/30 font-semibold rounded hover:bg-brand-gold/20 transition text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-3 h-3 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
              ) : (
                '🔄 Apply Suggestions to Resume'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
