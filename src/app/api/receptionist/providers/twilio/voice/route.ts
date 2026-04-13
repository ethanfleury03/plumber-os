import { NextResponse } from 'next/server';
import { handleTwilioInboundVoice } from '@/lib/receptionist/receptionist-live';

export async function POST(request: Request) {
  const form = await request.formData();
  const get = (k: string) => String(form.get(k) ?? '');
  const signature = request.headers.get('x-twilio-signature');
  const requestUrl = request.url;

  const result = await handleTwilioInboundVoice({
    twilioCallSid: get('CallSid'),
    from: get('From'),
    to: get('To'),
    signature,
    requestUrl,
  });

  return new NextResponse(result.twiml, {
    status: result.status,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}
