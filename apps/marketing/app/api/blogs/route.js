import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getDbBlogSummaries, saveBlogFromPayload } = require("../../../src/server/blog-store");

export const dynamic = "force-dynamic";

function json(body, status = 200) {
  return Response.json(body, { status });
}

function requireBlogAuth(request) {
  const configuredToken = process.env.BLOG_API_TOKEN;
  if (!configuredToken) {
    return { ok: false, status: 500, error: "BLOG_API_TOKEN is not configured on the server." };
  }

  const header = request.headers.get("authorization") || "";
  const receivedToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!receivedToken || receivedToken !== configuredToken) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}

export async function GET(request) {
  const url = new URL(request.url);
  const requestedLimit = Number.parseInt(url.searchParams.get("limit") || "6", 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 20) : 6;
  return json({ blogs: await getDbBlogSummaries(limit) });
}

export async function POST(request) {
  const auth = requireBlogAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  try {
    const body = await request.json();
    const { blog, created } = await saveBlogFromPayload(body || {});
    return json({ ok: true, blog }, created ? 201 : 200);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not save blog." }, 400);
  }
}
