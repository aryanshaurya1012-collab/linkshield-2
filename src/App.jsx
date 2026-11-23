import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Shield, Lock, LogOut, Activity, Database, UserCheck } from 'lucide-react';
import Scanner from './components/Scanner';
import Auth from './components/Auth';
import History from './components/History';
import { getCurrentUser, logoutUser, getUserScans } from './utils/db';

const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/" replace />;
  return children;
};

const ScrollToTopOnNavigate = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const MainLayout = ({ user, setUser, uptime, totalScans, setTotalScans }) => {
  const location = useLocation();

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setTotalScans(0);
  };

  return (
    <div className="min-h-screen flex flex-col items-center w-full">
      <ScrollToTopOnNavigate />
      
      {/* Global Threat Ticker - In normal layout flow to prevent overlapping header on scroll */}
      <div className="w-full bg-slate-950/90 border-b border-[#00FFFF]/30 py-1.5 overflow-hidden shadow-[0_0_15px_rgba(0,255,255,0.1)] backdrop-blur-md relative z-10">
        <div className="whitespace-nowrap animate-marquee inline-block font-mono text-[#00FFFF] text-[10px] md:text-xs font-bold tracking-widest drop-shadow-[0_0_5px_rgba(0,255,255,0.8)] uppercase">
          <span className="mx-8">[LIVE] Analyzing Homograph patterns in .top &amp; .xyz domains...</span>
          <span className="mx-8">[DB] Local Heuristic &amp; Entropy Engine: ACTIVE</span>
          <span className="mx-8">[THREAT] Zero-Day DGA Vector Detection Engine: ONLINE</span>
          <span className="mx-8">[FORENSICS] Client-Side PBKDF2 Vault: ENCRYPTED</span>
          <span className="mx-8">[LIVE] Analyzing Homograph patterns in .top &amp; .xyz domains...</span>
          <span className="mx-8">[DB] Local Heuristic &amp; Entropy Engine: ACTIVE</span>
        </div>
      </div>

      <div className="flex flex-col gap-5 w-full max-w-6xl px-4 sm:px-6 md:px-8 py-5 flex-1">
        
        {/* Header (Branding & Navigation) */}
        <header className="w-full flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-[#00FFFF]/10 rounded-xl border border-[#00FFFF]/30 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
              <Shield className="w-7 h-7 text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#00FFFF] to-[#0088FF] bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] tracking-wider uppercase">LinkShield</h1>
              <p className="text-[#00FFFF]/70 text-xs tracking-widest font-mono uppercase mt-0.5">Cyber Threat Intelligence Platform</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {user ? (
              <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 border border-[#00FFFF]/30 rounded-xl p-1.5 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[#00FFFF]/70 font-mono text-xs border-r border-[#00FFFF]/20 mr-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#00FFFF]" />
                  <span className="text-[#00FFFF] font-bold max-w-[120px] truncate">{user.username}</span>
                </div>
                <Link to="/scanner" className={`flex items-center gap-2 px-3.5 md:px-4.5 py-1.5 rounded-lg font-mono text-xs sm:text-sm font-bold uppercase transition-all ${location.pathname === '/scanner' || location.pathname === '/' ? 'bg-[#00FFFF]/20 text-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.4)]' : 'text-[#00FFFF]/60 hover:text-[#00FFFF]'}`}>
                  <Activity className="w-4 h-4" />
                  Scanner
                </Link>
                <Link to="/history" className={`flex items-center gap-2 px-3.5 md:px-4.5 py-1.5 rounded-lg font-mono text-xs sm:text-sm font-bold uppercase transition-all ${location.pathname === '/history' ? 'bg-[#FF00FF]/20 text-[#FF00FF] shadow-[0_0_10px_rgba(255,0,255,0.4)]' : 'text-[#FF00FF]/60 hover:text-[#FF00FF]'}`}>
                  <Database className="w-4 h-4" />
                  History
                </Link>
                <div className="w-px h-6 bg-[#00FFFF]/20 mx-1"></div>
                <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-[#FF0000]/80 hover:text-[#FF0000] font-mono text-xs uppercase font-bold transition-all hover:drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]">
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-1.5 glass-panel border border-[#00FFFF]/30 shadow-[0_0_10px_rgba(0,255,255,0.1)] rounded-full text-xs font-mono font-medium text-[#00FFFF]">
                <Lock className="w-3.5 h-3.5 text-[#00FFFF] animate-pulse" />
                <span className="hidden sm:inline">Encrypted Auth Sequence Required</span>
                <span className="sm:hidden">Auth Required</span>
              </div>
            )}
          </div>
        </header>

        <Routes>
          <Route path="/" element={!user ? <Auth onLogin={setUser} /> : <Navigate to="/scanner" replace />} />
          <Route path="/scanner" element={
            <ProtectedRoute user={user}>
              <Scanner user={user} uptime={uptime} totalScans={totalScans} setTotalScans={setTotalScans} />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute user={user}>
              <History user={user} setTotalScans={setTotalScans} />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-10 pb-6 w-full text-center text-xs relative z-20">
        <div className="inline-block border border-[#00FFFF]/30 bg-[#00FFFF]/5 px-5 py-2.5 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(0,255,255,0.1)]">
          <p className="text-[#00FFFF] font-mono tracking-widest uppercase text-xs drop-shadow-[0_0_5px_rgba(0,255,255,0.5)] font-bold">
            LinkShield v2.1 <span className="text-[#FF00FF] mx-2">|</span> All rights reserved <span className="text-[#FF00FF] mx-2">|</span> JIS UNIVERSITY
          </p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [uptime, setUptime] = useState(0);
  const [totalScans, setTotalScans] = useState(0);

  useEffect(() => {
    if (!user) return;

    getUserScans(user.id).then(data => {
      setTotalScans(data.length);
    });
  }, [user]);

  // Uptime hook
  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <BrowserRouter>
      <MainLayout 
        user={user} 
        setUser={setUser} 
        uptime={formatUptime(uptime)} 
        totalScans={totalScans} 
        setTotalScans={setTotalScans} 
      />
    </BrowserRouter>
  );
}

export default App;
