import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getPublishedBlog } = require("../../../../src/server/blog-store");

export const dynamic = "force-dynamic";

export async function GET(_request, context) {
  const { slug } = (await context.params) || {};
  const blog = await getPublishedBlog(slug);
  if (!blog) return Response.json({ error: "Blog not found" }, { status: 404 });
  return Response.json({ blog });
}
