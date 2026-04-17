import { describe, expect, it } from 'vitest';
import { calculateEstimateTotals, computeLineTotalCents, type LineForTotals } from '@/lib/estimates/totals';

describe('computeLineTotalCents', () => {
  it('rounds quantity * unit cents', () => {
    expect(computeLineTotalCents(2, 1500)).toBe(3000);
    expect(computeLineTotalCents(1.5, 1000)).toBe(1500);
  });
});

describe('calculateEstimateTotals', () => {
  const baseLine = (over: Partial<LineForTotals>): LineForTotals => ({
    quantity: 1,
    unit_price_cents: 10000,
    is_optional: false,
    is_taxable: true,
    included_in_package: true,
    option_group: null,
    ...over,
  });

  it('computes subtotal, discount, tax, total', () => {
    const lines: LineForTotals[] = [baseLine({}), baseLine({ quantity: 2, unit_price_cents: 5000 })];
    const t = calculateEstimateTotals(lines, 1000, 1000); // 10% tax
    expect(t.subtotal_amount_cents).toBe(20000);
    expect(t.tax_amount_cents).toBe(1900); // 10% of (20000-1000)
    expect(t.total_amount_cents).toBe(20900);
  });

  it('excludes optional lines not in package from subtotal', () => {
    const lines: LineForTotals[] = [
      baseLine({}),
      baseLine({ is_optional: true, included_in_package: false }),
    ];
    const t = calculateEstimateTotals(lines, 0, 0);
    expect(t.subtotal_amount_cents).toBe(10000);
  });

  it('accumulates tier subtotals by option_group', () => {
    const lines: LineForTotals[] = [
      baseLine({ option_group: 'Basic', unit_price_cents: 5000 }),
      baseLine({ option_group: 'Basic', unit_price_cents: 3000 }),
      baseLine({ option_group: 'Premium', unit_price_cents: 12000 }),
    ];
    const t = calculateEstimateTotals(lines, 0, 0);
    expect(t.tier_subtotals_cents.Basic).toBe(8000);
    expect(t.tier_subtotals_cents.Premium).toBe(12000);
  });
});
