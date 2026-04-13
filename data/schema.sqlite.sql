-- PlumberOS SQLite schema (dev / committed DB)
-- uuid() is registered by the app via better-sqlite3 before queries run.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  stripe_customer_id TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plumbers (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'plumber',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS buckets (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  title TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  position INTEGER NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  plumber_id TEXT REFERENCES plumbers(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  priority INTEGER DEFAULT 3,
  issue TEXT NOT NULL,
  description TEXT,
  location TEXT,
  ai_qualification TEXT,
  ai_score INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  plumber_id TEXT REFERENCES plumbers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'scheduled',
  type TEXT NOT NULL,
  description TEXT,
  scheduled_date TEXT,
  scheduled_time TEXT,
  started_at TEXT,
  completed_at TEXT,
  estimated_price REAL,
  final_price REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  service_type TEXT,
  status TEXT DEFAULT 'pending',
  amount REAL NOT NULL,
  tax REAL DEFAULT 0,
  total REAL NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT,
  paid_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS call_logs (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  customer_name TEXT,
  phone_number TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',
  transcript TEXT,
  ai_summary TEXT,
  outcome TEXT,
  recording INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_lead_id ON jobs(lead_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_company_id ON call_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at);

-- AI Receptionist (see docs/RECEPTIONIST.md)
CREATE TABLE IF NOT EXISTS receptionist_mock_scenarios (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  transcript_script_json TEXT NOT NULL,
  expected_outcome TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receptionist_settings (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  company_name TEXT,
  greeting TEXT,
  disclosure_enabled INTEGER NOT NULL DEFAULT 1,
  recording_enabled INTEGER NOT NULL DEFAULT 0,
  business_hours_json TEXT,
  after_hours_mode TEXT DEFAULT 'message_and_callback',
  allowed_actions_json TEXT,
  emergency_keywords_json TEXT,
  booking_rules_json TEXT,
  default_call_outcome_rules_json TEXT,
  provider_type TEXT NOT NULL DEFAULT 'mock',
  provider_config_json TEXT,
  internal_instructions TEXT,
  callback_booking_enabled INTEGER NOT NULL DEFAULT 1,
  quote_visit_booking_enabled INTEGER NOT NULL DEFAULT 1,
  retell_agent_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receptionist_calls (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  provider TEXT NOT NULL DEFAULT 'mock',
  provider_call_id TEXT,
  twilio_call_sid TEXT,
  provider_agent_id TEXT,
  provider_status TEXT,
  direction TEXT NOT NULL DEFAULT 'inbound',
  from_phone TEXT,
  to_phone TEXT,
  caller_name TEXT,
  status TEXT NOT NULL DEFAULT 'mock',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  duration_seconds INTEGER DEFAULT 0,
  transcript_text TEXT,
  ai_summary TEXT,
  extracted_json TEXT,
  recommended_next_step TEXT,
  disposition TEXT,
  urgency TEXT,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  appointment_id TEXT,
  call_log_id TEXT REFERENCES call_logs(id) ON DELETE SET NULL,
  recording_url TEXT,
  raw_provider_payload_json TEXT,
  mock_scenario_id TEXT,
  current_transcript_index INTEGER NOT NULL DEFAULT 0,
  receptionist_meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receptionist_transcript_segments (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  call_id TEXT NOT NULL REFERENCES receptionist_calls(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp_ms INTEGER,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(call_id, seq)
);

CREATE TABLE IF NOT EXISTS receptionist_events (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  call_id TEXT NOT NULL REFERENCES receptionist_calls(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload_json TEXT,
  source TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receptionist_tool_invocations (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  call_id TEXT NOT NULL REFERENCES receptionist_calls(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  request_json TEXT,
  response_json TEXT,
  status TEXT NOT NULL DEFAULT 'ok',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receptionist_bookings (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  call_id TEXT NOT NULL REFERENCES receptionist_calls(id) ON DELETE CASCADE,
  booking_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  requested_window_start TEXT,
  requested_window_end TEXT,
  scheduled_start TEXT,
  scheduled_end TEXT,
  notes TEXT,
  assigned_to TEXT,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_receptionist_calls_created_at ON receptionist_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_receptionist_calls_status ON receptionist_calls(status);
CREATE INDEX IF NOT EXISTS idx_receptionist_segments_call ON receptionist_transcript_segments(call_id);
CREATE INDEX IF NOT EXISTS idx_receptionist_events_call ON receptionist_events(call_id);
CREATE INDEX IF NOT EXISTS idx_receptionist_bookings_call ON receptionist_bookings(call_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_receptionist_calls_twilio_sid ON receptionist_calls(twilio_call_sid) WHERE twilio_call_sid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_receptionist_calls_provider_call_id ON receptionist_calls(provider_call_id) WHERE provider_call_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_receptionist_tool_call ON receptionist_tool_invocations(call_id);

CREATE TABLE IF NOT EXISTS receptionist_staff_tasks (
  id TEXT PRIMARY KEY DEFAULT (uuid()) NOT NULL,
  call_id TEXT NOT NULL REFERENCES receptionist_calls(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  details_json TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_to_plumber_id TEXT REFERENCES plumbers(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_receptionist_staff_tasks_call ON receptionist_staff_tasks(call_id);
CREATE INDEX IF NOT EXISTS idx_receptionist_staff_tasks_status ON receptionist_staff_tasks(status);
