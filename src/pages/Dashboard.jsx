import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ShieldAlert, Activity, ArrowUpRight, 
  Search, Server, Lock, ExternalLink, Loader2
} from 'lucide-react';
import { api } from '../utils/api';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [recentThreats, setRecentThreats] = useState([]);
  const [quickUrl, setQuickUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, threatsData] = await Promise.all([
        api.getStats(user?.id),
        api.getThreats()
      ]);
      setStats(statsData);
      setRecentThreats(threatsData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleQuickScan = (e) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    navigate(`/scanner?url=${encodeURIComponent(quickUrl.trim())}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 panel p-6 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Security Operations Center
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Threat Intelligence &amp; Link Posture
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time link auditing, DNS/TLS forensic telemetry, and automated phishing protection backed by persistent SQLite storage.
          </p>
        </div>

        {/* Quick Scan Input */}
        <form onSubmit={handleQuickScan} className="flex items-center gap-2 w-full md:w-auto md:min-w-[340px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Quick inspect URL..."
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 font-mono transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            Inspect
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Vectors Scanned</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.totalScans || 0}
          </div>
          <p className="text-[11px] text-slate-400">Audit logs recorded in SQLite</p>
        </div>

        <div className="panel p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Threats Neutralized</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : stats?.threatsBlocked || 0}
          </div>
          <p className="text-[11px] text-slate-400">Critical &amp; High Phishing Indicators</p>
        </div>

        <div className="panel p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Clean Domain Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              `${stats?.totalScans ? Math.round((stats.cleanDomains / stats.totalScans) * 100) : 100}%`
            )}
          </div>
          <p className="text-[11px] text-slate-400">Verified allowlisted destinations</p>
        </div>

        <div className="panel p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Avg Shannon Entropy</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : `${stats?.avgEntropy || 2.85} H(X)`}
          </div>
          <p className="text-[11px] text-slate-400">DGA alert threshold: &gt; 3.80</p>
        </div>
      </div>

      {/* Main Grid: Threat Activity & System Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Threat Indicators */}
        <div className="lg:col-span-2 panel p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Live Phishing Feeds &amp; Emerging Indicators
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Known malicious targets identified in real-time auditing</p>
            </div>
            <button
              onClick={() => navigate('/intel')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View All IOCs
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentThreats.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400 font-mono">No threat signatures cataloged yet.</p>
            ) : (
              recentThreats.map((ioc) => (
                <div key={ioc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white font-semibold">{ioc.domain}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        ioc.risk_level === 'CRITICAL' ? 'badge-critical' : 'badge-suspicious'
                      }`}>
                        {ioc.risk_level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{ioc.description}</p>
                  </div>

                  <button
                    onClick={() => navigate(`/scanner?url=${encodeURIComponent(`http://${ioc.domain}`)}`)}
                    className="self-start sm:self-center px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                  >
                    Investigate
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Engine Telemetry & Security Protocols */}
        <div className="panel p-6 space-y-5">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Engine Architecture
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Active automated inspection modules</p>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-200">Live DNS Resolution</span>
                <p className="text-[11px] text-slate-400">Queries A, AAAA, MX, NS, and TXT SPF records directly via Node.js async resolvers.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-200">Real-Time TLS/SSL Handshake</span>
                <p className="text-[11px] text-slate-400">Inspects live certificate validity, issuer authority, expiration timeline, and cipher suites.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-200">Security Header Audit</span>
                <p className="text-[11px] text-slate-400">Verifies HSTS enforcement, Content Security Policy (CSP), and clickjacking safeguards.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-200">Persistent SQLite Vault</span>
                <p className="text-[11px] text-slate-400">Disk-backed relational database storage for audit trails, users, and threat intelligence.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
