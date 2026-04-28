const blog = $("Parse Blog JSON").first().json;
const imageItem = $input.first() || { json: {}, binary: {} };
const imageJson = imageItem.json || {};
const imageBinary = imageItem.binary || {};
const imageDataUrl =
  imageJson.imageDataUrl ||
  imageJson.image_data_url ||
  imageJson.dataUrl ||
  imageJson.data_url ||
  "";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeScriptJson(value) {
  return String(value || "")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function safeFileName(value) {
  return (
    String(value || "wny-automation-blog")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "wny-automation-blog"
  );
}

function inlineMarkdownToHtml(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+|#[^)\s]+)\)/g, (_match, label, href) => {
      return `<a href="${escapeHtml(href)}">${label}</a>`;
    });
}

function markdownToHtml(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
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
  if (typeof value === "object") return JSON.stringify(value);

  try {
    return JSON.stringify(JSON.parse(String(value)));
  } catch (error) {
    return "";
  }
}

if (!imageBinary.blogImage) {
  const match = String(imageDataUrl).match(/^data:([^;]+);base64,(.+)$/);

  if (match) {
    imageBinary.blogImage = {
      data: match[2],
      mimeType: match[1],
      fileName: blog.image_file_name,
    };
  }
}

if (!imageBinary.blogImage) {
  throw new Error("Image node must return binary.blogImage or a base64 data URL named imageDataUrl.");
}

const title = blog.generated_title || blog.post_title || "Untitled Blog";
const publishDate = blog.publish_date || blog.today_iso || "the scheduled date";
const slug = safeFileName(blog.slug || title);
const bodyHtml = String(blog.blog_html || "").trim() || markdownToHtml(blog.blog_markdown);
const faqSchemaJson = normalizeJsonLd(blog.faq_schema_json || blog.faq_schema);
const schemaScript = faqSchemaJson
  ? `\n  <script type="application/ld+json">${escapeScriptJson(faqSchemaJson)}</script>`
  : "";

if (!String(bodyHtml || "").trim()) {
  throw new Error("Cannot create blog HTML attachment because blog_html and blog_markdown are both empty.");
}

const emailHtml = [
  "Hello Ethan,<br><br>",
  `Here is your blog for ${escapeHtml(publishDate)} about ${escapeHtml(title)}. Attached are the publish-ready HTML and image.<br><br>`,
  `<strong>Slug:</strong> ${escapeHtml(slug)}<br>`,
  `<strong>Meta title:</strong> ${escapeHtml(blog.meta_title || title)}<br>`,
  `<strong>Meta description:</strong> ${escapeHtml(blog.meta_description || blog.excerpt || "")}<br>`,
  `<strong>Image alt:</strong> ${escapeHtml(blog.image_alt || blog.alt_text || "")}<br>`,
  `<strong>FAQ schema:</strong> ${faqSchemaJson ? "Included" : "Not included"}<br><br>`,
  "Best,<br>Blogger.",
].join("");

const blogDocumentHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(blog.meta_title || title)}</title>
  <meta name="description" content="${escapeHtml(blog.meta_description || blog.excerpt || "")}">${schemaScript}
</head>
<body>
${bodyHtml}
</body>
</html>`;

imageBinary.blogHtml = {
  data: Buffer.from(blogDocumentHtml, "utf8").toString("base64"),
  mimeType: "text/html",
  fileName: `${slug}.html`,
};

return [
  {
    json: {
      ...blog,
      faq_schema_json: faqSchemaJson,
      image_alt: blog.image_alt || blog.alt_text || "",
      image_data_url: imageDataUrl,
      email_subject: `Blog: "${title}"`,
      email_html: emailHtml,
      blog_html_file_name: `${slug}.html`,
    },
    binary: imageBinary,
  },
];
