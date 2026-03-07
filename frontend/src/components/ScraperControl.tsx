import { useEffect, useState } from 'react';
import API from '../api';
import { useAppStore } from '../store/appStore';

export default function ScraperControl() {
  const { isScraperRunning, setScraperRunning } = useAppStore();
  const [interval, setInterval_] = useState(60);
  const [runs, setRuns] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await API.get('/scraper/status');
      setStatus(res.data);
      setRuns(res.data.runs || []);
      setScraperRunning(res.data.isRunning);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchStatus(); const id = window.setInterval(fetchStatus, 5000); return () => clearInterval(id); }, []);

  const handleStart = async () => {
    try {
      await API.post('/scraper/start', { interval: interval });
      setScraperRunning(true);
      fetchStatus();
    } catch (err) { console.error(err); }
  };

  const handleStop = async () => {
    try {
      await API.post('/scraper/stop');
      setScraperRunning(false);
      fetchStatus();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={`p-6 rounded-xl border-2 ${isScraperRunning ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          <span className={`w-4 h-4 rounded-full ${isScraperRunning ? 'bg-red-500 animate-pulse-glow' : 'bg-gray-300'}`} />
          <span className="text-lg font-bold">
            Scraper is {isScraperRunning ? 'RUNNING' : 'STOPPED'}
          </span>
        </div>
        {status?.lastRunAt && (
          <p className="text-xs text-gray-500 mt-2">Last run: {new Date(status.lastRunAt).toLocaleString()}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isScraperRunning ? (
          <button onClick={handleStart} className="px-6 py-2 bg-brand-teal text-white font-semibold rounded-lg hover:bg-brand-teal/90 transition">
            ▶ Start Auto Mode
          </button>
        ) : (
          <button onClick={handleStop} className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition">
            ⏹ Stop
          </button>
        )}
        <select
          value={interval}
          onChange={e => setInterval_(+e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value={60}>Every 60s</option>
          <option value={120}>Every 2min</option>
          <option value={300}>Every 5min</option>
          <option value={600}>Every 10min</option>
        </select>
      </div>

      {/* Run History */}
      <div>
        <h3 className="font-bold text-brand-teal mb-2">Run History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2">Started</th>
                <th className="text-left p-2">Platforms</th>
                <th className="text-left p-2">Found</th>
                <th className="text-left p-2">New</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r: any, i: number) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="p-2">{r.started_at ? new Date(r.started_at).toLocaleString() : '—'}</td>
                  <td className="p-2">{r.platforms_scraped ? JSON.parse(r.platforms_scraped).length : 0} platforms</td>
                  <td className="p-2">{r.jobs_found || 0}</td>
                  <td className="p-2 font-semibold text-green-600">{r.jobs_new || 0}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'completed' ? 'bg-green-100 text-green-700' :
                      r.status === 'running' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{r.status}</span>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-gray-400">No runs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
