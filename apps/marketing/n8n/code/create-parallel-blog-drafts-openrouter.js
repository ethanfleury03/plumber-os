// Put this Code node right after "Pick Today's Row".
//
// It replaces the three separate Blog Creation branches by calling all
// three draft models at the same time, then returns compact draft_1,
// draft_2, and draft_3 payloads for the Opus fusion LLM.
//
// Required n8n environment variable:
// OPENROUTER_API_KEY

const OPENROUTER_API_KEY = $env.OPENROUTER_API_KEY;

const DRAFT_MODELS = [
  {
    field: "draft_1",
    label: "SEO/AEO structure draft",
    model: "openai/gpt-5.5",
    perspective: "Prioritize search intent, answer-engine structure, headings, key takeaways, and FAQ quality.",
  },
  {
    field: "draft_2",
    label: "Local practical draft",
    model: "deepseek/deepseek-v4-flash",
    perspective: "Prioritize Buffalo/Niagara local specificity, practical small-business examples, and plain-English usefulness.",
  },
  {
    field: "draft_3",
    label: "Conversion draft",
    model: "anthropic/claude-opus-4.7",
    perspective: "Prioritize trust, CTA flow, objections, realistic limitations, and Free Workflow Audit conversion.",
  },
];

if (!OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the n8n environment.");
}

const inputItems = $input.all();
const sources = inputItems.length ? inputItems.map((item) => item.json || {}) : [{}];
const httpRequest = this.helpers.httpRequest.bind(this);
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 8000;
const MAX_DRAFT_BODY_CHARS = 12000;
const MAX_DRAFT_FIELD_CHARS = 1200;

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildDraftPrompt(row, draftConfig) {
  return `You are writing one candidate blog draft for WNY Automation Co. Another editor model will later fuse this draft with two other drafts, so focus on making this version genuinely strong from your assigned perspective.

Assigned perspective:
${draftConfig.perspective}

Business positioning:
- Brand: WNY Automation Co
- Market: Buffalo, Niagara, and Western New York
- Audience: local small business owners and operators who are busy, skeptical of hype, and want practical ways to save time.
- Core offer: Free Workflow Audit
- Tone: clear, useful, local, practical, direct, trustworthy, not futuristic, not buzzword-heavy.
- Avoid hype words like revolutionary, disruptive, game-changing, cutting-edge, unlock, transform, and leverage unless absolutely necessary.

Scheduled blog row:
- Blog number: ${clean(row.blog_number)}
- Publish date: ${clean(row.publish_date)}
- Industry: ${clean(row.industry)}
- Funnel stage: ${clean(row.funnel_stage)}
- Post title: ${clean(row.post_title)}
- Content type: ${clean(row.content_type)}
- Target word count: ${clean(row.target_word_count)}
- Primary keyword: ${clean(row.primary_keyword)}
- Secondary keywords: ${clean(row.secondary_keywords)}
- LSI keywords: ${clean(row.lsi_keywords)}
- Search intent: ${clean(row.search_intent)}
- Pain point: ${clean(row.pain_point)}
- How AI fixes it: ${clean(row.how_ai_fixes_it)}
- Required outline: ${clean(row.outline)}
- Recommended CTA: ${clean(row.cta)}
- Suggested meta title: ${clean(row.meta_title)}
- Suggested meta description: ${clean(row.meta_description)}
- Research/source URL: ${clean(row.source_url)}

Draft requirements:
- Write a complete candidate article in blog_markdown, not notes.
- Satisfy the search intent quickly in the first 2-3 sentences.
- Include a concise answer block, Key Takeaways, practical sections, a realistic example, limitations, CTA, and Common Questions.
- Use the primary keyword naturally. Do not keyword stuff.
- Include Buffalo, Niagara, Western New York, or WNY naturally where relevant.
- Add internal links naturally to /#automate, /#process, /#examples, or /#workflow-form.
- If the research/source URL is useful, include it as a real external link.
- Do not invent statistics, client results, case studies, prices, guarantees, or before/after metrics.
- Do not include Entity Signals, Suggested Internal Links, SEO notes, source notes, schema explanations, or editorial notes.
- Include an image prompt, image alt suggestion, and brief editor notes.
- Do not include blog_html. The final fusion model will create the clean semantic HTML.

Return only valid JSON. Do not use markdown fences.

Use this shape:
{
  "generated_title": "",
  "slug": "",
  "meta_title": "",
  "meta_description": "",
  "excerpt": "",
  "image_prompt": "",
  "image_alt": "",
  "blog_markdown": "",
  "editor_notes": ""
}`;
}

function trimText(value, maxChars) {
  const text = String(value || "").trim();
  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, maxChars).trim()}\n\n[Trimmed for fusion input size.]`;
}

function stripJsonFence(value) {
  return String(value || "")
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function parseJsonObject(value) {
  const text = stripJsonFence(value);

  try {
    return JSON.parse(text);
  } catch (error) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }

    throw error;
  }
}

function htmlToReadableText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function compactDraftContent(content) {
  try {
    const parsed = parseJsonObject(content);
    const markdown =
      parsed.blog_markdown ||
      parsed.markdown ||
      parsed.article_markdown ||
      htmlToReadableText(parsed.blog_html || parsed.html || "");

    return {
      generated_title: trimText(parsed.generated_title || parsed.title, MAX_DRAFT_FIELD_CHARS),
      slug: trimText(parsed.slug, MAX_DRAFT_FIELD_CHARS),
      meta_title: trimText(parsed.meta_title, MAX_DRAFT_FIELD_CHARS),
      meta_description: trimText(parsed.meta_description, MAX_DRAFT_FIELD_CHARS),
      excerpt: trimText(parsed.excerpt || parsed.summary, MAX_DRAFT_FIELD_CHARS),
      image_prompt: trimText(parsed.image_prompt, MAX_DRAFT_FIELD_CHARS),
      image_alt: trimText(parsed.image_alt || parsed.alt_text, MAX_DRAFT_FIELD_CHARS),
      blog_markdown: trimText(markdown, MAX_DRAFT_BODY_CHARS),
      editor_notes: trimText(parsed.editor_notes || parsed.notes || parsed.rationale, MAX_DRAFT_FIELD_CHARS),
    };
  } catch (error) {
    return {
      blog_markdown: trimText(content, MAX_DRAFT_BODY_CHARS),
      parse_warning: `Draft was not valid JSON before fusion compaction: ${error.message}`,
    };
  }
}

async function callOpenRouter(source, draftConfig) {
  let parsed;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      parsed = await httpRequest({
        method: "POST",
        url: "https://openrouter.ai/api/v1/chat/completions",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://wnyautomation.local",
          "X-Title": "WNY Automation Co Blog Draft Pipeline",
        },
        body: {
          model: draftConfig.model,
          temperature: 0.72,
          messages: [
            {
              role: "system",
              content: "Write one strong candidate blog draft for WNY Automation Co. Return only valid JSON.",
            },
            {
              role: "user",
              content: buildDraftPrompt(source, draftConfig),
            },
          ],
        },
        json: true,
        timeout: 300000,
      });
      break;
    } catch (error) {
      const statusCode = error.response?.statusCode || error.statusCode || error.status;
      const responseBody = error.response?.body ? JSON.stringify(error.response.body) : "";
      const isRetryable = statusCode === 429 || statusCode === 408 || statusCode >= 500;

      if (!isRetryable || attempt > MAX_RETRIES) {
        throw new Error(`${draftConfig.label} failed after ${attempt} attempt(s): ${error.message}${responseBody ? ` ${responseBody}` : ""}`);
      }

      await new Promise((resolve) => setTimeout(resolve, BASE_RETRY_DELAY_MS * attempt));
    }
  }

  const content =
    parsed.choices?.[0]?.message?.content ||
    parsed.message?.content ||
    parsed.content ||
    parsed.text ||
    "";

  return [
    draftConfig.field,
    JSON.stringify(
      {
        label: draftConfig.label,
        model: draftConfig.model,
        draft: compactDraftContent(content),
      },
      null,
      2,
    ),
  ];
}

async function createDraftsForSource(source, index, total) {
  const settledDrafts = await Promise.allSettled(DRAFT_MODELS.map((draftConfig) => callOpenRouter(source, draftConfig)));
  const failedDrafts = settledDrafts.filter((result) => result.status === "rejected");

  if (failedDrafts.length === settledDrafts.length) {
    throw new Error(`All parallel draft calls failed: ${failedDrafts.map((result) => result.reason.message).join(" | ")}`);
  }

  const drafts = {};
  const draft_errors = [];

  for (const result of settledDrafts) {
    if (result.status === "fulfilled") {
      const [field, draft] = result.value;
      drafts[field] = draft;
    } else {
      draft_errors.push(result.reason.message);
    }
  }

  return {
    json: {
      ...source,
      ...drafts,
      draft_errors,
      draft_batch_index: index + 1,
      draft_batch_count: total,
    },
  };
}

return (async () => {
  const output = [];

  // Process rows one at a time to avoid multiplying rate-limit pressure.
  // Each row still sends its three draft models in parallel.
  for (let index = 0; index < sources.length; index++) {
    output.push(await createDraftsForSource(sources[index], index, sources.length));
  }

  return output;
})();
