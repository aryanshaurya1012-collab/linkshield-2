import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Globe, Info, Terminal, Volume2, VolumeX } from 'lucide-react';
import { calculateEntropy, detectHomograph, calculateRiskScore } from '../utils/engine';
import { saveScan } from '../utils/db';
import { motion } from 'framer-motion';

export default function Scanner({ user, uptime, totalScans, setTotalScans }) {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState({
    score: 0,
    entropy: 0,
    isHomograph: false,
    breakdown: []
  });
  const [logs, setLogs] = useState([]);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Critical Threat hook
  useEffect(() => {
    if (analysis.score === 100) {
      setShowCriticalModal(true);
      addLog('CRITICAL ALERT: FORCED SYSTEM ISOLATION', 'critical');
      
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && !isMuted) {
          const ctx = new AudioCtx();
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
        }
      } catch (e) {
        console.error("Audio API error", e);
      }
    }
  }, [analysis.score, isMuted]);

  // Mocking real-time analysis logs
  useEffect(() => {
    if (!url || url.trim() === '') {
      setLogs([]);
      setAnalysis({ score: 0, entropy: 0, isHomograph: false, breakdown: [] });
      return;
    }

    if (url.trim().length <= 3) {
      setLogs([{ time: new Date().toLocaleTimeString(), msg: '[SYSTEM] Input too short. Awaiting valid vector...', type: 'info' }]);
      setAnalysis({ score: 0, entropy: 0, isHomograph: false, breakdown: [] });
      return;
    }

    if (!url.includes('.') || url.endsWith('.')) {
      setLogs([{ time: new Date().toLocaleTimeString(), msg: '[SYSTEM] INVALID VECTOR: Missing TLD or invalid format.', type: 'warn' }]);
      setAnalysis({ score: 0, entropy: 0, isHomograph: false, breakdown: [] });
      return;
    }

    const timer = setTimeout(() => {
      analyzeUrl(url);
    }, 400);

    return () => clearTimeout(timer);
  }, [url]);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
  };

  const analyzeUrl = (inputUrl) => {
    setLogs([]);
    setTotalScans(prev => prev + 1);
    addLog('Initializing LinkShield Cyber-Scan...', 'info');
    
    setTimeout(() => {
      const riskResult = calculateRiskScore(inputUrl);
      const entropy = riskResult.entropy;
      addLog(`[TARGET] Entropy H(X): ${entropy.toFixed(2)}`, entropy > 3.5 ? 'warn' : 'success');
      
      setTimeout(() => {
        const isHomograph = detectHomograph(inputUrl);
        addLog(`[SCAN] Punycode/Homograph: ${isHomograph ? 'FLAGGED' : 'CLEAN'}`, isHomograph ? 'warn' : 'success');
        
        setTimeout(() => {
          if (riskResult.breakdown.length === 0) {
            addLog('[INTELLIGENCE] TLD & Keyword Analysis: CLEAN', 'success');
          } else {
            riskResult.breakdown.forEach(b => {
               addLog(`[ALERT] ${b.factor} detected!`, 'error');
            });
          }

          setAnalysis({
            score: riskResult.score,
            entropy,
            isHomograph,
            breakdown: riskResult.breakdown
          });

          if (riskResult.score < 100) {
            addLog(`[SYSTEM] Analysis Complete. Final Score: ${riskResult.score}/100`, riskResult.score >= 70 ? 'error' : riskResult.score >= 30 ? 'warn' : 'success');
          }

          // Database Action: PUSH SCAN DATA to mock backend
          if (user) {
            saveScan(user.id, {
              url: inputUrl,
              score: riskResult.score,
              entropy: entropy,
              breakdown: riskResult.breakdown.map(b => b.factor)
            });
          }

        }, 300);
      }, 300);
    }, 300);
  };

  const getRiskColorCSS = (score) => {
    if (score === 0) return '#00FFFF'; // Default Cyan
    if (score < 30) return '#00FF00'; // Neon Green
    if (score < 70) return '#FF00FF'; // Neon Magenta
    return '#FF0000'; // Red
  };

  const getRiskLabel = () => {
    if (!url || url.trim() === '' || analysis.score === 0) return 'STANDBY';
    if (!url.includes('.') || url.endsWith('.')) return 'INVALID';
    if (analysis.score === 100) return 'TERMINATE CONNECTION';
    if (analysis.score < 30) return 'SAFE';
    if (analysis.score < 70) return 'SUSPICIOUS';
    return 'CRITICAL THREAT';
  };

  const riskLabel = getRiskLabel();
  const isHighRisk = analysis.score >= 70;

  return (
    <>
      <motion.div 
        className="w-full flex flex-col gap-6 pb-10"
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
      
      {/* Top Analytics Bar (System Pulse Header) */}
      <div className="w-full flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-[#00FFFF]/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md flex-col md:flex-row gap-4 relative z-20">
        <div className="flex items-center gap-4">
          <div className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF00] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,1)]"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#00FF00] font-mono font-black tracking-widest text-sm drop-shadow-[0_0_5px_rgba(0,255,0,0.8)]">SYSTEM ONLINE</span>
            <span className="text-[#00FF00]/60 font-mono text-[10px] uppercase tracking-wider">Secure Node Active</span>
          </div>
          <div className="hidden md:flex ml-4 items-center h-8 w-24 opacity-60">
             <svg viewBox="0 0 100 30" className="w-full h-full stroke-[#00FF00] fill-none" preserveAspectRatio="none">
               <path d="M0,15 L10,15 L15,5 L25,25 L30,15 L50,15 L55,2 L65,28 L70,15 L100,15" strokeWidth="1.5" strokeLinejoin="round" 
                 style={{ strokeDasharray: 120, strokeDashoffset: 120, animation: 'dash 2s linear infinite' }} />
             </svg>
             <style dangerouslySetInnerHTML={{__html: `
               @keyframes dash {
                 to { stroke-dashoffset: 0; }
               }
             `}} />
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
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-[#00FFFF] font-mono uppercase tracking-wide">
              <Globe className="w-6 h-6 text-[#00FFFF]" />
              Target Vector
            </h2>
            <div className="relative z-20">
              <input
                type="text"
                placeholder="Enter URL to scan..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-950/80 border border-[#00FFFF]/30 rounded-xl py-5 px-6 text-xl focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/60 focus:border-[#00FFFF]/60 transition-all font-mono text-[#00FFFF] placeholder:text-[#00FFFF]/30 shadow-inner"
              />
              {analysis.score > 0 && url && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {analysis.score < 30 ? (
                     <CheckCircle className="w-8 h-8 text-[#00FF00] drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]" color="#00FF00" />
                  ) : (
                     <AlertTriangle className="w-8 h-8 drop-shadow-[0_0_8px_currentColor]" color={getRiskColorCSS(analysis.score)} />
                  )}
                </div>
              )}
            </div>

            {/* Simulation Deck Presets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 z-20 relative">
              <button 
                onClick={() => setUrl('https://jisuniversity.ac.in/portal/student-login')} 
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-mono py-2 px-3 rounded-md hover:border-cyan-500/50 transition-all duration-200"
              >
                [ 🟢 Safe Portal ]
              </button>
              <button 
                onClick={() => setUrl('https://z9r2k7m4v9p1q6w8.google-services.net')} 
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-mono py-2 px-3 rounded-md hover:border-cyan-500/50 transition-all duration-200"
              >
                [ 🟡 Suspicious Entropy ]
              </button>
              <button 
                onClick={() => setUrl('http://crypto-wallet-auth.top')} 
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-mono py-2 px-3 rounded-md hover:border-cyan-500/50 transition-all duration-200"
              >
                [ 🟠 High Risk Zone ]
              </button>
              <button 
                onClick={() => setUrl('https://signin-auth-secure-paypal.xyz')} 
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-mono py-2 px-3 rounded-md hover:border-cyan-500/50 transition-all duration-200"
              >
                [ 🔴 Critical Alert ]
              </button>
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
                  style={{ color: analysis.score === 100 ? '#FF0000' : (url && analysis.score > 0 ? getRiskColorCSS(analysis.score) : '#FF00FF') }}
                >
                  {riskLabel}
                </div>
              </div>
              
              <div className="relative w-56 h-28 overflow-hidden mb-4">
                <div className="absolute top-0 left-0 w-56 h-56 border-[20px] border-slate-900/80 backdrop-blur-sm rounded-full shadow-inner"></div>
                <div 
                  className="absolute top-0 left-0 w-56 h-56 border-[20px] border-transparent rounded-full transition-all duration-1000 ease-out z-10"
                  style={{
                    transform: `rotate(${url && analysis.score > 0 ? (analysis.score / 100) * 180 - 45 : -45}deg)`,
                    borderTopColor: url && analysis.score > 0 ? getRiskColorCSS(analysis.score) : 'transparent',
                    borderRightColor: url && analysis.score > 0 ? getRiskColorCSS(analysis.score) : 'transparent',
                    filter: url && analysis.score > 0 ? `drop-shadow(0 0 10px ${getRiskColorCSS(analysis.score)})` : 'none'
                  }}
                ></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-slate-950 border-4 border-[#00FFFF]/50 shadow-[0_0_15px_rgba(0,255,255,0.5)] z-20"></div>
                <div 
                  className="absolute bottom-6 left-1/2 w-1.5 h-24 bg-white/90 shadow-[0_0_8px_white] origin-bottom transition-all duration-1000 ease-out rounded-t-full z-10"
                  style={{ transform: `rotate(${url && analysis.score > 0 ? (analysis.score / 100) * 180 - 90 : -90}deg)` }}
                ></div>
              </div>
              
              <div className="text-6xl font-black font-mono tracking-tighter drop-shadow-[0_0_8px_currentColor] transition-colors duration-500" style={{ color: url && analysis.score > 0 ? getRiskColorCSS(analysis.score) : '#FF00FF' }}>
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
                     Punycode / Non-ASCII Domain
                   </div>
                )}
              </div>
              
              <div className="pt-6 border-t border-[#FF00FF]/20">
                <div className="flex gap-3 items-start">
                  <Info className="w-5 h-5 text-[#FF00FF] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#FF00FF]/70 leading-relaxed font-mono">
                    H(X) &gt; 3.5 suggests algorithmically generated domains. Scanning locally.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {analysis.breakdown && analysis.breakdown.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 border border-[#FF0000]/40 shadow-[0_0_20px_rgba(255,0,0,0.15)] bg-slate-900/50">
              <h3 className="text-[#FF0000] font-mono tracking-widest uppercase text-sm font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Engine Threat Analysis Logs
              </h3>
              <div className="flex flex-wrap gap-3">
                {analysis.breakdown.map((issue, idx) => (
                  <span key={idx} className="bg-red-950/30 border border-red-500/40 text-red-400 px-3 py-1.5 rounded-full text-xs font-mono font-bold animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.2)]">
                    {issue.factor}
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
               <span className="font-mono text-sm text-[#00FF00] font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">Threat Vector Logs</span>
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
                          animationDuration: `${Math.random() * 2 + 1.5}s`, 
                          animationDelay: `${Math.random() * 2}s`,
                          writingMode: 'vertical-rl',
                          textOrientation: 'upright',
                          opacity: Math.random() * 0.5 + 0.3
                        }}
                      >
                        {Array.from({ length: 15 }).map(() => Math.random() > 0.5 ? '1' : '0').join('')}
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
          </div>
        </div>
      </div>
      </motion.div>

      {/* Critical Threat Modal Overlay */}
      {showCriticalModal && (
        <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="absolute inset-0 border-[8px] border-[#FF0000] shadow-[inset_0_0_100px_rgba(255,0,0,0.5)] animate-pulse pointer-events-none"></div>
          <div className="relative w-full max-w-2xl bg-slate-950/90 border-2 border-[#FF0000] rounded-3xl p-10 shadow-[0_0_50px_rgba(255,0,0,0.5)] flex flex-col items-center text-center">
            
            <AlertTriangle className="w-24 h-24 text-[#FF0000] drop-shadow-[0_0_20px_rgba(255,0,0,1)] mb-6 animate-bounce" />
            
            <h2 className="text-4xl md:text-5xl font-black text-[#FF0000] drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] mb-6 tracking-widest uppercase">
              ⚠️ CRITICAL THREAT DETECTED
            </h2>
            
            <div className="bg-[#FF0000]/10 border border-[#FF0000]/50 rounded-xl p-6 mb-8 w-full shadow-[inset_0_0_20px_rgba(255,0,0,0.2)]">
              <p className="text-[#FF0000] font-mono text-lg font-bold tracking-wide">
                Reason: {analysis.breakdown.map(b => b.factor).join(' + ')}
              </p>
            </div>
            
            <button 
              onClick={() => {
                setShowCriticalModal(false);
                setUrl('');
                setAnalysis({ score: 0, entropy: 0, isHomograph: false, breakdown: [] });
                setLogs([]);
              }}
              className="px-8 py-4 bg-[#FF0000]/20 hover:bg-[#FF0000]/40 border-2 border-[#FF0000] text-[#FF0000] hover:text-white font-bold font-mono text-xl tracking-widest uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(255,0,0,0.4)] hover:shadow-[0_0_30px_rgba(255,0,0,0.8)] focus:outline-none focus:ring-4 focus:ring-[#FF0000]/50"
            >
              Close Security Alert
            </button>
            
          </div>
        </div>
      )}
    </>
  );
}
