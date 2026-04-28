import { NextResponse } from "next/server";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const {
  caseStudyBySlug,
  getStaticRoutes,
  industryBySlug,
  locationBySlug,
  renderBlogIndexPage,
  renderBlogPostPage,
  renderCaseStudiesIndex,
  renderCaseStudyPage,
  renderChecklistPage,
  renderHomePage,
  renderHtmlSitemapPage,
  renderIndustriesIndex,
  renderIndustryPage,
  renderLegalPage,
  renderLocationsIndex,
  renderLocationPage,
  renderMissedLeadCalculatorPage,
  renderNotFoundPage,
  renderReadinessQuizPage,
  renderResourcesPage,
  renderRobotsTxt,
  renderRoiCalculatorPage,
  renderServicePage,
  renderServicesIndex,
  renderSitemapXml,
  renderWorkflowAuditPage,
  sampleBlogBySlug,
  serviceBySlug,
} = require("../../src/render/pages");
const business = require("../../src/config/business");
const {
  getAllBlogPosts,
  getDbBlogRoutes,
  getPublishedBlog,
} = require("../../src/server/blog-store");

export const dynamic = "force-dynamic";

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function text(body, contentType = "text/plain; charset=utf-8") {
  return new Response(body, {
    headers: { "content-type": contentType },
  });
}

async function routePath(context) {
  const params = await context?.params;
  const parts = params?.path || [];
  return `/${parts.join("/")}`.replace(/\/+$/, "") || "/";
}

async function getAllRoutes() {
  const staticRoutes = getStaticRoutes();
  const staticPaths = new Set(staticRoutes.map((route) => route.path));
  const dbRoutes = (await getDbBlogRoutes()).filter((route) => !staticPaths.has(route.path));
  return [...staticRoutes, ...dbRoutes];
}

export async function GET(request, context) {
  const pathname = await routePath(context);

  if (pathname === "/") return html(renderHomePage(await getAllBlogPosts()));
  if (pathname === "/free-workflow-audit") return html(renderWorkflowAuditPage());
  if (pathname === "/services") return html(renderServicesIndex());
  if (pathname === "/industries") return html(renderIndustriesIndex());
  if (pathname === "/locations") return html(renderLocationsIndex());
  if (pathname === "/resources") return html(renderResourcesPage());
  if (pathname === "/tools/missed-lead-cost-calculator") return html(renderMissedLeadCalculatorPage());
  if (pathname === "/tools/automation-roi-calculator") return html(renderRoiCalculatorPage());
  if (pathname === "/tools/ai-automation-readiness-quiz") return html(renderReadinessQuizPage());
  if (pathname === "/resources/workflow-audit-checklist") return html(renderChecklistPage());
  if (pathname === "/case-studies") return html(renderCaseStudiesIndex());
  if (pathname === "/privacy-policy") return html(renderLegalPage("privacy"));
  if (pathname === "/terms") return html(renderLegalPage("terms"));
  if (pathname === "/blog") return html(renderBlogIndexPage(await getAllBlogPosts()));
  if (pathname === "/blogs") return NextResponse.redirect(new URL("/blog", request.url), 301);
  if (pathname === "/client-portal") {
    return NextResponse.redirect(new URL(business.clientPortalUrl, request.url), 302);
  }
  if (pathname === "/sitemap") return html(renderHtmlSitemapPage(await getAllRoutes()));
  if (pathname === "/sitemap.xml") return text(renderSitemapXml(await getAllRoutes()), "application/xml; charset=utf-8");
  if (pathname === "/robots.txt") return text(renderRobotsTxt());

  const segments = pathname.split("/").filter(Boolean);
  const [section, slug] = segments;

  if (segments.length === 2 && section === "services") {
    const service = serviceBySlug.get(slug);
    return service ? html(renderServicePage(service)) : html(renderNotFoundPage(), 404);
  }

  if (segments.length === 2 && section === "industries") {
    const industry = industryBySlug.get(slug);
    return industry ? html(renderIndustryPage(industry)) : html(renderNotFoundPage(), 404);
  }

  if (segments.length === 2 && section === "locations") {
    const location = locationBySlug.get(slug);
    return location ? html(renderLocationPage(location)) : html(renderNotFoundPage(), 404);
  }

  if (segments.length === 2 && section === "case-studies") {
    const caseStudy = caseStudyBySlug.get(slug);
    return caseStudy ? html(renderCaseStudyPage(caseStudy)) : html(renderNotFoundPage(), 404);
  }

  if (segments.length === 2 && section === "blog") {
    const blog = (await getPublishedBlog(slug)) || sampleBlogBySlug.get(slug);
    return blog ? html(renderBlogPostPage(blog)) : html(renderNotFoundPage(), 404);
  }

  if (segments.length === 2 && section === "blogs") {
    return NextResponse.redirect(new URL(`/blog/${encodeURIComponent(slug)}`, request.url), 301);
  }

  return html(renderNotFoundPage(), 404);
}
