import ScraperControl from '../components/ScraperControl';
import ModeToggle from '../components/ModeToggle';

export default function Scraper() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-teal">🔍 Scraper Control</h1>
        <ModeToggle />
      </div>
      <ScraperControl />
    </div>
  );
}
