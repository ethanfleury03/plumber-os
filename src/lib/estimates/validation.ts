import { z } from 'zod';

export const estimateStatusSchema = z.enum([
  'draft',
  'sent',
  'viewed',
  'approved',
  'rejected',
  'expired',
  'converted',
  'archived',
]);

export const createEstimateBodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  job_id: z.string().uuid().optional().nullable(),
  receptionist_call_id: z.string().uuid().optional().nullable(),
  source_type: z.string().max(80).optional().nullable(),
  source_id: z.string().max(120).optional().nullable(),
  assigned_to_plumber_id: z.string().uuid().optional().nullable(),
  notes_internal: z.string().max(20000).optional().nullable(),
  notes_customer: z.string().max(20000).optional().nullable(),
  discount_amount_cents: z.number().int().min(0).optional(),
  option_presentation_mode: z.enum(['single', 'tiered']).optional(),
  tax_rate_basis_points: z.number().int().min(0).max(3000).optional().nullable(),
});

export const patchEstimateBodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  status: estimateStatusSchema.optional(),
  notes_internal: z.string().max(20000).optional().nullable(),
  notes_customer: z.string().max(20000).optional().nullable(),
  discount_amount_cents: z.number().int().min(0).optional(),
  expiration_date: z.string().max(40).optional().nullable(),
  assigned_to_plumber_id: z.string().uuid().optional().nullable(),
  /** Link or unlink a CRM customer; snapshots refresh from the customer row when set to a UUID. */
  customer_id: z.string().uuid().optional().nullable(),
  option_presentation_mode: z.enum(['single', 'tiered']).optional(),
  tax_rate_basis_points: z.number().int().min(0).max(3000).optional().nullable(),
  deposit_amount_cents: z.number().int().min(0).optional().nullable(),
});

export const lineItemBodySchema = z.object({
  category: z.string().max(120).optional().nullable(),
  name: z.string().min(1).max(500),
  description: z.string().max(2000).optional().nullable(),
  quantity: z.number().positive().max(1_000_000),
  unit: z.string().max(40).default('ea'),
  unit_price_cents: z.number().int().min(0).max(100_000_000),
  is_optional: z.boolean().optional(),
  is_taxable: z.boolean().optional(),
  option_group: z.string().max(40).optional().nullable(),
  included_in_package: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export const patchLineItemBodySchema = lineItemBodySchema.partial();

export const sendEstimateBodySchema = z.object({
  recipient_email: z.string().email().optional(),
  delivery_type: z.enum(['email', 'sms_share_link', 'manual_copy_link']).optional(),
});

export const publicApproveBodySchema = z.object({
  customer_selected_option_group: z.string().max(40).optional().nullable(),
  confirmation_acknowledged: z.boolean().optional(),
  signature_text: z.string().max(500).optional().nullable(),
});

export const publicRejectBodySchema = z.object({
  reason: z.string().max(2000).optional().nullable(),
});

export const reorderLineItemsSchema = z.object({
  ordered_ids: z.array(z.string().uuid()).min(1),
});

export const estimateSettingsPatchSchema = z.object({
  company_name: z.string().min(1).max(200).optional(),
  logo_url: z.union([z.string().url().max(2000), z.literal('')]).optional().nullable(),
  accent_color: z.string().max(20).optional().nullable(),
  estimate_footer_text: z.string().max(10000).optional().nullable(),
  default_terms_text: z.string().max(20000).optional().nullable(),
  default_expiration_days: z.number().int().min(1).max(365).optional(),
  default_tax_rate_basis_points: z.number().int().min(0).max(3000).optional().nullable(),
  estimate_prefix: z.string().min(1).max(20).optional(),
  default_deposit_enabled: z.boolean().optional(),
  default_deposit_percent_basis_points: z.number().int().min(0).max(10000).optional().nullable(),
  customer_signature_required: z.boolean().optional(),
  allow_customer_reject: z.boolean().optional(),
  public_approval_requires_token: z.boolean().optional(),
});
