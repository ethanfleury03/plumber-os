import { sql } from '@/lib/db';
import { MOCK_SCENARIOS, getScenarioById } from '@/lib/receptionist/scenarios';
import {
  decideDisposition,
  dispositionToRecommendedStep,
  extractCallFieldsFromTranscript,
  parseEmergencyKeywordsJson,
} from '@/lib/receptionist/extract';
import {
  createCallLogForReceptionistCall,
  getCompanyIdForReceptionist,
  linkReceptionistCallToCallLog,
} from '@/lib/receptionist/integrations';
import type { ReceptionistDisposition, ReceptionistSettingsRow } from '@/lib/receptionist/types';

export async function syncMockScenariosToDb() {
  for (let i = 0; i < MOCK_SCENARIOS.length; i++) {
    const s = MOCK_SCENARIOS[i];
    await sql`
      INSERT INTO receptionist_mock_scenarios (id, name, description, transcript_script_json, expected_outcome, is_default)
      VALUES (
        ${s.id},
        ${s.name},
        ${s.description},
        ${JSON.stringify(s.turns)},
        ${s.expectedOutcome},
        ${i === 0 ? 1 : 0}
      )
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        transcript_script_json = excluded.transcript_script_json,
        expected_outcome = excluded.expected_outcome
    `;
  }
}

export async function ensureReceptionistSettings(): Promise<ReceptionistSettingsRow> {
  const rows = (await sql`
    SELECT * FROM receptionist_settings ORDER BY created_at ASC LIMIT 1
  `) as unknown as ReceptionistSettingsRow[];

  if (rows.length > 0) {
    const r = rows[0] as unknown as ReceptionistSettingsRow;
    return { ...r, retell_agent_id: r.retell_agent_id ?? null };
  }

  const company = await sql`SELECT name FROM companies ORDER BY created_at ASC LIMIT 1`;
  const companyName = (company[0]?.name as string) || 'PlumberOS';

  const inserted = (await sql`
    INSERT INTO receptionist_settings (
      company_name,
      greeting,
      disclosure_enabled,
      recording_enabled,
      business_hours_json,
      after_hours_mode,
      allowed_actions_json,
      emergency_keywords_json,
      booking_rules_json,
      default_call_outcome_rules_json,
      provider_type,
      provider_config_json,
      internal_instructions,
      callback_booking_enabled,
      quote_visit_booking_enabled,
      retell_agent_id
    )
    VALUES (
      ${companyName},
      ${`Thanks for calling ${companyName}. I'm an AI assistant — how can we help?`},
      1,
      0,
      ${JSON.stringify({ monFri: '8:00-17:00', sat: 'closed', sun: 'closed' })},
      'message_and_callback',
      ${JSON.stringify(['callback', 'quote_visit', 'lead', 'emergency'])},
      ${JSON.stringify(['burst pipe', 'flooding', 'sewer backup', 'gas smell'])},
      ${JSON.stringify({ minNoticeHours: 4 })},
      ${JSON.stringify({ defaultDisposition: 'follow_up_needed' })},
      'mock',
      ${JSON.stringify({ note: 'Non-secret provider options only' })},
      ${'Never quote exact prices. Escalate emergencies. Confirm bookings before promising arrival times.'},
      1,
      1,
      NULL
    )
    RETURNING *
  `) as unknown as ReceptionistSettingsRow[];

  const ins = inserted[0] as unknown as ReceptionistSettingsRow;
  return { ...ins, retell_agent_id: ins.retell_agent_id ?? null };
}

export async function updateReceptionistSettings(
  patch: Partial<{
    company_name: string | null;
    greeting: string | null;
    disclosure_enabled: boolean;
    recording_enabled: boolean;
    business_hours_json: string | null;
    after_hours_mode: string | null;
    allowed_actions_json: string | null;
    emergency_keywords_json: string | null;
    booking_rules_json: string | null;
    default_call_outcome_rules_json: string | null;
    provider_type: string;
    provider_config_json: string | null;
    internal_instructions: string | null;
    callback_booking_enabled: boolean;
    quote_visit_booking_enabled: boolean;
    retell_agent_id?: string | null;
  }>,
) {
  const current = await ensureReceptionistSettings();
  const next = {
    company_name: patch.company_name ?? current.company_name,
    greeting: patch.greeting ?? current.greeting,
    disclosure_enabled:
      patch.disclosure_enabled !== undefined
        ? patch.disclosure_enabled
          ? 1
          : 0
        : current.disclosure_enabled,
    recording_enabled:
      patch.recording_enabled !== undefined
        ? patch.recording_enabled
          ? 1
          : 0
        : current.recording_enabled,
    business_hours_json: patch.business_hours_json ?? current.business_hours_json,
    after_hours_mode: patch.after_hours_mode ?? current.after_hours_mode,
    allowed_actions_json: patch.allowed_actions_json ?? current.allowed_actions_json,
    emergency_keywords_json: patch.emergency_keywords_json ?? current.emergency_keywords_json,
    booking_rules_json: patch.booking_rules_json ?? current.booking_rules_json,
    default_call_outcome_rules_json:
      patch.default_call_outcome_rules_json ?? current.default_call_outcome_rules_json,
    provider_type: patch.provider_type ?? current.provider_type,
    provider_config_json: patch.provider_config_json ?? current.provider_config_json,
    internal_instructions: patch.internal_instructions ?? current.internal_instructions,
    callback_booking_enabled:
      patch.callback_booking_enabled !== undefined
        ? patch.callback_booking_enabled
          ? 1
          : 0
        : current.callback_booking_enabled,
    quote_visit_booking_enabled:
      patch.quote_visit_booking_enabled !== undefined
        ? patch.quote_visit_booking_enabled
          ? 1
          : 0
        : current.quote_visit_booking_enabled,
    retell_agent_id:
      patch.retell_agent_id !== undefined ? patch.retell_agent_id : current.retell_agent_id ?? null,
  };

  await sql`
    UPDATE receptionist_settings SET
      company_name = ${next.company_name},
      greeting = ${next.greeting},
      disclosure_enabled = ${next.disclosure_enabled},
      recording_enabled = ${next.recording_enabled},
      business_hours_json = ${next.business_hours_json},
      after_hours_mode = ${next.after_hours_mode},
      allowed_actions_json = ${next.allowed_actions_json},
      emergency_keywords_json = ${next.emergency_keywords_json},
      booking_rules_json = ${next.booking_rules_json},
      default_call_outcome_rules_json = ${next.default_call_outcome_rules_json},
      provider_type = ${next.provider_type},
      provider_config_json = ${next.provider_config_json},
      internal_instructions = ${next.internal_instructions},
      callback_booking_enabled = ${next.callback_booking_enabled},
      quote_visit_booking_enabled = ${next.quote_visit_booking_enabled},
      retell_agent_id = ${next.retell_agent_id},
      updated_at = datetime('now')
    WHERE id = ${current.id}
  `;

  return ensureReceptionistSettings();
}

export type ReceptionistEventSource = 'mock' | 'retell' | 'twilio' | 'system';

export async function logReceptionistEvent(
  callId: string,
  eventType: string,
  payload: unknown,
  source: ReceptionistEventSource = 'system',
) {
  await sql`
    INSERT INTO receptionist_events (call_id, event_type, payload_json, source)
    VALUES (${callId}, ${eventType}, ${JSON.stringify(payload)}, ${source})
  `;
}

async function logEvent(callId: string, eventType: string, payload: unknown) {
  await logReceptionistEvent(callId, eventType, payload, 'mock');
}

export async function startMockCall(scenarioId: string) {
  await syncMockScenariosToDb();
  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    throw new Error('Unknown scenario');
  }

  const settings = await ensureReceptionistSettings();
  const baseline = scenario.extractedBaseline;
  const fromPhone =
    (baseline?.phone as string) || '(555) 000-0001';

  const rows = await sql`
    INSERT INTO receptionist_calls (
      provider,
      provider_call_id,
      direction,
      from_phone,
      to_phone,
      caller_name,
      status,
      mock_scenario_id,
      current_transcript_index,
      urgency
    )
    VALUES (
      'mock',
      ${`mock-${Date.now()}`},
      'inbound',
      ${fromPhone},
      ${'(555) PLUMBER'},
      ${(baseline?.callerName as string) || null},
      'active',
      ${scenarioId},
      0,
      ${baseline?.urgency || 'medium'}
    )
    RETURNING *
  `;

  const call = rows[0];
  await logEvent(call.id as string, 'mock_started', { scenarioId });

  return { call, scenario, settings };
}

export async function advanceMockCall(callId: string) {
  const calls = await sql`SELECT * FROM receptionist_calls WHERE id = ${callId}`;
  if (calls.length === 0) throw new Error('Call not found');
  const call = calls[0] as Record<string, unknown>;
  if (call.status === 'completed') {
    return { done: true, segment: null, call, autoCompleted: false };
  }
  const scenarioId = call.mock_scenario_id as string | null;
  if (!scenarioId) throw new Error('Not a mock call');

  const scenario = getScenarioById(scenarioId);
  if (!scenario) throw new Error('Scenario missing');

  let idx = Number(call.current_transcript_index || 0);
  if (idx >= scenario.turns.length) {
    return { done: true, segment: null, call, autoCompleted: false };
  }

  const turn = scenario.turns[idx];
  const seq = idx;

  await sql`
    INSERT INTO receptionist_transcript_segments (call_id, seq, speaker, text, timestamp_ms)
    VALUES (${callId}, ${seq}, ${turn.speaker}, ${turn.text}, ${Date.now()})
    ON CONFLICT(call_id, seq) DO NOTHING
  `;

  const segments = await sql`
    SELECT speaker, text FROM receptionist_transcript_segments
    WHERE call_id = ${callId}
    ORDER BY seq ASC
  `;
  const transcriptText = segments
    .map((s) => {
      const label =
        s.speaker === 'assistant'
          ? 'Assistant'
          : s.speaker === 'caller'
            ? 'Caller'
            : 'System';
      return `${label}: ${s.text}`;
    })
    .join('\n');

  idx += 1;
  await sql`
    UPDATE receptionist_calls
    SET
      current_transcript_index = ${idx},
      transcript_text = ${transcriptText},
      status = 'active',
      updated_at = datetime('now')
    WHERE id = ${callId}
  `;

  await logEvent(callId, 'transcript_chunk', { seq, speaker: turn.speaker });

  const updated = (await sql`SELECT * FROM receptionist_calls WHERE id = ${callId}`)[0];

  if (idx >= scenario.turns.length) {
    await finalizeReceptionistCall(callId);
    const finalCall = (await sql`SELECT * FROM receptionist_calls WHERE id = ${callId}`)[0];
    return { done: true, segment: turn, call: finalCall, autoCompleted: true };
  }

  return { done: false, segment: turn, call: updated, autoCompleted: false };
}

export async function endMockCall(callId: string, fastForwardRemaining = true) {
  const calls = await sql`SELECT * FROM receptionist_calls WHERE id = ${callId}`;
  if (calls.length === 0) throw new Error('Call not found');
  const call = calls[0] as Record<string, unknown>;
  const scenarioId = call.mock_scenario_id as string | null;

  if (call.status === 'completed') {
    return (await sql`SELECT * FROM receptionist_calls WHERE id = ${callId}`)[0];
  }

  if (fastForwardRemaining && scenarioId) {
    const scenario = getScenarioById(scenarioId);
    if (scenario) {
      for (;;) {
        const row = (await sql`
          SELECT status, current_transcript_index FROM receptionist_calls WHERE id = ${callId}
        `)[0] as Record<string, unknown>;
        if (row.status === 'completed') break;
        const idx = Number(row.current_transcript_index || 0);
        if (idx >= scenario.turns.length) {
          await finalizeReceptionistCall(callId);
          break;
        }
        await advanceMockCall(callId);
      }
    }
  } else {
    await finalizeReceptionistCall(callId);
  }

  return (await sql`SELECT * FROM receptionist_calls WHERE id = ${callId}`)[0];
}

export async function finalizeReceptionistCall(callId: string) {
  const calls = await sql`SELECT * FROM receptionist_calls WHERE id = ${callId}`;
  if (calls.length === 0) throw new Error('Call not found');
  const call = calls[0] as Record<string, unknown>;
  if (call.status === 'completed') {
    return call;
  }

  const settings = await ensureReceptionistSettings();
  const scenario = call.mock_scenario_id
    ? (getScenarioById(call.mock_scenario_id as string) ?? null)
    : null;

  const transcript = (call.transcript_text as string) || '';
  const keywords = parseEmergencyKeywordsJson(settings.emergency_keywords_json);
  const extracted = extractCallFieldsFromTranscript(transcript, scenario, keywords);
  const disposition = decideDisposition(extracted, scenario);
  const recommended = dispositionToRecommendedStep(disposition, extracted);

  const started = call.started_at ? new Date(call.started_at as string).getTime() : Date.now();
  const durationSeconds = Math.max(0, Math.round((Date.now() - started) / 1000));

  await sql`
    UPDATE receptionist_calls SET
      caller_name = ${extracted.callerName},
      from_phone = COALESCE(${extracted.phone}, from_phone),
      extracted_json = ${JSON.stringify(extracted)},
      ai_summary = ${extracted.summary},
      recommended_next_step = ${recommended},
      disposition = ${disposition},
      urgency = ${extracted.urgency},
      status = 'completed',
      ended_at = datetime('now'),
      duration_seconds = ${durationSeconds},
      updated_at = datetime('now')
    WHERE id = ${callId}
  `;

  await logEvent(callId, 'call_finalized', { disposition, recommended });

  const companyId = await getCompanyIdForReceptionist();
  const finalRow = (await sql`SELECT * FROM receptionist_calls WHERE id = ${callId}`)[0] as Record<
    string,
    unknown
  >;

  if (!finalRow.call_log_id) {
    const transcriptFull = (finalRow.transcript_text as string) || '';
    const callLogId = await createCallLogForReceptionistCall({
      companyId,
      customerName: extracted.callerName,
      phoneNumber: (extracted.phone as string) || (finalRow.from_phone as string) || 'unknown',
      durationSeconds,
      transcript: transcriptFull,
      aiSummary: extracted.summary,
      outcome: mapDispositionToCallOutcome(disposition),
      leadId: (finalRow.lead_id as string) || null,
      jobId: (finalRow.job_id as string) || null,
      customerId: null,
      recording: Boolean(settings.recording_enabled),
    });
    await linkReceptionistCallToCallLog(callId, callLogId);
  }

  return (await sql`SELECT * FROM receptionist_calls WHERE id = ${callId}`)[0];
}

function mapDispositionToCallOutcome(disposition: ReceptionistDisposition) {
  switch (disposition) {
    case 'quote_visit_booked':
    case 'callback_booked':
      return 'booked';
    case 'lead_created':
    case 'follow_up_needed':
      return 'callback';
    case 'emergency':
      return 'callback';
    case 'spam':
      return 'not_interested';
    default:
      return 'info';
  }
}

export async function reprocessReceptionistCall(callId: string) {
  const calls = await sql`SELECT * FROM receptionist_calls WHERE id = ${callId}`;
  if (calls.length === 0) throw new Error('Call not found');
  const call = calls[0] as Record<string, unknown>;

  const settings = await ensureReceptionistSettings();
  const scenario = call.mock_scenario_id
    ? (getScenarioById(call.mock_scenario_id as string) ?? null)
    : null;
  const transcript = (call.transcript_text as string) || '';
  const keywords = parseEmergencyKeywordsJson(settings.emergency_keywords_json);
  const extracted = extractCallFieldsFromTranscript(transcript, scenario, keywords);
  const disposition = decideDisposition(extracted, scenario);
  const recommended = dispositionToRecommendedStep(disposition, extracted);

  await sql`
    UPDATE receptionist_calls SET
      extracted_json = ${JSON.stringify(extracted)},
      ai_summary = ${extracted.summary},
      recommended_next_step = ${recommended},
      disposition = ${disposition},
      urgency = ${extracted.urgency},
      updated_at = datetime('now')
    WHERE id = ${callId}
  `;

  await logReceptionistEvent(callId, 'manual_reprocess', {}, 'system');

  if (call.call_log_id) {
    await sql`
      UPDATE call_logs SET
        transcript = ${transcript},
        ai_summary = ${extracted.summary},
        outcome = ${mapDispositionToCallOutcome(disposition)},
        customer_name = ${extracted.callerName},
        phone_number = COALESCE(${extracted.phone}, phone_number),
        updated_at = datetime('now')
      WHERE id = ${call.call_log_id}
    `;
  }

  return (await sql`SELECT * FROM receptionist_calls WHERE id = ${callId}`)[0];
}

export async function listReceptionistCalls(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const rows = await sql`
    SELECT rc.*, l.issue as lead_issue
    FROM receptionist_calls rc
    LEFT JOIN leads l ON rc.lead_id = l.id
    ORDER BY rc.started_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const countRow = await sql`SELECT COUNT(*) as total FROM receptionist_calls`;
  const total = Number(countRow[0]?.total || 0);
  return { calls: rows, total };
}

export async function getReceptionistCallDetail(callId: string) {
  const calls = await sql`
    SELECT rc.*, l.issue as lead_issue, j.type as job_type, j.scheduled_date, j.scheduled_time
    FROM receptionist_calls rc
    LEFT JOIN leads l ON rc.lead_id = l.id
    LEFT JOIN jobs j ON rc.job_id = j.id
    WHERE rc.id = ${callId}
  `;
  if (calls.length === 0) return null;
  const segments = await sql`
    SELECT * FROM receptionist_transcript_segments WHERE call_id = ${callId} ORDER BY seq ASC
  `;
  const events = await sql`
    SELECT * FROM receptionist_events WHERE call_id = ${callId} ORDER BY created_at ASC
  `;
  const bookings = await sql`
    SELECT * FROM receptionist_bookings WHERE call_id = ${callId} ORDER BY created_at ASC
  `;
  const toolInvocations = await sql`
    SELECT * FROM receptionist_tool_invocations WHERE call_id = ${callId} ORDER BY created_at ASC
  `;
  return { call: calls[0], segments, events, bookings, toolInvocations };
}

export async function getDashboardStats() {
  const totalRow = await sql`SELECT COUNT(*) as c FROM receptionist_calls`;
  const activeRow = await sql`
    SELECT COUNT(*) as c FROM receptionist_calls
    WHERE status IN ('mock', 'active', 'ringing')
       OR provider_status IN ('registered', 'ongoing', 'not_connected')
  `;
  const cbRow = await sql`
    SELECT COUNT(*) as c FROM receptionist_bookings WHERE booking_type = 'callback' AND status != 'cancelled'
  `;
  const qvRow = await sql`
    SELECT COUNT(*) as c FROM receptionist_bookings WHERE booking_type = 'quote_visit' AND status != 'cancelled'
  `;
  const emRow = await sql`
    SELECT COUNT(*) as c FROM receptionist_calls WHERE disposition = 'emergency'
  `;

  return {
    totalCalls: Number(totalRow[0]?.c || 0),
    activeCalls: Number(activeRow[0]?.c || 0),
    callbackBookings: Number(cbRow[0]?.c || 0),
    quoteVisitBookings: Number(qvRow[0]?.c || 0),
    emergenciesFlagged: Number(emRow[0]?.c || 0),
  };
}

export async function listMockScenariosFromDb() {
  await syncMockScenariosToDb();
  return sql`SELECT * FROM receptionist_mock_scenarios ORDER BY is_default DESC, name ASC`;
}

export async function updateCallDisposition(callId: string, disposition: ReceptionistDisposition) {
  await sql`
    UPDATE receptionist_calls
    SET disposition = ${disposition}, updated_at = datetime('now')
    WHERE id = ${callId}
  `;
  await logReceptionistEvent(callId, 'disposition_updated', { disposition }, 'system');
}

export async function linkLeadToCall(callId: string, leadId: string) {
  await sql`
    UPDATE receptionist_calls SET lead_id = ${leadId}, updated_at = datetime('now') WHERE id = ${callId}
  `;
  await logReceptionistEvent(callId, 'lead_linked', { leadId }, 'system');
}

export async function linkJobToCall(callId: string, jobId: string) {
  await sql`
    UPDATE receptionist_calls SET job_id = ${jobId}, updated_at = datetime('now') WHERE id = ${callId}
  `;
  await logReceptionistEvent(callId, 'job_linked', { jobId }, 'system');
}

export async function findReceptionistCallByTwilioSid(twilioCallSid: string) {
  const rows = await sql`
    SELECT * FROM receptionist_calls WHERE twilio_call_sid = ${twilioCallSid} LIMIT 1
  `;
  return rows[0] as Record<string, unknown> | undefined;
}

export async function findReceptionistCallByRetellCallId(retellCallId: string) {
  const rows = await sql`
    SELECT * FROM receptionist_calls WHERE provider_call_id = ${retellCallId} LIMIT 1
  `;
  return rows[0] as Record<string, unknown> | undefined;
}

export async function insertReceptionistToolInvocation(params: {
  callId: string;
  toolName: string;
  requestJson: unknown;
  responseJson: unknown;
  status: string;
}) {
  await sql`
    INSERT INTO receptionist_tool_invocations (call_id, tool_name, request_json, response_json, status)
    VALUES (
      ${params.callId},
      ${params.toolName},
      ${JSON.stringify(params.requestJson)},
      ${JSON.stringify(params.responseJson)},
      ${params.status}
    )
  `;
}

export async function createInboundRetellCallRow(params: {
  twilioCallSid: string;
  fromPhone: string;
  toPhone: string;
}) {
  const rows = await sql`
    INSERT INTO receptionist_calls (
      provider,
      twilio_call_sid,
      direction,
      from_phone,
      to_phone,
      status,
      mock_scenario_id,
      current_transcript_index
    )
    VALUES (
      'retell',
      ${params.twilioCallSid},
      'inbound',
      ${params.fromPhone},
      ${params.toPhone},
      'ringing',
      NULL,
      0
    )
    RETURNING *
  `;
  return rows[0] as Record<string, unknown>;
}

export async function attachRetellRegistrationToCall(
  plumberCallId: string,
  params: {
    retellCallId: string;
    agentId: string;
    providerStatus: string;
    rawPayload?: unknown;
  },
) {
  await sql`
    UPDATE receptionist_calls SET
      provider_call_id = ${params.retellCallId},
      provider_agent_id = ${params.agentId},
      provider_status = ${params.providerStatus},
      status = 'active',
      raw_provider_payload_json = ${params.rawPayload != null ? JSON.stringify(params.rawPayload) : null},
      updated_at = datetime('now')
    WHERE id = ${plumberCallId}
  `;
}
