import React, { useEffect, useState, useMemo } from 'react';
import { Database, Clock, ShieldAlert, CheckCircle, AlertTriangle, Download, Trash2, Search, Filter } from 'lucide-react';
import { getUserScans, deleteScan, clearUserScans } from '../utils/db';

export default function History({ user, setTotalScans }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL'); // ALL, SAFE, SUSPICIOUS, CRITICAL

  useEffect(() => {
    if (user) {
      getUserScans(user.id).then(data => {
        setScans(data);
        if (setTotalScans) setTotalScans(data.length);
        setLoading(false);
      });
    }
  }, [user, setTotalScans]);

  const getRiskColorCSS = (score) => {
    if (score < 30) return '#00FF00';
    if (score < 70) return '#FF00FF';
    return '#FF0000';
  };

  const getRiskLabel = (score) => {
    if (score < 30) return 'SAFE';
    if (score < 70) return 'SUSPICIOUS';
    return 'CRITICAL';
  };

  const handleDelete = async (scanId) => {
    if (!user) return;
    const updated = await deleteScan(user.id, scanId);
    setScans(updated);
    if (setTotalScans) setTotalScans(updated.length);
  };

  const handleClearAll = async () => {
    if (!user || scans.length === 0) return;
    const confirmClear = window.confirm('Are you sure you want to purge all archived threat intelligence logs?');
    if (!confirmClear) return;

    await clearUserScans(user.id);
    setScans([]);
    if (setTotalScans) setTotalScans(0);
  };

  const exportToCSV = () => {
    if (scans.length === 0) return;

    const escapeCsvField = (value) => {
      const stringValue = String(value ?? '');
      return `"${stringValue.replace(/"/g, '""')}"`;
    };
    
    let csvContent = "Timestamp,URL,Score,Risk Level,Entropy,Detected Factors\n";
    
    scans.forEach(scan => {
      const date = new Date(scan.timestamp).toLocaleString();
      const url = scan.url;
      const score = scan.score ?? 0;
      const level = getRiskLabel(score);
      const entropy = scan.entropy !== undefined ? Number(scan.entropy).toFixed(3) : 'N/A';
      const breakdown = Array.isArray(scan.breakdown) ? scan.breakdown.join('; ') : '';
      csvContent += `${escapeCsvField(date)},${escapeCsvField(url)},${escapeCsvField(score)},${escapeCsvField(level)},${escapeCsvField(entropy)},${escapeCsvField(breakdown)}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `linkshield_forensics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredScans = useMemo(() => {
    return scans.filter(scan => {
      const matchesSearch = !searchQuery.trim() || 
        scan.url.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (Array.isArray(scan.breakdown) && scan.breakdown.some(b => b.toLowerCase().includes(searchQuery.trim().toLowerCase())));

      if (!matchesSearch) return false;

      const level = getRiskLabel(scan.score ?? 0);
      if (filterLevel === 'ALL') return true;
      return level === filterLevel;
    });
  }, [scans, searchQuery, filterLevel]);

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pb-10">
      <div className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden border border-[#00FFFF]/40 shadow-[0_0_20px_rgba(0,255,255,0.15)] group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00FFFF] to-[#FF00FF]"></div>
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 border-b border-[#00FFFF]/20 pb-6">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#FF00FF] font-mono uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
              <Database className="w-8 h-8 text-[#00FFFF]" />
              Threat Intel History
            </h2>
            <p className="text-[#00FFFF]/60 font-mono text-sm uppercase tracking-widest mt-2">
              Archived scans for Operator: <span className="text-[#00FFFF] font-bold">{user?.username}</span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#00FFFF]/10 rounded-full border border-[#00FFFF]/30">
              <Clock className="w-4 h-4 text-[#00FFFF]" />
              <span className="text-[#00FFFF] font-mono text-xs uppercase font-bold">{scans.length} Records</span>
            </div>

            {scans.length > 0 && (
              <>
                <button 
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00FF00]/10 hover:bg-[#00FF00]/20 rounded-full border border-[#00FF00]/60 hover:border-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,0.3)] hover:shadow-[0_0_20px_rgba(0,255,0,0.6)] text-[#00FF00] transition-all"
                  title="Download CSV export"
                >
                  <Download className="w-4 h-4" />
                  <span className="font-mono text-xs uppercase font-bold tracking-wider">Export CSV</span>
                </button>
                <button 
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FF0000]/10 hover:bg-[#FF0000]/20 rounded-full border border-[#FF0000]/50 hover:border-[#FF0000] text-[#FF0000] transition-all"
                  title="Purge all scan logs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-mono text-xs uppercase font-bold tracking-wider">Purge All</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#00FFFF]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by URL or threat factor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-[#00FFFF]/30 rounded-xl py-2 pl-10 pr-4 text-sm text-[#00FFFF] font-mono placeholder:text-[#00FFFF]/30 focus:outline-none focus:ring-1 focus:ring-[#00FFFF]/60 focus:border-[#00FFFF]/60 shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-[#00FFFF]/20">
            <Filter className="w-3.5 h-3.5 text-[#00FFFF]/60 ml-2 mr-1 hidden sm:inline" />
            {['ALL', 'SAFE', 'SUSPICIOUS', 'CRITICAL'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs uppercase font-bold transition-all ${
                  filterLevel === lvl 
                    ? lvl === 'SAFE' ? 'bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/50 shadow-[0_0_8px_rgba(0,255,0,0.3)]'
                      : lvl === 'SUSPICIOUS' ? 'bg-[#FF00FF]/20 text-[#FF00FF] border border-[#FF00FF]/50 shadow-[0_0_8px_rgba(255,0,255,0.3)]'
                      : lvl === 'CRITICAL' ? 'bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/50 shadow-[0_0_8px_rgba(255,0,0,0.3)]'
                      : 'bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/50 shadow-[0_0_8px_rgba(0,255,255,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#00FFFF]">
            <Database className="w-12 h-12 animate-bounce drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] mb-4" />
            <span className="font-mono uppercase tracking-widest animate-pulse">Querying Threat Archive...</span>
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#00FFFF]/40 border-2 border-dashed border-[#00FFFF]/20 rounded-xl">
            <ShieldAlert className="w-16 h-16 mb-4 opacity-50" />
            <span className="font-mono uppercase tracking-widest text-sm">No threat intelligence records found</span>
            <p className="font-mono text-xs text-[#00FFFF]/30 mt-2">Run a URL scan to generate forensic telemetry logs</p>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#00FFFF]/50 border border-[#00FFFF]/20 rounded-xl">
            <Search className="w-10 h-10 mb-3 opacity-40" />
            <span className="font-mono uppercase tracking-widest text-xs">No records match the active search or filter</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScans.map((scan) => {
              const color = getRiskColorCSS(scan.score ?? 0);
              const score = scan.score ?? 0;
              return (
                <div key={scan.id} className="bg-slate-900/70 border border-slate-700/80 hover:border-slate-500 rounded-xl p-5 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] flex flex-col justify-between h-full group/card"
                  style={{ borderColor: `${color}40` }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[11px] font-mono text-slate-400 opacity-80">
                        {new Date(scan.timestamp).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border" style={{ backgroundColor: `${color}20`, color: color, borderColor: color, textShadow: `0 0 5px ${color}` }}>
                          {getRiskLabel(score)}
                        </div>
                        <button
                          onClick={() => handleDelete(scan.id)}
                          className="opacity-0 group-hover/card:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-opacity"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-mono text-white text-base font-bold break-all leading-snug mb-3 drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">
                      {scan.url}
                    </h3>

                    {/* Breakdown factor pills */}
                    {Array.isArray(scan.breakdown) && scan.breakdown.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {scan.breakdown.slice(0, 3).map((factor, fIdx) => (
                          <span key={fIdx} className="text-[10px] font-mono bg-red-950/40 text-red-300 border border-red-500/30 px-2 py-0.5 rounded">
                            {factor}
                          </span>
                        ))}
                        {scan.breakdown.length > 3 && (
                          <span className="text-[10px] font-mono text-slate-400 px-1 py-0.5">
                            +{scan.breakdown.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between mt-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest font-mono">Threat Score</span>
                      <span className="text-xl font-black font-mono" style={{ color: color, textShadow: `0 0 8px ${color}` }}>
                        {score}/100
                      </span>
                    </div>

                    {scan.entropy !== undefined && (
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest font-mono">Entropy H(X)</span>
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          {Number(scan.entropy).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div>
                      {score < 30 ? (
                        <CheckCircle className="w-6 h-6 text-[#00FF00] drop-shadow-[0_0_5px_rgba(0,255,0,0.8)]" />
                      ) : (
                        <AlertTriangle className="w-6 h-6" style={{ color: color, filter: `drop-shadow(0 0 5px ${color})` }} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
