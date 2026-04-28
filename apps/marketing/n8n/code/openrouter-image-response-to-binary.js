const item = $input.first();
const json = item.json || {};
const blog = $("Parse Image Prompt JSON").first().json;

const dataUrl =
  json.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
  json.choices?.[0]?.message?.images?.[0]?.imageUrl?.url ||
  json.imageDataUrl ||
  json.image_data_url ||
  "";

const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);

if (!match) {
  throw new Error("OpenRouter image response did not include choices[0].message.images[0].image_url.url as a base64 data URL.");
}

return [
  {
    json: {
      ...blog,
      image_data_url_preview: dataUrl.slice(0, 80),
    },
    binary: {
      blogImage: {
        data: match[2],
        mimeType: match[1],
        fileName: blog.image_file_name,
      },
    },
  },
];
