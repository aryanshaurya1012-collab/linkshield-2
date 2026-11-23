import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, ShieldAlert, AlertTriangle, Search, 
  ExternalLink, Globe, Lock, ShieldCheck, Loader2
} from 'lucide-react';
import { api } from '../utils/api';

const WATCHLIST_BRANDS = [
  { name: 'PayPal', category: 'Financial / Payments', risk: 'HIGH', domainsTracked: '1,420+' },
  { name: 'Apple / iCloud', category: 'Identity & Cloud', risk: 'HIGH', domainsTracked: '980+' },
  { name: 'Google Workspace', category: 'Enterprise SSO', risk: 'CRITICAL', domainsTracked: '2,150+' },
  { name: 'Microsoft 365', category: 'Enterprise Office', risk: 'CRITICAL', domainsTracked: '3,890+' },
  { name: 'Meta / Instagram', category: 'Social Engineering', risk: 'MEDIUM', domainsTracked: '840+' },
  { name: 'Binance / Crypto', category: 'Web3 Wallet Drain', risk: 'HIGH', domainsTracked: '1,120+' }
];

const RISKY_TLDS_DATA = [
  { tld: '.top', abuseRate: '68%', primaryThreat: 'Phishing kits & Malware droppers', rating: 'CRITICAL' },
  { tld: '.xyz', abuseRate: '54%', primaryThreat: 'Typosquatting & Fake brand auth', rating: 'HIGH' },
  { tld: '.cc', abuseRate: '48%', primaryThreat: 'Credential harvesting vectors', rating: 'HIGH' },
  { tld: '.click', abuseRate: '45%', primaryThreat: 'Adware & Malicious redirects', rating: 'MEDIUM' },
  { tld: '.bit', abuseRate: '62%', primaryThreat: 'Bulletproof decentralized C2', rating: 'CRITICAL' }
];

export default function ThreatIntel() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadThreats();
  }, []);

  const loadThreats = async () => {
    try {
      setLoading(true);
      const data = await api.getThreats();
      setThreats(data);
    } catch (err) {
      console.error('Failed to load threat intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreats = threats.filter(t => 
    !search.trim() || 
    t.domain.toLowerCase().includes(search.toLowerCase()) ||
    t.threat_type.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="panel p-6 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
            Threat Intelligence Feed
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Indicators of Compromise &amp; Global Phishing Registry
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Live repository of active adversary infrastructure, typosquatting domains, and high-risk TLD telemetry cataloged in our SQLite database.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="panel p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Cataloged Threat Vectors</span>
          <div className="text-2xl font-bold font-mono text-white">{threats.length} Active IOCs</div>
          <p className="text-[11px] text-slate-500 font-mono">SQLite threat registry index</p>
        </div>

        <div className="panel p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Monitored High-Risk TLDs</span>
          <div className="text-2xl font-bold font-mono text-amber-400">28 Suffixes</div>
          <p className="text-[11px] text-slate-500 font-mono">Continuous spam/abuse tracking</p>
        </div>

        <div className="panel p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">High-Value Brand Targets</span>
          <div className="text-2xl font-bold font-mono text-rose-400">14 Enterprise Brands</div>
          <p className="text-[11px] text-slate-500 font-mono">Automated impersonation alert system</p>
        </div>
      </div>

      {/* Main IOC Table & Watchlist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active IOC Table */}
        <div className="lg:col-span-2 panel p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Live Threat IOC Registry
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Known malicious domains indexed for proactive blocking</p>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter IOCs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 font-mono"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span className="text-xs font-mono">Loading Threat Feed...</span>
              </div>
            ) : filteredThreats.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400 font-mono">No matching threat indicators found.</p>
            ) : (
              filteredThreats.map((ioc) => (
                <div key={ioc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-white">{ioc.domain}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        ioc.risk_level === 'CRITICAL' ? 'badge-critical' : 'badge-suspicious'
                      }`}>
                        {ioc.risk_level}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                        {ioc.threat_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{ioc.description}</p>
                  </div>

                  <button
                    onClick={() => navigate(`/scanner?url=${encodeURIComponent(`http://${ioc.domain}`)}`)}
                    className="self-start sm:self-center flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors shrink-0"
                  >
                    Inspect
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Watchlists */}
        <div className="space-y-6">
          {/* Targeted Brands Watchlist */}
          <div className="panel p-6 space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Targeted Brand Watchlist
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Most frequently impersonated institutions</p>
            </div>

            <div className="space-y-3">
              {WATCHLIST_BRANDS.map((b) => (
                <div key={b.name} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200 block">{b.name}</span>
                    <span className="text-[10px] text-slate-500">{b.category}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    b.risk === 'CRITICAL' ? 'badge-critical' : 'badge-suspicious'
                  }`}>
                    {b.domainsTracked}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* High Risk TLDs */}
          <div className="panel p-6 space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                High-Risk TLD Watchlist
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Top-level domains with elevated abuse rates</p>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {RISKY_TLDS_DATA.map((tld) => (
                <div key={tld.tld} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">{tld.tld}</span>
                    <span className="text-[10px] text-slate-400">{tld.primaryThreat}</span>
                  </div>
                  <span className="text-xs font-bold text-rose-400">{tld.abuseRate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
