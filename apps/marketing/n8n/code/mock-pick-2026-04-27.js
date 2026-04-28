const TARGET_ISO = "2026-04-27";

function clean(value) {
  return String(value || "").trim();
}

function parseSheetDate(value) {
  const text = clean(value);
  if (!text) return "";
  if (text === TARGET_ISO) return TARGET_ISO;

  // Sheet format: Apr 27, 2026
  const match = text.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (match) {
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

    const month = months[match[1].slice(0, 3).toLowerCase()];
    const day = match[2].padStart(2, "0");
    const year = match[3];
    if (month) return `${year}-${month}-${day}`;
  }

  return "";
}

function rowValue(row, headerName, fallbackKey) {
  if (row[headerName] !== undefined && row[headerName] !== "") return row[headerName];
  if (row[fallbackKey] !== undefined && row[fallbackKey] !== "") return row[fallbackKey];
  return "";
}

function blogNumber(row) {
  if (row["#"] !== undefined && row["#"] !== "") return row["#"];

  const key = Object.keys(row).find((candidate) => {
    return candidate !== "row_number" && !/^col_\d+$/i.test(candidate);
  });

  return key ? row[key] : "";
}

const rows = $input.all()
  .map((item) => item.json || {})
  .filter((row) => {
    const publishDate = rowValue(row, "Publish Date", "col_2");
    return publishDate && clean(publishDate).toLowerCase() !== "publish date";
  });

let match = rows.find((row) => parseSheetDate(rowValue(row, "Publish Date", "col_2")) === TARGET_ISO);
let selectedBy = "date_match";

// Mock/test mode: never silently return empty if the sheet has real blog rows.
if (!match && rows.length) {
  match = rows[0];
  selectedBy = "fallback_first_blog_row";
}

if (!match) {
  return [
    {
      json: {
        _debug_error: "No usable blog rows found",
        _debug_target_iso: TARGET_ISO,
        _debug_input_count: $input.all().length,
      },
    },
  ];
}

return [
  {
    json: {
      today_iso: TARGET_ISO,
      run_id: `mock-blog-${TARGET_ISO}`,
      _debug_selected_by: selectedBy,
      source_row_number: match.row_number || "",
      blog_number: blogNumber(match),
      publish_date: rowValue(match, "Publish Date", "col_2"),
      industry: rowValue(match, "Industry", "col_5"),
      funnel_stage: rowValue(match, "Funnel Stage", "col_6"),
      post_title: rowValue(match, "Post Title", "col_7"),
      content_type: rowValue(match, "Content Type", "col_8"),
      target_word_count: rowValue(match, "Target Word Count", "col_9"),
      primary_keyword: rowValue(match, "Primary Keyword", "col_10"),
      secondary_keywords: rowValue(match, "Secondary Keywords (2-3)", "col_11"),
      lsi_keywords: rowValue(match, "LSI Keywords (4-6)", "col_12"),
      search_intent: rowValue(match, "Search Intent", "col_13"),
      pain_point: rowValue(match, "Pain Point", "col_14"),
      how_ai_fixes_it: rowValue(match, "How AI Fixes It", "col_15"),
      outline: rowValue(match, "Content Brief Outline (H2 Structure)", "col_16"),
      cta: rowValue(match, "Recommended CTA", "col_17"),
      meta_title: rowValue(match, "Meta Title (<60 chars)", "col_18"),
      meta_description: rowValue(match, "Meta Description (<160 chars)", "col_19"),
      source_url: rowValue(match, "Research / Source URL", "col_20"),
    },
  },
];
