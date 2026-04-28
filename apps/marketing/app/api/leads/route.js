import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { insertLead } = require("../../../src/server/lead-store");
const { clean } = require("../../../src/lib/slugs");

export const dynamic = "force-dynamic";

function normalizeLeadPayload(body, request) {
  return {
    submittedAt: clean(body.submittedAt) || new Date().toISOString(),
    name: clean(body.name),
    email: clean(body.email),
    phone: clean(body.phone),
    businessName: clean(body.businessName || body.business),
    website: clean(body.website),
    industry: clean(body.industry),
    manualTask: clean(body.manualTask || body.task),
    source: clean(body.source || body.pageSource || "website"),
    pageUrl: clean(body.pageUrl),
    pageTitle: clean(body.pageTitle),
    utmSource: clean(body.utmSource),
    utmMedium: clean(body.utmMedium),
    utmCampaign: clean(body.utmCampaign),
    userAgent: clean(body.userAgent || request.headers.get("user-agent")),
    companyWebsite: clean(body.companyWebsite),
    formVariant: clean(body.formVariant),
    conversionPath: clean(body.conversionPath),
    detailFieldsProvided: clean(body.detailFieldsProvided),
  };
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const payload = normalizeLeadPayload(body || {}, request);

  if (payload.companyWebsite) {
    return Response.json({ ok: true, configured: Boolean(process.env.N8N_LEAD_WEBHOOK_URL) });
  }

  try {
    await insertLead(payload);

    if (process.env.N8N_LEAD_WEBHOOK_URL) {
      const response = await fetch(process.env.N8N_LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
    }

    return Response.json({
      ok: true,
      configured: Boolean(process.env.N8N_LEAD_WEBHOOK_URL),
      message: "Thanks - WNY Automation Co will review your workflow and send back a few practical automation ideas.",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: "Something went wrong. Please try again or email us directly.",
      },
      { status: 502 },
    );
  }
}
