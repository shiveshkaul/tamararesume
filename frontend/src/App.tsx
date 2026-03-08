import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ResumeEditor from './pages/ResumeEditor';
import Applications from './pages/Applications';
import Scraper from './pages/Scraper';
import Settings from './pages/Settings';
import './index.css';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/editor" element={<ResumeEditor />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/scraper" element={<Scraper />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
