import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { timingSafeCompare } from '../../src/server/utils/crypto.ts';

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
