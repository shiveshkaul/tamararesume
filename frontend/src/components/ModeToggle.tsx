import { useAppStore } from '../store/appStore';

export default function ModeToggle() {
  const { mode, setMode } = useAppStore();

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-semibold transition ${mode === 'manual' ? 'text-brand-teal' : 'text-gray-400'}`}>
        Manual
      </span>
      <button
        onClick={() => setMode(mode === 'manual' ? 'auto' : 'manual')}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          mode === 'auto' ? 'bg-brand-gold' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            mode === 'auto' ? 'translate-x-7' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span className={`text-xs font-semibold transition ${mode === 'auto' ? 'text-brand-gold' : 'text-gray-400'}`}>
        Auto
      </span>
    </div>
  );
}
