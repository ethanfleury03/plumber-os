// Optional one-time backfill picker.
//
// Put this Code node after "Google Sheets - Pull Blog Schedule" when you want
// to run several manually added calendar rows right now.
//
// Default range matches the five rows in:
// n8n/blog-calendar-backfill-rows.tsv

const BACKFILL_START_ISO = "2026-04-28";
const BACKFILL_END_ISO = "2026-05-02";
const MAX_ROWS = 5;

let context = {};

try {
  context = $("Set Today").first().json || {};
} catch (error) {
  context = {};
}

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function getField(row, fieldName) {
  if (row[fieldName] !== undefined) return row[fieldName];

  const normalizedFieldName = clean(fieldName).toLowerCase();
  const match = Object.entries(row).find(([key]) => clean(key).toLowerCase() === normalizedFieldName);
  if (match) return match[1];

  const fallbackColumns = {
    "Publish Date": "col_2",
    Day: "col_3",
    Wk: "col_4",
    Industry: "col_5",
    "Funnel Stage": "col_6",
    "Post Title": "col_7",
    "Content Type": "col_8",
    "Target Word Count": "col_9",
    "Primary Keyword": "col_10",
    "Secondary Keywords (2-3)": "col_11",
    "LSI Keywords (4-6)": "col_12",
    "Search Intent": "col_13",
    "Pain Point": "col_14",
    "How AI Fixes It": "col_15",
    "Content Brief Outline (H2 Structure)": "col_16",
    "Recommended CTA": "col_17",
    "Meta Title (<60 chars)": "col_18",
    "Meta Description (<160 chars)": "col_19",
    "Research / Source URL": "col_20",
  };

  if (fieldName === "#") {
    const firstDataKey = Object.keys(row).find((key) => key !== "row_number" && !/^col_\d+$/i.test(key));
    return firstDataKey ? row[firstDataKey] : "";
  }

  const fallbackKey = fallbackColumns[fieldName];
  return fallbackKey && row[fallbackKey] !== undefined ? row[fallbackKey] : "";
}

function parseSheetDate(value) {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "number") {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + value * 86400000).toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const namedDate = text.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (namedDate) {
    const months = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
    };
    const month = months[namedDate[1].slice(0, 3).toLowerCase()];
    const day = namedDate[2].padStart(2, "0");
    const year = namedDate[3];
    return month ? `${year}-${month}-${day}` : "";
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().slice(0, 10);
}

function normalizeRow(row, publishDateIso, index, total) {
  return {
    ...context,
    today_iso: context.today_iso || publishDateIso,
    run_id: `blog-backfill-${publishDateIso}-${index + 1}-${Date.now()}`,
    _debug_selected_by: "backfill_date_range",
    backfill_start_iso: BACKFILL_START_ISO,
    backfill_end_iso: BACKFILL_END_ISO,
    backfill_index: index + 1,
    backfill_count: total,
    source_row_number: row.row_number || "",
    blog_number: getField(row, "#"),
    publish_date: getField(row, "Publish Date"),
    industry: getField(row, "Industry"),
    funnel_stage: getField(row, "Funnel Stage"),
    post_title: getField(row, "Post Title"),
    content_type: getField(row, "Content Type"),
    target_word_count: getField(row, "Target Word Count"),
    primary_keyword: getField(row, "Primary Keyword"),
    secondary_keywords: getField(row, "Secondary Keywords (2-3)"),
    lsi_keywords: getField(row, "LSI Keywords (4-6)"),
    search_intent: getField(row, "Search Intent"),
    pain_point: getField(row, "Pain Point"),
    how_ai_fixes_it: getField(row, "How AI Fixes It"),
    outline: getField(row, "Content Brief Outline (H2 Structure)"),
    cta: getField(row, "Recommended CTA"),
    meta_title: getField(row, "Meta Title (<60 chars)"),
    meta_description: getField(row, "Meta Description (<160 chars)"),
    source_url: getField(row, "Research / Source URL"),
  };
}

const candidateRows = $input
  .all()
  .map((item) => item.json || {})
  .map((row) => {
    const publishDate = getField(row, "Publish Date");
    return {
      row,
      publishDateIso: parseSheetDate(publishDate),
    };
  })
  .filter(({ row, publishDateIso }) => {
    const publishDate = getField(row, "Publish Date");
    return publishDate && clean(publishDate).toLowerCase() !== "publish date" && publishDateIso;
  })
  .filter(({ publishDateIso }) => publishDateIso >= BACKFILL_START_ISO && publishDateIso <= BACKFILL_END_ISO)
  .sort((left, right) => left.publishDateIso.localeCompare(right.publishDateIso))
  .slice(0, MAX_ROWS);

return candidateRows.map(({ row, publishDateIso }, index) => ({
  json: normalizeRow(row, publishDateIso, index, candidateRows.length),
}));
