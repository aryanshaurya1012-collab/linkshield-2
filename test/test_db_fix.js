import { db } from '../server/db.js';

console.log('--- DB & API Verification ---');

// 1. Foreign key list
const fkList = db.prepare('PRAGMA foreign_key_list(scans)').all();
console.log('1. Foreign keys on scans:', fkList);
if (fkList.length > 0) {
  throw new Error('Foreign key constraint still present on scans table!');
}

// 2. Stats query
const criticalRow = db.prepare("SELECT COUNT(*) as critical FROM scans WHERE risk_level IN ('CRITICAL', 'HIGH')").get();
const cleanRow = db.prepare("SELECT COUNT(*) as clean FROM scans WHERE risk_level = 'CLEAN'").get();
console.log('2. Stats query results:', { critical: criticalRow.critical, clean: cleanRow.clean });

// 3. Clerk user scan insert test
const testScanId = 'test-' + Date.now();
const testClerkUserId = 'user_2clerk_test_' + Date.now();

db.prepare(`
  INSERT INTO users (id, email, name, provider)
  VALUES (?, ?, ?, 'clerk')
  ON CONFLICT(id) DO NOTHING
`).run(testClerkUserId, `${testClerkUserId}@clerk.user`, 'Clerk Operator');

db.prepare(`
  INSERT INTO scans (id, user_id, url, hostname, score, risk_level, entropy, is_homograph, ip, ssl_data, dns_data, headers_data, breakdown, threat_notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  testScanId,
  testClerkUserId,
  'https://jisuniversity.ac.in/portal/student-login',
  'jisuniversity.ac.in',
  0,
  'CLEAN',
  2.34,
  0,
  '104.21.45.12',
  '{"issuer":"Cloudflare"}',
  '{"aRecords":["104.21.45.12"]}',
  '{"statusCode":200}',
  '[]',
  '[]'
);
console.log('3. Successfully inserted scan with Clerk userId without any foreign key error!');

// 4. Retrieve user scans
const rows = db.prepare('SELECT id, user_id, url, hostname, score FROM scans WHERE user_id = ?').all(testClerkUserId);
console.log('4. Successfully queried user scans:', rows);

// 5. Cleanup test record
db.prepare('DELETE FROM scans WHERE id = ?').run(testScanId);
db.prepare('DELETE FROM users WHERE id = ?').run(testClerkUserId);
console.log('5. Cleanup successful. All database operations verified!');
