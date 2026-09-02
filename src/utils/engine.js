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

const MULTIPART_PUBLIC_SUFFIXES = new Set([
  'ac.in', 'co.in', 'gov.in', 'net.in', 'org.in',
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk',
  'com.au', 'net.au', 'org.au',
  'co.jp', 'ne.jp', 'or.jp',
  'co.nz', 'org.nz'
]);

export const extractHostname = (url) => {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url.includes('://') ? url : `http://${url}`);
    return parsedUrl.hostname.toLowerCase();
  } catch {
    return null;
  }
};

export const getRootDomain = (hostname) => {
  if (!hostname) return '';

  const parts = hostname.toLowerCase().split('.');
  if (parts.length <= 2) return hostname.toLowerCase();

  const suffix2 = parts.slice(-2).join('.');
  if (MULTIPART_PUBLIC_SUFFIXES.has(suffix2) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }

  return parts.slice(-2).join('.');
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
  const hasNonAscii = [...domain].some((char) => char.charCodeAt(0) > 127);
  if (hasNonAscii) return true;

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
  if (!url) {
    return { score: 0, entropy: 0, breakdown: [], notes: [], isHomograph: false, hostname: null, isMalformed: false };
  }

  const TRUSTED_DOMAINS = ['google.com', 'github.com', 'microsoft.com', 'apple.com', 'jisuniversity.ac.in', 'linkedin.com', 'youtube.com'];

  // Query String Stripping: Remove everything from ? or # to the end
  const cleanUrl = url.split('?')[0].split('#')[0];

  let score = 0;
  let overallEntropy = 0;
  const breakdown = [];
  const notes = [];
  let isHomograph = false;
  let hostname = null;

  try {
    const parsedUrl = new URL(cleanUrl.includes('://') ? cleanUrl : 'http://' + cleanUrl);
    hostname = parsedUrl.hostname.toLowerCase();
    
    const parts = hostname.split('.');
    let subdomain = '';
    const rootDomain = getRootDomain(hostname);
    
    if (parts.length > 2) {
      const rootPartsLength = rootDomain.split('.').length;
      subdomain = parts.slice(0, parts.length - rootPartsLength).join('.');
    }

    // 1. Global Trust Whitelist (Short-Circuit Logic)
    if (TRUSTED_DOMAINS.includes(rootDomain)) {
      notes.push({ factor: 'Trusted Domain', detail: `${rootDomain} is in trusted allowlist` });
      return { 
        score: 0, 
        entropy: 0,
        breakdown: [],
        notes,
        isHomograph: false,
        hostname,
        isMalformed: false
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

    isHomograph = detectHomograph(hostname);
    if (isHomograph) {
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

  } catch {
    notes.push({ factor: 'Malformed URL', detail: 'Input could not be parsed as a URL' });
    return {
      score: 0,
      entropy: 0,
      breakdown: [],
      notes,
      isHomograph: false,
      hostname: null,
      isMalformed: true
    };
  }

  return {
    score: Math.min(score, 100),
    entropy: overallEntropy,
    breakdown,
    notes,
    isHomograph,
    hostname,
    isMalformed: false
  };
};
