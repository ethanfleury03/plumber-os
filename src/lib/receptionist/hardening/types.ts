import type { ReceptionistDisposition } from '@/lib/receptionist/types';

export type EmergencyTier = 'emergency' | 'urgent' | 'standard' | 'spam';

export type CallerBehavior =
  | 'neutral'
  | 'off_topic_warning'
  | 'abusive_but_legitimate'
  | 'spam_or_prank'
  | 'legitimate_plumbing'
  | 'emergency_legitimate';

export type OperationalPriority =
  | 'emergency_callback_required'
  | 'emergency_dispatch_review'
  | 'emergency_incomplete_but_urgent'
  | 'urgent_follow_up'
  | 'standard'
  | 'low'
  | 'spam_no_action';

export type FieldConfidence = 'confirmed' | 'inferred' | 'weak' | 'missing';
export type FieldProvenance =
  | 'explicit_tool_arg'
  | 'caller_ani'
  | 'transcript_inference'
  | 'summary_inference'
  | 'booking_record'
  | 'unknown';

export interface FieldConfidenceEntry {
  confidence: FieldConfidence;
  provenance: FieldProvenance;
}

export type InternalBookingOutcome =
  | 'booking_confirmed'
  | 'booking_duplicate_merged'
  | 'booking_failed_follow_up_needed'
  | 'booking_failed_fallback_lead_created'
  | 'booking_validation_failed'
  | 'emergency_flagged_pending_human'
  | 'none';

export interface ReceptionistCallMeta {
  version?: number;
  completeness?: CallCompletenessResult;
  emergencyTier?: EmergencyTier;
  emergencyRationale?: string[];
  callerBehavior?: CallerBehavior;
  behaviorRationale?: string;
  operationalPriority?: OperationalPriority;
  fieldConfidence?: Partial<Record<string, FieldConfidenceEntry>>;
  internalOutcome?: InternalBookingOutcome;
  toolFallbacks?: Array<{ tool: string; action: string; reason?: string }>;
  duplicateNotes?: string[];
  issueRaw?: string | null;
  issueNormalized?: string | null;
  issueSuspicious?: boolean;
  issueNormalizationSource?: 'vocabulary_match' | 'none';
  timingHints?: NormalizedTimingHint[];
  afterHours?: { active: boolean; mode?: string | null; note?: string };
  confirmations?: {
    callback_phone_readback?: boolean;
    callback_window_readback?: boolean;
    visit_address_readback?: boolean;
    visit_window_readback?: boolean;
    issue_clarified?: boolean;
  };
  incompleteReasons?: string[];
  abandonedSignals?: string[];
  spamRationale?: string[];
  lastToolError?: { tool?: string; message?: string; at?: string };
}

export interface CallCompletenessItem {
  key: string;
  ok: boolean;
  detail?: string;
}

export interface CallCompletenessResult {
  items: CallCompletenessItem[];
  sufficient: boolean;
  missingLabels: string[];
  suggestedDisposition?: ReceptionistDisposition;
  downgradeReason?: string;
}

export type TimingKind =
  | 'concrete_window'
  | 'vague_bucket'
  | 'asap_urgent'
  | 'open_ended'
  | 'unparsed';

export interface NormalizedTimingHint {
  sourceField: 'preferredCallbackWindow' | 'preferredVisitWindow' | 'transcript';
  rawPhrase: string;
  kind: TimingKind;
  summary: string;
  localWindowLabel?: string;
  requiresClarification: boolean;
}

export interface BookingRulesExtended {
  minNoticeHours?: number;
  duplicateWindowMinutes?: number;
  spamKeywords?: string[];
  timezone?: string;
  emergencyEscalation?: 'flag_only' | 'flag_and_callback';
  silenceTranscriptMaxChars?: number;
}
