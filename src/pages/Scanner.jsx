import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Globe, Lock, Server, FileText, CheckCircle2, 
  XCircle, Copy, Check, RefreshCw, Loader2, ArrowRight, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { api } from '../utils/api';

const PRESETS = [
  { label: 'Safe Portal', url: 'https://jisuniversity.ac.in/portal/student-login', type: 'clean' },
  { label: 'High Entropy', url: 'https://z9r2k7m4v9p1q6w8.google-services.net', type: 'warn' },
  { label: 'Risky TLD', url: 'http://crypto-wallet-auth.top', type: 'high' },
  { label: 'Critical Phish', url: 'https://signin-auth-secure-paypal.xyz', type: 'critical' },
];

export default function Scanner({ user }) {
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('threats'); // threats, dns, ssl, headers
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const executeScan = useCallback(async (targetUrl) => {
    const trimmed = (targetUrl || url).trim();
    if (!trimmed) return;

    setError(null);
    setIsScanning(true);
    setResult(null);

    try {
      setScanStep('Querying live DNS over TLS...');
      await new Promise(r => setTimeout(r, 200));

      setScanStep('Executing TLS certificate handshake...');
      await new Promise(r => setTimeout(r, 250));

      setScanStep('Auditing HTTP redirection & security headers...');
      const data = await api.scanUrl(trimmed, user?.id);

      setScanStep('Synthesizing threat intelligence heuristic score...');
      await new Promise(r => setTimeout(r, 200));

      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to complete URL forensic scan.');
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  }, [url, user?.id]);

  useEffect(() => {
    const queryUrl = searchParams.get('url');
    if (queryUrl) {
      setUrl(queryUrl);
      executeScan(queryUrl);
    }
  }, [searchParams, executeScan]);

  const handleSubmit = (e) => {
    e.preventDefault();
    executeScan();
  };

  const handleCopyReport = () => {
    if (!result) return;
    const reportText = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreBadge = (score) => {
    if (score >= 75) return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', label: 'CRITICAL THREAT' };
    if (score >= 50) return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', label: 'HIGH RISK' };
    if (score >= 25) return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'SUSPICIOUS' };
    return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'CLEAN & SAFE' };
  };

  return (
    <div className="space-y-6">
      {/* Target Input Section */}
      <div className="panel p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            Live Forensic URL Inspector
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Perform real-time DNS resolution, SSL/TLS validation, security header analysis, and Shannon entropy calculations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter domain or URL (e.g. https://secure-bank-login.com)..."
                value={url}
                disabled={isScanning}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-10 pr-14 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 font-mono transition-all disabled:opacity-60"
              />
              {result && !isScanning && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {result.score < 25 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isScanning || !url.trim()}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  Inspect Link
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Preset Test Vectors */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-slate-400">Simulation Vectors:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={isScanning}
              onClick={() => {
                setUrl(p.url);
                executeScan(p.url);
              }}
              className="px-2.5 py-1 text-xs font-mono rounded bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Loading Step Tracker */}
        {isScanning && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-emerald-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{scanStep}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Forensic Report Display */}
      {result && (
        <div className="space-y-6">
          {/* Verdict Banner Card */}
          <div className="panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-slate-800">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${getScoreBadge(result.score).color}`}>
                  {getScoreBadge(result.score).label}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  IP: <strong className="text-slate-200">{result.ip}</strong>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Hostname: <strong className="text-slate-200">{result.hostname}</strong>
                </span>
              </div>

              <h2 className="text-lg font-bold text-white break-all font-mono">
                {result.url}
              </h2>

              <p className="text-xs text-slate-400">
                {result.score >= 50
                  ? 'Severe threat indicators identified. Do not enter credentials or download files from this destination.'
                  : result.score >= 25
                  ? 'Moderate caution advised. Anomalous domain patterns or heuristic flags detected.'
                  : 'Valid TLS certificates, standard domain entropy, and clean security indicators verified.'}
              </p>
            </div>

            {/* Score Radial Box & Actions */}
            <div className="flex items-center gap-6 self-start md:self-auto shrink-0">
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/80 border border-slate-800 min-w-[110px]">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Threat Score</span>
                <span className={`text-3xl font-black font-mono mt-0.5 ${
                  result.score >= 75 ? 'text-rose-400' :
                  result.score >= 50 ? 'text-rose-400' :
                  result.score >= 25 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {result.score}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Export JSON'}
                </button>
                <button
                  onClick={() => executeScan(result.url)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-Inspect
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Forensic Inspector Tabs */}
          <div className="panel overflow-hidden">
            {/* Tab Bar */}
            <div className="flex items-center gap-1 p-2 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
              <button
                onClick={() => setActiveTab('threats')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  activeTab === 'threats'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Threat Heuristics ({result.breakdown?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('dns')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  activeTab === 'dns'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Server className="w-3.5 h-3.5 text-sky-400" />
                Live DNS Records
              </button>

              <button
                onClick={() => setActiveTab('ssl')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  activeTab === 'ssl'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                TLS / SSL Certificate
              </button>

              <button
                onClick={() => setActiveTab('headers')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  activeTab === 'headers'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Security Headers
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* TAB 1: THREAT HEURISTICS */}
              {activeTab === 'threats' && (
                <div className="space-y-6">
                  {/* Entropy & Homograph summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-300">Shannon Entropy H(X)</span>
                        <span className="font-mono font-bold text-amber-400">{result.entropy?.toFixed(3)}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all"
                          style={{ width: `${Math.min((result.entropy / 5) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">Higher values (&gt; 3.8) indicate algorithmic randomness / DGA.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-slate-300 block">Homograph / Punycode Check</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">Detects deceptive Cyrillic or Unicode lookalikes</p>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                        result.isHomograph ? 'badge-critical' : 'badge-clean'
                      }`}>
                        {result.isHomograph ? 'DETECTED' : 'CLEAR'}
                      </span>
                    </div>
                  </div>

                  {/* Findings Breakdown */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Identified Risk Factors
                    </h3>
                    {result.breakdown?.length === 0 ? (
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400 font-mono flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        No malicious heuristics or phishing patterns matched. Vector is clean.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {result.breakdown?.map((b, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                            <span className="font-medium text-slate-200">{b.factor}</span>
                            <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              {b.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE DNS RECORDS */}
              {activeTab === 'dns' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">A Records (IPv4):</span>
                    {result.dnsData?.aRecords?.length > 0 ? (
                      <div className="space-y-1">
                        {result.dnsData.aRecords.map((ip, i) => (
                          <div key={i} className="text-slate-200 font-semibold">{ip}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500">None resolved</span>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Mail Exchange (MX Records):</span>
                    {result.dnsData?.mxRecords?.length > 0 ? (
                      <div className="space-y-1">
                        {result.dnsData.mxRecords.map((mx, i) => (
                          <div key={i} className="text-slate-200">{mx}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500">No MX records configured</span>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Authoritative Name Servers (NS):</span>
                    {result.dnsData?.nsRecords?.length > 0 ? (
                      <div className="space-y-1">
                        {result.dnsData.nsRecords.map((ns, i) => (
                          <div key={i} className="text-slate-200">{ns}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500">None detected</span>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SSL / TLS CERTIFICATE */}
              {activeTab === 'ssl' && (
                <div className="space-y-4 text-xs font-mono">
                  {result.sslData?.hasSSL ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                        <span className="text-slate-400 block">Certificate Issuer (CA):</span>
                        <span className="text-white font-bold text-sm">{result.sslData.issuer}</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                        <span className="text-slate-400 block">Subject / Common Name:</span>
                        <span className="text-white font-bold text-sm">{result.sslData.subject}</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                        <span className="text-slate-400 block">Expiration Days Remaining:</span>
                        <span className={`font-bold text-sm ${
                          result.sslData.isExpired ? 'text-rose-400' :
                          result.sslData.daysRemaining < 14 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {result.sslData.daysRemaining !== null ? `${result.sslData.daysRemaining} days` : 'N/A'}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                        <span className="text-slate-400 block">Protocol &amp; Cipher Suite:</span>
                        <span className="text-slate-200 font-bold">{result.sslData.protocol} ({result.sslData.cipher})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                      <p className="font-bold">No Valid TLS/SSL Certificate Presented</p>
                      <p className="text-[11px] text-rose-400/80 mt-1">{result.sslData?.error || 'Target does not support encrypted HTTPS connections.'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SECURITY HEADERS */}
              {activeTab === 'headers' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-slate-400 block">HTTP Response Code:</span>
                      <span className="text-white font-bold">{result.headersData?.statusCode || 'Offline / Unreachable'}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-slate-400 block">Server Banner:</span>
                      <span className="text-slate-200 font-bold">{result.headersData?.server || 'Hidden'}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300">HSTS (Strict-Transport-Security):</span>
                      <span className={result.headersData?.securityHeaders?.hsts ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {result.headersData?.securityHeaders?.hsts ? 'ENFORCED' : 'ABSENT'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300">CSP (Content-Security-Policy):</span>
                      <span className={result.headersData?.securityHeaders?.csp ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {result.headersData?.securityHeaders?.csp ? 'ENABLED' : 'ABSENT'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
