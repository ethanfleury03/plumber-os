# Simple WNY Automation Co n8n Blog Pipeline

This is the stripped-down v1 workflow.

The original v1 goal was:

```text
Trigger -> Google Sheets row -> LLM blog draft -> JS image generation -> merge blog + image -> email to you
```

The website now includes a local blog API, so the chain can optionally auto-post after the email step works.

## Workflow File

Import this into n8n:

```text
n8n/n8n-blog-pipeline.workflow.json
```

## Source Sheet

Spreadsheet ID:

```text
1QGYmKLTQL_f4zgpBi6caRurOiq69G1LFC1tUKgPSbk0
```

Tab:

```text
Blog Schedule
```

Structure:

- Row 1 is the title/banner.
- Row 2 is the header row.
- Blog rows start on row 3.
- `Publish Date` decides what row is used.

## Simple Node Chain

1. `Manual Trigger`
   - Use this for testing.

2. `Schedule Trigger - MWF Noon`
   - Runs Monday, Wednesday, and Friday at noon.
   - Timezone: `America/New_York`.

3. `Set Today`
   - Code node.
   - Paste `code/simple-set-today.js`.
   - For testing, temporarily set `override_today_iso` to `2026-04-27` with a Set node or edit the code.

4. `Google Sheets - Pull Blog Schedule`
   - Reads the existing `Blog Schedule` tab.
   - Use range `A2:T` so row 2 is treated as headers.

5. `Pick Today's Row`
   - Code node.
   - Paste `code/simple-pick-today-row.js`.
   - If there is no matching date, it returns no items and the workflow stops.

6. `LLM Blog Call`
   - HTTP Request or your preferred LLM node.
   - Input is the selected schedule row.
   - Use the prompt in `n8n/prompts/blog-llm-user-message.txt`.
   - Output should be strict JSON with publish-ready public content:

```json
{
  "generated_title": "",
  "slug": "",
  "meta_title": "",
  "meta_description": "",
  "excerpt": "",
  "image_prompt": "",
  "image_alt": "",
  "faq_schema_json": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": []
  },
  "blog_markdown": "",
  "blog_html": ""
}
```

   `blog_html` must use real HTML tags for emphasis and links, such as `<strong>` and `<a>`, not raw Markdown. Do not include reader-facing SEO planning sections like `Entity Signals` or `Suggested Internal Links`.

7. `Parse Blog JSON`
   - Code node.
   - Paste `code/simple-parse-blog-json.js`.
   - Turns the LLM response into clean fields for the rest of the workflow.

8. `JS Image Generation`
   - This is your existing JS node that calls OpenRouter / the ChatGPT image model.
   - It should use:

```text
{{$json.image_prompt}}
```

   - Best output is binary field:

```text
blogImage
```

   - Also accepted: `imageDataUrl` as a base64 data URL.

9. `Merge Blog + Image`
   - Code node.
   - Paste `code/simple-merge-blog-and-image.js`.
   - Combines the parsed blog fields with the generated image.

10. `Email Blog Draft`
    - Gmail or Send Email node.
    - Subject:

```text
{{$json.email_subject}}
```

    - HTML body:

```text
{{$json.email_html}}
```

   - Attachment binary field:

```text
blogImage
blogHtml
```

11. Optional `Prepare Blog API Payload`
    - Code node.
    - Paste `code/prepare-blog-api-payload.js`.
    - Put this after `Merge Blog + Image`.
    - It creates the JSON body expected by the WNY Automation Co website API.

12. `Publish to WNY Automation Co Blog API`
    - HTTP Request node.
    - Method: `POST`
    - URL:

```text
http://localhost:3000/api/blogs
```

    - If n8n runs in Docker, use:

```text
http://host.docker.internal:3000/api/blogs
```

    - Headers:

```text
Authorization: Bearer <your blog API token>
Content-Type: application/json
```

    - Body: JSON, send the current item JSON from `Prepare Blog API Payload`.
    - If n8n runs in Docker, use `http://host.docker.internal:3000/api/blogs` instead of `localhost`.
    - Paste the token directly into the node header if your n8n instance blocks environment variable access.

## Three-Draft Fusion Setup

If you want three blog models to draft in parallel and then have Opus combine them:

Fastest setup:

```text
Pick Today's Row
-> Create Parallel Blog Drafts
-> Opus Fusion LLM
-> Parse Blog JSON
-> Image Creation
-> Parse Image Prompt JSON
-> OpenRouter Image
-> Merge Blog + Image
-> Email / Blog API
```

For `Create Parallel Blog Drafts`, paste:

```text
n8n/code/create-parallel-blog-drafts-openrouter.js
```

The repo default models are `openai/gpt-5.5`, `deepseek/deepseek-v4-flash`, and `anthropic/claude-opus-4.7`. This Code node uses `Promise.allSettled`, so it sends all three model calls at the same time and still continues if one draft model fails.

Visual branch setup:

```text
Pick Today's Row
-> Blog Creation 1
-> Blog Creation 2
-> Blog Creation 3
-> Merge by Position
-> Prepare Fusion Drafts
-> Opus Fusion LLM
-> Parse Blog JSON
-> Image Creation
-> Parse Image Prompt JSON
-> OpenRouter Image
-> Merge Blog + Image
-> Email / Blog API
```

For the one `Prepare Fusion Drafts` Code node after Merge, paste:

```text
n8n/code/prepare-fusion-drafts-after-merge.js
```

At the top of that code, make sure the node names match your canvas:

```js
const BLOG_DRAFT_NODES = [
  { field: "draft_1", model: "Blog Creation 1", nodeName: "Blog Creation1" },
  { field: "draft_2", model: "Blog Creation 2", nodeName: "Blog Creation" },
  { field: "draft_3", model: "Blog Creation 3", nodeName: "Blog Creation2" },
];
```

For the Opus fusion node, use:

```text
n8n/prompts/blog-fusion-llm-user-message.txt
```

The Opus fusion node should return the same JSON shape as the regular blog node. It can then go directly into `Parse Blog JSON`.

## One-Time Blog Backfill

Use this when you want to fill the site with several new posts immediately instead of waiting for their scheduled dates.

1. Open:

```text
n8n/blog-calendar-backfill-rows.tsv
```

2. Copy rows 38-42 into the `Blog Schedule` Google Sheet under the existing rows.

3. Add a Code node after `Google Sheets - Pull Blog Schedule` named:

```text
Pick Backfill Blog Rows
```

4. Paste:

```text
n8n/code/pick-backfill-blog-rows.js
```

5. For the one-time run, connect:

```text
Google Sheets - Pull Blog Schedule
-> Pick Backfill Blog Rows
-> Create Parallel Blog Drafts
```

Then run manually. The backfill picker returns the five rows dated `2026-04-28` through `2026-05-02`. `Create Parallel Blog Drafts` supports multiple input rows and processes each row one at a time while still running the three draft models in parallel for that row.

After the backfill succeeds, reconnect the normal scheduled path:

```text
Google Sheets - Pull Blog Schedule
-> Pick Today's Row
-> Create Parallel Blog Drafts
```

## Test It

1. Import the workflow JSON.
2. Connect Google Sheets credentials.
3. Connect Gmail or email credentials.
4. Add your OpenRouter API key wherever your image JS node expects it.
5. Paste the four simple code files into their matching Code nodes.
6. Temporarily test with `2026-04-27`, the first scheduled blog row.
7. Run manually.
8. Confirm you receive one email with blog content and image attachment.
9. Start the WNY Automation Co website server with `BLOG_API_TOKEN` set.
10. Confirm the `Publish to WNY Automation Co Blog API` node succeeds and the post appears at `/blogs/{slug}`.
11. Remove the date override.
12. Activate the schedule.

## Direct n8n API Editing

You sent the API token, but I still need the n8n base URL before I can edit your n8n instance directly.

Example:

```text
https://your-workspace.app.n8n.cloud
```

I will not save the API token in the repo.
