import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { timingSafeCompare, generateString, generateId, hashKey } from '../../src/server/utils/crypto.ts';

describe('generateString', () => {
  test('generates string of exact requested length', () => {
    assert.equal(generateString(0).length, 0);
    assert.equal(generateString(16).length, 16);
    assert.equal(generateString(64).length, 64);
  });

  test('contains only allowed alphanumeric characters', () => {
    const result = generateString(100);
    assert.match(result, /^[A-Za-z0-9]+$/);
  });

  test('distinct calls return different random values', () => {
    const val1 = generateString(32);
    const val2 = generateString(32);
    assert.notEqual(val1, val2);
  });
});

describe('generateId', () => {
  test('generates a valid UUID v4 format', () => {
    const id = generateId();
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  test('successive calls return unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    assert.notEqual(id1, id2);
  });
});

describe('hashKey', () => {
  test('returns a 64-character lowercase hex SHA-256 string', () => {
    const hash = hashKey('test');
    assert.equal(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);
  });

  test('matches standard SHA-256 test vectors', () => {
    const emptyHash = hashKey('');
    assert.equal(emptyHash, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  test('determinism and uniqueness', () => {
    const input = 'hello world';
    assert.equal(hashKey(input), hashKey(input));
    assert.notEqual(hashKey(input), hashKey('Hello World'));
  });
});

describe('timingSafeCompare', () => {
  test('returns true for equal strings of the same length', () => {
    assert.equal(timingSafeCompare('hello', 'hello'), true);
    assert.equal(timingSafeCompare('password123', 'password123'), true);
  });

  test('returns false for different strings of the same length', () => {
    assert.equal(timingSafeCompare('hello', 'world'), false);
    assert.equal(timingSafeCompare('pass123', 'word456'), false);
  });

  test('returns false for strings of different lengths', () => {
    assert.equal(timingSafeCompare('hello', 'hello!'), false);
    assert.equal(timingSafeCompare('longstring', 'short'), false);
  });

  test('handles empty strings correctly', () => {
    assert.equal(timingSafeCompare('', ''), true);
    assert.equal(timingSafeCompare('', 'a'), false);
    assert.equal(timingSafeCompare('a', ''), false);
  });

  test('handles unicode and multi-byte characters', () => {
    assert.equal(timingSafeCompare('🦀', '🦀'), true);
    assert.equal(timingSafeCompare('🦀', '🦞'), false);
    assert.equal(timingSafeCompare('crab🦀', 'crab🦞'), false);
  });

  test('handles strings with null bytes and control characters', () => {
    assert.equal(timingSafeCompare('secret\0token', 'secret\0token'), true);
    assert.equal(timingSafeCompare('secret\0token', 'secret\0other'), false);
    assert.equal(timingSafeCompare('line1\nline2', 'line1\nline2'), true);
  });

  test('differentiates non-ASCII byte equality (e.g., accents)', () => {
    assert.equal(timingSafeCompare('café', 'café'), true);
    assert.equal(timingSafeCompare('café', 'cafe'), false); // Accent difference
  });
});
