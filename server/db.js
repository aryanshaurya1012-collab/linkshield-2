import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../linkshield.db');

export const db = new DatabaseSync(dbPath);

// Disable foreign key constraint enforcement so external identity IDs (e.g. Clerk user_...) never fail scans
db.exec('PRAGMA foreign_keys = OFF;');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'email',
    avatar TEXT,
    password_hash TEXT,
    salt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    url TEXT NOT NULL,
    hostname TEXT NOT NULL,
    score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    entropy REAL NOT NULL,
    is_homograph INTEGER NOT NULL DEFAULT 0,
    ip TEXT,
    ssl_data TEXT,
    dns_data TEXT,
    headers_data TEXT,
    breakdown TEXT,
    threat_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS threat_intel (
    id TEXT PRIMARY KEY,
    domain TEXT UNIQUE NOT NULL,
    threat_type TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    description TEXT NOT NULL,
    reported_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_scans_user ON scans(user_id);
  CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_threat_domain ON threat_intel(domain);
`);

// Seamless migration: strip legacy FOREIGN KEY constraint from existing scans table if present
try {
  const fkList = db.prepare('PRAGMA foreign_key_list(scans)').all();
  if (fkList.length > 0) {
    db.exec(`
      CREATE TABLE scans_migrated (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        url TEXT NOT NULL,
        hostname TEXT NOT NULL,
        score INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        entropy REAL NOT NULL,
        is_homograph INTEGER NOT NULL DEFAULT 0,
        ip TEXT,
        ssl_data TEXT,
        dns_data TEXT,
        headers_data TEXT,
        breakdown TEXT,
        threat_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO scans_migrated SELECT * FROM scans;
      DROP TABLE scans;
      ALTER TABLE scans_migrated RENAME TO scans;
      CREATE INDEX IF NOT EXISTS idx_scans_user ON scans(user_id);
      CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);
    `);
  }
} catch {
  // Migration already applied or not required
}

// Seed default known IOCs (Indicators of Compromise) if empty
const countRow = db.prepare('SELECT COUNT(*) as cnt FROM threat_intel').get();
if (countRow && countRow.cnt === 0) {
  const insertThreat = db.prepare(`
    INSERT INTO threat_intel (id, domain, threat_type, risk_level, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  const initialIOCs = [
    ['ioc-1', 'signin-auth-secure-paypal.xyz', 'Credential Harvester', 'CRITICAL', 'Spoofed PayPal login with high entropy path targeting banking tokens.'],
    ['ioc-2', 'crypto-wallet-auth.top', 'Drainer / Web3 Phish', 'HIGH', 'Wallet drainer script utilizing deceptive Web3 modal popups.'],
    ['ioc-3', 'z9r2k7m4v9p1q6w8.google-services.net', 'DGA / C2 Infrastructure', 'HIGH', 'Algorithmically generated domain acting as remote control vector.'],
    ['ioc-4', 'apple-id-verify-icloud.cc', 'Apple ID Phishing', 'CRITICAL', 'Fake two-factor authentication landing page harvesting iCloud credentials.'],
    ['ioc-5', 'netflix-billing-update.top', 'Subscription Scam', 'MEDIUM', 'Deceptive billing renewal page capturing credit card numbers.'],
    ['ioc-6', 'secure-bank-login-verify.click', 'Banking Trojan Loader', 'CRITICAL', 'Malicious APK payload distributor masked as online banking alert.']
  ];

  for (const item of initialIOCs) {
    insertThreat.run(...item);
  }
}
