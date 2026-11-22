import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Globe, Info, Terminal, Volume2, VolumeX, Loader2, X, ShieldAlert } from 'lucide-react';
import { calculateRiskScore, extractHostname } from '../utils/engine';
import { saveScan } from '../utils/db';

const createInitialAnalysis = () => ({
  score: 0,
  entropy: 0,
  isHomograph: false,
  breakdown: []
});

export default function Scanner({ user, uptime, totalScans, setTotalScans }) {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState(createInitialAnalysis);
  const [logs, setLogs] = useState([]);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [inputInvalid, setInputInvalid] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const timersRef = useRef([]);
  const terminalEndRef = useRef(null);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
  };

  const resetScanView = () => {
    clearAllTimers();
    setIsScanning(false);
    setHasScanned(false);
    setInputInvalid(false);
    setLogs([]);
    setAnalysis(createInitialAnalysis());
  };

  const analyzeUrl = (inputUrl) => {
    clearAllTimers();
    setIsScanning(true);
    setLogs([]);
    addLog('Initializing LinkShield Cyber-Scan sequence...', 'info');

    const t1 = setTimeout(() => {
      const riskResult = calculateRiskScore(inputUrl);

      if (riskResult.isMalformed) {
        addLog('[SYSTEM] INVALID VECTOR: Unable to parse URL format.', 'warn');
        setAnalysis(createInitialAnalysis());
        setIsScanning(false);
        return;
      }

      const entropy = riskResult.entropy;
      addLog(`[TARGET] Shannon Entropy H(X): ${entropy.toFixed(3)}`, entropy > 3.5 ? 'warn' : 'success');

      const t2 = setTimeout(() => {
        const isHomograph = riskResult.isHomograph;
        addLog(`[SCAN] Punycode / Homograph Spoof: ${isHomograph ? 'FLAGGED THREAT' : 'CLEAN'}`, isHomograph ? 'warn' : 'success');

        const t3 = setTimeout(async () => {
          riskResult.notes.forEach((note) => {
            addLog(`[NOTE] ${note.factor}: ${note.detail}`, 'success');
          });

          if (riskResult.breakdown.length === 0) {
            addLog('[INTELLIGENCE] Heuristic & Threat Signatures: CLEAN', 'success');
          } else {
            riskResult.breakdown.forEach(b => {
              addLog(`[ALERT] ${b.factor} (${b.value})`, 'error');
            });
          }

          setAnalysis({
            score: riskResult.score,
            entropy,
            isHomograph,
            breakdown: riskResult.breakdown
          });

          if (riskResult.score === 100) {
            setShowCriticalModal(true);
            addLog('CRITICAL ALERT: FORCED SYSTEM ISOLATION PROTOCOL ENGAGED', 'critical');

            try {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (AudioCtx && !isMuted) {
                const ctx = new AudioCtx();
                if (ctx.state === 'suspended') {
                  await ctx.resume().catch(() => {});
                }

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(600, ctx.currentTime);

                for (let i = 0; i < 5; i++) {
                  osc.frequency.setValueAtTime(900, ctx.currentTime + i * 0.4);
                  osc.frequency.setValueAtTime(600, ctx.currentTime + i * 0.4 + 0.2);
                }

                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 2);

                setTimeout(() => {
                  ctx.close().catch(() => {});
                }, 2500);
              }
            } catch (audioError) {
              console.warn('Audio telemetry alert skipped:', audioError);
            }
          }

          if (riskResult.score < 100) {
            addLog(
              `[SYSTEM] Vector Analysis Complete. Threat Rating: ${riskResult.score}/100`,
              riskResult.score >= 70 ? 'error' : riskResult.score >= 30 ? 'warn' : 'success'
            );
          }

          setIsScanning(false);
          setTotalScans(prev => prev + 1);

          // Database Action: PUSH SCAN DATA to client-side storage
          if (user) {
            await saveScan(user.id, {
              url: inputUrl,
              score: riskResult.score,
              entropy: entropy,
              breakdown: riskResult.breakdown.map(b => b.factor)
            });
          }
        }, 300);

        timersRef.current.push(t3);
      }, 300);

      timersRef.current.push(t2);
    }, 300);

    timersRef.current.push(t1);
  };

  const handleScan = (event) => {
    if (event) event.preventDefault();
    if (isScanning) return;

    const trimmed = url.trim();
    if (!trimmed) {
      resetScanView();
      return;
    }

    const hostname = extractHostname(trimmed);
    const isIp = hostname && (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith('['));
    if (!hostname || (!hostname.includes('.') && !isIp) || hostname.endsWith('.')) {
      setInputInvalid(true);
      setHasScanned(false);
      setLogs([{ time: new Date().toLocaleTimeString(), msg: '[SYSTEM] INVALID VECTOR: Missing valid domain or IP address.', type: 'warn' }]);
      setAnalysis(createInitialAnalysis());
      return;
    }

    setInputInvalid(false);
    setHasScanned(true);
    analyzeUrl(trimmed);
  };

  const getRiskColorCSS = (score) => {
    if (score === 0) return '#00FFFF'; // Neon Cyan
    if (score < 30) return '#00FF00'; // Neon Green
    if (score < 70) return '#FF00FF'; // Neon Magenta
    return '#FF0000'; // Critical Red
  };

  const getRiskLabel = () => {
    if (inputInvalid) return 'INVALID VECTOR';
    if (!hasScanned) return 'STANDBY';
    if (analysis.score === 100) return 'TERMINATE CONNECTION';
    if (analysis.score < 30) return 'SAFE VECTOR';
    if (analysis.score < 70) return 'SUSPICIOUS';
    return 'CRITICAL THREAT';
  };

  const riskLabel = getRiskLabel();
  const isHighRisk = analysis.score >= 70;

  const handlePresetSelect = (presetUrl) => {
    if (isScanning) return;
    setUrl(presetUrl);
    resetScanView();
  };

  return (
    <>
      <div className="w-full flex flex-col gap-6 pb-10">
      
      {/* Top Analytics Bar (System Pulse Header) */}
      <div className="w-full flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-[#00FFFF]/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md flex-col md:flex-row gap-4 relative z-20">
        <div className="flex items-center gap-4">
          <div className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF00] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,1)]"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#00FF00] font-mono font-black tracking-widest text-sm drop-shadow-[0_0_5px_rgba(0,255,0,0.8)]">SYSTEM ONLINE</span>
            <span className="text-[#00FF00]/60 font-mono text-[10px] uppercase tracking-wider">
              {user ? `Operator: ${user.username}` : 'Guest Session'}
            </span>
          </div>
          <div className="hidden md:flex ml-4 items-center h-8 w-24 opacity-60">
             <svg viewBox="0 0 100 30" className="w-full h-full stroke-[#00FF00] fill-none" preserveAspectRatio="none">
               <path d="M0,15 L10,15 L15,5 L25,25 L30,15 L50,15 L55,2 L65,28 L70,15 L100,15" strokeWidth="1.5" strokeLinejoin="round" 
                 style={{ strokeDasharray: 120, strokeDashoffset: 120, animation: 'dash 2s linear infinite' }} />
             </svg>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className={`p-2 rounded-full border transition-all ${isMuted ? 'border-[#FF0000]/40 text-[#FF0000] bg-[#FF0000]/10 hover:shadow-[0_0_15px_rgba(255,0,0,0.4)]' : 'border-[#00FFFF]/40 text-[#00FFFF] bg-[#00FFFF]/10 shadow-[0_0_10px_rgba(0,255,255,0.4)] hover:shadow-[0_0_20px_rgba(0,255,255,0.6)]'}`}
            title={isMuted ? "Telemetry Audio: MUTED" : "Telemetry Audio: ACTIVE"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-pulse" />}
          </button>
          <div className="h-8 w-px bg-[#00FFFF]/20 hidden sm:block"></div>
          <div className="flex flex-col items-end">
            <span className="text-[#00FFFF]/60 font-mono text-[10px] uppercase tracking-wider">Session Uptime</span>
            <span className="text-[#00FFFF] font-mono font-black tracking-widest text-lg drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]">
              {uptime}
            </span>
          </div>
          <div className="h-8 w-px bg-[#00FFFF]/20"></div>
          <div className="flex flex-col items-end">
            <span className="text-[#FF00FF]/60 font-mono text-[10px] uppercase tracking-wider">Total Scans</span>
            <span className="text-[#FF00FF] font-mono font-black tracking-widest text-lg drop-shadow-[0_0_8px_rgba(255,0,255,0.6)]">
              {totalScans.toString().padStart(4, '0')}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Input & Gauge */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Input Card */}
          <div className="glass-panel rounded-2xl p-8 relative overflow-hidden border border-[#00FFFF]/40 shadow-[0_0_20px_rgba(0,255,255,0.15)] group transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.25)] z-10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00FFFF] to-transparent"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3 text-[#00FFFF] font-mono uppercase tracking-wide">
                <Globe className="w-6 h-6 text-[#00FFFF]" />
                Target Vector Inspection
              </h2>
              {url && (
                <button
                  type="button"
                  onClick={() => {
                    setUrl('');
                    resetScanView();
                  }}
                  className="text-xs font-mono text-[#00FFFF]/60 hover:text-[#00FFFF] flex items-center gap-1 transition-all"
                >
                  <X className="w-4 h-4" /> Reset
                </button>
              )}
            </div>
            
            <form className="relative z-20" onSubmit={handleScan}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter URL to scan (e.g., https://example.com)..."
                    value={url}
                    disabled={isScanning}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      resetScanView();
                    }}
                    className="w-full bg-slate-950/80 border border-[#00FFFF]/30 rounded-xl py-5 px-6 text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/60 focus:border-[#00FFFF]/60 transition-all font-mono text-[#00FFFF] placeholder:text-[#00FFFF]/30 shadow-inner disabled:opacity-60"
                  />
                  {hasScanned && !inputInvalid && url && !isScanning && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {analysis.score < 30 ? (
                        <CheckCircle className="w-8 h-8 text-[#00FF00] drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 drop-shadow-[0_0_8px_currentColor]" color={getRiskColorCSS(analysis.score)} />
                      )}
                    </div>
                  )}
                  {isScanning && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Loader2 className="w-7 h-7 text-[#00FFFF] animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isScanning || !url.trim()}
                  className="bg-[#00FFFF]/10 hover:bg-[#00FFFF]/20 border border-[#00FFFF] text-[#00FFFF] px-8 py-4 rounded-xl font-mono font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning
                    </>
                  ) : (
                    'Scan'
                  )}
                </button>
              </div>
            </form>

            {/* Simulation Deck Presets */}
            <div className="mt-6">
              <span className="text-[10px] font-mono text-[#00FFFF]/60 uppercase tracking-widest block mb-2">
                Simulated Phishing Vectors &amp; Test Vectors:
              </span>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 z-20 relative">
                <button 
                  type="button"
                  disabled={isScanning}
                  onClick={() => handlePresetSelect('https://jisuniversity.ac.in/portal/student-login')}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 text-slate-300 hover:text-emerald-400 text-xs font-mono py-2.5 px-3 rounded-md hover:border-emerald-500/50 transition-all duration-200 disabled:opacity-40 text-left truncate"
                >
                  🟢 Safe Portal
                </button>
                <button 
                  type="button"
                  disabled={isScanning}
                  onClick={() => handlePresetSelect('https://z9r2k7m4v9p1q6w8.google-services.net')}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 text-slate-300 hover:text-yellow-400 text-xs font-mono py-2.5 px-3 rounded-md hover:border-yellow-500/50 transition-all duration-200 disabled:opacity-40 text-left truncate"
                >
                  🟡 High Entropy
                </button>
                <button 
                  type="button"
                  disabled={isScanning}
                  onClick={() => handlePresetSelect('http://crypto-wallet-auth.top')}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 text-slate-300 hover:text-orange-400 text-xs font-mono py-2.5 px-3 rounded-md hover:border-orange-500/50 transition-all duration-200 disabled:opacity-40 text-left truncate"
                >
                  🟠 Risky TLD
                </button>
                <button 
                  type="button"
                  disabled={isScanning}
                  onClick={() => handlePresetSelect('https://signin-auth-secure-paypal.xyz')}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 text-slate-300 hover:text-red-400 text-xs font-mono py-2.5 px-3 rounded-md hover:border-red-500/50 transition-all duration-200 disabled:opacity-40 text-left truncate"
                >
                  🔴 Critical Alert
                </button>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Gauge Card */}
            <div className={`glass-panel rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden border border-[#FF00FF]/40 shadow-[0_0_20px_rgba(255,0,255,0.15)] transition-all duration-500 ease-in-out ${isHighRisk ? 'animate-pulse shadow-[0_0_40px_rgba(255,0,0,0.4)] border-[#FF0000]/60' : ''}`}>
              <div className="text-center mb-8">
                <h3 className="text-[#FF00FF] uppercase tracking-widest text-sm font-bold mb-2 font-mono">Threat Level</h3>
                <div 
                  className={`text-2xl font-black tracking-widest uppercase drop-shadow-[0_0_5px_currentColor] transition-colors duration-500 ${analysis.score === 100 ? 'animate-pulse text-[#FF0000]' : ''}`}
                  style={{ color: analysis.score === 100 ? '#FF0000' : (hasScanned && !inputInvalid ? getRiskColorCSS(analysis.score) : '#FF00FF') }}
                >
                  {riskLabel}
                </div>
              </div>
              
              <div className="relative w-56 h-28 overflow-hidden mb-4">
                <div className="absolute top-0 left-0 w-56 h-56 border-[20px] border-slate-900/80 backdrop-blur-sm rounded-full shadow-inner"></div>
                <div 
                  className="absolute top-0 left-0 w-56 h-56 border-[20px] border-transparent rounded-full transition-all duration-1000 ease-out z-10"
                  style={{
                    transform: `rotate(${hasScanned && !inputInvalid ? (analysis.score / 100) * 180 - 45 : -45}deg)`,
                    borderTopColor: hasScanned && !inputInvalid ? getRiskColorCSS(analysis.score) : 'transparent',
                    borderRightColor: hasScanned && !inputInvalid ? getRiskColorCSS(analysis.score) : 'transparent',
                    filter: hasScanned && !inputInvalid ? `drop-shadow(0 0 10px ${getRiskColorCSS(analysis.score)})` : 'none'
                  }}
                ></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-slate-950 border-4 border-[#00FFFF]/50 shadow-[0_0_15px_rgba(0,255,255,0.5)] z-20"></div>
                <div 
                  className="absolute bottom-6 left-1/2 w-1.5 h-24 bg-white/90 shadow-[0_0_8px_white] origin-bottom transition-all duration-1000 ease-out rounded-t-full z-10"
                  style={{ transform: `rotate(${hasScanned && !inputInvalid ? (analysis.score / 100) * 180 - 90 : -90}deg)` }}
                ></div>
              </div>
              
              <div className="text-6xl font-black font-mono tracking-tighter drop-shadow-[0_0_8px_currentColor] transition-colors duration-500" style={{ color: hasScanned && !inputInvalid ? getRiskColorCSS(analysis.score) : '#FF00FF' }}>
                {analysis.score}
                <span className="text-[#FF00FF]/50 text-3xl ml-1">/100</span>
              </div>
            </div>

            {/* Analysis Data Card */}
            <div className="glass-panel rounded-2xl p-8 space-y-8 border border-[#FF00FF]/40 shadow-[0_0_20px_rgba(255,0,255,0.15)] flex flex-col justify-center">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#FF00FF] font-mono tracking-wide uppercase text-sm font-bold">Shannon Entropy</span>
                  <span className="font-mono font-black text-lg transition-colors duration-300" style={{ color: analysis.entropy > 3.5 ? '#FF00FF' : '#00FFFF', textShadow: `0 0 5px ${analysis.entropy > 3.5 ? '#FF00FF' : '#00FFFF'}` }}>
                    {analysis.entropy.toFixed(3)}
                  </span>
                </div>
                <div className="w-full bg-slate-900/80 rounded-full h-3 border border-[#FF00FF]/20 shadow-inner overflow-hidden flex items-center">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min((analysis.entropy / 5) * 100, 100)}%`,
                      backgroundColor: analysis.entropy > 3.5 ? '#FF00FF' : '#00FFFF',
                      boxShadow: `0 0 10px ${analysis.entropy > 3.5 ? '#FF00FF' : '#00FFFF'}`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#FF00FF] font-mono tracking-wide uppercase text-sm font-bold">Homograph Check</span>
                  <span className="font-mono font-black text-lg transition-colors duration-300" style={{ color: analysis.isHomograph ? '#FF0000' : '#00FFFF', textShadow: `0 0 5px ${analysis.isHomograph ? '#FF0000' : '#00FFFF'}` }}>
                    {analysis.isHomograph ? 'DETECTED' : 'CLEAR'}
                  </span>
                </div>
                {analysis.isHomograph && (
                   <div className="px-3 py-2 bg-[#FF0000]/10 border border-[#FF0000]/50 rounded text-xs text-[#FF0000] mt-2 flex items-center gap-2 font-mono uppercase font-bold animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.2)]">
                     <AlertTriangle className="w-4 h-4" />
                     Punycode / Non-ASCII Domain Detected
                   </div>
                )}
              </div>
              
              <div className="pt-6 border-t border-[#FF00FF]/20">
                <div className="flex gap-3 items-start">
                  <Info className="w-5 h-5 text-[#FF00FF] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#FF00FF]/70 leading-relaxed font-mono">
                    H(X) &gt; 3.5 indicates algorithmic pseudo-randomness (DGA). Scans execute locally in-browser.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {analysis.breakdown && analysis.breakdown.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 border border-[#FF0000]/40 shadow-[0_0_20px_rgba(255,0,0,0.15)] bg-slate-900/50">
              <h3 className="text-[#FF0000] font-mono tracking-widest uppercase text-sm font-bold mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Detected Threat Signatures ({analysis.breakdown.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {analysis.breakdown.map((issue, idx) => (
                  <span key={idx} className="bg-red-950/40 border border-red-500/50 text-red-300 px-3 py-1.5 rounded-full text-xs font-mono font-bold shadow-[0_0_10px_rgba(255,0,0,0.2)] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    {issue.factor} <span className="text-red-400 opacity-75">({issue.value})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Terminal Window */}
        <div className="glass-panel rounded-2xl flex flex-col h-[600px] overflow-hidden border border-[#00FF00]/40 shadow-[0_0_20px_rgba(0,255,0,0.1)] group transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,0,0.2)]">
          <div className="bg-[#002200]/50 px-5 py-4 border-b border-[#00FF00]/30 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-3">
               <Terminal className="w-5 h-5 text-[#00FF00] drop-shadow-[0_0_5px_rgba(0,255,0,1)]" />
               <span className="font-mono text-sm text-[#00FF00] font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">
                 Threat Vector Logs {isScanning && '• SCANNING...'}
               </span>
            </div>
            <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-[#00FF00]/20 border border-[#00FF00]/50 shadow-[0_0_5px_rgba(0,255,0,0.5)]"></div>
               <div className="w-3 h-3 rounded-full bg-[#00FF00]/50 border border-[#00FF00] shadow-[0_0_5px_rgba(0,255,0,0.5)]"></div>
               <div className="w-3 h-3 rounded-full bg-[#00FF00] border border-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.8)]"></div>
            </div>
          </div>
          
          <div className="flex-1 p-5 bg-black/60 font-mono text-sm overflow-y-auto space-y-4 shadow-inner relative">
            {logs.length === 0 ? (
               <div className="text-[#00FF00]/30 flex flex-col items-center justify-center h-full gap-4 transition-all duration-1000 relative overflow-hidden group">
                 {/* Matrix Rain Background Effect */}
                 <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden flex font-mono text-[10px] text-[#00FF00] leading-none select-none justify-between px-2">
                   {Array.from({ length: 30 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="animate-rain absolute" 
                        style={{ 
                          left: `${(i / 30) * 100}%`,
                          animationDuration: `${1.5 + (i % 5) * 0.35}s`, 
                          animationDelay: `${(i % 7) * 0.25}s`,
                          writingMode: 'vertical-rl',
                          textOrientation: 'upright',
                          opacity: 0.3 + (i % 4) * 0.15
                        }}
                      >
                        {Array.from({ length: 15 }, (_, j) => ((i + j) % 2 === 0 ? '1' : '0')).join('')}
                      </div>
                   ))}
                 </div>
                 
                 <Terminal className="w-10 h-10 mb-2 opacity-50 relative z-10" />
                 <p className="animate-pulse tracking-widest uppercase text-xs relative z-10 drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">Awaiting data injection...</p>
               </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                  log.type === 'critical' ? 'text-[#FF0000] font-black drop-shadow-[0_0_8px_rgba(255,0,0,1)] text-base uppercase animate-pulse' :
                  log.type === 'error' ? 'text-[#FF0000] drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]' :
                  log.type === 'warn' ? 'text-[#FF00FF] drop-shadow-[0_0_5px_rgba(255,0,255,0.8)]' :
                  'text-[#00FF00] drop-shadow-[0_0_5px_rgba(0,255,0,0.6)]'
                }`}>
                  <span className="opacity-50 shrink-0">[{log.time}]</span>
                  <span className="break-all">
                    {'>'} {log.msg}
                  </span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
      </div>

      {/* Critical Threat Modal Overlay */}
      {showCriticalModal && (
        <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="absolute inset-0 border-[8px] border-[#FF0000] shadow-[inset_0_0_100px_rgba(255,0,0,0.5)] animate-pulse pointer-events-none"></div>
          <div className="relative w-full max-w-2xl bg-slate-950/90 border-2 border-[#FF0000] rounded-3xl p-8 md:p-10 shadow-[0_0_50px_rgba(255,0,0,0.5)] flex flex-col items-center text-center">
            
            <AlertTriangle className="w-20 h-20 md:w-24 md:h-24 text-[#FF0000] drop-shadow-[0_0_20px_rgba(255,0,0,1)] mb-6 animate-bounce" />
            
            <h2 className="text-3xl md:text-5xl font-black text-[#FF0000] drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] mb-6 tracking-widest uppercase">
              ⚠️ CRITICAL THREAT DETECTED
            </h2>
            
            <div className="bg-[#FF0000]/10 border border-[#FF0000]/50 rounded-xl p-6 mb-8 w-full shadow-[inset_0_0_20px_rgba(255,0,0,0.2)]">
              <p className="text-[#FF0000] font-mono text-base md:text-lg font-bold tracking-wide break-words">
                Threat Breakdown: {analysis.breakdown.map(b => b.factor).join(' + ') || 'Maximal Phishing Heuristic Signals'}
              </p>
            </div>
            
            <button 
              onClick={() => {
                setShowCriticalModal(false);
                setUrl('');
                resetScanView();
              }}
              className="px-8 py-4 bg-[#FF0000]/20 hover:bg-[#FF0000]/40 border-2 border-[#FF0000] text-[#FF0000] hover:text-white font-bold font-mono text-lg md:text-xl tracking-widest uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(255,0,0,0.4)] hover:shadow-[0_0_30px_rgba(255,0,0,0.8)] focus:outline-none focus:ring-4 focus:ring-[#FF0000]/50"
            >
              Close Security Alert
            </button>
            
          </div>
        </div>
      )}
    </>
  );
}
