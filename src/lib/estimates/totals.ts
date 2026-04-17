/**
 * Server-side estimate totals (integer cents). Do not trust client money values.
 */
export interface LineForTotals {
  quantity: number;
  unit_price_cents: number;
  is_optional: boolean;
  is_taxable: boolean;
  included_in_package: boolean;
  option_group: string | null;
}

export interface TotalsResult {
  subtotal_amount_cents: number;
  taxable_subtotal_cents: number;
  tax_amount_cents: number;
  total_amount_cents: number;
  /** Subtotals per option_group when tiered (good/better/best) */
  tier_subtotals_cents: Record<string, number>;
}

function lineCountsTowardSubtotal(line: LineForTotals): boolean {
  if (!line.is_optional) return true;
  return Boolean(line.included_in_package);
}

export function computeLineTotalCents(quantity: number, unitPriceCents: number): number {
  const q = Number(quantity);
  if (!Number.isFinite(q) || q < 0) return 0;
  return Math.round(q * unitPriceCents);
}

/**
 * @param discount_amount_cents — applied before tax (from subtotal)
 * @param tax_rate_basis_points — e.g. 825 = 8.25%; applied to taxable portion of (subtotal - discount)
 */
export function calculateEstimateTotals(
  lines: LineForTotals[],
  discount_amount_cents: number,
  tax_rate_basis_points: number | null | undefined,
): TotalsResult {
  const tier_subtotals_cents: Record<string, number> = {};
  let subtotal = 0;
  let taxableSubtotal = 0;

  for (const line of lines) {
    const lineTotal = computeLineTotalCents(line.quantity, line.unit_price_cents);
    if (!lineCountsTowardSubtotal(line)) continue;
    subtotal += lineTotal;
    if (line.is_taxable) taxableSubtotal += lineTotal;
    const g = line.option_group?.trim() || '_default';
    tier_subtotals_cents[g] = (tier_subtotals_cents[g] || 0) + lineTotal;
  }

  const discount = Math.max(0, Math.min(discount_amount_cents, subtotal));
  const afterDiscount = subtotal - discount;
  const taxableRatio = subtotal > 0 ? taxableSubtotal / subtotal : 0;
  const taxableAfterDiscount = Math.round(afterDiscount * taxableRatio);
  const bps = tax_rate_basis_points ?? 0;
  const tax = Math.round((taxableAfterDiscount * bps) / 10000);
  const total = afterDiscount + tax;

  return {
    subtotal_amount_cents: subtotal,
    taxable_subtotal_cents: taxableSubtotal,
    tax_amount_cents: tax,
    total_amount_cents: total,
    tier_subtotals_cents,
  };
}

export function computeDepositCents(
  total_cents: number,
  enabled: boolean,
  percentBps: number | null | undefined,
  fixedCents: number | null | undefined,
): number | null {
  if (!enabled) return null;
  if (fixedCents != null && fixedCents > 0) return Math.min(fixedCents, total_cents);
  if (percentBps != null && percentBps > 0) {
    return Math.min(total_cents, Math.round((total_cents * percentBps) / 10000));
  }
  return null;
}
