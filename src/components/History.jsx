import React, { useEffect, useState } from 'react';
import { Database, Clock, ShieldAlert, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { getUserScans } from '../utils/db';

export default function History({ user }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getUserScans(user.id).then(data => {
        setScans(data);
        setLoading(false);
      });
    }
  }, [user]);

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

  const exportToCSV = () => {
    if (scans.length === 0) return;

    const escapeCsvField = (value) => {
      const stringValue = String(value ?? '');
      return `"${stringValue.replace(/"/g, '""')}"`;
    };
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,URL,Score,Risk Level\n";
    
    scans.forEach(scan => {
      const date = new Date(scan.timestamp).toLocaleString();
      const url = scan.url;
      const score = scan.score ?? 0;
      const level = getRiskLabel(score);
      csvContent += `${escapeCsvField(date)},${escapeCsvField(url)},${escapeCsvField(score)},${escapeCsvField(level)}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `linkshield_forensics_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pb-10">
      <div className="glass-panel rounded-2xl p-8 relative overflow-hidden border border-[#00FFFF]/40 shadow-[0_0_20px_rgba(0,255,255,0.15)] group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00FFFF] to-[#FF00FF]"></div>
        
        <div className="flex items-center justify-between mb-8 border-b border-[#00FFFF]/20 pb-6">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#FF00FF] font-mono uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
              <Database className="w-8 h-8 text-[#00FFFF]" />
              Threat Intel History
            </h2>
            <p className="text-[#00FFFF]/60 font-mono text-sm uppercase tracking-widest mt-2">
              Archived scans for Operator: {user?.username}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#00FFFF]/10 rounded-full border border-[#00FFFF]/30">
              <Clock className="w-4 h-4 text-[#00FFFF]" />
              <span className="text-[#00FFFF] font-mono text-xs uppercase font-bold">{scans.length} Records Found</span>
            </div>
            {scans.length > 0 && (
              <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-[#00FF00]/10 hover:bg-[#00FF00]/20 rounded-full border border-[#00FF00]/60 hover:border-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,0.3)] hover:shadow-[0_0_20px_rgba(0,255,0,0.6)] text-[#00FF00] transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="font-mono text-xs uppercase font-bold tracking-wider">Export Forensic Log (CSV)</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#00FFFF]">
            <Database className="w-12 h-12 animate-bounce drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] mb-4" />
            <span className="font-mono uppercase tracking-widest animate-pulse">Querying Database...</span>
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#00FFFF]/40 border-2 border-dashed border-[#00FFFF]/20 rounded-xl">
            <ShieldAlert className="w-16 h-16 mb-4 opacity-50" />
            <span className="font-mono uppercase tracking-widest">No previous intel found</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scans.map((scan) => {
              const color = getRiskColorCSS(scan.score);
              return (
                <div key={scan.id} className="bg-slate-900/60 border border-slate-700 hover:border-slate-500 rounded-xl p-5 transition-all shadow-lg hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] flex flex-col justify-between h-full"
                  style={{ borderColor: `${color}40` }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-mono text-slate-400 opacity-70">
                        {new Date(scan.timestamp).toLocaleString()}
                      </span>
                      <div className="px-3 py-1 rounded-full text-xs font-mono font-bold border" style={{ backgroundColor: `${color}20`, color: color, borderColor: color, textShadow: `0 0 5px ${color}` }}>
                        {getRiskLabel(scan.score)}
                      </div>
                    </div>
                    
                    <h3 className="font-mono text-white text-lg break-all leading-tight mb-4 drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">
                      {scan.url}
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest font-mono">Score</span>
                      <span className="text-xl font-black font-mono" style={{ color: color, textShadow: `0 0 8px ${color}` }}>
                        {scan.score}/100
                      </span>
                    </div>
                    {scan.score < 30 ? (
                      <CheckCircle className="w-6 h-6 text-[#00FF00] drop-shadow-[0_0_5px_rgba(0,255,0,0.8)]" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" style={{ color: color, filter: `drop-shadow(0 0 5px ${color})` }} />
                    )}
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
