/**
 * Shannon Entropy Engine
 * Calculates the randomness of a string.
 * @param {string} str - Input string (e.g., URL or domain)
 * @returns {number} Entropy value
 */
export const calculateEntropy = (str) => {
  if (!str || str.length === 0) return 0;
  
  const charCount = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    charCount[char] = (charCount[char] || 0) + 1;
  }

  let entropy = 0;
  for (const char in charCount) {
    const p = charCount[char] / str.length;
    entropy -= p * Math.log2(p);
  }

  return entropy;
};

/**
 * Homograph/Punycode Detector
 * Checks for non-ASCII characters or punycode prefix.
 * @param {string} domain 
 * @returns {boolean} True if suspicious
 */
export const detectHomograph = (domain) => {
  if (!domain) return false;
  
  // Check for non-ASCII characters
  const nonAsciiRegex = /[^\x00-\x7F]/;
  if (nonAsciiRegex.test(domain)) return true;

  // Check for punycode prefix
  if (domain.includes('xn--')) return true;

  return false;
};

/**
 * Risk Scoring Algorithm
 * Combines entropy, TLD risk, and sensitive keywords into a 0-100 score.
 * @param {string} url 
 * @returns {object} { score, breakdown }
 */
export const calculateRiskScore = (url) => {
  if (!url) return { score: 0, entropy: 0, breakdown: [] };

  const TRUSTED_DOMAINS = ['google.com', 'github.com', 'microsoft.com', 'apple.com', 'jisuniversity.ac.in', 'linkedin.com', 'youtube.com'];

  // Query String Stripping: Remove everything from ? or # to the end
  const cleanUrl = url.split('?')[0].split('#')[0];

  let score = 0;
  let overallEntropy = 0;
  const breakdown = [];

  try {
    const parsedUrl = new URL(cleanUrl.includes('://') ? cleanUrl : 'http://' + cleanUrl);
    const protocol = parsedUrl.protocol;
    const hostname = parsedUrl.hostname;
    const pathname = parsedUrl.pathname;
    
    const parts = hostname.split('.');
    let subdomain = '';
    let rootDomain = hostname;
    
    if (parts.length > 2) {
      subdomain = parts.slice(0, parts.length - 2).join('.');
      rootDomain = parts.slice(parts.length - 2).join('.');
    }

    // 1. Global Trust Whitelist (Short-Circuit Logic)
    if (TRUSTED_DOMAINS.includes(rootDomain)) {
      return { 
        score: 0, 
        entropy: 0, 
        breakdown: [{ factor: 'TRUSTED DOMAIN DETECTED - SCAN BYPASSED' }] 
      };
    }

    overallEntropy = calculateEntropy(hostname);

    if (subdomain) {
      const subEntropy = calculateEntropy(subdomain);
      if (subEntropy > 3.8) {
        score += 35;
        breakdown.push({ factor: 'Subdomain High Entropy', value: '+35' });
      }
    } else {
      // If no subdomain exists, check overall entropy to maintain baseline protection
      if (overallEntropy > 4.5) {
        score += 50;
        breakdown.push({ factor: 'Critical Entropy', value: '+50' });
      } else if (overallEntropy > 3.5) {
        score += 35;
        breakdown.push({ factor: 'High Entropy', value: '+35' });
      }
    }

    if (detectHomograph(hostname)) {
      score += 45;
      breakdown.push({ factor: 'Suspicious Characters (Punycode/Homograph)', value: '+45' });
    }

    const riskyTlds = ['.xyz', '.top', '.bit', '.cc', '.loan', '.tk', '.ml', '.ga', '.cf', '.gq'];
    const tldMatch = hostname.match(/\.[a-z0-9]+$/i);
    if (tldMatch && riskyTlds.includes(tldMatch[0].toLowerCase())) {
      score += 30;
      breakdown.push({ factor: 'Risky TLD', value: '+30' });
    }

    const sensitiveKeywords = ['login', 'verify', 'secure', 'banking', 'paypal', 'netflix', 'crypto', 'signin', 'auth'];
    const lowerUrl = cleanUrl.toLowerCase();
    
    // 3. Contextual Keyword Penalties (Only if not trusted)
    if (!TRUSTED_DOMAINS.includes(rootDomain)) {
      sensitiveKeywords.forEach(kw => {
        if (lowerUrl.includes(kw)) {
          score += 20;
          breakdown.push({ factor: `Phishing Keyword (${kw})`, value: '+20' });
        }
      });
    }

  } catch (error) {
    breakdown.push({ factor: 'Malformed URL', value: 'Error' });
  }

  return {
    score: Math.min(score, 100),
    entropy: overallEntropy,
    breakdown
  };
};
