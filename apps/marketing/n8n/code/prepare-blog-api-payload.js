const item = $input.first() || { json: {}, binary: {} };
const json = item.json || {};
const image = item.binary?.blogImage;

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

const title = clean(json.generated_title || json.title || json.post_title);
const slug = slugify(json.slug || title);
const binaryDataUrl = image?.data ? `data:${image.mimeType || "image/png"};base64,${image.data}` : "";
const imageDataUrl = json.image_data_url || json.imageDataUrl || binaryDataUrl;

if (!title || !slug) {
  throw new Error("Cannot publish blog because title or slug is missing.");
}

if (!json.blog_html && !json.blog_markdown) {
  throw new Error("Cannot publish blog because blog_html and blog_markdown are both missing.");
}

return [
  {
    json: {
      title,
      slug,
      excerpt: json.excerpt || "",
      caption: json.caption || json.excerpt || "",
      meta_title: json.meta_title || title,
      meta_description: json.meta_description || json.excerpt || "",
      blog_markdown: json.blog_markdown || "",
      blog_html: json.blog_html || "",
      faq_schema_json: json.faq_schema_json || json.faq_schema || "",
      image_alt: json.image_alt || json.alt_text || `Hero image for ${title}`,
      industry: json.industry || "",
      publish_date: json.publish_date || json.today_iso || "",
      image_data_url: imageDataUrl,
      status: "published",
    },
  },
];
