const context = $("Set Today").first().json;
const targetIso = context.today_iso;

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
    "Day": "col_3",
    "Wk": "col_4",
    "Industry": "col_5",
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

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().slice(0, 10);
}

const rows = $input.all().filter((item) => {
  const publishDate = getField(item.json, "Publish Date");
  return publishDate && clean(publishDate).toLowerCase() !== "publish date";
});

const match = rows.find((item) => {
  const publishDate = getField(item.json, "Publish Date");
  return parseSheetDate(publishDate) === targetIso;
});

if (!match) {
  return [];
}

const row = match.json;

return [
  {
    json: {
      ...context,
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
    },
  },
];
