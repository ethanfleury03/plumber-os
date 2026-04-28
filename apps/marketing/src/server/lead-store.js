const crypto = require("node:crypto");
const { Pool } = require("@neondatabase/serverless");

const memoryLeads = [];
let pool = null;
let schemaReady = false;

function databaseUrl() {
  return process.env.DATABASE_URL?.trim();
}

function getPool() {
  if (pool) return pool;
  pool = new Pool({ connectionString: databaseUrl() });
  return pool;
}

async function ensureSchema() {
  if (!databaseUrl() || schemaReady) return;
  schemaReady = true;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS marketing_leads (
      id UUID PRIMARY KEY,
      company_id UUID,
      kind TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      trade TEXT,
      message TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      referrer TEXT,
      user_agent TEXT,
      ip_hash TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW()),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW())
    );
    CREATE INDEX IF NOT EXISTS idx_marketing_leads_kind ON marketing_leads(kind);
    CREATE INDEX IF NOT EXISTS idx_marketing_leads_email ON marketing_leads(email);
    CREATE INDEX IF NOT EXISTS idx_marketing_leads_created ON marketing_leads(created_at);
  `);
}

function ipHash(value) {
  const ip = String(value || "").trim();
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip).digest("hex");
}

async function insertLead(payload) {
  const id = crypto.randomUUID();
  const lead = {
    id,
    company_id: null,
    kind: "general",
    name: payload.name || "Website lead",
    email: payload.email || "unknown@example.com",
    company: payload.businessName || null,
    phone: payload.phone || null,
    trade: payload.industry || null,
    message: payload.manualTask || null,
    utm_source: payload.utmSource || null,
    utm_medium: payload.utmMedium || null,
    utm_campaign: payload.utmCampaign || null,
    referrer: payload.pageUrl || null,
    user_agent: payload.userAgent || null,
    ip_hash: ipHash(payload.userAgent),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!databaseUrl()) {
    memoryLeads.push(lead);
    return id;
  }

  await ensureSchema();
  await getPool().query(
    `
      INSERT INTO marketing_leads (
        id, company_id, kind, name, email, company, phone, trade, message,
        utm_source, utm_medium, utm_campaign, referrer, user_agent, ip_hash,
        created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        NOW(), NOW()
      )
    `,
    [
      lead.id,
      lead.company_id,
      lead.kind,
      lead.name,
      lead.email,
      lead.company,
      lead.phone,
      lead.trade,
      lead.message,
      lead.utm_source,
      lead.utm_medium,
      lead.utm_campaign,
      lead.referrer,
      lead.user_agent,
      lead.ip_hash,
    ],
  );
  return id;
}

module.exports = {
  insertLead,
};
