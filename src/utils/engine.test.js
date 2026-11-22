import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRiskScore, extractHostname, getRootDomain, detectHomograph, calculateEntropy } from './engine.js';

test('extractHostname parses URLs with and without protocol', () => {
  assert.equal(extractHostname('https://example.com/path'), 'example.com');
  assert.equal(extractHostname('example.com/path'), 'example.com');
  assert.equal(extractHostname('   http://sub.domain.co.uk:8080   '), 'sub.domain.co.uk');
  assert.equal(extractHostname('not a url'), null);
});

test('getRootDomain supports multipart public suffixes and IPs', () => {
  assert.equal(getRootDomain('portal.jisuniversity.ac.in'), 'jisuniversity.ac.in');
  assert.equal(getRootDomain('secure.login.example.co.uk'), 'example.co.uk');
  assert.equal(getRootDomain('api.github.com'), 'github.com');
  assert.equal(getRootDomain('portal.service.gov.au'), 'service.gov.au');
  assert.equal(getRootDomain('192.168.1.1'), '192.168.1.1');
});

test('trusted multipart domain is bypassed safely', () => {
  const result = calculateRiskScore('https://portal.jisuniversity.ac.in/login');
  assert.equal(result.score, 0);
  assert.equal(result.breakdown.length, 0);
  assert.equal(result.isMalformed, false);
  assert.equal(result.notes[0]?.factor, 'Trusted Domain');
});

test('punycode domains are flagged by homograph detector', () => {
  assert.equal(detectHomograph('xn--paypa1-l2c.com'), true);
  const result = calculateRiskScore('https://xn--paypa1-l2c.com');
  assert.equal(result.isHomograph, true);
  assert.ok(result.score > 0);
});

test('malformed URL returns malformed marker without threat breakdown', () => {
  const result = calculateRiskScore('http://');
  assert.equal(result.isMalformed, true);
  assert.equal(result.breakdown.length, 0);
  assert.equal(result.notes[0]?.factor, 'Malformed URL');
});

test('detects raw IP address hostname as a threat indicator', () => {
  const result = calculateRiskScore('http://192.168.1.1/admin/login');
  assert.ok(result.breakdown.some(b => b.factor === 'Raw IP Address Hostname'));
  assert.ok(result.score >= 45);
});

test('detects embedded authority / fake credential trick with @', () => {
  const result = calculateRiskScore('http://google.com@evil-site.xyz/login');
  assert.ok(result.breakdown.some(b => b.factor.includes('Embedded Credentials')));
  assert.ok(result.score >= 70);
});

test('detects brand impersonation in untrusted domain subdomain', () => {
  const result = calculateRiskScore('https://paypal.verification-portal.net');
  assert.ok(result.breakdown.some(b => b.factor.includes('Brand Spoofing Target')));
});

test('detects URL shortener services', () => {
  const result = calculateRiskScore('https://bit.ly/3xY9kL');
  assert.ok(result.breakdown.some(b => b.factor.includes('URL Shortener')));
});

test('detects excessive hyphenation in malicious domain', () => {
  const result = calculateRiskScore('http://verify-bank-account-security-alert.org');
  assert.ok(result.breakdown.some(b => b.factor.includes('Excessive Domain Hyphenation')));
});

test('detects high entropy and non-standard ports', () => {
  const result = calculateRiskScore('http://suspicious-dga-domain-site.com:8444/login');
  assert.ok(result.breakdown.some(b => b.factor.includes('Non-Standard Port')));
});

test('calculateEntropy correctly computes entropy values', () => {
  assert.equal(calculateEntropy(''), 0);
  assert.equal(calculateEntropy('aaaaaa'), 0);
  const lowEntropy = calculateEntropy('google.com');
  const highEntropy = calculateEntropy('z9r2k7m4v9p1q6w8');
  assert.ok(highEntropy > lowEntropy);
});
