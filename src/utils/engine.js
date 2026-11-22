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
  'ac.in', 'co.in', 'gov.in', 'net.in', 'org.in', 'edu.in', 'res.in',
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'net.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
  'co.jp', 'ne.jp', 'or.jp', 'ac.jp', 'go.jp',
  'co.nz', 'org.nz', 'net.nz', 'govt.nz',
  'com.sg', 'edu.sg', 'gov.sg', 'net.sg',
  'com.br', 'gov.br', 'org.br',
  'co.za', 'org.za', 'gov.za',
  'com.hk', 'edu.hk', 'gov.hk',
  'co.kr', 'ne.kr', 'or.kr',
  'com.mx', 'gob.mx', 'edu.mx'
]);

const TRUSTED_DOMAINS = [
  'google.com',
  'github.com',
  'microsoft.com',
  'apple.com',
  'jisuniversity.ac.in',
  'linkedin.com',
  'youtube.com',
  'wikipedia.org',
  'amazon.com'
];

const RISKY_TLDS = new Set([
  '.xyz', '.top', '.bit', '.cc', '.loan', '.tk', '.ml', '.ga', '.cf', '.gq',
  '.click', '.link', '.rest', '.buzz', '.work', '.tokyo', '.fit', '.surf',
  '.gdn', '.icu', '.sbs', '.cfd', '.quest', '.country', '.stream', '.men',
  '.party', '.racing', '.download'
]);

const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'is.gd', 'buff.ly', 'ow.ly',
  'cutt.ly', 'rb.gy', 'goo.gl', 'shorturl.at', 'bl.ink'
]);

const BRAND_TARGETS = [
  'paypal', 'google', 'microsoft', 'apple', 'netflix',
  'amazon', 'facebook', 'instagram', 'whatsapp', 'binance',
  'coinbase', 'chase', 'wellsfargo', 'bankofamerica'
];

export const extractHostname = (url) => {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsedUrl = new URL(trimmed.includes('://') ? trimmed : `http://${trimmed}`);
    const host = parsedUrl.hostname.toLowerCase();
    return host || null;
  } catch {
    return null;
  }
};

export const getRootDomain = (hostname) => {
  if (!hostname) return '';

  const lower = hostname.toLowerCase();

  // If hostname is an IP address, return raw IP
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(lower) || lower.startsWith('[') || /^[0-9a-f:]+$/i.test(lower)) {
    return lower;
  }

  const parts = lower.split('.');
  if (parts.length <= 2) return lower;

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
 * Combines entropy, TLD risk, spoofing heuristics, and sensitive keywords into a 0-100 score.
 * @param {string} url 
 * @returns {object} { score, breakdown, notes, entropy, isHomograph, hostname, isMalformed }
 */
export const calculateRiskScore = (url) => {
  if (!url || typeof url !== 'string') {
    return { score: 0, entropy: 0, breakdown: [], notes: [], isHomograph: false, hostname: null, isMalformed: false };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { score: 0, entropy: 0, breakdown: [], notes: [], isHomograph: false, hostname: null, isMalformed: false };
  }

  // Query String & Hash Stripping for base vector analysis
  const cleanUrl = trimmed.split('?')[0].split('#')[0];

  let score = 0;
  let overallEntropy = 0;
  const breakdown = [];
  const notes = [];
  let isHomograph = false;
  let hostname = null;

  try {
    const rawParsedUrl = new URL(cleanUrl.includes('://') ? cleanUrl : `http://${cleanUrl}`);
    hostname = rawParsedUrl.hostname.toLowerCase();

    if (!hostname) {
      throw new Error('Invalid host');
    }

    const rootDomain = getRootDomain(hostname);
    const parts = hostname.split('.');
    let subdomain = '';

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

    // 2. Raw IP Address Hostname Detection
    const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const isIpv6 = hostname.startsWith('[') || (hostname.includes(':') && /^[0-9a-f:]+$/i.test(hostname));
    if (isIpv4 || isIpv6) {
      score += 45;
      breakdown.push({ factor: 'Raw IP Address Hostname', value: '+45' });
    }

    // 3. Embedded Credentials / Authority Spoofing (@ symbol in original URL authority)
    if (rawParsedUrl.username || cleanUrl.includes('@')) {
      score += 45;
      breakdown.push({ factor: 'Embedded Credentials / Fake Authority (@)', value: '+45' });
    }

    // 4. URL Shortener Detection
    if (URL_SHORTENERS.has(hostname) || URL_SHORTENERS.has(rootDomain)) {
      score += 20;
      breakdown.push({ factor: 'URL Shortener (Masked Destination)', value: '+20' });
    }

    // 5. Entropy Analysis
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

    // 6. Homograph / Punycode
    isHomograph = detectHomograph(hostname);
    if (isHomograph) {
      score += 45;
      breakdown.push({ factor: 'Suspicious Characters (Punycode/Homograph)', value: '+45' });
    }

    // 7. Risky TLDs
    const tldMatch = hostname.match(/\.[a-z0-9]+$/i);
    if (tldMatch && RISKY_TLDS.has(tldMatch[0].toLowerCase())) {
      score += 30;
      breakdown.push({ factor: 'Risky TLD', value: '+30' });
    }

    // 8. Brand Spoofing in Subdomain / Hostname for non-trusted domains
    const brandMatch = BRAND_TARGETS.find(brand => {
      const isTargetBrand = rootDomain.split('.')[0] === brand;
      if (isTargetBrand) return false;
      return hostname.includes(brand);
    });

    if (brandMatch) {
      score += 35;
      breakdown.push({ factor: `Brand Spoofing Target (${brandMatch})`, value: '+35' });
    }

    // 9. Excessive Subdomain Nesting (e.g. login.secure.verify.paypal.fake.com)
    if (subdomain && subdomain.split('.').length >= 3) {
      score += 25;
      breakdown.push({ factor: 'Excessive Subdomain Nesting', value: '+25' });
    }

    // 10. Excessive Hyphens (domain squatted / obfuscated keywords)
    const hyphenCount = (hostname.match(/-/g) || []).length;
    if (hyphenCount >= 3) {
      score += 20;
      breakdown.push({ factor: 'Excessive Domain Hyphenation', value: '+20' });
    }

    // 11. Suspicious Port Detection
    if (rawParsedUrl.port && !['80', '443', '3000', '5173', '8080'].includes(rawParsedUrl.port)) {
      score += 25;
      breakdown.push({ factor: `Non-Standard Port (${rawParsedUrl.port})`, value: '+25' });
    }

    // 12. Contextual Sensitive Keywords
    const sensitiveKeywords = ['login', 'verify', 'secure', 'banking', 'paypal', 'netflix', 'crypto', 'signin', 'auth'];
    const lowerUrl = cleanUrl.toLowerCase();
    
    sensitiveKeywords.forEach(kw => {
      if (lowerUrl.includes(kw)) {
        score += 20;
        breakdown.push({ factor: `Phishing Keyword (${kw})`, value: '+20' });
      }
    });

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
