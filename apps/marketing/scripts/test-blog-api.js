const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PORT = 3137;
const TOKEN = "test-blog-token";
const BASE_URL = `http://localhost:${PORT}`;

const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "-p", String(PORT)], {
  cwd: ROOT,
  env: {
    ...process.env,
    PORT: String(PORT),
    BLOG_API_TOKEN: TOKEN,
    ALLOW_DATA_URL_BLOG_IMAGES: "true",
    NEXT_PUBLIC_SITE_URL: BASE_URL,
    NEXT_PUBLIC_CLIENT_PORTAL_URL: "https://app.wnyautomation.com/sign-in",
    N8N_LEAD_WEBHOOK_URL: "",
    NODE_NO_WARNINGS: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

server.stdout.on("data", (chunk) => process.stdout.write(chunk));
server.stderr.on("data", (chunk) => process.stderr.write(chunk));

async function waitForServer() {
  const started = Date.now();

  while (Date.now() - started < 8000) {
    try {
      const response = await fetch(`${BASE_URL}/api/blogs?limit=1`);
      if (response.ok) return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  throw new Error("Server did not start in time.");
}

async function request(pathname, options = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, options);
  const text = await response.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch (error) {
    body = text;
  }

  return { response, body, text };
}

async function expectPage(pathname, expectedText) {
  const { response, text } = await request(pathname);

  if (!response.ok) {
    throw new Error(`Expected ${pathname} to return 200, got ${response.status}`);
  }

  if (!text.includes(expectedText)) {
    throw new Error(`Expected ${pathname} to include ${expectedText}`);
  }

  const h1Count = (text.match(/<h1[\s>]/g) || []).length;
  if (h1Count !== 1) {
    throw new Error(`Expected ${pathname} to have one h1, got ${h1Count}`);
  }

  if (!text.includes('rel="canonical"')) {
    throw new Error(`Expected ${pathname} to include a canonical link.`);
  }

  if (!text.includes('name="description"')) {
    throw new Error(`Expected ${pathname} to include a meta description.`);
  }

  if (/fake testimonials?|fake client logos?/i.test(text)) {
    throw new Error(`Expected ${pathname} not to include fake claim language.`);
  }
}

async function expectLeadFocusedHomepage() {
  const { response, text } = await request("/");

  if (!response.ok) {
    throw new Error(`Expected / to return 200, got ${response.status}`);
  }

  const checks = [
    'href="/#workflow-form"',
    'class="button header-login button-secondary"',
    'href="https://app.wnyautomation.com/sign-in"',
    "Client Login",
    'href="#workflow-form"',
    'class="lead-form workflow-form lead-form-compact"',
    'data-form-variant="short"',
    'name="manualTask"',
    'name="email"',
    'required></textarea>',
    'type="email" autocomplete="email" required',
    '<details class="form-details">',
    'name="businessName"',
    'name="industry"',
    'name="phone"',
    'name="website"',
    "No tech jargon",
    "Current tools first",
    "Local WNY support",
  ];

  for (const check of checks) {
    if (!text.includes(check)) {
      throw new Error(`Expected homepage lead capture markup to include ${check}`);
    }
  }

  if (text.includes("(716) 555-0100") || text.includes("Address placeholder")) {
    throw new Error("Expected homepage not to render placeholder trust details.");
  }
}

async function main() {
  await waitForServer();

  await expectPage("/", "Practical automation for Buffalo");
  await expectLeadFocusedHomepage();
  await expectPage("/services", "Workflow automation services built around real small-business work.");
  await expectPage("/services/automated-lead-follow-up", "Automated Lead Follow-Up for Small Businesses");
  await expectPage("/industries", "Workflow automation ideas for local industries.");
  await expectPage("/industries/hvac-companies", "Workflow Automation for HVAC Companies");
  await expectPage("/locations", "Practical workflow automation across Buffalo");
  await expectPage("/locations/buffalo-ny", "Workflow Automation for Small Businesses in Buffalo");
  await expectPage("/resources", "Tools and guides for finding automation opportunities.");
  await expectPage("/tools/missed-lead-cost-calculator", "Missed Lead Cost Calculator");
  await expectPage("/case-studies", "Workflow examples for future case studies.");
  await expectPage("/privacy-policy", "Privacy Policy");

  const portal = await fetch(`${BASE_URL}/client-portal`, { redirect: "manual" });
  if (portal.status !== 302 || !portal.headers.get("location")?.includes("app.wnyautomation.com/sign-in")) {
    throw new Error("Expected /client-portal to redirect to the WNY Automation Portal sign-in URL.");
  }

  const lead = await request("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "lead@example.com",
      manualTask: "Manual lead follow-up",
      formVariant: "short",
      conversionPath: "homepage-hero",
      detailFieldsProvided: "",
      source: "test",
    }),
  });

  if (!lead.response.ok || !lead.body.ok || lead.body.configured !== false) {
    throw new Error(`Expected /api/leads dev success, got ${lead.response.status}: ${JSON.stringify(lead.body)}`);
  }

  const unauthorized = await request("/api/blogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Unauthorized Test", slug: "unauthorized-test" }),
  });

  if (unauthorized.response.status !== 401) {
    throw new Error(`Expected unauthorized POST to return 401, got ${unauthorized.response.status}`);
  }

  const sampleImage =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can a Buffalo small business automate follow-up?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. A small business can start by automating one repeatable follow-up workflow.",
        },
      },
    ],
  };

  const create = await request("/api/blogs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      title: "Sample WNY Automation Co Blog",
      slug: "sample-wny-automation-blog",
      excerpt: "A short practical test post for the WNY Automation Co blog feed.",
      caption: "A quick sample article for testing the feed.",
      meta_title: "Sample WNY Automation Co Blog",
      meta_description: "A short practical test post for the WNY Automation Co blog feed.",
      blog_markdown: "## Quick Answer\nThis is a local test post.",
      blog_html:
        '<h2>Quick Answer</h2><p>**Pick one workflow.** [Book your Free Workflow Audit](/#workflow-form)</p><h2>Entity Signals</h2><ul><li>Buffalo</li></ul>',
      faq_schema_json: faqSchema,
      image_alt: "Sample WNY Automation Co blog image",
      industry: "Local Small Business",
      publish_date: "2026-04-27",
      image_data_url: sampleImage,
    }),
  });

  if (![200, 201].includes(create.response.status) || !create.body.ok) {
    throw new Error(`Expected authorized POST to succeed, got ${create.response.status}: ${JSON.stringify(create.body)}`);
  }

  if (!create.body.blog.blog_html.includes("<strong>Pick one workflow.</strong>")) {
    throw new Error("Expected blog_html to convert Markdown bold to strong tags.");
  }

  if (!create.body.blog.blog_html.includes('<a href="/#workflow-form">Book your Free Workflow Audit</a>')) {
    throw new Error("Expected blog_html to convert Markdown links to anchor tags.");
  }

  if (create.body.blog.blog_html.includes("Entity Signals")) {
    throw new Error("Expected reader-facing SEO planning sections to be stripped.");
  }

  const xss = await request("/api/blogs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      title: "Unsafe Blog HTML Test",
      slug: "unsafe-blog-html-test",
      excerpt: "Sanitizer regression test.",
      blog_html:
        '<h2 onclick=alert(1)>Safe Heading</h2><p><strong>Safe bold</strong><a href="javascript:alert(1)" onclick="alert(1)">Bad link</a><a href="/#workflow-form">Safe internal</a><a href="#top">Safe anchor</a><a href="mailto:test@example.com">Safe mail</a></p><svg onload=alert(1)></svg><iframe src="https://example.com"></iframe><script>alert(1)</script><style>body{display:none}</style>',
      publish_date: "2026-04-27",
    }),
  });

  if (![200, 201].includes(xss.response.status) || !xss.body.ok) {
    throw new Error(`Expected XSS sanitizer POST to succeed, got ${xss.response.status}: ${JSON.stringify(xss.body)}`);
  }

  const cleaned = xss.body.blog.blog_html;
  const forbidden = [
    "onclick",
    "onload",
    "javascript:",
    "<svg",
    "<iframe",
    "<script",
    "<style",
  ];
  for (const token of forbidden) {
    if (cleaned.toLowerCase().includes(token)) {
      throw new Error(`Expected sanitizer to remove ${token}, got ${cleaned}`);
    }
  }
  for (const expected of [
    "<h2>Safe Heading</h2>",
    "<strong>Safe bold</strong>",
    '<a>Bad link</a>',
    '<a href="/#workflow-form">Safe internal</a>',
    '<a href="#top">Safe anchor</a>',
    '<a href="mailto:test@example.com">Safe mail</a>',
  ]) {
    if (!cleaned.includes(expected)) {
      throw new Error(`Expected sanitized HTML to include ${expected}, got ${cleaned}`);
    }
  }

  const update = await request("/api/blogs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      title: "Sample WNY Automation Co Blog Updated",
      slug: "sample-wny-automation-blog",
      excerpt: "Updated excerpt.",
      blog_html: "<h2>Updated</h2><p>**Updated bold.** [Read examples](/#examples)</p>",
      faq_schema_json: faqSchema,
      publish_date: "2026-04-27",
    }),
  });

  if (update.response.status !== 200) {
    throw new Error(`Expected duplicate slug to update, got ${update.response.status}`);
  }

  const list = await request("/api/blogs?limit=6");

  if (!list.response.ok || !list.body.blogs?.some((blog) => blog.slug === "sample-wny-automation-blog")) {
    throw new Error("Expected blog list to include the sample post.");
  }

  const blogPage = await fetch(`${BASE_URL}/blog/sample-wny-automation-blog`);

  if (!blogPage.ok) {
    throw new Error(`Expected blog page to render, got ${blogPage.status}`);
  }

  const blogPageHtml = await blogPage.text();

  if (!blogPageHtml.includes('type="application/ld+json"')) {
    throw new Error("Expected blog page to include JSON-LD.");
  }

  if (!blogPageHtml.includes("<strong>Updated bold.</strong>") || blogPageHtml.includes("**Updated bold.**")) {
    throw new Error("Expected rendered blog page to show cleaned HTML formatting.");
  }

  const sitemap = await request("/sitemap.xml");
  if (!sitemap.response.ok || !sitemap.text.includes("/services/automated-lead-follow-up") || !sitemap.text.includes("/locations/buffalo-ny")) {
    throw new Error("Expected sitemap to include important SEO routes.");
  }

  const robots = await request("/robots.txt");
  if (!robots.response.ok || !robots.text.includes("Sitemap:") || robots.text.includes("Disallow: /services")) {
    throw new Error("Expected robots.txt to allow SEO pages and include sitemap.");
  }

  console.log("WNY Automation Co SEO and blog smoke test passed.");
}

async function stopServer() {
  if (server.exitCode !== null || server.killed) {
    return;
  }

  await new Promise((resolve) => {
    server.once("exit", resolve);
    server.kill();
    setTimeout(resolve, 1500);
  });
}

function cleanup() {
  fs.rmSync(path.join(ROOT, ".next"), { force: true, recursive: true });
}

(async () => {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await stopServer();
    cleanup();
  }
})();
