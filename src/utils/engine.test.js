import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRiskScore, extractHostname, getRootDomain, detectHomograph } from './engine.js';

test('extractHostname parses URLs with and without protocol', () => {
  assert.equal(extractHostname('https://example.com/path'), 'example.com');
  assert.equal(extractHostname('example.com/path'), 'example.com');
  assert.equal(extractHostname('not a url'), null);
});

test('getRootDomain supports multipart public suffixes', () => {
  assert.equal(getRootDomain('portal.jisuniversity.ac.in'), 'jisuniversity.ac.in');
  assert.equal(getRootDomain('secure.login.example.co.uk'), 'example.co.uk');
  assert.equal(getRootDomain('api.github.com'), 'github.com');
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
