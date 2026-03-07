import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { ApplicationRow } from '../types';
import { useAppStore } from '../store/appStore';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500',
  pending: 'bg-orange-100 text-orange-600',
  manually_applied: 'bg-blue-100 text-blue-700',
  auto_applied: 'bg-purple-100 text-purple-700',
  rejected: 'bg-red-100 text-red-700',
  interview: 'bg-green-100 text-green-700',
  offer: 'bg-yellow-100 text-yellow-800',
};

export default function ApplicationTracker() {
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  
  const navigate = useNavigate();
  const store = useAppStore();

  const fetchApps = async () => {
    try {
      const res = await API.get('/applications', { params: { status: statusFilter || undefined, limit: 100 } });
      setApps(res.data.applications || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchApps(); }, [statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await API.patch(`/applications/${id}`, { status });
      fetchApps();
    } catch (err) { console.error(err); }
  };

  const handleDeleteApp = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this application? This cannot be undone.')) return;
    try {
      await API.delete(`/applications/${id}`);
      fetchApps();
    } catch (err) {
      console.error('Failed to delete application:', err);
      alert('Failed to delete application.');
    }
  };

  const handleOpenApp = async (app: ApplicationRow) => {
    try {
      const res = await API.get(`/resume/${app.id}`);
      store.setTailoredResume(res.data.resumeData);
      store.setCoverLetter(res.data.coverLetter);
      store.setActiveJobDetails({ title: app.job_title || 'Unknown Role', company: app.job_company || 'Unknown Company', id: app.job_id });
      
      if (res.data.jobDescription) {
        store.setJobDescription(res.data.jobDescription);
      } else {
        store.setJobDescription(app.job_title ? `Role: ${app.job_title}\nCompany: ${app.job_company || ''}` : '');
      }

      if (res.data.atsResult) {
        store.setAtsResult(res.data.atsResult);
      } else {
        store.setAtsResult(null);
      }
      
      navigate('/editor');
    } catch (err) {
      console.error('Failed to load application data:', err);
      alert('Failed to load application data. See console for details.');
    }
  };

  const avgAts = apps.length > 0
    ? Math.round(apps.reduce((sum, a) => sum + (a.ats_score || 0), 0) / apps.length)
    : 0;

  const today = new Date().toISOString().split('T')[0];
  const todayCount = apps.filter(a => a.created_at?.startsWith(today)).length;

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-brand-teal">{total}</p>
          <p className="text-xs text-gray-500">Total Applications</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-brand-gold">{todayCount}</p>
          <p className="text-xs text-gray-500">Applied Today</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-green-600">{avgAts}%</p>
          <p className="text-xs text-gray-500">Avg ATS Score</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-purple-600">
            {apps.filter(a => a.status === 'interview').length}
          </p>
          <p className="text-xs text-gray-500">Interviews</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['', 'draft', 'pending', 'manually_applied', 'interview', 'offer', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-xs rounded-full transition ${
              statusFilter === s ? 'bg-brand-teal text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left p-3 font-semibold">Date</th>
              <th className="text-left p-3 font-semibold">Company</th>
              <th className="text-left p-3 font-semibold">Role</th>
              <th className="text-left p-3 font-semibold">Platform</th>
              <th className="text-left p-3 font-semibold">ATS</th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="text-left p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.map(app => (
              <tr key={app.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="p-3">{app.created_at?.split('T')[0]}</td>
                <td className="p-3 font-medium">{app.job_company || '—'}</td>
                <td className="p-3">{app.job_title || '—'}</td>
                <td className="p-3 capitalize">{app.job_platform || 'manual'}</td>
                <td className="p-3">
                  {app.ats_score != null && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      app.ats_score >= 80 ? 'bg-green-100 text-green-700' :
                      app.ats_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{app.ats_score}%</span>
                  )}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[app.status] || 'bg-gray-100 text-gray-600'}`}>
                    {app.status}
                  </span>
                </td>
                <td className="p-3">
                  <select
                    value={app.status}
                    onChange={e => updateStatus(app.id, e.target.value)}
                    className="text-[10px] border border-gray-200 rounded px-1 py-0.5"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="manually_applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {app.job_url && (
                    <a href={app.job_url} target="_blank" rel="noopener noreferrer"
                      className="ml-2 text-brand-teal hover:underline inline-block">
                      ↗ View Job
                    </a>
                  )}
                  <button
                    onClick={() => handleOpenApp(app)}
                    className="ml-2 px-2 py-0.5 bg-brand-teal text-white rounded hover:bg-brand-teal/90 transition text-[10px]"
                  >
                    Open in Editor
                  </button>
                  <button
                    onClick={() => handleDeleteApp(app.id)}
                    className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition text-[10px]"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
            {apps.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No applications yet. Tailor a resume and save it!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
