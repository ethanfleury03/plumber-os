import { NextResponse } from 'next/server';
import { receptionistService } from '@/lib/receptionist/service';
import {
  auditTool,
  mergeExtractedOntoCall,
  partialExtractedFromToolArgs,
  readRetellToolJson,
  resolvePlumberCallIdFromToolBody,
  toolJsonError,
  toolJsonOk,
  unknownRetellCallMessage,
  verifyRetellToolSecret,
} from '@/lib/receptionist/retell-tool-common';

export async function POST(request: Request) {
  if (!verifyRetellToolSecret(request)) {
    return NextResponse.json(toolJsonError('Unauthorized', 'unauthorized'), { status: 401 });
  }
  const body = await readRetellToolJson(request, 'book_quote_visit');
  const callId = await resolvePlumberCallIdFromToolBody(body);
  if (!callId) {
    return NextResponse.json(toolJsonError(unknownRetellCallMessage(body), 'bad_request'), { status: 400 });
  }
  try {
    await mergeExtractedOntoCall(callId, partialExtractedFromToolArgs(body));
    const out = await receptionistService.bookQuoteVisitFromCall(callId);
    await auditTool(callId, 'book_quote_visit', body, out, 'ok');
    return NextResponse.json(toolJsonOk({ bookingId: out.bookingId, jobId: out.jobId }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error';
    await auditTool(callId, 'book_quote_visit', body, { error: msg }, 'error');
    return NextResponse.json(toolJsonError(msg, 'tool_error'), { status: 400 });
  }
}
