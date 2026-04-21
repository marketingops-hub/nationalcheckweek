import { describe, it, expect } from 'vitest';
import { estimateCost, sumCosts, formatUsd } from '../pricing';

describe('estimateCost', () => {
  it('returns null when model is missing', () => {
    expect(estimateCost(undefined, { prompt: 100, completion: 50 })).toBeNull();
  });

  it('returns null when tokens are missing', () => {
    expect(estimateCost('gpt-4o', undefined)).toBeNull();
  });

  it('returns null for an unknown model', () => {
    expect(estimateCost('gpt-7-supermax', { prompt: 1000, completion: 500 })).toBeNull();
  });

  it('computes cost for gpt-4o', () => {
    // gpt-4o: 2.50/1M in, 10/1M out. 1M in + 1M out = 12.50
    expect(estimateCost('gpt-4o', { prompt: 1_000_000, completion: 1_000_000 })).toBeCloseTo(12.5, 4);
  });

  it('computes cost for claude-3-5-sonnet', () => {
    // 3/1M in, 15/1M out. 10k prompt + 10k completion = 0.03 + 0.15 = 0.18
    expect(estimateCost('claude-3-5-sonnet-20241022', { prompt: 10_000, completion: 10_000 }))
      .toBeCloseTo(0.18, 4);
  });

  it('is case-insensitive on the model id', () => {
    const a = estimateCost('GPT-4o-MINI', { prompt: 100_000, completion: 100_000 });
    const b = estimateCost('gpt-4o-mini', { prompt: 100_000, completion: 100_000 });
    expect(a).toEqual(b);
  });

  it('handles missing completion as zero', () => {
    // gpt-4o-mini: 0.15/1M in. 1M prompt = 0.15
    expect(estimateCost('gpt-4o-mini', { prompt: 1_000_000 })).toBeCloseTo(0.15, 4);
  });
});

describe('sumCosts', () => {
  it('returns { total: 0, partial: false } for empty input', () => {
    expect(sumCosts([])).toEqual({ total: 0, partial: false });
  });

  it('sums across legs', () => {
    const res = sumCosts([
      { model: 'gpt-4o-mini',              tokens: { prompt: 1_000_000, completion: 0 } }, // 0.15
      { model: 'claude-3-5-sonnet-latest', tokens: { prompt: 0, completion: 1_000_000 } }, // 15
    ]);
    expect(res.total).toBeCloseTo(15.15, 4);
    expect(res.partial).toBe(false);
  });

  it('marks partial when one leg is unknown', () => {
    const res = sumCosts([
      { model: 'gpt-4o-mini',    tokens: { prompt: 1_000_000, completion: 0 } },
      { model: 'mystery-model',  tokens: { prompt: 500, completion: 500 } },
    ]);
    expect(res.total).toBeCloseTo(0.15, 4);
    expect(res.partial).toBe(true);
  });
});

describe('formatUsd', () => {
  it('uses 4dp under $0.01', () => {
    expect(formatUsd(0.0042)).toBe('$0.0042');
  });
  it('uses 3dp under $1', () => {
    expect(formatUsd(0.125)).toBe('$0.125');
  });
  it('uses 2dp at / over $1', () => {
    expect(formatUsd(12.5)).toBe('$12.50');
  });
});
