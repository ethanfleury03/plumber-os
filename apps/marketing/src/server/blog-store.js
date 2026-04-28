const crypto = require("node:crypto");
const { Pool } = require("@neondatabase/serverless");
const blogPosts = require("../data/blogPosts");
const { clean, normalizeDate, slugify } = require("../lib/slugs");
const { markdownToHtml } = require("../render/html");
const { putR2Object, r2ConfigFromEnv } = require("./r2");

const memoryBlogs = new Map();
let pool = null;
let schemaReady = false;

function databaseUrl() {
  return process.env.DATABASE_URL?.trim();
}

function getPool() {
  if (pool) return pool;
  pool = new Pool({ connectionString: databaseUrl() });
  return pool;
}

async function query(text, values = []) {
  if (!databaseUrl()) return { rows: [] };
  await ensureSchema();
  return getPool().query(text, values);
}

async function ensureSchema() {
  if (!databaseUrl() || schemaReady) return;
  schemaReady = true;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS marketing_blogs (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT,
      caption TEXT,
      meta_title TEXT,
      meta_description TEXT,
      blog_markdown TEXT,
      blog_html TEXT,
      image_url TEXT,
      image_alt TEXT,
      faq_schema_json TEXT,
      industry TEXT,
      publish_date TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_marketing_blogs_status_publish_date
      ON marketing_blogs(status, publish_date, created_at);
  `);
}

function toBlogSummary(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    caption: row.caption,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    image_url: row.image_url,
    image_alt: row.image_alt,
    industry: row.industry,
    publish_date: row.publish_date,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: "WNY Automation Co",
    category: row.industry || "WNY Automation Co Blog",
  };
}

function toPublicBlog(row) {
  return {
    ...toBlogSummary(row),
    blog_markdown: row.blog_markdown,
    blog_html: normalizeBlogHtml(row.blog_html || markdownToHtml(row.blog_markdown || "")),
    faq_schema_json: row.faq_schema_json || "",
  };
}

function sortBlogs(left, right) {
  const leftDate = left.publish_date || left.publishDate || left.created_at || "";
  const rightDate = right.publish_date || right.publishDate || right.created_at || "";
  return rightDate.localeCompare(leftDate);
}

async function getDbBlogSummaries(limit = 20) {
  if (!databaseUrl()) {
    return [...memoryBlogs.values()]
      .filter((blog) => blog.status === "published")
      .sort(sortBlogs)
      .slice(0, limit)
      .map(toBlogSummary);
  }

  const result = await query(
    `
      SELECT id, title, slug, excerpt, caption, meta_title, meta_description,
        image_url, image_alt, industry, publish_date, status, created_at, updated_at
      FROM marketing_blogs
      WHERE status = 'published'
      ORDER BY COALESCE(publish_date, created_at) DESC, created_at DESC
      LIMIT $1
    `,
    [limit],
  );
  return result.rows.map(toBlogSummary);
}

async function getPublishedBlog(slug) {
  const cleanSlug = clean(slug);
  if (!cleanSlug) return null;

  if (!databaseUrl()) {
    const blog = memoryBlogs.get(cleanSlug);
    return blog?.status === "published" ? toPublicBlog(blog) : null;
  }

  const result = await query(
    "SELECT * FROM marketing_blogs WHERE slug = $1 AND status = 'published' LIMIT 1",
    [cleanSlug],
  );
  return result.rows[0] ? toPublicBlog(result.rows[0]) : null;
}

async function getAllBlogPosts() {
  const dbPosts = await getDbBlogSummaries(50);
  const dbSlugs = new Set(dbPosts.map((post) => post.slug));
  const samples = blogPosts.filter((post) => !dbSlugs.has(post.slug));
  return [...dbPosts, ...samples].sort(sortBlogs);
}

async function getDbBlogRoutes() {
  return (await getDbBlogSummaries(100)).map((blog) => ({
    path: `/blog/${blog.slug}`,
    priority: "0.64",
    changefreq: "monthly",
  }));
}

async function saveBlogFromPayload(body) {
  const title = clean(body.title || body.generated_title || body.post_title);
  const slug = slugify(body.slug || title);

  if (!title || !slug) {
    throw new Error("A blog title or slug is required.");
  }

  const existing = await findBlogBySlug(slug);
  const now = new Date().toISOString();
  let imageUrl = clean(body.image_url || existing?.image_url || "");

  if (body.image_data_url) {
    imageUrl = await saveImageDataUrl(body.image_data_url, slug);
  }

  const blog = {
    id: existing?.id || crypto.randomUUID(),
    title,
    slug,
    excerpt: clean(body.excerpt),
    caption: clean(body.caption || body.excerpt),
    meta_title: clean(body.meta_title || title),
    meta_description: clean(body.meta_description || body.excerpt || body.caption),
    blog_markdown: stripInternalNotes(String(body.blog_markdown || "")),
    blog_html: normalizeBlogHtml(body.blog_html || ""),
    image_url: imageUrl,
    image_alt: clean(body.image_alt || `${title} blog hero image`),
    faq_schema_json: normalizeJsonLd(body.faq_schema_json || body.faq_schema || ""),
    industry: clean(body.industry),
    publish_date: normalizeDate(body.publish_date),
    status: clean(body.status || "published").toLowerCase() === "draft" ? "draft" : "published",
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  if (!blog.blog_html && blog.blog_markdown) {
    blog.blog_html = markdownToHtml(blog.blog_markdown);
  }

  if (!databaseUrl()) {
    memoryBlogs.set(slug, blog);
    return { blog: toPublicBlog(blog), created: !existing };
  }

  await query(
    `
      INSERT INTO marketing_blogs (
        id, title, slug, excerpt, caption, meta_title, meta_description,
        blog_markdown, blog_html, image_url, image_alt, faq_schema_json, industry, publish_date,
        status, created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17
      )
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        excerpt = excluded.excerpt,
        caption = excluded.caption,
        meta_title = excluded.meta_title,
        meta_description = excluded.meta_description,
        blog_markdown = excluded.blog_markdown,
        blog_html = excluded.blog_html,
        image_url = excluded.image_url,
        image_alt = excluded.image_alt,
        faq_schema_json = excluded.faq_schema_json,
        industry = excluded.industry,
        publish_date = excluded.publish_date,
        status = excluded.status,
        updated_at = excluded.updated_at
    `,
    [
      blog.id,
      blog.title,
      blog.slug,
      blog.excerpt,
      blog.caption,
      blog.meta_title,
      blog.meta_description,
      blog.blog_markdown,
      blog.blog_html,
      blog.image_url,
      blog.image_alt,
      blog.faq_schema_json,
      blog.industry,
      blog.publish_date,
      blog.status,
      blog.created_at,
      blog.updated_at,
    ],
  );

  const saved = await findBlogBySlug(slug);
  return { blog: toPublicBlog(saved), created: !existing };
}

async function findBlogBySlug(slug) {
  if (!databaseUrl()) return memoryBlogs.get(slug) || null;
  const result = await query("SELECT * FROM marketing_blogs WHERE slug = $1 LIMIT 1", [slug]);
  return result.rows[0] || null;
}

async function saveImageDataUrl(imageDataUrl, slug) {
  const match = String(imageDataUrl).match(/^data:image\/(png|jpe?g|webp);base64,([\s\S]+)$/i);
  if (!match) {
    throw new Error("image_data_url must be a base64 data URL for png, jpg, jpeg, or webp.");
  }

  const rawExtension = match[1].toLowerCase();
  const extension = rawExtension === "jpeg" ? "jpg" : rawExtension;
  const contentType = `image/${rawExtension === "jpg" ? "jpeg" : rawExtension}`;
  const buffer = Buffer.from(match[2], "base64");

  if (!r2ConfigFromEnv()) {
    if (process.env.NODE_ENV !== "production" || process.env.ALLOW_DATA_URL_BLOG_IMAGES === "true") {
      return imageDataUrl;
    }
    throw new Error("R2 is required for blog image uploads in production.");
  }

  return putR2Object(`marketing/blogs/${slug}.${extension}`, buffer, contentType);
}

const INTERNAL_NOTE_TITLES = [
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

function stripInternalNotes(value) {
  let text = String(value || "").trim();
  if (!text) return "";

  const titles = INTERNAL_NOTE_TITLES.map(escapeRegExp).join("|");
  const htmlHeading = new RegExp(`\\s*<h[1-6][^>]*>\\s*(?:${titles})\\s*:?\\s*<\\/h[1-6]>[\\s\\S]*$`, "i");
  const plainHeading = new RegExp(`(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:${titles})\\s*:?\\s*(?:\\n|$)[\\s\\S]*$`, "i");

  text = text.replace(htmlHeading, "").replace(plainHeading, "");
  return text.replace(/<hr\s*\/?>\s*$/i, "").trim();
}

function normalizeBlogHtml(html) {
  const withoutNotes = stripInternalNotes(html)
    .replace(/\*\*([^*<>]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]<]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+|#[^)\s]+)\)/g, (_match, label, href) => {
      return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
    });

  return sanitizeArticleHtml(withoutNotes).trim();
}

function normalizeJsonLd(value) {
  if (!value) return "";
  if (typeof value === "object") return JSON.stringify(value);

  const text = String(value)
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeArticleHtml(html) {
  return String(html || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s+href\s*=\s*"javascript:[^"]*"/gi, ' href="#"')
    .replace(/\s+href\s*=\s*'javascript:[^']*'/gi, " href='#'");
}

module.exports = {
  getAllBlogPosts,
  getDbBlogRoutes,
  getDbBlogSummaries,
  getPublishedBlog,
  normalizeBlogHtml,
  saveBlogFromPayload,
};
