import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import History from './pages/History';
import ThreatIntel from './pages/ThreatIntel';
import Auth from './pages/Auth';
import { api } from './utils/api';

const ScrollToTopOnNavigate = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCurrentUser()
      .then((u) => setUser(u))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Initializing LinkShield Threat Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTopOnNavigate />
      <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <Navbar user={user} onLogout={() => setUser(null)} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Public Home & Live Hero Scanner */}
            <Route path="/" element={<Home user={user} />} />

            {/* Deep Forensic URL Scanner Suite */}
            <Route path="/scanner" element={<Scanner user={user} />} />

            {/* Global Threat Intelligence & IOC Registry */}
            <Route path="/intel" element={<ThreatIntel />} />

            {/* SOC Operational Overview */}
            <Route path="/dashboard" element={<Dashboard user={user} />} />

            {/* Persistent Historical Audits (SQLite Backed) */}
            <Route
              path="/history"
              element={
                <ProtectedRoute user={user}>
                  <History user={user} />
                </ProtectedRoute>
              }
            />

            {/* Clean Enterprise Authentication (Google, Apple, Email) */}
            <Route
              path="/auth"
              element={!user ? <Auth onLoginSuccess={setUser} /> : <Navigate to="/" replace />}
            />

            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800/80 bg-[#080c14]/90 py-8 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">LinkShield Enterprise</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-400">Disk-backed SQLite Threat Intelligence</span>
            </div>
            <div className="text-slate-400 flex flex-wrap items-center justify-center gap-4 text-[11px]">
              <span>Real-Time DNS over TLS</span>
              <span>&bull;</span>
              <span>TLS Handshake Auditing</span>
              <span>&bull;</span>
              <span>Shannon Entropy Analysis</span>
              <span>&bull;</span>
              <span>Homograph Detection</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
