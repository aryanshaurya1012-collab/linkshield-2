import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, Search, Filter, Trash2, Download, 
  ExternalLink, X, RefreshCw, Loader2
} from 'lucide-react';
import { api } from '../utils/api';

export default function History({ user }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [selectedScan, setSelectedScan] = useState(null);
  const navigate = useNavigate();

  const loadScans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getScans({
        userId: user?.id,
        q: searchQuery,
        risk: filterRisk
      });
      setScans(data);
    } catch (err) {
      console.error('Failed to load scan history:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, searchQuery, filterRisk]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadScans();
  };

  const handleDeleteScan = async (id, e) => {
    e.stopPropagation();
    try {
      await api.deleteScan(id);
      setScans(prev => prev.filter(s => s.id !== id));
      if (selectedScan?.id === id) setSelectedScan(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to permanently purge all scan records from SQLite?')) return;
    try {
      await api.clearScans(user?.id);
      setScans([]);
      setSelectedScan(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const exportCSV = () => {
    if (scans.length === 0) return;
    const headers = ['Timestamp', 'URL', 'Hostname', 'Threat Score', 'Risk Level', 'IP Address', 'Entropy'];
    const rows = scans.map(s => [
      `"${new Date(s.timestamp).toISOString()}"`,
      `"${s.url.replace(/"/g, '""')}"`,
      `"${s.hostname}"`,
      s.score,
      s.riskLevel,
      `"${s.ip || 'Unresolved'}"`,
      s.entropy?.toFixed(3) || 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `linkshield_audit_logs_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const getRiskPill = (level) => {
    if (level === 'CRITICAL' || level === 'HIGH') return 'badge-critical';
    if (level === 'SUSPICIOUS') return 'badge-suspicious';
    return 'badge-clean';
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Forensic Audit Archive
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical link inspection logs with DNS, TLS, and heuristic records stored in SQLite.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {scans.length > 0 && (
            <>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>

              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-lg transition-colors border border-rose-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Purge All
              </button>
            </>
          )}

          <button
            onClick={loadScans}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by URL, domain, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 font-mono"
          />
        </form>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1 hidden sm:inline" />
          {['ALL', 'CRITICAL', 'HIGH', 'SUSPICIOUS', 'CLEAN'].map((risk) => (
            <button
              key={risk}
              onClick={() => setFilterRisk(risk)}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-colors ${
                filterRisk === risk
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>
      </div>

      {/* Scans Table / List */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-xs font-mono">Querying SQLite Records...</span>
          </div>
        ) : scans.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Database className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">No forensic records located</p>
            <p className="text-xs text-slate-500">Run a scan from the inspector to create persistent audit entries.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {scans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => setSelectedScan(scan)}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-800/30 cursor-pointer transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getRiskPill(scan.riskLevel)}`}>
                      {scan.riskLevel}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Score: <strong className={scan.score >= 50 ? 'text-rose-400' : 'text-emerald-400'}>{scan.score}/100</strong>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(scan.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="font-mono text-sm font-semibold text-white truncate max-w-2xl">
                    {scan.url}
                  </h3>

                  {scan.breakdown?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {scan.breakdown.slice(0, 3).map((b, i) => (
                        <span key={i} className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                          {b.factor}
                        </span>
                      ))}
                      {scan.breakdown.length > 3 && (
                        <span className="text-[10px] font-mono text-slate-500 px-1 py-0.5">
                          +{scan.breakdown.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/scanner?url=${encodeURIComponent(scan.url)}`)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Inspect
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => handleDeleteScan(scan.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Forensic Detail Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="panel max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 border-slate-700">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getRiskPill(selectedScan.riskLevel)}`}>
                  {selectedScan.riskLevel} VERDICT
                </span>
                <h2 className="text-base font-bold text-white font-mono break-all mt-1">
                  {selectedScan.url}
                </h2>
              </div>
              <button
                onClick={() => setSelectedScan(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block">Threat Score:</span>
                <span className="text-base font-bold text-white">{selectedScan.score} / 100</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block">Resolved IP:</span>
                <span className="text-base font-bold text-white">{selectedScan.ip || 'Unresolved'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block">Shannon Entropy:</span>
                <span className="text-white font-bold">{selectedScan.entropy?.toFixed(3)} H(X)</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block">TLS Authority:</span>
                <span className="text-white font-bold truncate block">{selectedScan.sslData?.issuer || 'None'}</span>
              </div>
            </div>

            {selectedScan.breakdown?.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">Identified Indicators:</span>
                <div className="space-y-1.5">
                  {selectedScan.breakdown.map((b, i) => (
                    <div key={i} className="flex justify-between p-2 rounded bg-slate-950 text-xs font-mono border border-slate-800/80">
                      <span className="text-slate-300">{b.factor}</span>
                      <span className="text-rose-400 font-bold">{b.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  navigate(`/scanner?url=${encodeURIComponent(selectedScan.url)}`);
                  setSelectedScan(null);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold rounded-lg transition-colors"
              >
                Re-Inspect in Live Scanner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
