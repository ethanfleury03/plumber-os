'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Loader2 } from 'lucide-react';

interface SettingsRow {
  id: string;
  company_name: string | null;
  greeting: string | null;
  disclosure_enabled: number;
  recording_enabled: number;
  business_hours_json: string | null;
  after_hours_mode: string | null;
  allowed_actions_json: string | null;
  emergency_keywords_json: string | null;
  booking_rules_json: string | null;
  default_call_outcome_rules_json: string | null;
  provider_type: string;
  provider_config_json: string | null;
  internal_instructions: string | null;
  callback_booking_enabled: number;
  quote_visit_booking_enabled: number;
  retell_agent_id: string | null;
}

export default function ReceptionistSettingsPage() {
  const [settings, setSettings] = useState<SettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/receptionist/settings');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (!cancelled)
          setSettings({
            ...data.settings,
            retell_agent_id: data.settings.retell_agent_id ?? null,
          });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = <K extends keyof SettingsRow>(key: K, value: SettingsRow[K]) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  };

  const validateJson = (label: string, raw: string | null) => {
    if (!raw || !raw.trim()) return null;
    try {
      JSON.parse(raw);
      return null;
    } catch {
      return `${label} must be valid JSON`;
    }
  };

  const save = async () => {
    if (!settings) return;
    const jsonErr =
      validateJson('Business hours', settings.business_hours_json) ||
      validateJson('Allowed actions', settings.allowed_actions_json) ||
      validateJson('Emergency keywords', settings.emergency_keywords_json) ||
      validateJson('Booking rules', settings.booking_rules_json) ||
      validateJson('Outcome rules', settings.default_call_outcome_rules_json) ||
      validateJson('Provider config', settings.provider_config_json);
    if (jsonErr) {
      setError(jsonErr);
      return;
    }

    setSaving(true);
    setError('');
    setOk('');
    try {
      const res = await fetch('/api/receptionist/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: settings.company_name ?? '',
          greeting: settings.greeting ?? '',
          disclosure_enabled: Boolean(settings.disclosure_enabled),
          recording_enabled: Boolean(settings.recording_enabled),
          business_hours_json: settings.business_hours_json,
          after_hours_mode: settings.after_hours_mode,
          allowed_actions_json: settings.allowed_actions_json,
          emergency_keywords_json: settings.emergency_keywords_json,
          booking_rules_json: settings.booking_rules_json,
          default_call_outcome_rules_json: settings.default_call_outcome_rules_json,
          provider_type: settings.provider_type,
          provider_config_json: settings.provider_config_json,
          internal_instructions: settings.internal_instructions,
          callback_booking_enabled: Boolean(settings.callback_booking_enabled),
          quote_visit_booking_enabled: Boolean(settings.quote_visit_booking_enabled),
          retell_agent_id: settings.retell_agent_id?.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(typeof data.error === 'string' ? data.error : 'Validation failed');
      setSettings(data.settings);
      setOk('Settings saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100">
      <main className="flex-1 overflow-auto">
        <header className="header px-6 py-4 border-b border-gray-200/80 bg-white/70 backdrop-blur">
          <Link
            href="/receptionist"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Receptionist
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Bot className="w-7 h-7 text-indigo-600" aria-hidden />
            Receptionist settings
          </h1>
          <p className="text-gray-500 text-sm mt-1">Policies, hours, and provider mode (mock by default).</p>
        </header>

        <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
          {error ? <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div> : null}
          {ok ? <div className="bg-emerald-50 text-emerald-800 px-4 py-3 rounded-xl text-sm">{ok}</div> : null}

          <div className="bg-white/90 rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company display name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                value={settings.company_name || ''}
                onChange={(e) => updateField('company_name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Greeting</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 min-h-[80px]"
                value={settings.greeting || ''}
                onChange={(e) => updateField('greeting', e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={Boolean(settings.disclosure_enabled)}
                  onChange={(e) => updateField('disclosure_enabled', e.target.checked ? 1 : 0)}
                />
                AI disclosure enabled
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={Boolean(settings.recording_enabled)}
                  onChange={(e) => updateField('recording_enabled', e.target.checked ? 1 : 0)}
                />
                Call recording (policy flag)
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={Boolean(settings.callback_booking_enabled)}
                  onChange={(e) => updateField('callback_booking_enabled', e.target.checked ? 1 : 0)}
                />
                Callback booking enabled
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={Boolean(settings.quote_visit_booking_enabled)}
                  onChange={(e) => updateField('quote_visit_booking_enabled', e.target.checked ? 1 : 0)}
                />
                Quote visit booking enabled
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">After-hours mode</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                value={settings.after_hours_mode || ''}
                onChange={(e) => updateField('after_hours_mode', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                value={settings.provider_type}
                onChange={(e) => updateField('provider_type', e.target.value)}
              >
                <option value="mock">mock (local demo)</option>
                <option value="retell">retell + Twilio (live)</option>
                <option value="twilio">twilio (legacy stub)</option>
                <option value="custom">custom</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Live calls use Twilio webhooks + Retell SIP regardless of this flag; this value is stored for UI and ops.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Retell agent ID</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono"
                placeholder="From Retell dashboard"
                value={settings.retell_agent_id || ''}
                onChange={(e) => updateField('retell_agent_id', e.target.value || null)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Overrides <code className="bg-gray-100 px-1 rounded">RETELL_AGENT_ID</code> when set. Required for
                registerPhoneCall.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business hours (JSON)</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 min-h-[72px]"
                value={settings.business_hours_json || ''}
                onChange={(e) => updateField('business_hours_json', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency keywords (JSON array)</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 min-h-[72px]"
                value={settings.emergency_keywords_json || ''}
                onChange={(e) => updateField('emergency_keywords_json', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowed actions (JSON)</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 min-h-[56px]"
                value={settings.allowed_actions_json || ''}
                onChange={(e) => updateField('allowed_actions_json', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal instructions</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 min-h-[100px]"
                value={settings.internal_instructions || ''}
                onChange={(e) => updateField('internal_instructions', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider config (JSON, non-secret)</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 min-h-[56px]"
                value={settings.provider_config_json || ''}
                onChange={(e) => updateField('provider_config_json', e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
            Save settings
          </button>
        </div>
      </main>
    </div>
  );
}
