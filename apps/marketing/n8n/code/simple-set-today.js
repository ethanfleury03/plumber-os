const TIME_ZONE = "America/New_York";
const LOOKAHEAD_DAYS = 7;
const input = $input.first()?.json || {};
const overrideTodayIso = input.override_today_iso || "";
const now = new Date();

function isoDateInTimezone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

const baseIso = isoDateInTimezone(now, TIME_ZONE);
const targetDate = addDays(now, LOOKAHEAD_DAYS);
const todayIso = overrideTodayIso || isoDateInTimezone(targetDate, TIME_ZONE);

return [
  {
    json: {
      today_iso: todayIso,
      target_publish_date_iso: todayIso,
      base_run_date_iso: baseIso,
      lookahead_days: LOOKAHEAD_DAYS,
      run_id: `blog-${todayIso}-${now.getTime()}`,
      timezone: TIME_ZONE,
    },
  },
];
