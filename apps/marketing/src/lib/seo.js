const business = require("../config/business");
const { escapeAttribute, escapeHtml } = require("../render/html");

function absoluteUrl(pathname = "/") {
  if (/^https?:\/\//i.test(pathname)) {
    return pathname;
  }

  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${business.siteUrl}${path}`;
}

function metadata(options = {}) {
  const title = options.title || business.defaultSeoTitle;
  const description = options.description || business.defaultSeoDescription;
  const path = options.path || "/";
  const image = options.image || "/assets/wny-automation-icon.svg";

  return {
    title,
    description,
    canonical: absoluteUrl(path),
    path,
    image: absoluteUrl(image),
    type: options.type || "website",
    noindex: Boolean(options.noindex),
  };
}

function renderMeta(meta) {
  const m = metadata(meta);
  const verification = business.analytics.gscVerification
    ? `<meta name="google-site-verification" content="${escapeAttribute(business.analytics.gscVerification)}" />`
    : "";
  const robots = m.noindex ? '<meta name="robots" content="noindex,nofollow" />' : "";

  return `
    <title>${escapeHtml(m.title)}</title>
    <meta name="description" content="${escapeAttribute(m.description)}" />
    <link rel="canonical" href="${escapeAttribute(m.canonical)}" />
    ${robots}
    ${verification}
    <meta property="og:title" content="${escapeAttribute(m.title)}" />
    <meta property="og:description" content="${escapeAttribute(m.description)}" />
    <meta property="og:type" content="${escapeAttribute(m.type)}" />
    <meta property="og:url" content="${escapeAttribute(m.canonical)}" />
    <meta property="og:image" content="${escapeAttribute(m.image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(m.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(m.description)}" />
    <meta name="twitter:image" content="${escapeAttribute(m.image)}" />`;
}

function renderTrackingScripts() {
  const scripts = [];

  if (business.analytics.gaId) {
    scripts.push(`
      <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeAttribute(business.analytics.gaId)}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${escapeAttribute(business.analytics.gaId)}');
      </script>`);
  }

  if (business.analytics.metaPixelId) {
    scripts.push(`
      <script>
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
        (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${escapeAttribute(business.analytics.metaPixelId)}');
        fbq('track', 'PageView');
      </script>`);
  }

  return scripts.join("\n");
}

function routeEntry(path, priority = "0.7", changefreq = "weekly") {
  return { path, priority, changefreq };
}

function buildStaticRoutes({ services, industries, locations, caseStudies, blogPosts }) {
  return [
    routeEntry("/", "1.0", "weekly"),
    routeEntry("/free-workflow-audit", "0.95", "monthly"),
    routeEntry("/services", "0.9", "weekly"),
    ...services.map((item) => routeEntry(`/services/${item.slug}`, "0.82", "monthly")),
    routeEntry("/industries", "0.85", "weekly"),
    ...industries.map((item) => routeEntry(`/industries/${item.slug}`, "0.78", "monthly")),
    routeEntry("/locations", "0.8", "weekly"),
    ...locations.map((item) => routeEntry(`/locations/${item.slug}`, "0.72", "monthly")),
    routeEntry("/resources", "0.76", "monthly"),
    routeEntry("/tools/missed-lead-cost-calculator", "0.76", "monthly"),
    routeEntry("/tools/automation-roi-calculator", "0.76", "monthly"),
    routeEntry("/tools/ai-automation-readiness-quiz", "0.74", "monthly"),
    routeEntry("/resources/workflow-audit-checklist", "0.74", "monthly"),
    routeEntry("/case-studies", "0.65", "monthly"),
    ...caseStudies.map((item) => routeEntry(`/case-studies/${item.slug}`, "0.58", "monthly")),
    routeEntry("/blog", "0.8", "weekly"),
    ...blogPosts.map((item) => routeEntry(`/blog/${item.slug}`, "0.55", "monthly")),
    routeEntry("/privacy-policy", "0.25", "yearly"),
    routeEntry("/terms", "0.25", "yearly"),
    routeEntry("/sitemap", "0.35", "monthly"),
  ];
}

module.exports = {
  absoluteUrl,
  buildStaticRoutes,
  metadata,
  renderMeta,
  renderTrackingScripts,
  routeEntry,
};
