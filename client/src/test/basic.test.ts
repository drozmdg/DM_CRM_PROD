import { describe, it, expect } from 'vitest';

describe('Basic Test Framework', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should validate framework setup', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
});