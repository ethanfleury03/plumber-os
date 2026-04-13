import { sql } from '@/lib/db';
import type { ExtractedCallData, ReceptionistDisposition } from '@/lib/receptionist/types';
import {
  createCustomerAndLeadFromExtracted,
  createJobForBooking,
  getCompanyIdForReceptionist,
  suggestScheduleForBooking,
} from '@/lib/receptionist/integrations';
import {
  finalizeReceptionistCall,
  getReceptionistCallDetail,
  linkJobToCall,
  linkLeadToCall,
  listMockScenariosFromDb,
  listReceptionistCalls,
  reprocessReceptionistCall,
  startMockCall,
  advanceMockCall,
  endMockCall,
  ensureReceptionistSettings,
  updateReceptionistSettings,
  getDashboardStats,
  updateCallDisposition,
} from '@/lib/receptionist/repository';

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

  async bookCallbackFromCall(callId: string) {
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

    const companyId = await getCompanyIdForReceptionist();
    const { scheduledDate, scheduledTime } = suggestScheduleForBooking('callback', extracted);

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

    return { bookingId: bookingRows[0].id as string, jobId: job.id as string };
  },

  async bookQuoteVisitFromCall(callId: string) {
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

    const companyId = await getCompanyIdForReceptionist();
    const { scheduledDate, scheduledTime } = suggestScheduleForBooking('quote_visit', extracted);

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

    return { bookingId: bookingRows[0].id as string, jobId: job.id as string };
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
  },

  async markSpam(callId: string) {
    await updateCallDisposition(callId, 'spam');
  },

  async setDisposition(callId: string, disposition: ReceptionistDisposition) {
    await updateCallDisposition(callId, disposition);
  },
};
