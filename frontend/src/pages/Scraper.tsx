import ScraperControl from '../components/ScraperControl';
import { useAppStore } from '../store/appStore';
import API from '../api';

export default function Scraper() {
  const { wfhOnly, setWfhOnly } = useAppStore();

  const handleWfhToggle = async () => {
    const newVal = !wfhOnly;
    setWfhOnly(newVal);
    try {
      await API.post('/settings/wfh_only', { value: JSON.stringify(newVal) });
    } catch (err) {
      console.error('Failed to save WFH setting:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-teal">🔍 Scraper Control</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleWfhToggle}
            className={`text-sm px-4 py-1.5 rounded-full font-bold shadow-sm transition-all flex items-center gap-2 ${
              wfhOnly 
                ? 'bg-brand-gold text-white shadow-brand-gold/30 ring-2 ring-brand-gold/50' 
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {wfhOnly ? (
              <><span>🌍</span> <span>Remote Jobs: <strong>ON</strong></span></>
            ) : (
              <><span>🏢</span> <span>Remote Jobs: <strong>OFF</strong></span></>
            )}
          </button>
        </div>
      </div>
      <ScraperControl />
    </div>
  );
}
