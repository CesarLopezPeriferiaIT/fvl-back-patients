import { afterEach, describe, expect, it, vi } from 'vitest';

import { calculateAge, getToday } from '../src/shared/date.js';

describe('date', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts the years once the birthday has passed', () => {
    expect(calculateAge('1990-05-20', '2026-05-20')).toBe(36);
    expect(calculateAge('1990-05-20', '2026-11-13')).toBe(36);
  });

  it('does not count the year before the birthday', () => {
    expect(calculateAge('1990-05-20', '2026-05-19')).toBe(35);
    expect(calculateAge('1990-12-31', '2026-01-01')).toBe(35);
  });

  it('returns 0 for a newborn', () => {
    expect(calculateAge('2026-11-13', '2026-11-13')).toBe(0);
  });

  it('treats a leap-day birthday as completed on March 1 in a non leap year', () => {
    expect(calculateAge('2000-02-29', '2026-02-28')).toBe(25);
    expect(calculateAge('2000-02-29', '2026-03-01')).toBe(26);
    expect(calculateAge('2000-02-29', '2028-02-29')).toBe(28);
  });

  it('reads the date in Colombia time, not UTC', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-14T03:00:00Z'));
    expect(getToday()).toBe('2026-11-13');
  });
});
