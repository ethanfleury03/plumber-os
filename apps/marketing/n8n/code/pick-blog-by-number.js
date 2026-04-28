// Manual single-blog picker.
//
// Put this Code node after "Google Sheets - Pull Blog Schedule".
// Change TARGET_BLOG_NUMBER to "1", run it, then change it to "2", etc.
//
// It matches the "#" column in your Blog Schedule. If that column is missing,
// it falls back to the row's position among real blog rows.

const TARGET_BLOG_NUMBER = "1";

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

function normalizeBlogNumber(value) {
  const text = clean(value);
  const match = text.match(/\d+/);
  return match ? match[0] : text;
}

function isRealBlogRow(row) {
  const publishDate = getField(row, "Publish Date");
  const title = getField(row, "Post Title");

  return (
    publishDate &&
    title &&
    clean(publishDate).toLowerCase() !== "publish date" &&
    clean(title).toLowerCase() !== "post title"
  );
}

function toOutput(row, selectedBy) {
  const now = new Date();

  return {
    ...context,
    today_iso: context.today_iso || now.toISOString().slice(0, 10),
    run_id: `manual-blog-${TARGET_BLOG_NUMBER}-${now.getTime()}`,
    _debug_selected_by: selectedBy,
    manual_target_blog_number: TARGET_BLOG_NUMBER,
    source_row_number: row.row_number || "",
    blog_number: getField(row, "#") || TARGET_BLOG_NUMBER,
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

const target = normalizeBlogNumber(TARGET_BLOG_NUMBER);
const rows = $input
  .all()
  .map((item) => item.json || {})
  .filter(isRealBlogRow);

let selectedBy = "blog_number";
let match = rows.find((row) => normalizeBlogNumber(getField(row, "#")) === target);

if (!match) {
  selectedBy = "data_row_position";
  const targetIndex = Number.parseInt(target, 10) - 1;
  match = Number.isInteger(targetIndex) && targetIndex >= 0 ? rows[targetIndex] : null;
}

if (!match) {
  throw new Error(`Could not find blog ${TARGET_BLOG_NUMBER}. Check the # column or row count in the Blog Schedule sheet.`);
}

return [
  {
    json: toOutput(match, selectedBy),
  },
];
