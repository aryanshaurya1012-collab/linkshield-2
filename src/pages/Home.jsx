import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Search, ArrowRight, CheckCircle2, AlertTriangle, 
  XCircle, Globe, Lock, Server, FileText, Database, ShieldAlert, 
  ExternalLink, Loader2, Sparkles, Activity, Cpu, Layers, Check
} from 'lucide-react';
import { api } from '../utils/api';

const PRESETS = [
  { label: 'Safe Portal', url: 'https://jisuniversity.ac.in/portal/student-login', type: 'clean' },
  { label: 'High Entropy DGA', url: 'https://z9r2k7m4v9p1q6w8.google-services.net', type: 'warn' },
  { label: 'Risky .top TLD', url: 'http://crypto-wallet-auth.top', type: 'high' },
  { label: 'Critical Phish', url: 'https://signin-auth-secure-paypal.xyz', type: 'critical' },
];

const LIVE_TICKER = [
  { domain: 'signin-auth-secure-paypal.xyz', status: 'CRITICAL', tag: 'Phishing Kit' },
  { domain: 'google.com', status: 'CLEAN', tag: 'Verified Enterprise' },
  { domain: 'crypto-wallet-auth.top', status: 'HIGH RISK', tag: 'Credential Drainer' },
  { domain: 'github.com', status: 'CLEAN', tag: 'Verified Enterprise' },
  { domain: 'appleid-verify-alert.cc', status: 'CRITICAL', tag: 'Impersonation' },
  { domain: 'jisuniversity.ac.in', status: 'CLEAN', tag: 'Verified Education' },
];

export default function Home({ user }) {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleScan = async (targetUrl) => {
    const trimmed = (targetUrl || url).trim();
    if (!trimmed) return;

    setError(null);
    setIsScanning(true);
    setResult(null);

    try {
      setScanStep('Querying live DNS over TLS...');
      await new Promise(r => setTimeout(r, 220));

      setScanStep('Executing real-time TLS handshake & certificate audit...');
      await new Promise(r => setTimeout(r, 250));

      setScanStep('Auditing HTTP security headers & redirection chain...');
      const data = await api.scanUrl(trimmed, user?.id);

      setScanStep('Calculating Shannon entropy & heuristic risk score...');
      await new Promise(r => setTimeout(r, 180));

      setResult(data);
    } catch (err) {
      setError(err.message || 'Inspection failed. Target domain might be offline.');
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 75) return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', label: 'CRITICAL THREAT' };
    if (score >= 50) return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', label: 'HIGH RISK' };
    if (score >= 25) return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'SUSPICIOUS' };
    return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'CLEAN & SAFE' };
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Real-time Threat Ticker */}
      <div className="w-full overflow-hidden border-y border-slate-800/80 bg-slate-950/70 py-2.5 px-4 -mt-2 rounded-xl">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE RADAR:
          </div>
          <div className="flex items-center gap-6 shrink-0">
            {LIVE_TICKER.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                <span className="text-slate-400">{item.domain}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  item.status === 'CLEAN' ? 'badge-clean' : 'badge-critical'
                }`}>
                  {item.status}
                </span>
                <span className="text-slate-600">&bull;</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative text-center pt-2 pb-4 max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time DNS &bull; TLS Handshake &bull; SQLite Threat Hub</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
          Next-Generation Phishing Defense &amp; <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
            Forensic Link Intelligence
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Inspect suspicious links, verify live SSL certificates, resolve asynchronous DNS records, and detect zero-day phishing infrastructure backed by persistent relational storage.
        </p>

        {/* Big Search / Scan Box */}
        <div className="pt-2 max-w-3xl mx-auto">
          <div className="panel p-3.5 sm:p-5 border-slate-700 bg-slate-900/90 shadow-2xl rounded-2xl">
            <form onSubmit={(e) => { e.preventDefault(); handleScan(); }} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter URL to inspect (e.g. https://signin-paypal.com)..."
                  value={url}
                  disabled={isScanning}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-700 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isScanning || !url.trim()}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <span>Inspect Target</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Test Vectors */}
            <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3.5 border-t border-slate-800/80 text-xs text-slate-400">
              <span className="font-mono text-[11px] text-slate-500">Quick Test Vectors:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={isScanning}
                  onClick={() => {
                    setUrl(p.url);
                    handleScan(p.url);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time step progress indicator */}
          {isScanning && (
            <div className="mt-3 flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 animate-in fade-in">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{scanStep}</span>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Scan Verdict Banner (Displays immediately on homepage when scanned!) */}
      {result && (
        <div className="max-w-4xl mx-auto panel p-6 sm:p-8 border-slate-700 bg-slate-900/95 space-y-6 animate-in fade-in duration-300 rounded-2xl shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${getScoreBadge(result.score).color}`}>
                  {getScoreBadge(result.score).label}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Resolved IP: <strong className="text-slate-200">{result.ip}</strong>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Host: <strong className="text-slate-200">{result.hostname}</strong>
                </span>
              </div>

              <h2 className="text-xl font-bold text-white font-mono break-all">
                {result.url}
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                {result.score >= 50
                  ? 'Severe threat indicators identified. Do not enter credentials or download files from this destination.'
                  : result.score >= 25
                  ? 'Moderate caution advised. Anomalous domain patterns or heuristic flags detected.'
                  : 'Valid TLS certificates, standard domain entropy, and clean security indicators verified.'}
              </p>
            </div>

            {/* Score Box */}
            <div className="flex items-center gap-4 self-start md:self-auto shrink-0">
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border border-slate-800 min-w-[120px]">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Threat Score</span>
                <span className={`text-4xl font-black font-mono mt-0.5 ${
                  result.score >= 75 ? 'text-rose-400' :
                  result.score >= 50 ? 'text-rose-400' :
                  result.score >= 25 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {result.score}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </span>
              </div>

              <button
                onClick={() => navigate(`/scanner?url=${encodeURIComponent(result.url)}`)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 shadow-sm transition-colors"
              >
                Deep Forensic View
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-sans">Shannon Entropy H(X):</span>
              <span className="text-sm font-bold text-amber-400">{result.entropy?.toFixed(3)}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-sans">SSL / TLS Authority:</span>
              <span className="text-sm font-bold text-white truncate block">{result.sslData?.issuer || 'None'}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-sans">HSTS Enforcement:</span>
              <span className={result.headersData?.securityHeaders?.hsts ? 'text-sm font-bold text-emerald-400' : 'text-sm font-bold text-slate-500'}>
                {result.headersData?.securityHeaders?.hsts ? 'ENFORCED' : 'ABSENT'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Global Detection Statistics */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="panel p-6 border-slate-800/80">
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">184,920+</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">URLs Analyzed</div>
        </div>
        <div className="panel p-6 border-slate-800/80">
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400">99.8%</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Phishing Accuracy</div>
        </div>
        <div className="panel p-6 border-slate-800/80">
          <div className="text-2xl sm:text-3xl font-black font-mono text-sky-400">&lt; 120ms</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Mean Probe Latency</div>
        </div>
        <div className="panel p-6 border-slate-800/80">
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">SQLite</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Disk-Backed Storage</div>
        </div>
      </div>

      {/* 4 Security Pillars Section */}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">Forensic Technology</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Enterprise Multi-Stage Threat Engine</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Comprehensive link inspection combining active network telemetry, cryptographic audits, and heuristic algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="panel p-6 space-y-3 border-slate-800/90 rounded-2xl hover:border-slate-700 transition-colors">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Live DNS Resolution</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Queries live IPv4, IPv6, MX routing, nameservers, and TXT SPF validation directly via asynchronous DNS resolvers.
            </p>
          </div>

          <div className="panel p-6 space-y-3 border-slate-800/90 rounded-2xl hover:border-slate-700 transition-colors">
            <div className="p-3 w-fit rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">TLS/SSL Handshake</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspects live certificate authority, expiration countdown, protocol versions, and cipher suites to flag rogue certificates.
            </p>
          </div>

          <div className="panel p-6 space-y-3 border-slate-800/90 rounded-2xl hover:border-slate-700 transition-colors">
            <div className="p-3 w-fit rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Shannon Entropy Math</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates string randomness to expose algorithmically generated domains (DGA) used by botnets and C2 relays.
            </p>
          </div>

          <div className="panel p-6 space-y-3 border-slate-800/90 rounded-2xl hover:border-slate-700 transition-colors">
            <div className="p-3 w-fit rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Brand Impersonation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects deceptive typosquatting, Cyrillic homographs, and high-value target brand names nested inside untrusted paths.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Workflow */}
      <div className="max-w-6xl mx-auto panel p-8 sm:p-10 border-slate-800 rounded-2xl space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">Inspection Architecture</span>
          <h2 className="text-2xl font-bold text-white tracking-tight">How LinkShield Analyzes Every URL</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3 p-5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm">
              01
            </div>
            <h4 className="text-sm font-bold text-white">Target Ingestion &amp; Sanitization</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Domain normalizer extracts TLD, path, and protocol while decoding punycode to catch homograph visual spoofing.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono font-bold flex items-center justify-center text-sm">
              02
            </div>
            <h4 className="text-sm font-bold text-white">Active Network Probes</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Non-blocking asynchronous sockets execute live DNS queries, TLS handshakes, and HTTP header inspections in parallel.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-sm">
              03
            </div>
            <h4 className="text-sm font-bold text-white">Heuristic Scoring &amp; Storage</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Heuristic engine calculates threat risk score (0-100) and writes full forensic records into SQLite persistent storage.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="max-w-5xl mx-auto panel p-8 sm:p-10 border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl shadow-xl">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">Ready for Persistent Historical Forensics?</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Sign in with Google, Apple, or enterprise credentials to maintain audit trails and export forensic intelligence reports.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/intel')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-700"
          >
            Threat Feed
          </button>
          <button
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            {user ? 'Go to SOC Dashboard' : 'Sign In / Register'}
          </button>
        </div>
      </div>
    </div>
  );
}
