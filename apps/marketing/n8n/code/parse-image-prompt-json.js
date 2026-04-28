const blog = $("Parse Blog JSON").first().json;
const response = $input.first()?.json || {};

function stripFence(value) {
  return String(value || "")
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

const content =
  response.choices?.[0]?.message?.content ||
  response.message?.content ||
  response.content ||
  response.text ||
  "";

let imageMeta;

if (response.image_prompt || response.alt_text || response.caption) {
  imageMeta = response;
} else if (typeof content === "object" && content !== null) {
  imageMeta = content;
} else {
  imageMeta = JSON.parse(stripFence(content));
}

return [
  {
    json: {
      ...blog,
      image_prompt: imageMeta.image_prompt || "",
      image_alt: imageMeta.image_alt || imageMeta.alt_text || blog.image_alt || "",
      alt_text: imageMeta.alt_text || imageMeta.image_alt || blog.alt_text || "",
      caption: imageMeta.caption || "",
      image_file_name: `${blog.slug || "wny-automation-blog"}-hero.png`,
    },
  },
];
