import { sql } from '@/lib/db';
import {
  detectSuspiciousIssueDescription,
  logReceptionistHardening,
  looksLikePhone,
  looksLikeServiceAddress,
  parseBookingRulesExtended,
} from '@/lib/receptionist/hardening/heuristics';
import { parseReceptionistMeta } from '@/lib/receptionist/hardening/merge-meta';
import type { InternalBookingOutcome, ReceptionistCallMeta } from '@/lib/receptionist/hardening/types';
import {
  createCustomerAndLeadFromExtracted,
  createJobForBooking,
  getCompanyIdForReceptionist,
  suggestScheduleForBooking,
} from '@/lib/receptionist/integrations';
import {
  finalizeReceptionistCall,
  findActiveBookingOnCall,
  findRecentDuplicateBooking,
  getReceptionistCallDetail,
  linkJobToCall,
  linkLeadToCall,
  listMockScenariosFromDb,
  listReceptionistCalls,
  logReceptionistEvent,
  mergeReceptionistMetaPartial,
  reprocessReceptionistCall,
  startMockCall,
  advanceMockCall,
  endMockCall,
  ensureReceptionistSettings,
  updateReceptionistSettings,
  getDashboardStats,
  updateCallDisposition,
} from '@/lib/receptionist/repository';
import type { ExtractedCallData, ReceptionistDisposition } from '@/lib/receptionist/types';

function parseExtracted(call: Record<string, unknown>): ExtractedCallData | null {
  const raw = call.extracted_json as string | null | undefined;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ExtractedCallData;
  } catch {
    return null;
  }
}

/** When extracted_json is empty but the call row has PSTN / transcript context (common for live Retell mid-call). */
function buildExtractedFallbackFromCallRow(call: Record<string, unknown>): ExtractedCallData {
  return {
    callerName: (call.caller_name as string) || null,
    phone: (call.from_phone as string) || null,
    address: null,
    issueType: 'Phone inquiry',
    issueDescription: (call.transcript_text as string) || (call.ai_summary as string) || null,
    urgency: 'medium',
    preferredCallbackWindow: null,
    preferredVisitWindow: null,
    emergencyDetected: false,
    existingCustomerPossible: false,
    spamLikely: false,
    summary: (call.ai_summary as string) || '',
    nextStep: '',
  };
}

export const receptionistService = {
  getSettings: ensureReceptionistSettings,
  updateSettings: updateReceptionistSettings,
  startMockCall,
  advanceMockCall,
  endMockCall,
  finalizeCall: finalizeReceptionistCall,
  reprocessCall: reprocessReceptionistCall,
  listCalls: listReceptionistCalls,
  getCallDetail: getReceptionistCallDetail,
  dashboardStats: getDashboardStats,
  listScenarios: listMockScenariosFromDb,

  async createLeadFromCall(callId: string) {
    const detail = await getReceptionistCallDetail(callId);
    if (!detail) throw new Error('Call not found');
    const call = detail.call as Record<string, unknown>;
    if (call.lead_id) {
      return { leadId: call.lead_id as string, alreadyLinked: true };
    }
    let extracted = parseExtracted(call);
    if (!extracted && call.status !== 'completed') {
      await finalizeReceptionistCall(callId);
      const again = await getReceptionistCallDetail(callId);
      extracted = parseExtracted(again!.call as Record<string, unknown>);
    }
    if (!extracted) {
      extracted = {
        callerName: (call.caller_name as string) || null,
        phone: (call.from_phone as string) || null,
        address: null,
        issueType: 'Phone inquiry',
        issueDescription: (call.transcript_text as string) || null,
        urgency: 'medium',
        preferredCallbackWindow: null,
        preferredVisitWindow: null,
        emergencyDetected: false,
        existingCustomerPossible: false,
        spamLikely: false,
        summary: (call.ai_summary as string) || '',
        nextStep: '',
      };
    }

    const companyId = await getCompanyIdForReceptionist();
    const { lead } = await createCustomerAndLeadFromExtracted(companyId, extracted, 'ai_receptionist');
    const leadId = lead.id as string;
    await linkLeadToCall(callId, leadId);

    await sql`
      UPDATE receptionist_calls
      SET disposition = ${'lead_created' satisfies ReceptionistDisposition}, updated_at = datetime('now')
      WHERE id = ${callId}
    `;

    const callRow = (await sql`SELECT call_log_id FROM receptionist_calls WHERE id = ${callId}`)[0] as Record<
      string,
      unknown
    >;
    if (callRow.call_log_id) {
      await sql`
        UPDATE call_logs SET lead_id = ${leadId}, updated_at = datetime('now')
        WHERE id = ${callRow.call_log_id}
      `;
    }

    return { leadId, alreadyLinked: false };
  },

  async bookCallbackFromCall(
    callId: string,
    opts?: { skipIssueClarificationGuard?: boolean },
  ) {
    const settings = await ensureReceptionistSettings();
    if (!settings.callback_booking_enabled) {
      throw new Error('Callback booking is disabled in receptionist settings');
    }
    const detail = await getReceptionistCallDetail(callId);
    if (!detail) throw new Error('Call not found');
    const call = detail.call as Record<string, unknown>;
    let extracted = parseExtracted(call);
    if (!extracted) {
      extracted = buildExtractedFallbackFromCallRow(call);
    }

    const rules = parseBookingRulesExtended(settings.booking_rules_json);
    const existing = await findActiveBookingOnCall(callId, 'callback');
    if (existing) {
      await mergeReceptionistMetaPartial(callId, {
        internalOutcome: 'booking_duplicate_merged',
        duplicateNotes: [`same_call_booking:${existing.id}`],
      });
      logReceptionistHardening('duplicate_booking_same_call', {
        callId,
        bookingId: existing.id,
      });
      if (!existing.job_id) throw new Error('Existing callback booking is missing a linked job');
      return { bookingId: existing.id, jobId: existing.job_id, duplicate: true as const };
    }

    const phone = extracted.phone || (call.from_phone as string) || '';
    if (!looksLikePhone(phone)) {
      logReceptionistHardening('booking_validation_failed', { callId, field: 'phone' });
      throw new Error('Callback booking requires a valid 10-digit phone number');
    }

    const issueText = extracted.issueDescription || extracted.issueType || '';
    const sus = detectSuspiciousIssueDescription(issueText);
    const meta = parseReceptionistMeta(call.receptionist_meta_json as string | undefined);
    if (sus.suspicious && !meta.confirmations?.issue_clarified && !opts?.skipIssueClarificationGuard) {
      logReceptionistHardening('booking_blocked_suspicious_issue', { callId, reasons: sus.reasons });
      throw new Error(
        'Issue description looks unclear or mis-transcribed; confirm the problem with the caller before booking.',
      );
    }

    const dupes = await findRecentDuplicateBooking({
      excludeCallId: callId,
      phone,
      bookingType: 'callback',
      windowMinutes: rules.duplicateWindowMinutes ?? 120,
    });
    if (dupes.length > 0) {
      await mergeReceptionistMetaPartial(callId, {
        duplicateNotes: dupes.map((d) => `recent_similar_call:${d.call_id}`),
      });
      logReceptionistHardening('duplicate_booking_cross_call_hint', {
        callId,
        matches: dupes.length,
      });
    }

    const companyId = await getCompanyIdForReceptionist();
    const { scheduledDate, scheduledTime } = suggestScheduleForBooking(
      'callback',
      extracted,
      rules.timezone || 'America/Toronto',
    );

    const bookingRows = await sql`
      INSERT INTO receptionist_bookings (
        call_id, booking_type, status,
        requested_window_start, requested_window_end,
        scheduled_start, scheduled_end,
        notes
      )
      VALUES (
        ${callId},
        'callback',
        'requested',
        ${scheduledDate},
        ${null},
        ${scheduledDate + 'T' + scheduledTime + ':00.000Z'},
        ${null},
        ${extracted.preferredCallbackWindow || 'Callback per AI receptionist'}
      )
      RETURNING id
    `;

    const job = await createJobForBooking({
      companyId,
      leadId: (call.lead_id as string) || null,
      customerId: null,
      type: 'Callback',
      description: `AI receptionist callback: ${extracted.issueDescription || extracted.summary || ''}`,
      scheduledDate,
      scheduledTime,
      notes: extracted.preferredCallbackWindow || null,
    });

    await sql`
      UPDATE receptionist_bookings SET job_id = ${job.id as string}, status = 'scheduled', updated_at = datetime('now')
      WHERE id = ${bookingRows[0].id as string}
    `;

    await linkJobToCall(callId, job.id as string);

    await sql`
      UPDATE receptionist_calls
      SET disposition = ${'callback_booked' satisfies ReceptionistDisposition},
          job_id = ${job.id as string},
          updated_at = datetime('now')
      WHERE id = ${callId}
    `;

    await mergeReceptionistMetaPartial(callId, { internalOutcome: 'booking_confirmed' });

    const callRow = (await sql`SELECT call_log_id FROM receptionist_calls WHERE id = ${callId}`)[0] as Record<
      string,
      unknown
    >;
    if (callRow.call_log_id) {
      await sql`
        UPDATE call_logs SET job_id = ${job.id as string}, outcome = 'booked', updated_at = datetime('now')
        WHERE id = ${callRow.call_log_id}
      `;
    }

    return { bookingId: bookingRows[0].id as string, jobId: job.id as string, duplicate: false as const };
  },

  async bookQuoteVisitFromCall(
    callId: string,
    opts?: { skipAddressGuard?: boolean },
  ) {
    const settings = await ensureReceptionistSettings();
    if (!settings.quote_visit_booking_enabled) {
      throw new Error('Quote visit booking is disabled in receptionist settings');
    }
    const detail = await getReceptionistCallDetail(callId);
    if (!detail) throw new Error('Call not found');
    const call = detail.call as Record<string, unknown>;
    let extracted = parseExtracted(call);
    if (!extracted) {
      extracted = buildExtractedFallbackFromCallRow(call);
    }

    const rules = parseBookingRulesExtended(settings.booking_rules_json);
    const existing = await findActiveBookingOnCall(callId, 'quote_visit');
    if (existing) {
      await mergeReceptionistMetaPartial(callId, {
        internalOutcome: 'booking_duplicate_merged',
        duplicateNotes: [`same_call_booking:${existing.id}`],
      });
      logReceptionistHardening('duplicate_booking_same_call', {
        callId,
        bookingId: existing.id,
        bookingType: 'quote_visit',
      });
      if (!existing.job_id) throw new Error('Existing quote booking is missing a linked job');
      return { bookingId: existing.id, jobId: existing.job_id, duplicate: true as const };
    }

    if (!looksLikeServiceAddress(extracted.address) && !opts?.skipAddressGuard) {
      logReceptionistHardening('booking_validation_failed', { callId, field: 'address' });
      throw new Error('Quote visit requires a service address with street detail');
    }

    const companyId = await getCompanyIdForReceptionist();
    const { scheduledDate, scheduledTime } = suggestScheduleForBooking(
      'quote_visit',
      extracted,
      rules.timezone || 'America/Toronto',
    );

    const bookingRows = await sql`
      INSERT INTO receptionist_bookings (
        call_id, booking_type, status,
        requested_window_start, requested_window_end,
        scheduled_start, scheduled_end,
        notes
      )
      VALUES (
        ${callId},
        'quote_visit',
        'requested',
        ${scheduledDate},
        ${null},
        ${scheduledDate + 'T' + scheduledTime + ':00.000Z'},
        ${null},
        ${extracted.preferredVisitWindow || 'On-site estimate'}
      )
      RETURNING id
    `;

    const job = await createJobForBooking({
      companyId,
      leadId: (call.lead_id as string) || null,
      customerId: null,
      type: 'Estimate visit',
      description: `Quote / estimate visit: ${extracted.issueDescription || extracted.summary || ''}`,
      scheduledDate,
      scheduledTime,
      notes: extracted.preferredVisitWindow || null,
    });

    await sql`
      UPDATE receptionist_bookings SET job_id = ${job.id as string}, status = 'scheduled', updated_at = datetime('now')
      WHERE id = ${bookingRows[0].id as string}
    `;

    await linkJobToCall(callId, job.id as string);

    await sql`
      UPDATE receptionist_calls
      SET disposition = ${'quote_visit_booked' satisfies ReceptionistDisposition},
          job_id = ${job.id as string},
          updated_at = datetime('now')
      WHERE id = ${callId}
    `;

    await mergeReceptionistMetaPartial(callId, { internalOutcome: 'booking_confirmed' });

    const row = (await sql`SELECT call_log_id FROM receptionist_calls WHERE id = ${callId}`)[0] as Record<
      string,
      unknown
    >;
    if (row.call_log_id) {
      await sql`
        UPDATE call_logs SET job_id = ${job.id as string}, outcome = 'booked', updated_at = datetime('now')
        WHERE id = ${row.call_log_id}
      `;
    }

    return { bookingId: bookingRows[0].id as string, jobId: job.id as string, duplicate: false as const };
  },

  async markEmergency(callId: string) {
    await sql`
      UPDATE receptionist_calls
      SET disposition = 'emergency', urgency = 'emergency', updated_at = datetime('now')
      WHERE id = ${callId}
    `;
    await sql`
      INSERT INTO receptionist_events (call_id, event_type, payload_json)
      VALUES (${callId}, 'emergency_flagged', ${JSON.stringify({})})
    `;
    const detail = await getReceptionistCallDetail(callId);
    const meta = detail
      ? parseReceptionistMeta((detail.call as Record<string, unknown>).receptionist_meta_json as string | undefined)
      : {};
    const wasPreviouslySpam = meta.callerBehavior === 'spam_or_prank';
    await mergeReceptionistMetaPartial(callId, {
      internalOutcome: 'emergency_flagged_pending_human',
      emergencyTier: 'emergency',
      callerBehavior: 'emergency_legitimate',
      behaviorRationale: wasPreviouslySpam
        ? 'Emergency flagged after prior spam classification — emergency takes priority'
        : 'Emergency flagged',
      operationalPriority: 'emergency_callback_required',
      toolFallbacks: [{ tool: 'flag_emergency', action: 'recorded', reason: 'manual_or_tool_flag' }],
    });
    logReceptionistHardening('emergency_flagged', { callId, previousBehavior: meta.callerBehavior });
  },

  async recordToolFailureFallback(
    callId: string,
    tool: string,
    message: string,
    internalOutcome: InternalBookingOutcome,
  ) {
    await mergeReceptionistMetaPartial(callId, {
      internalOutcome,
      lastToolError: { tool, message, at: new Date().toISOString() },
      toolFallbacks: [{ tool, action: 'fallback_follow_up', reason: message.slice(0, 120) }],
    });
    await sql`
      UPDATE receptionist_calls SET disposition = ${'follow_up_needed' satisfies ReceptionistDisposition}, updated_at = datetime('now')
      WHERE id = ${callId}
    `;
    await logReceptionistEvent(callId, 'tool_failure_fallback', { tool, internalOutcome }, 'system');
    logReceptionistHardening('tool_failure_fallback', { callId, tool, internalOutcome });
  },

  async markSpam(callId: string) {
    const detail = await getReceptionistCallDetail(callId);
    if (detail) {
      const call = detail.call as Record<string, unknown>;
      const meta = parseReceptionistMeta(call.receptionist_meta_json as string | undefined);
      const isEmergency =
        call.disposition === 'emergency' ||
        meta.emergencyTier === 'emergency' ||
        meta.callerBehavior === 'emergency_legitimate';
      if (isEmergency) {
        logReceptionistHardening('mark_spam_blocked_emergency', { callId });
        await mergeReceptionistMetaPartial(callId, {
          callerBehavior: 'abusive_but_legitimate',
          behaviorRationale: 'mark_spam called but emergency was already detected — reclassified as abusive_but_legitimate',
          spamRationale: [...(meta.spamRationale || []), 'mark_spam_attempted_post_emergency'],
        });
        return;
      }
      const hasPlumbing = meta.callerBehavior === 'legitimate_plumbing' || meta.callerBehavior === 'abusive_but_legitimate';
      if (hasPlumbing) {
        logReceptionistHardening('mark_spam_softened_to_abusive', { callId });
        await mergeReceptionistMetaPartial(callId, {
          callerBehavior: 'abusive_but_legitimate',
          behaviorRationale: 'mark_spam called but legitimate plumbing content detected — reclassified as abusive_but_legitimate',
        });
        return;
      }
    }
    await updateCallDisposition(callId, 'spam');
    await mergeReceptionistMetaPartial(callId, {
      callerBehavior: 'spam_or_prank',
      behaviorRationale: 'Marked as spam via tool or UI',
    });
  },

  async setDisposition(callId: string, disposition: ReceptionistDisposition) {
    await updateCallDisposition(callId, disposition);
  },
};
