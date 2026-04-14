/**
 * Starter line-item presets for the estimate editor.
 * Replace with a full price book / catalog when the product grows.
 */
export const ESTIMATE_LINE_ITEM_PRESETS: {
  name: string;
  category: string;
  unit: string;
  unit_price_cents: number;
  option_group?: string;
}[] = [
  { name: 'Service call / trip fee', category: 'Labor', unit: 'ea', unit_price_cents: 89_00 },
  { name: 'Diagnostic / camera inspection', category: 'Labor', unit: 'ea', unit_price_cents: 129_00 },
  { name: 'Faucet repair / replacement (typical)', category: 'Labor & parts', unit: 'ea', unit_price_cents: 249_00 },
  { name: 'Drain clearing (main line)', category: 'Labor', unit: 'ea', unit_price_cents: 325_00 },
  { name: 'Toilet repair (fill valve / flapper)', category: 'Labor & parts', unit: 'ea', unit_price_cents: 195_00 },
  { name: 'Water heater repair (standard tank)', category: 'Labor & parts', unit: 'ea', unit_price_cents: 450_00 },
  { name: 'After-hours / emergency surcharge', category: 'Fees', unit: 'ea', unit_price_cents: 150_00 },
  { name: 'Basic repair package', category: 'Good-Better-Best', unit: 'ea', unit_price_cents: 450_00, option_group: 'Basic' },
  { name: 'Recommended repair package', category: 'Good-Better-Best', unit: 'ea', unit_price_cents: 750_00, option_group: 'Recommended' },
  { name: 'Full replacement package', category: 'Good-Better-Best', unit: 'ea', unit_price_cents: 2200_00, option_group: 'Full replacement' },
];
