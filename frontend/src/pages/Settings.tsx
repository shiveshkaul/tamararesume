import { useEffect, useState } from 'react';
import API from '../api';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    API.get('/settings').then(res => setSettings(res.data)).catch(console.error);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await API.post('/settings', settings);
      setMessage('✅ Settings saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('❌ Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-brand-teal mb-6">⚙️ Settings</h1>

      <div className="space-y-6">
        {/* Groq API Key */}
        <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Groq API Key</label>
          <input
            type="password"
            value={settings.groq_api_key || ''}
            onChange={e => setSettings({ ...settings, groq_api_key: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-teal"
          />
        </div>

        {/* Groq Model */}
        <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Groq Model</label>
          <select
            value={settings.groq_model || 'openai/gpt-oss-120b'}
            onChange={e => setSettings({ ...settings, groq_model: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
          >
            <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (default)</option>
            <option value="llama3-70b-8192">llama3-70b-8192</option>
            <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
          </select>
        </div>

        {/* Resume Owner */}
        <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Resume Owner</label>
          <input
            type="text"
            value="Tamara Steer"
            disabled
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">🔒 Locked — this app is built for Tamara's CV only</p>
        </div>

        {/* Language */}
        <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Cover Letter Language</label>
          <input
            type="text"
            value="German (Deutsch)"
            disabled
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        {/* Notification Sound */}
        <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Alert Sound for New Jobs</p>
            <p className="text-xs text-gray-400">Play a chime when new jobs arrive</p>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5 accent-brand-teal" />
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Data Management</h3>
          <button className="px-4 py-2 bg-brand-teal text-white text-xs font-semibold rounded hover:bg-brand-teal/90 transition">
            📊 Export Applications CSV
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded hover:bg-gray-200 transition ml-2">
            🗑 Clear Dismissed Jobs
          </button>
          <button className="px-4 py-2 bg-red-100 text-red-600 text-xs font-semibold rounded hover:bg-red-200 transition ml-2">
            ⚠️ Reset Database
          </button>
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-brand-teal text-white font-semibold rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 transition"
        >
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
        {message && <p className="text-sm ml-3 inline">{message}</p>}
      </div>
    </div>
  );
}
