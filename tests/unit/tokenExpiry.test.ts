import { test, describe, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { calculateExpiry, checkTokenExpiry } from '../../src/server/utils/tokenExpiry.ts';

describe('tokenExpiry utilities', () => {
  const FIXED_TIME = 1700000000000; // 2023-11-14T22:13:20.000Z

  afterEach(() => {
    mock.timers.reset();
  });

  describe('calculateExpiry', () => {
    test('calculates correct future date for minutes', () => {
      mock.timers.enable({ apis: ['Date'] });
      mock.timers.setTime(FIXED_TIME);

      const result = calculateExpiry('30m');
      assert.equal(result, new Date(FIXED_TIME + 30 * 60 * 1000).toISOString());
    });

    test('calculates correct future date for hours', () => {
      mock.timers.enable({ apis: ['Date'] });
      mock.timers.setTime(FIXED_TIME);

      const result = calculateExpiry('1h');
      assert.equal(result, new Date(FIXED_TIME + 1 * 60 * 60 * 1000).toISOString());

      const result2 = calculateExpiry('24h');
      assert.equal(result2, new Date(FIXED_TIME + 24 * 60 * 60 * 1000).toISOString());
    });

    test('calculates correct future date for days', () => {
      mock.timers.enable({ apis: ['Date'] });
      mock.timers.setTime(FIXED_TIME);

      const result = calculateExpiry('7d');
      assert.equal(result, new Date(FIXED_TIME + 7 * 24 * 60 * 60 * 1000).toISOString());

      const result2 = calculateExpiry('90d');
      assert.equal(result2, new Date(FIXED_TIME + 90 * 24 * 60 * 60 * 1000).toISOString());
    });

    test('calculates correct future date for years', () => {
      mock.timers.enable({ apis: ['Date'] });
      mock.timers.setTime(FIXED_TIME);

      const result = calculateExpiry('1y');
      assert.equal(result, new Date(FIXED_TIME + 1 * 365 * 24 * 60 * 60 * 1000).toISOString());
    });

    test('handles zero duration', () => {
      mock.timers.enable({ apis: ['Date'] });
      mock.timers.setTime(FIXED_TIME);

      const result1 = calculateExpiry('0m');
      assert.equal(result1, new Date(FIXED_TIME).toISOString());

      const result2 = calculateExpiry('0d');
      assert.equal(result2, new Date(FIXED_TIME).toISOString());
    });

    test('throws Error for empty string', () => {
      assert.throws(() => calculateExpiry(''), {
        message: 'Invalid TTL format: '
      });
    });

    test('throws Error for unsupported units', () => {
      assert.throws(() => calculateExpiry('30s'), {
        message: 'Invalid TTL format: 30s'
      });
      assert.throws(() => calculateExpiry('2w'), {
        message: 'Invalid TTL format: 2w'
      });
      assert.throws(() => calculateExpiry('3months'), {
        message: 'Invalid TTL format: 3months'
      });
    });

    test('throws Error for missing unit', () => {
      assert.throws(() => calculateExpiry('100'), {
        message: 'Invalid TTL format: 100'
      });
    });

    test('handles missing number', () => {
      assert.throws(() => calculateExpiry('m'), {
        message: 'Invalid TTL format: m'
      });
      assert.throws(() => calculateExpiry('d'), {
        message: 'Invalid TTL format: d'
      });
    });

    test('handles non-numeric strings', () => {
      assert.throws(() => calculateExpiry('invalid'), {
        message: 'Invalid TTL format: invalid'
      });
      assert.throws(() => calculateExpiry('abc'), {
        message: 'Invalid TTL format: abc'
      });
      assert.throws(() => calculateExpiry('abcd'), {
        message: 'Invalid TTL format: abcd'
      });
    });

    test('produces valid ISO 8601 string', () => {
      const result = calculateExpiry('30m');
      assert.equal(new Date(result).toISOString(), result);
    });
  });

  describe('checkTokenExpiry', () => {
    test('returns true when expiresAt is null (perpetual token)', () => {
      assert.equal(checkTokenExpiry(null), true);
    });

    test('returns true when expiresAt is in the future', () => {
      mock.timers.enable({ apis: ['Date'] });
      mock.timers.setTime(FIXED_TIME);

      const futureDate = new Date(FIXED_TIME + 1000).toISOString();
      assert.equal(checkTokenExpiry(futureDate), true);

      const farFutureDate = new Date(FIXED_TIME + 24 * 60 * 60 * 1000).toISOString();
      assert.equal(checkTokenExpiry(farFutureDate), true);
    });

    test('returns false when expiresAt is in the past', () => {
      mock.timers.enable({ apis: ['Date'] });
      mock.timers.setTime(FIXED_TIME);

      const pastDate = new Date(FIXED_TIME - 1000).toISOString();
      assert.equal(checkTokenExpiry(pastDate), false);

      const farPastDate = new Date(FIXED_TIME - 24 * 60 * 60 * 1000).toISOString();
      assert.equal(checkTokenExpiry(farPastDate), false);
    });

    test('returns false when expiresAt is exactly now', () => {
      mock.timers.enable({ apis: ['Date'] });
      mock.timers.setTime(FIXED_TIME);

      const exactNow = new Date(FIXED_TIME).toISOString();
      assert.equal(checkTokenExpiry(exactNow), false);
    });
  });
});
