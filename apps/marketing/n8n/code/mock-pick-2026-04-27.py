TARGET_ISO = "2026-04-27"


def clean(value):
    return str(value or "").strip()


def parse_sheet_date(value):
    text = clean(value)
    if not text:
        return ""

    if text == TARGET_ISO:
        return TARGET_ISO

    # This is the format your sheet is using: Apr 27, 2026
    month_numbers = {
        "jan": "01",
        "feb": "02",
        "mar": "03",
        "apr": "04",
        "may": "05",
        "jun": "06",
        "jul": "07",
        "aug": "08",
        "sep": "09",
        "oct": "10",
        "nov": "11",
        "dec": "12",
    }

    parts = text.replace(",", "").split()
    if len(parts) == 3:
        month = month_numbers.get(parts[0].lower()[:3])
        day = parts[1].zfill(2)
        year = parts[2]
        if month and year.isdigit() and day.isdigit():
            return f"{year}-{month}-{day}"

    return ""


def get_json(item):
    if isinstance(item, dict):
        return item.get("json", {})
    return {}


def row_value(row, header_name, fallback_key):
    if header_name in row and row[header_name] not in (None, ""):
        return row[header_name]
    if fallback_key in row and row[fallback_key] not in (None, ""):
        return row[fallback_key]
    return ""


def blog_number(row):
    if "#" in row and row["#"] not in (None, ""):
        return row["#"]

    for key, value in row.items():
        if key != "row_number" and not str(key).startswith("col_"):
            return value

    return ""


rows = []
for item in _items:
    row = get_json(item)
    publish_date = row_value(row, "Publish Date", "col_2")

    # Skip the header row.
    if clean(publish_date).lower() == "publish date":
        continue

    if publish_date:
        rows.append(row)


match = None
for row in rows:
    if parse_sheet_date(row_value(row, "Publish Date", "col_2")) == TARGET_ISO:
        match = row
        break


# For this mock/test version, do not return empty. If date parsing gets weird,
# use the first real blog row so the rest of the workflow can be tested.
selected_by = "date_match"
if match is None and rows:
    match = rows[0]
    selected_by = "fallback_first_blog_row"


if match is None:
    return [
        {
            "json": {
                "_debug_error": "No usable blog rows found",
                "_debug_target_iso": TARGET_ISO,
                "_debug_input_count": len(_items),
            }
        }
    ]


return [
    {
        "json": {
            "today_iso": TARGET_ISO,
            "run_id": f"mock-blog-{TARGET_ISO}",
            "_debug_selected_by": selected_by,
            "source_row_number": match.get("row_number", ""),
            "blog_number": blog_number(match),
            "publish_date": row_value(match, "Publish Date", "col_2"),
            "industry": row_value(match, "Industry", "col_5"),
            "funnel_stage": row_value(match, "Funnel Stage", "col_6"),
            "post_title": row_value(match, "Post Title", "col_7"),
            "content_type": row_value(match, "Content Type", "col_8"),
            "target_word_count": row_value(match, "Target Word Count", "col_9"),
            "primary_keyword": row_value(match, "Primary Keyword", "col_10"),
            "secondary_keywords": row_value(match, "Secondary Keywords (2-3)", "col_11"),
            "lsi_keywords": row_value(match, "LSI Keywords (4-6)", "col_12"),
            "search_intent": row_value(match, "Search Intent", "col_13"),
            "pain_point": row_value(match, "Pain Point", "col_14"),
            "how_ai_fixes_it": row_value(match, "How AI Fixes It", "col_15"),
            "outline": row_value(match, "Content Brief Outline (H2 Structure)", "col_16"),
            "cta": row_value(match, "Recommended CTA", "col_17"),
            "meta_title": row_value(match, "Meta Title (<60 chars)", "col_18"),
            "meta_description": row_value(match, "Meta Description (<160 chars)", "col_19"),
            "source_url": row_value(match, "Research / Source URL", "col_20"),
        }
    }
]
