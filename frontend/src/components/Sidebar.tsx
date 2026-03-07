import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/editor', label: 'Resume Editor', icon: '📝' },
  { path: '/applications', label: 'Applications', icon: '📋' },
  { path: '/scraper', label: 'Scraper', icon: '🔍' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const { newJobCount, isScraperRunning, mode } = useAppStore();

  return (
    <aside className="w-64 h-screen bg-brand-teal text-white flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold">TamaraApply</h1>
        <p className="text-xs text-white/60 mt-1">Pro · AI Job Application System</p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-all hover:bg-white/10 ${
                isActive ? 'bg-white/15 border-r-4 border-brand-gold font-semibold' : 'text-white/80'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
            {item.path === '/' && newJobCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-content-center animate-pulse">
                {newJobCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs">
          {isScraperRunning ? (
            <>
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <span className="text-white/70">Scraper Active</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="text-white/50">Scraper Idle</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs mt-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mode === 'auto' ? 'bg-brand-gold text-white' : 'bg-white/20 text-white/70'}`}>
            {mode.toUpperCase()} MODE
          </span>
        </div>
      </div>
    </aside>
  );
}
