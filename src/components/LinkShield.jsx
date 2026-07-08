import { useState } from 'react';

const LinkShield = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeUrl = (inputUrl) => {
    setIsAnalyzing(true);
    setResult(null);

    // Simulate analytical lookup
    setTimeout(() => {
      try {
        let processUrl = inputUrl.trim();
        if (!/^https?:\/\//i.test(processUrl)) {
          processUrl = 'http://' + processUrl;
        }

        const parsed = new URL(processUrl);
        const domain = parsed.hostname.toLowerCase();
        
        let score = 0;
        let reasons = [];

        // 1. Homograph Attack Check (Non-ASCII characters)
        const nonAsciiRegex = /[^\x00-\x7F]/;
        if (nonAsciiRegex.test(domain)) {
          score += 50;
          reasons.push("Homograph attack detected: contains non-standard/confusable characters (Punycode).");
        }

        // 2. Entropy / Randomness Check
        const parts = domain.split('.');
        const maxLabelLength = Math.max(...parts.map(p => p.length));
        if (maxLabelLength > 25) {
          score += 30;
          reasons.push("Abnormal subdomain length detected (high length).");
        }
        
        // Calculate Shannon Entropy for the domain
        const calculateEntropy = (str) => {
          const len = str.length;
          const frequencies = Array.from(str).reduce((freq, c) => {
            freq[c] = (freq[c] || 0) + 1;
            return freq;
          }, {});
          
          return Object.values(frequencies).reduce((sum, f) => {
            const p = f / len;
            return sum - (p * Math.log2(p));
          }, 0);
        };

        const entropy = calculateEntropy(domain);
        if (entropy > 3.5) {
          score += 40;
          reasons.push(`High entropy detected (${entropy.toFixed(2)}): indicates possible algorithmically generated domain.`);
        }

        const numDashes = (domain.match(/-/g) || []).length;
        if (numDashes > 3) {
          score += 20;
          reasons.push("Multiple hyphens in domain, a common phishing tactic.");
        }

        // 3. Keyword Flagging (Only in Subdomains)
        const sensitiveKeywords = ['login', 'secure', 'banking', 'auth', 'update', 'account', 'verify', 'paypal', 'support', 'service', 'bank'];
        const knownSafeDomains = ['paypal.com', 'google.com', 'apple.com', 'microsoft.com', 'chase.com', 'bankofamerica.com', 'amazon.com'];
        const isSafeDomain = knownSafeDomains.some(safe => domain === safe || domain.endsWith('.' + safe));

        if (!isSafeDomain && parts.length > 2) {
          // Check keywords only in subdomains (excluding the top-level domain and main domain)
          const subdomains = parts.slice(0, -2).join('.');
          
          sensitiveKeywords.forEach(keyword => {
            if (subdomains.includes(keyword)) {
              score += 40;
              reasons.push(`Suspicious keyword '${keyword}' found in subdomain.`);
            }
          });
          
          if (parts.length > 3) {
            score += 15;
            reasons.push("Multiple subdomains detected, potentially hiding true domain.");
          }
        }

        // 4. IP Address Check
        const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);
        if (isIpAddress) {
          score += 40;
          reasons.push("Domain is an IP address, often used to bypass filters.");
        }

        score = Math.min(score, 100);

        let status = 'Safe';
        let color = 'text-green-400';
        let bgStatus = 'bg-green-500';
        let strokeColor = '#4ADE80'; // tailwind green-400
        
        if (score >= 60) {
          status = 'Dangerous';
          color = 'text-red-500';
          bgStatus = 'bg-red-500';
          strokeColor = '#EF4444'; // tailwind red-500
        } else if (score > 0) {
          status = 'Suspicious';
          color = 'text-yellow-400';
          bgStatus = 'bg-yellow-400';
          strokeColor = '#FACC15'; // tailwind yellow-400
        }

        if (score === 0) {
          reasons.push("Clean. No suspicious patterns detected.");
        }

        setResult({ score, status, color, bgStatus, strokeColor, reasons });

        // --- API Integration Placeholder ---
        // Privacy-First: No real backend data sent, logic is strictly client-side.
        /*
        fetch('https://safebrowsing.googleapis.com/v4/threatMatches:find?key=YOUR_API_KEY', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client: { clientId: "LinkShield", clientVersion: "1.0.0" },
            threatInfo: {
              threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
              platformTypes: ["ANY_PLATFORM"],
              threatEntryTypes: ["URL"],
              threatEntries: [{ url: inputUrl }]
            }
          })
        }).then(res => res.json()).then(data => { console.log('API Result:', data); });
        */

      } catch (err) {
        setResult({ 
          score: -1, 
          status: 'Invalid URL', 
          color: 'text-gray-400', 
          bgStatus: 'bg-gray-400',
          strokeColor: '#9CA3AF',
          reasons: ['The URL provided is not properly formatted.']
        });
      }
      setIsAnalyzing(false);
    }, 1200);
  };

  const handleScan = (e) => {
    e.preventDefault();
    if (url.trim()) {
      analyzeUrl(url);
    }
  };

  // Calculate SVG stroke offset
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = result && result.score >= 0 
    ? circumference - (result.score / 100) * circumference 
    : circumference;

  return (
    <div className="min-h-screen bg-[#0A1128] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-3xl bg-[#111A3A] rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.1)] border border-[#1A265A] p-8 md:p-12 overflow-hidden relative">
        
        {/* Glow Effects */}
        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[80%] h-[150px] bg-[#00F0FF] opacity-10 blur-[100px] pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-[#1A265A] rounded-full mb-6 border border-[#2A3B8B] shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#00F0FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00F0FF]">
            LinkShield
          </h1>
          <p className="text-lg text-gray-400">Human Firewall & Phishing Threat Analyzer</p>
        </div>

        <form onSubmit={handleScan} className="relative z-10 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a suspicious URL (e.g., http://secure-login-update.com)"
              className="flex-1 bg-[#1A265A] border-2 border-[#2A3B8B] rounded-xl px-6 py-4 text-lg text-white focus:outline-none focus:border-[#00F0FF] focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all placeholder-gray-500"
              required
            />
            <button
              type="submit"
              disabled={isAnalyzing}
              className="bg-[#00F0FF] hover:bg-white hover:text-[#0A1128] text-[#0A1128] font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center min-w-[160px] shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <div className="w-6 h-6 border-4 border-[#0A1128] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Scan Link"
              )}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center flex justify-center items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Privacy First: All analysis is fully performed locally in your browser.
          </p>
        </form>

        {result && (
          <div className="mt-10 bg-[#0A1128] rounded-2xl p-8 border border-[#1A265A] shadow-inner relative overflow-hidden animate-[fadeIn_0.5s_ease-out]">
            <div className="flex flex-col md:flex-row items-center gap-12">
              
              {/* Risk Gauge */}
              <div className="relative flex flex-col items-center justify-center shrink-0">
                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 140 140">
                  {/* Background Circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#1A265A"
                    strokeWidth="12"
                  />
                  {/* Progress Circle */}
                  {result.score >= 0 && (
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      stroke={result.strokeColor}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1500 ease-out"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-black ${result.color} drop-shadow-[0_0_10px_rgba(currentColor,0.5)]`}>
                    {result.score >= 0 ? result.score : '?'}
                  </span>
                  <span className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-semibold">
                    Risk Score
                  </span>
                </div>
              </div>

              {/* Analysis Details */}
              <div className="flex-1 w-full text-center md:text-left">
                <div className="inline-block px-4 py-1 rounded-full bg-[#111A3A] border border-[#2A3B8B] mb-4">
                  <span className={`text-sm font-bold uppercase tracking-wider ${result.color}`}>
                    Analysis Complete
                  </span>
                </div>
                <h3 className={`text-3xl font-bold mb-4 ${result.color}`}>
                  {result.status}
                </h3>
                <ul className="space-y-4">
                  {result.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-[#111A3A] p-3 rounded-lg border border-[#1A265A]">
                      <span className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${result.bgStatus} shadow-[0_0_8px_currentColor]`}></span>
                      <span className="text-gray-300 leading-relaxed">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 text-center text-gray-600 text-sm">
        <p>LinkShield AI · Advanced Threat Detection Model</p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LinkShield;
