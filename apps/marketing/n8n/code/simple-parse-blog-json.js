const source = $("Pick Today's Row").first().json;
const response = $input.first()?.json || {};

const PLANNING_SECTION_TITLES = [
  "Entity Signals",
  "Suggested Internal Links",
  "Internal Link Suggestions",
  "SEO Notes",
  "Editorial Notes",
  "Implementation Notes",
  "External Source Note",
  "FAQ Schema",
  "Schema Markup",
];

function stripFence(value) {
  return String(value || "")
    .trim()
    .replace(/^```(?:json|html|markdown)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function planningTitlePattern() {
  return PLANNING_SECTION_TITLES.map((title) => title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
}

function stripPlanningSections(value) {
  let text = String(value || "").trim();
  if (!text) return "";

  const titles = planningTitlePattern();
  const htmlHeading = new RegExp(`\\s*<h[1-6][^>]*>\\s*(?:${titles})\\s*<\\/h[1-6]>[\\s\\S]*$`, "i");
  const plainHeading = new RegExp(`(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:${titles})\\s*:?[\\s\\S]*$`, "i");

  text = text.replace(htmlHeading, "").replace(plainHeading, "");
  return text.replace(/<hr\s*\/?>\s*$/i, "").trim();
}

function inlineMarkdownToHtml(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+|#[^)\s]+)\)/g, (_match, label, href) => {
      return `<a href="${escapeAttribute(href)}">${label}</a>`;
    });
}

function cleanHtmlMarkdownArtifacts(value) {
  return stripPlanningSections(value)
    .replace(/\*\*([^*<>]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]<]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+|#[^)\s]+)\)/g, (_match, label, href) => {
      return `<a href="${escapeAttribute(href)}">${label}</a>`;
    })
    .trim();
}

function markdownToHtml(markdown) {
  const lines = stripPlanningSections(markdown).split(/\r?\n/);
  const html = [];
  let inList = false;
  let listTag = "ul";

  function closeList() {
    if (inList) {
      html.push(`</${listTag}>`);
      inList = false;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${inlineMarkdownToHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inlineMarkdownToHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${inlineMarkdownToHtml(line.slice(2))}</h1>`);
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList || listTag !== "ul") {
        closeList();
        listTag = "ul";
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdownToHtml(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inList || listTag !== "ol") {
        closeList();
        listTag = "ol";
        html.push("<ol>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdownToHtml(line.replace(/^\d+\.\s+/, ""))}</li>`);
    } else {
      closeList();
      html.push(`<p>${inlineMarkdownToHtml(line)}</p>`);
    }
  }

  closeList();
  return html.join("\n");
}

function normalizeJsonLd(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  const text = stripFence(value);
  if (!text) return "";

  try {
    return JSON.stringify(JSON.parse(text));
  } catch (error) {
    return "";
  }
}

const content =
  response.choices?.[0]?.message?.content ||
  response.message?.content ||
  response.content ||
  response.text ||
  "";

function parseTaggedOutput(value) {
  const text = String(value || "");
  const fields = [
    "generated_title",
    "slug",
    "meta_title",
    "meta_description",
    "excerpt",
    "image_prompt",
    "image_alt",
    "alt_text",
    "caption",
    "faq_schema_json",
    "blog_markdown",
    "blog_html",
  ];

  const output = {};

  for (const field of fields) {
    const pattern = new RegExp(`<${field}>\\s*([\\s\\S]*?)\\s*<\\/${field}>`, "i");
    const match = text.match(pattern);
    output[field] = match ? match[1].trim() : "";
  }

  if (!output.generated_title && !output.blog_markdown && !output.blog_html) {
    throw new Error("Could not parse Blog Creation output as structured fields, JSON, or tagged text.");
  }

  return output;
}

let blog;

if (response.generated_title || response.blog_markdown || response.blog_html) {
  blog = response;
} else if (typeof content === "object" && content !== null) {
  blog = content;
} else {
  const cleaned = stripFence(content);
  try {
    blog = JSON.parse(cleaned);
  } catch (error) {
    blog = parseTaggedOutput(cleaned);
  }
}

const title = blog.generated_title || blog.title || source.post_title;
const slug = slugify(blog.slug || title);
const blogMarkdown = stripPlanningSections(blog.blog_markdown || blog.markdown || "");
const rawBlogHtml = blog.blog_html || blog.html || "";
const blogHtml = cleanHtmlMarkdownArtifacts(rawBlogHtml || markdownToHtml(blogMarkdown));
const imageAlt = blog.image_alt || blog.alt_text || blog.image_alt_text || "";

if (!String(blogMarkdown || "").trim() && !String(blogHtml || "").trim()) {
  throw new Error("Blog Creation produced title/meta data but no blog_markdown or blog_html body.");
}

return [
  {
    json: {
      ...source,
      generated_title: title,
      slug,
      meta_title: blog.meta_title || source.meta_title,
      meta_description: blog.meta_description || source.meta_description,
      excerpt: blog.excerpt || "",
      blog_markdown: blogMarkdown,
      blog_html: blogHtml,
      image_prompt: blog.image_prompt || "",
      image_alt: imageAlt,
      alt_text: imageAlt,
      caption: blog.caption || blog.excerpt || "",
      faq_schema_json: normalizeJsonLd(blog.faq_schema_json || blog.faq_schema),
      image_file_name: `${slug}-hero.png`,
    },
  },
];
