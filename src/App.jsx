import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Shield, Lock, LogOut, Activity, Database } from 'lucide-react';
import Scanner from './components/Scanner';
import Auth from './components/Auth';
import History from './components/History';
import { getCurrentUser, logoutUser, getUserScans } from './utils/db';

const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/" replace />;
  return children;
};

const MainLayout = ({ user, setUser, uptime, totalScans, setTotalScans }) => {
  const location = useLocation();

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setTotalScans(0);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center w-full pt-12 md:pt-16">
      
      {/* Global Threat Ticker */}
      <div className="fixed top-0 left-0 w-full bg-[#00FFFF]/5 border-b border-[#00FFFF]/30 py-1.5 overflow-hidden z-20 shadow-[0_0_15px_rgba(0,255,255,0.1)] backdrop-blur-md">
        <div className="whitespace-nowrap animate-marquee inline-block font-mono text-[#00FFFF] text-[10px] md:text-xs font-bold tracking-widest drop-shadow-[0_0_5px_rgba(0,255,255,0.8)] uppercase">
          <span className="mx-8">[LIVE] Analyzing Homograph patterns in .top domains...</span>
          <span className="mx-8">[DB] Local Heuristic Database: ACTIVE</span>
          <span className="mx-8">[THREAT] New DGA vector detected in Kolkata region</span>
          <span className="mx-8">[LIVE] Analyzing Homograph patterns in .top domains...</span>
          <span className="mx-8">[DB] Local Heuristic Database: ACTIVE</span>
          <span className="mx-8">[THREAT] New DGA vector detected in Kolkata region</span>
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-6xl mt-8 flex-1">
        
        {/* Header (Branding & Navigation) */}
        <header className="w-full flex flex-col xl:flex-row justify-between items-center gap-4 relative z-40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#00FFFF]/10 rounded-xl border border-[#00FFFF]/30 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
              <Shield className="w-8 h-8 text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-[#00FFFF] to-[#0088FF] bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] tracking-wider uppercase">LinkShield</h1>
              <p className="text-[#00FFFF]/70 text-sm tracking-widest font-mono uppercase mt-1">Cyber Command Center</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-900/80 border border-[#00FFFF]/30 rounded-xl p-1 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                <Link to="/scanner" className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg font-mono text-xs md:text-sm font-bold uppercase transition-all ${location.pathname === '/scanner' || location.pathname === '/' ? 'bg-[#00FFFF]/20 text-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.4)]' : 'text-[#00FFFF]/60 hover:text-[#00FFFF]'}`}>
                  <Activity className="w-4 h-4" />
                  Scanner
                </Link>
                <Link to="/history" className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg font-mono text-xs md:text-sm font-bold uppercase transition-all ${location.pathname === '/history' ? 'bg-[#FF00FF]/20 text-[#FF00FF] shadow-[0_0_10px_rgba(255,0,255,0.4)]' : 'text-[#FF00FF]/60 hover:text-[#FF00FF]'}`}>
                  <Database className="w-4 h-4" />
                  History
                </Link>
                <div className="w-px h-8 bg-[#00FFFF]/20 mx-2"></div>
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-[#FF0000]/80 hover:text-[#FF0000] font-mono text-xs uppercase font-bold transition-all hover:drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-5 py-2 glass-panel border border-[#00FFFF]/30 shadow-[0_0_10px_rgba(0,255,255,0.1)] rounded-full text-xs font-mono font-medium text-[#00FFFF]">
                <Lock className="w-4 h-4 text-[#00FFFF] animate-pulse" />
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
              <History user={user} />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-16 pb-6 w-full text-center text-sm relative z-20">
        <div className="inline-block border border-[#00FFFF]/30 bg-[#00FFFF]/5 px-6 py-3 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(0,255,255,0.1)]">
          <p className="text-[#00FFFF] font-mono tracking-widest uppercase text-xs drop-shadow-[0_0_5px_rgba(0,255,255,0.5)] font-bold">
            LinkShield v2.0 <span className="text-[#FF00FF] mx-2">|</span> All rights reserved <span className="text-[#FF00FF] mx-2">|</span> JIS UNIVERSITY
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
