import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
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
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Initializing LinkShield Threat Hub...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTopOnNavigate />
      <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100">
        <Navbar user={user} onLogout={() => setUser(null)} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/scanner" element={<Scanner user={user} />} />
            <Route path="/intel" element={<ThreatIntel />} />
            <Route
              path="/history"
              element={
                <ProtectedRoute user={user}>
                  <History user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auth"
              element={!user ? <Auth onLoginSuccess={setUser} /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800/80 bg-[#080c14]/80 py-5 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-mono text-[11px]">
              LinkShield v3.0 Enterprise SOC &bull; SQLite Real-Time Network Probes
            </span>
            <span className="text-slate-400">
              Zero-Day Detection &bull; TLS Handshake &bull; Live DNS &bull; Threat Intelligence
            </span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
