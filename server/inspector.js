import dns from 'node:dns/promises';
import tls from 'node:tls';
import { calculateEntropy, detectHomograph, getRootDomain } from '../src/utils/engine.js';

const RISKY_TLDS = new Set([
  '.xyz', '.top', '.bit', '.cc', '.loan', '.tk', '.ml', '.ga', '.cf', '.gq',
  '.click', '.link', '.rest', '.buzz', '.work', '.tokyo', '.fit', '.surf',
  '.gdn', '.icu', '.sbs', '.cfd', '.quest', '.country', '.stream', '.men',
  '.party', '.racing', '.download'
]);

const BRAND_TARGETS = [
  'paypal', 'google', 'microsoft', 'apple', 'netflix',
  'amazon', 'facebook', 'instagram', 'whatsapp', 'binance',
  'coinbase', 'chase', 'wellsfargo', 'bankofamerica'
];

const TRUSTED_DOMAINS = [
  'google.com', 'github.com', 'microsoft.com', 'apple.com',
  'jisuniversity.ac.in', 'linkedin.com', 'youtube.com', 'wikipedia.org',
  'amazon.com', 'cloudflare.com', 'vercel.com'
];

/**
 * Perform real-time TLS handshake to extract live certificate metadata
 */
async function inspectTLS(hostname, port = 443, timeoutMs = 3500) {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      finish({
        hasSSL: false,
        valid: false,
        error: 'TLS Handshake Timeout (>3.5s)'
      });
    }, timeoutMs);

    try {
      const socket = tls.connect(
        {
          host: hostname,
          port: port,
          servername: hostname,
          rejectUnauthorized: false
        },
        () => {
          clearTimeout(timer);
          const cert = socket.getPeerCertificate(true);
          const authorized = socket.authorized;
          const protocol = socket.getProtocol();
          const cipher = socket.getCipher();

          if (!cert || Object.keys(cert).length === 0) {
            socket.destroy();
            return finish({
              hasSSL: false,
              valid: false,
              error: 'No certificate presented'
            });
          }

          const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
          const daysRemaining = validTo ? Math.round((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

          const sslData = {
            hasSSL: true,
            valid: authorized,
            authorizationError: socket.authorizationError || null,
            issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown CA',
            subject: cert.subject?.CN || hostname,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            daysRemaining,
            isExpired: daysRemaining !== null && daysRemaining <= 0,
            protocol: protocol || 'TLS',
            cipher: cipher?.name || 'Unknown'
          };

          socket.destroy();
          finish(sslData);
        }
      );

      socket.on('error', (err) => {
        clearTimeout(timer);
        finish({
          hasSSL: false,
          valid: false,
          error: err.message || 'Connection Refused'
        });
      });
    } catch (err) {
      clearTimeout(timer);
      finish({
        hasSSL: false,
        valid: false,
        error: err.message
      });
    }
  });
}

/**
 * Perform real-time DNS resolution (A, AAAA, MX, NS, TXT)
 */
async function inspectDNS(hostname) {
  const dnsReport = {
    resolved: false,
    aRecords: [],
    aaaaRecords: [],
    mxRecords: [],
    nsRecords: [],
    txtRecords: [],
    error: null
  };

  try {
    const aRecords = await dns.resolve4(hostname).catch(() => []);
    const aaaaRecords = await dns.resolve6(hostname).catch(() => []);
    const mxRecords = await dns.resolveMx(hostname).catch(() => []);
    const nsRecords = await dns.resolveNs(hostname).catch(() => []);
    const txtRecords = await dns.resolveTxt(hostname).catch(() => []);

    dnsReport.aRecords = aRecords;
    dnsReport.aaaaRecords = aaaaRecords;
    dnsReport.mxRecords = mxRecords.map(m => `${m.exchange} (pri: ${m.priority})`);
    dnsReport.nsRecords = nsRecords;
    dnsReport.txtRecords = txtRecords.flat();
    dnsReport.resolved = aRecords.length > 0 || aaaaRecords.length > 0;
  } catch (err) {
    dnsReport.error = err.code || err.message;
  }

  return dnsReport;
}

/**
 * Perform real HTTP headers & redirection audit
 */
async function inspectHTTP(targetUrl, timeoutMs = 4000) {
  const httpReport = {
    online: false,
    statusCode: null,
    finalUrl: targetUrl,
    redirected: false,
    server: 'Unknown',
    securityHeaders: {
      hsts: false,
      hstsValue: null,
      csp: false,
      xFrameOptions: false,
      xContentTypeOptions: false,
      referrerPolicy: null
    },
    error: null
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'LinkShield-Security-Auditor/2.0 (Forensic Analysis Bot)'
      },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeout);

    httpReport.online = true;
    httpReport.statusCode = response.status;
    httpReport.finalUrl = response.url;
    httpReport.redirected = response.redirected || response.url !== targetUrl;

    const headers = response.headers;
    httpReport.server = headers.get('server') || 'Protected / Hidden';

    const hsts = headers.get('strict-transport-security');
    httpReport.securityHeaders.hsts = Boolean(hsts);
    httpReport.securityHeaders.hstsValue = hsts;

    httpReport.securityHeaders.csp = Boolean(headers.get('content-security-policy'));
    httpReport.securityHeaders.xFrameOptions = Boolean(headers.get('x-frame-options'));
    httpReport.securityHeaders.xContentTypeOptions = Boolean(headers.get('x-content-type-options'));
    httpReport.securityHeaders.referrerPolicy = headers.get('referrer-policy');
  } catch (err) {
    httpReport.online = false;
    httpReport.error = err.name === 'AbortError' ? 'HTTP Request Timed Out' : (err.message || 'Offline');
  }

  return httpReport;
}

/**
 * Comprehensive Real-Time Inspection & Threat Scoring
 */
export async function performDeepScan(inputUrl) {
  const trimmed = inputUrl.trim();
  const parsed = new URL(trimmed.includes('://') ? trimmed : `http://${trimmed}`);
  const hostname = parsed.hostname.toLowerCase();
  const rootDomain = getRootDomain(hostname);

  // Run Real-Time Network Probes Concurrently
  const [dnsData, sslData, httpData] = await Promise.all([
    inspectDNS(hostname),
    inspectTLS(hostname, parsed.port ? parseInt(parsed.port, 10) : 443),
    inspectHTTP(parsed.href)
  ]);

  let score = 0;
  const breakdown = [];
  const notes = [];

  // Check Allowlist
  const isTrusted = TRUSTED_DOMAINS.includes(rootDomain);
  if (isTrusted) {
    notes.push({ factor: 'Trusted Allowlist', detail: `${rootDomain} is an established global trusted authority.` });
    return {
      url: parsed.href,
      hostname,
      score: 0,
      riskLevel: 'CLEAN',
      entropy: calculateEntropy(hostname),
      isHomograph: false,
      ip: dnsData.aRecords[0] || 'Unresolved',
      sslData,
      dnsData,
      headersData: httpData,
      breakdown: [],
      notes
    };
  }

  // 1. IP Hostname Penalty
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (isIpv4) {
    score += 45;
    breakdown.push({ factor: 'Raw IP Hostname', value: '+45', severity: 'HIGH' });
  }

  // 2. Embedded Authority (@)
  if (parsed.username || inputUrl.includes('@')) {
    score += 45;
    breakdown.push({ factor: 'Embedded Authority Trick (@)', value: '+45', severity: 'HIGH' });
  }

  // 3. Homograph / Punycode
  const isHomograph = detectHomograph(hostname);
  if (isHomograph) {
    score += 45;
    breakdown.push({ factor: 'Punycode / Homograph Spoof', value: '+45', severity: 'CRITICAL' });
  }

  // 4. Entropy
  const entropy = calculateEntropy(hostname);
  if (entropy > 3.8) {
    score += 35;
    breakdown.push({ factor: 'High Shannon Entropy', value: '+35', severity: 'MEDIUM' });
  }

  // 5. Risky TLDs
  const tldMatch = hostname.match(/\.[a-z0-9]+$/i);
  if (tldMatch && RISKY_TLDS.has(tldMatch[0].toLowerCase())) {
    score += 30;
    breakdown.push({ factor: `High-Risk TLD (${tldMatch[0]})`, value: '+30', severity: 'MEDIUM' });
  }

  // 6. Brand Spoofing in Untrusted Domain
  const brandMatch = BRAND_TARGETS.find(brand => {
    const isPrimaryTarget = rootDomain.split('.')[0] === brand;
    if (isPrimaryTarget) return false;
    return hostname.includes(brand);
  });
  if (brandMatch) {
    score += 40;
    breakdown.push({ factor: `Target Brand Impersonation (${brandMatch})`, value: '+40', severity: 'CRITICAL' });
  }

  // 7. Live SSL Certificate Findings
  if (!sslData.hasSSL) {
    score += 25;
    breakdown.push({ factor: 'Missing or Invalid SSL/TLS', value: '+25', severity: 'HIGH' });
  } else {
    if (sslData.isExpired) {
      score += 35;
      breakdown.push({ factor: 'Expired SSL Certificate', value: '+35', severity: 'CRITICAL' });
    } else if (sslData.daysRemaining !== null && sslData.daysRemaining < 14) {
      score += 15;
      breakdown.push({ factor: `Expiring SSL Certificate (${sslData.daysRemaining} days left)`, value: '+15', severity: 'LOW' });
    }
  }

  // 8. Live DNS Findings
  if (!dnsData.resolved) {
    score += 20;
    breakdown.push({ factor: 'Unresolved DNS / Non-Existent Host', value: '+20', severity: 'MEDIUM' });
  }

  // 9. Phishing Keywords
  const sensitiveKeywords = ['login', 'verify', 'secure', 'banking', 'paypal', 'netflix', 'crypto', 'signin', 'auth', 'account-update'];
  const lowerUrl = inputUrl.toLowerCase();
  sensitiveKeywords.forEach(kw => {
    if (lowerUrl.includes(kw)) {
      score += 15;
      breakdown.push({ factor: `Sensitive Phishing Keyword (${kw})`, value: '+15', severity: 'LOW' });
    }
  });

  // Calculate Final Rating
  const finalScore = Math.min(Math.max(score, 0), 100);
  let riskLevel = 'CLEAN';
  if (finalScore >= 75) riskLevel = 'CRITICAL';
  else if (finalScore >= 50) riskLevel = 'HIGH';
  else if (finalScore >= 25) riskLevel = 'SUSPICIOUS';
  else if (finalScore > 0) riskLevel = 'LOW';

  return {
    url: parsed.href,
    hostname,
    score: finalScore,
    riskLevel,
    entropy,
    isHomograph,
    ip: dnsData.aRecords[0] || 'Unresolved',
    sslData,
    dnsData,
    headersData: httpData,
    breakdown,
    notes
  };
}
