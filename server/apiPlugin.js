import crypto from 'node:crypto';
import { db } from './db.js';
import { performDeepScan } from './inspector.js';

function parseRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// In-memory active session tokens mapped to user records
const activeSessions = new Map();

export function linkshieldApiPlugin() {
  return {
    name: 'linkshield-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');

        if (!url.pathname.startsWith('/api/')) {
          return next();
        }

        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          });
          return res.end();
        }

        try {
          // --- AUTH: REGISTER ---
          if (url.pathname === '/api/auth/register' && req.method === 'POST') {
            const { email, password, name } = await parseRequestBody(req);
            const normalizedEmail = (email || '').trim().toLowerCase();

            if (!normalizedEmail || !password || password.length < 6) {
              return sendJson(res, 400, { error: 'Valid email and minimum 6-character password are required.' });
            }

            const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
            if (existing) {
              return sendJson(res, 409, { error: 'An operator account with this email already exists.' });
            }

            const id = crypto.randomUUID();
            const salt = crypto.randomBytes(16).toString('hex');
            const password_hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
            const displayName = name || normalizedEmail.split('@')[0];
            const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`;

            db.prepare(`
              INSERT INTO users (id, email, name, provider, avatar, password_hash, salt)
              VALUES (?, ?, ?, 'email', ?, ?, ?)
            `).run(id, normalizedEmail, displayName, avatar, password_hash, salt);

            const token = crypto.randomUUID();
            const user = { id, email: normalizedEmail, name: displayName, provider: 'email', avatar };
            activeSessions.set(token, user);

            return sendJson(res, 201, { user, token });
          }

          // --- AUTH: LOGIN ---
          if (url.pathname === '/api/auth/login' && req.method === 'POST') {
            const { email, password } = await parseRequestBody(req);
            const normalizedEmail = (email || '').trim().toLowerCase();

            const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
            if (!userRow) {
              return sendJson(res, 401, { error: 'Invalid credentials. Access Denied.' });
            }

            if (userRow.provider !== 'email' || !userRow.salt || !userRow.password_hash) {
              return sendJson(res, 400, { error: `This account was registered via ${userRow.provider.toUpperCase()}. Please sign in using that provider.` });
            }

            const incomingHash = crypto.pbkdf2Sync(password, userRow.salt, 100000, 32, 'sha256').toString('hex');
            if (incomingHash !== userRow.password_hash) {
              return sendJson(res, 401, { error: 'Invalid credentials. Access Denied.' });
            }

            const token = crypto.randomUUID();
            const user = { id: userRow.id, email: userRow.email, name: userRow.name, provider: userRow.provider, avatar: userRow.avatar };
            activeSessions.set(token, user);

            return sendJson(res, 200, { user, token });
          }

          // --- AUTH: OAUTH (GOOGLE / APPLE) ---
          if (url.pathname === '/api/auth/oauth' && req.method === 'POST') {
            const { provider, email, name, avatar } = await parseRequestBody(req);
            const normalizedEmail = (email || '').trim().toLowerCase();

            if (!['google', 'apple'].includes(provider) || !normalizedEmail) {
              return sendJson(res, 400, { error: 'Valid OAuth provider and email are required.' });
            }

            let userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

            if (!userRow) {
              const id = crypto.randomUUID();
              const userAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`;
              const displayName = name || normalizedEmail.split('@')[0];

              db.prepare(`
                INSERT INTO users (id, email, name, provider, avatar)
                VALUES (?, ?, ?, ?, ?)
              `).run(id, normalizedEmail, displayName, provider, userAvatar);

              userRow = { id, email: normalizedEmail, name: displayName, provider, avatar: userAvatar };
            }

            const token = crypto.randomUUID();
            const user = { id: userRow.id, email: userRow.email, name: userRow.name, provider: userRow.provider, avatar: userRow.avatar };
            activeSessions.set(token, user);

            return sendJson(res, 200, { user, token });
          }

          // --- AUTH: CURRENT SESSION ---
          if (url.pathname === '/api/auth/me' && req.method === 'GET') {
            const authHeader = req.headers['authorization'];
            const token = authHeader?.replace('Bearer ', '');
            if (token && activeSessions.has(token)) {
              return sendJson(res, 200, { user: activeSessions.get(token) });
            }
            return sendJson(res, 401, { error: 'Not authenticated' });
          }

          // --- AUTH: LOGOUT ---
          if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
            const authHeader = req.headers['authorization'];
            const token = authHeader?.replace('Bearer ', '');
            if (token) activeSessions.delete(token);
            return sendJson(res, 200, { success: true });
          }

          // --- SCAN: REAL-TIME DEEP URL INSPECTION ---
          if (url.pathname === '/api/scan' && req.method === 'POST') {
            const { url: targetUrl, userId } = await parseRequestBody(req);

            if (!targetUrl || typeof targetUrl !== 'string') {
              return sendJson(res, 400, { error: 'Valid URL vector is required.' });
            }

            // Execute real-time network probes and heuristics
            const scanResult = await performDeepScan(targetUrl);
            const scanId = crypto.randomUUID();

            // Save to SQLite
            db.prepare(`
              INSERT INTO scans (id, user_id, url, hostname, score, risk_level, entropy, is_homograph, ip, ssl_data, dns_data, headers_data, breakdown, threat_notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              scanId,
              userId || null,
              scanResult.url,
              scanResult.hostname,
              scanResult.score,
              scanResult.riskLevel,
              scanResult.entropy,
              scanResult.isHomograph ? 1 : 0,
              scanResult.ip,
              JSON.stringify(scanResult.sslData),
              JSON.stringify(scanResult.dnsData),
              JSON.stringify(scanResult.headersData),
              JSON.stringify(scanResult.breakdown),
              JSON.stringify(scanResult.notes)
            );

            // If Critical, automatically index into threat intelligence table if not present
            if (scanResult.score >= 75) {
              const exists = db.prepare('SELECT id FROM threat_intel WHERE domain = ?').get(scanResult.hostname);
              if (!exists) {
                db.prepare(`
                  INSERT INTO threat_intel (id, domain, threat_type, risk_level, description)
                  VALUES (?, ?, ?, ?, ?)
                `).run(
                  crypto.randomUUID(),
                  scanResult.hostname,
                  scanResult.breakdown[0]?.factor || 'High-Risk Malicious Phishing Vector',
                  scanResult.riskLevel,
                  `Live detection: ${scanResult.breakdown.map(b => b.factor).join(', ')}`
                );
              }
            }

            return sendJson(res, 200, {
              id: scanId,
              ...scanResult,
              timestamp: new Date().toISOString()
            });
          }

          // --- SCANS: GET USER HISTORY ---
          if (url.pathname === '/api/scans' && req.method === 'GET') {
            const userId = url.searchParams.get('userId');
            const search = url.searchParams.get('q') || '';
            const risk = url.searchParams.get('risk') || 'ALL';

            let query = 'SELECT * FROM scans WHERE 1=1';
            const params = [];

            if (userId) {
              query += ' AND user_id = ?';
              params.push(userId);
            }

            if (risk && risk !== 'ALL') {
              query += ' AND risk_level = ?';
              params.push(risk);
            }

            if (search) {
              query += ' AND (url LIKE ? OR hostname LIKE ?)';
              params.push(`%${search}%`, `%${search}%`);
            }

            query += ' ORDER BY created_at DESC LIMIT 200';

            const rows = db.prepare(query).all(...params);
            const scans = rows.map(r => ({
              id: r.id,
              userId: r.user_id,
              url: r.url,
              hostname: r.hostname,
              score: r.score,
              riskLevel: r.risk_level,
              entropy: r.entropy,
              isHomograph: Boolean(r.is_homograph),
              ip: r.ip,
              sslData: JSON.parse(r.ssl_data || '{}'),
              dnsData: JSON.parse(r.dns_data || '{}'),
              headersData: JSON.parse(r.headers_data || '{}'),
              breakdown: JSON.parse(r.breakdown || '[]'),
              notes: JSON.parse(r.threat_notes || '[]'),
              timestamp: r.created_at
            }));

            return sendJson(res, 200, { scans });
          }

          // --- SCANS: DELETE INDIVIDUAL SCAN ---
          if (url.pathname.startsWith('/api/scans/') && req.method === 'DELETE') {
            const scanId = url.pathname.replace('/api/scans/', '');
            db.prepare('DELETE FROM scans WHERE id = ?').run(scanId);
            return sendJson(res, 200, { success: true });
          }

          // --- SCANS: PURGE USER HISTORY ---
          if (url.pathname === '/api/scans/clear' && req.method === 'POST') {
            const { userId } = await parseRequestBody(req);
            if (userId) {
              db.prepare('DELETE FROM scans WHERE user_id = ?').run(userId);
            } else {
              db.prepare('DELETE FROM scans').run();
            }
            return sendJson(res, 200, { success: true });
          }

          // --- THREAT INTEL: GET FEED ---
          if (url.pathname === '/api/threats' && req.method === 'GET') {
            const rows = db.prepare('SELECT * FROM threat_intel ORDER BY reported_at DESC LIMIT 50').all();
            return sendJson(res, 200, { threats: rows });
          }

          // --- STATS: EXECUTIVE DASHBOARD TELEMETRY ---
          if (url.pathname === '/api/stats' && req.method === 'GET') {
            const totalRow = db.prepare('SELECT COUNT(*) as total FROM scans').get();
            const criticalRow = db.prepare('SELECT COUNT(*) as critical FROM scans WHERE risk_level IN ("CRITICAL", "HIGH")').get();
            const cleanRow = db.prepare('SELECT COUNT(*) as clean FROM scans WHERE risk_level = "CLEAN"').get();
            const avgEntropyRow = db.prepare('SELECT AVG(entropy) as avg_entropy FROM scans').get();

            const distributionRows = db.prepare(`
              SELECT risk_level, COUNT(*) as count FROM scans GROUP BY risk_level
            `).all();

            const recentThreats = db.prepare(`
              SELECT id, url, hostname, score, risk_level, created_at
              FROM scans WHERE risk_level IN ('CRITICAL', 'HIGH')
              ORDER BY created_at DESC LIMIT 5
            `).all();

            return sendJson(res, 200, {
              totalScans: totalRow?.total || 0,
              threatsBlocked: criticalRow?.critical || 0,
              cleanDomains: cleanRow?.clean || 0,
              avgEntropy: avgEntropyRow?.avg_entropy ? Number(avgEntropyRow.avg_entropy.toFixed(3)) : 2.85,
              distribution: distributionRows,
              recentThreats
            });
          }

          // Unhandled API route
          return sendJson(res, 404, { error: 'Endpoint not found' });
        } catch (apiError) {
          console.error('API Error:', apiError);
          return sendJson(res, 500, { error: apiError.message || 'Internal Server Error' });
        }
      });
    }
  };
}
