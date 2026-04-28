const business = require("../config/business");
const { escapeAttribute, escapeHtml, icon, listItems } = require("./html");
const { formatDisplayDate } = require("../lib/slugs");

function renderHeader() {
  const clientPortalIsExternal = /^https?:\/\//i.test(business.clientPortalUrl);

  return `
    <header class="site-header" aria-label="Primary navigation">
      <div class="header-strip">
        <div class="header-strip-inner">
          <span>${icon("map-pin")}Serving Buffalo, Niagara, and Western New York</span>
          <span>${icon("clock-3")}Free workflow audit for local businesses</span>
        </div>
      </div>
      <div class="header-main">
        <a class="brand" href="/" aria-label="${escapeAttribute(business.businessName)} home">
          ${renderBrandLockup()}
        </a>
        <nav class="nav-links" aria-label="Primary links">
          <a href="/services">Services</a>
          <a href="/industries">Industries</a>
          <a href="/locations">Locations</a>
          <a href="/resources">Resources</a>
          <a href="/blog">Blog</a>
          <a href="/free-workflow-audit">Free Audit</a>
        </nav>
        <div class="header-actions">
          <a class="button header-cta button-primary" href="/#workflow-form">
            ${icon("sparkles")}
            <span class="cta-label-full">Get My Free Automation Ideas</span>
            <span class="cta-label-short">Ideas</span>
          </a>
          <a class="button header-login button-secondary" href="${escapeAttribute(business.clientPortalUrl)}"${clientPortalIsExternal ? ' target="_blank" rel="noopener"' : ""}>
            ${icon("log-in")}
            <span>Client Login</span>
          </a>
        </div>
      </div>
    </header>`;
}

function renderFooter({ services = [], industries = [], locations = [] } = {}) {
  const contactLinks = [
    `<a href="mailto:${escapeAttribute(business.email)}">${escapeHtml(business.email)}</a>`,
    business.phone ? `<a href="tel:${escapeAttribute(business.phone)}">${escapeHtml(business.phone)}</a>` : "",
  ].filter(Boolean);

  return `
    <footer class="site-footer">
      <div class="section-inner footer-grid">
        <div class="footer-brand">
          <a class="brand" href="/" aria-label="${escapeAttribute(business.businessName)} home">
            ${renderBrandLockup()}
          </a>
          <p>Practical workflow automation for Buffalo, Niagara, and Western New York businesses.</p>
          <p>Serving Buffalo, Niagara Falls, Amherst, Williamsville, Cheektowaga, Tonawanda, Lockport, Lewiston, Grand Island, and surrounding Western New York communities.</p>
          <p>${contactLinks.join(" · ")}</p>
        </div>
        ${footerColumn("Services", services.slice(0, 6).map((item) => [item.title, `/services/${item.slug}`]))}
        ${footerColumn("Industries", industries.slice(0, 6).map((item) => [item.title.replace("Workflow Automation for ", ""), `/industries/${item.slug}`]))}
        ${footerColumn("Locations", locations.slice(0, 6).map((item) => [item.city, `/locations/${item.slug}`]))}
        ${footerColumn("Resources", [
          ["Free Workflow Audit", "/free-workflow-audit"],
          ["Missed Lead Calculator", "/tools/missed-lead-cost-calculator"],
          ["Automation ROI Calculator", "/tools/automation-roi-calculator"],
          ["Readiness Quiz", "/tools/ai-automation-readiness-quiz"],
          ["Blog", "/blog"],
          ["Sitemap", "/sitemap"],
          ["Privacy Policy", "/privacy-policy"],
          ["Terms", "/terms"],
        ])}
      </div>
    </footer>`;
}

function renderBrandLockup() {
  return `
    <span class="brand-mark" aria-hidden="true">${icon("workflow")}</span>
    <span class="brand-copy">
      <strong>${escapeHtml(business.businessName)}</strong>
      <small>${escapeHtml(business.tagline)}</small>
    </span>`;
}

function footerColumn(title, links) {
  return `
    <nav class="footer-column" aria-label="${escapeAttribute(title)}">
      <h2>${escapeHtml(title)}</h2>
      ${links.map(([label, href]) => `<a href="${escapeAttribute(href)}">${escapeHtml(label)}</a>`).join("")}
    </nav>`;
}

function renderSEOPageHero({
  eyebrow,
  h1,
  subheading,
  primaryHref = "/free-workflow-audit#workflow-form",
  primaryLabel = "Get My Free Automation Ideas",
  secondaryHref = business.bookingLink,
  secondaryLabel = "Book a Free Workflow Audit",
  valueHighlights = [],
  miniForm = false,
}) {
  const highlights = valueHighlights.length
    ? valueHighlights
    : [
        { icon: "mail-check", text: "Lead follow-up" },
        { icon: "calendar-check", text: "Scheduling" },
        { icon: "message-square", text: "Customer requests" },
        { icon: "clipboard-check", text: "Admin workflows" },
      ];

  return `
    <section class="page-hero${miniForm ? " page-hero-with-form" : ""}">
      <div class="section-inner page-hero-inner">
        <div class="page-hero-copy">
          ${eyebrow ? `<p class="section-kicker">${escapeHtml(eyebrow)}</p>` : ""}
          <h1>${escapeHtml(h1)}</h1>
          <p>${escapeHtml(subheading)}</p>
          <div class="hero-actions">
            <a class="button button-primary" href="${escapeAttribute(primaryHref)}">${icon("sparkles")}${escapeHtml(primaryLabel)}</a>
            <a class="button button-secondary" href="${escapeAttribute(secondaryHref)}">${icon("calendar-check")}${escapeHtml(secondaryLabel)}</a>
          </div>
          ${
            miniForm
              ? `<div class="hero-workflow-strip hero-proof-strip" aria-label="Why businesses start with WNY Automation Co">
                  ${highlights.map((item) => `<span>${icon(item.icon)}${escapeHtml(item.text)}</span>`).join("")}
                </div>`
              : ""
          }
        </div>
        ${
          miniForm
            ? renderWorkflowAuditForm({
                compact: true,
                conversionPath: "homepage-hero",
                source: h1,
                title: "Get 3 practical automation ideas for one workflow.",
                variant: "short",
              })
            : ""
        }
      </div>
    </section>`;
}

function renderWorkflowAuditForm({
  compact = false,
  conversionPath = compact ? "homepage-hero" : "page-form",
  source = "website",
  title = "What's one task your business does manually that wastes time?",
  variant = compact ? "short" : "standard",
} = {}) {
  const isShort = variant === "short";
  const visibleFields = isShort
    ? `${field("email", "Email", "email", "email", true)}${field("name", "Name", "text", "name", false)}`
    : `${field("name", "Name", "text", "name", true)}
        ${field("email", "Email", "email", "email", true)}
        ${field("phone", "Phone", "tel", "tel", false)}
        ${field("businessName", "Business Name", "text", "organization", true)}
        ${field("website", "Website", "url", "url", false)}
        ${field("industry", "Industry", "text", "off", true, "Contractor, med spa, restaurant...")}`;
  const optionalDetails = isShort
    ? `
      <details class="form-details">
        <summary>Add business details</summary>
        <div class="field-grid form-details-grid">
          ${field("businessName", "Business Name", "text", "organization", false)}
          ${field("industry", "Industry", "text", "off", false, "Contractor, med spa, restaurant...")}
          ${field("phone", "Phone", "tel", "tel", false)}
          ${field("website", "Website", "url", "url", false)}
        </div>
      </details>`
    : "";

  return `
    <form class="lead-form workflow-form${compact ? " lead-form-compact" : ""}" id="workflow-form" data-conversion-path="${escapeAttribute(conversionPath)}" data-form-variant="${escapeAttribute(variant)}" data-source="${escapeAttribute(source)}" aria-labelledby="workflow-form-title">
      <label class="bot-field" for="company-website">Company website confirmation</label>
      <input class="bot-field" id="company-website" name="companyWebsite" type="text" tabindex="-1" autocomplete="off" />
      <input type="hidden" name="conversionPath" value="${escapeAttribute(conversionPath)}" />
      <input type="hidden" name="formVariant" value="${escapeAttribute(variant)}" />
      <input type="hidden" name="pageSource" value="${escapeAttribute(source)}" />
      <div class="form-header">
        <p class="section-kicker">Free workflow audit</p>
        <h2 id="workflow-form-title">${escapeHtml(title)}</h2>
        <p>No pressure. No tech jargon. Just practical automation ideas from ${escapeHtml(business.businessName)} for one workflow.</p>
      </div>
      <label class="field field-full" for="manual-task">
        <span>Biggest manual task</span>
        <textarea id="manual-task" name="manualTask" rows="4" placeholder="Example: We manually follow up with every website lead..." required></textarea>
      </label>
      <div class="field-grid${isShort ? " field-grid-short" : ""}">
        ${visibleFields}
      </div>
      ${optionalDetails}
      <div class="form-actions">
        <button class="button button-primary" type="submit">${icon("send")}${isShort ? "Get 3 Automation Ideas" : "Get My Free Automation Ideas"}</button>
        <a class="button button-secondary" href="${escapeAttribute(business.bookingLink)}">${icon("calendar-days")}Book a Free Workflow Audit</a>
      </div>
      <div class="form-status" aria-live="polite"></div>
    </form>`;
}

function field(name, label, type, autocomplete, required, placeholder = "") {
  const id = `field-${name}`;
  return `
    <label class="field" for="${escapeAttribute(id)}">
      <span>${escapeHtml(label)}${required ? "" : " <em>optional</em>"}</span>
      <input id="${escapeAttribute(id)}" name="${escapeAttribute(name)}" type="${escapeAttribute(type)}" autocomplete="${escapeAttribute(autocomplete)}"${placeholder ? ` placeholder="${escapeAttribute(placeholder)}"` : ""}${required ? " required" : ""} />
    </label>`;
}

function renderBreadcrumbs(items = []) {
  if (!items.length) return "";

  return `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      ${items
        .map((item, index) => {
          const isLast = index === items.length - 1;
          return isLast
            ? `<span aria-current="page">${escapeHtml(item.label)}</span>`
            : `<a href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a>`;
        })
        .join(`<span class="breadcrumb-separator">/</span>`)}
    </nav>`;
}

function renderPainPointSection({ eyebrow = "Common pain points", title, items }) {
  return section(`
    <div class="section-heading">
      <p class="section-kicker">${escapeHtml(eyebrow)}</p>
      <h2>${escapeHtml(title)}</h2>
    </div>
    <div class="check-card-grid">
      ${(items || []).map((item) => `<article class="check-card">${icon("circle-alert")}<p>${escapeHtml(item)}</p></article>`).join("")}
    </div>`);
}

function renderHowItWorksSection() {
  return section(
    `
      <div class="section-heading">
        <p class="section-kicker">How it works</p>
        <h2>Start small. Prove value. Improve from there.</h2>
      </div>
      <div class="process-grid">
        ${processStep("1", "Tell us the manual task", "Submit the workflow that wastes time, creates delays, or causes missed opportunities.")}
        ${processStep("2", "We map the workflow", "WNY Automation Co reviews your tools, steps, handoffs, and where the process breaks down.")}
        ${processStep("3", "We build a small automation pilot", "If there is a fit, we start with one focused workflow before expanding anything else.")}
      </div>`,
    "process-section",
  );
}

function processStep(number, title, text) {
  return `<article class="process-step"><span>${number}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`;
}

function renderAutomationExamplesGrid({ title = "Example automations", examples }) {
  return section(`
    <div class="section-heading">
      <p class="section-kicker">Examples</p>
      <h2>${escapeHtml(title)}</h2>
    </div>
    <div class="card-grid examples-grid">
      ${(examples || []).map((item) => `<article class="project-card">${icon(item.icon || "workflow")}<h3>${escapeHtml(item.title || item)}</h3><p>${escapeHtml(item.description || "")}</p></article>`).join("")}
    </div>`);
}

function renderFAQSection(faqs = [], title = "Common questions") {
  if (!faqs.length) return "";

  return section(`
    <div class="section-heading">
      <p class="section-kicker">FAQ</p>
      <h2>${escapeHtml(title)}</h2>
    </div>
    <div class="faq-list">
      ${faqs
        .map(
          (faq) => `
            <details>
              <summary>${escapeHtml(faq.question)}</summary>
              <p>${escapeHtml(faq.answer)}</p>
            </details>`,
        )
        .join("")}
    </div>`, "faq-section");
}

function renderCTASection({
  eyebrow = "Free workflow audit",
  primaryHref = "/free-workflow-audit#workflow-form",
  primaryLabel = "Get My Free Automation Ideas",
  secondaryHref = business.bookingLink,
  secondaryLabel = "Book a Free Workflow Audit",
  title = "Ready to find the one workflow costing you the most time?",
  text = "Tell WNY Automation Co one manual task. We will review the workflow and send back practical automation ideas.",
  withForm = false,
  source = "CTA",
}) {
  return `
    <section class="final-cta">
      <div class="section-inner final-inner${withForm ? " final-inner-with-form" : ""}">
        <div>
          <p class="section-kicker">${escapeHtml(eyebrow)}</p>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(text)}</p>
          ${withForm ? "" : `<div class="final-actions"><a class="button button-primary" href="${escapeAttribute(primaryHref)}">${icon("send")}${escapeHtml(primaryLabel)}</a><a class="button button-secondary" href="${escapeAttribute(secondaryHref)}">${icon("calendar-days")}${escapeHtml(secondaryLabel)}</a></div>`}
        </div>
        ${withForm ? renderWorkflowAuditForm({ compact: true, conversionPath: "page-cta", source, variant: "standard" }) : ""}
      </div>
    </section>`;
}

function renderInternalLinksSection(title, links = []) {
  const validLinks = links.filter(Boolean);
  if (!validLinks.length) return "";

  return section(`
    <div class="section-heading">
      <p class="section-kicker">Related pages</p>
      <h2>${escapeHtml(title)}</h2>
    </div>
    <div class="related-links-grid">
      ${validLinks
        .map((link) => `<a class="related-link-card" href="${escapeAttribute(link.href)}"><strong>${escapeHtml(link.label)}</strong><span>${escapeHtml(link.description || "Learn more")}</span>${icon("arrow-up-right")}</a>`)
        .join("")}
    </div>`);
}

function renderTrustSection() {
  const contactItems = [
    `<li>${icon("mail")}<a href="mailto:${escapeAttribute(business.email)}">${escapeHtml(business.email)}</a></li>`,
    business.phone ? `<li>${icon("phone")}<a href="tel:${escapeAttribute(business.phone)}">${escapeHtml(business.phone)}</a></li>` : "",
  ].filter(Boolean);

  return section(
    `
      <div class="trust-proof-grid">
        <div class="section-heading">
          <p class="section-kicker">Provable trust</p>
          <h2>Local, practical, and built around one workflow at a time.</h2>
          <p>WNY Automation Co serves Buffalo, Niagara, and Western New York businesses with a free, no-pressure workflow audit. We look at the tools you already use first, then recommend a small automation only when it makes sense.</p>
          <ul class="trust-contact-list">${contactItems.join("")}</ul>
        </div>
        <ul class="feature-list trust-proof-list">
          <li>${icon("map-pin")}Focused on Buffalo, Niagara, and WNY businesses.</li>
          <li>${icon("badge-check")}Free audit before any paid pilot.</li>
          <li>${icon("target")}One workflow first, not your whole business.</li>
          <li>${icon("shield-check")}Human review for sensitive or high-stakes steps.</li>
        </ul>
      </div>`,
    "trust-section",
  );
}

function renderIndexGrid(items, basePath, emptyText = "No pages available yet.") {
  if (!items.length) {
    return `<p class="blog-empty">${escapeHtml(emptyText)}</p>`;
  }

  return `<div class="index-card-grid">${items
    .map(
      (item) => `
        <article class="index-card">
          <p class="section-kicker">${escapeHtml(item.primaryKeyword || item.city || item.category || "WNY Automation")}</p>
          <h2><a href="${escapeAttribute(`${basePath}/${item.slug}`)}">${escapeHtml(item.title || item.h1)}</a></h2>
          <p>${escapeHtml(item.shortDescription || item.intro || item.metaDescription || item.excerpt || "")}</p>
          <a class="blog-read-link" href="${escapeAttribute(`${basePath}/${item.slug}`)}">View page${icon("arrow-up-right")}</a>
        </article>`,
    )
    .join("")}</div>`;
}

function renderBlogCard(post, basePath = "/blog") {
  const status = post.status === "sample" ? "Sample draft" : post.industry || post.category || "WNY Automation Blog";
  const date = formatDisplayDate(post.publish_date || post.publishDate);
  return `
    <article class="blog-card">
      <a class="blog-card-media" href="${escapeAttribute(`${basePath}/${post.slug}`)}" aria-label="Read ${escapeAttribute(post.title)}">
        ${
          post.image_url || post.featuredImage
            ? `<img src="${escapeAttribute(post.image_url || post.featuredImage)}" alt="${escapeAttribute(post.image_alt || post.title)}" loading="lazy" />`
            : `<div class="blog-image-fallback">${icon("file-text")}</div>`
        }
      </a>
      <div class="blog-card-body">
        <div class="blog-meta">${date ? `<span>${escapeHtml(date)}</span>` : ""}<span>${escapeHtml(status)}</span></div>
        <h3><a href="${escapeAttribute(`${basePath}/${post.slug}`)}">${escapeHtml(post.title)}</a></h3>
        <p>${escapeHtml(post.caption || post.excerpt || "")}</p>
        <a class="blog-read-link" href="${escapeAttribute(`${basePath}/${post.slug}`)}">Read article${icon("arrow-up-right")}</a>
      </div>
    </article>`;
}

function renderToolShell({ slug, title, description, fields, resultId }) {
  return `
    <article class="calculator-card" data-calculator="${escapeAttribute(slug)}">
      <div>
        <p class="section-kicker">Interactive tool</p>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(description)}</p>
      </div>
      <div class="calculator-grid">
        ${fields
          .map(
            (fieldItem) => `
              <label class="field" for="${escapeAttribute(fieldItem.name)}">
                <span>${escapeHtml(fieldItem.label)}</span>
                <input id="${escapeAttribute(fieldItem.name)}" name="${escapeAttribute(fieldItem.name)}" type="${escapeAttribute(fieldItem.type || "number")}" min="${escapeAttribute(fieldItem.min || "0")}" step="${escapeAttribute(fieldItem.step || "1")}" value="${escapeAttribute(fieldItem.value || "")}" />
              </label>`,
          )
          .join("")}
      </div>
      <button class="button button-primary" type="button" data-calculate="${escapeAttribute(slug)}">${icon("calculator")}Calculate</button>
      <div class="calculator-result" id="${escapeAttribute(resultId)}" aria-live="polite"></div>
      <p class="calculator-disclaimer">This is an estimate, not a guarantee.</p>
    </article>`;
}

function section(content, className = "") {
  return `<section class="section${className ? ` ${escapeAttribute(className)}` : ""}"><div class="section-inner">${content}</div></section>`;
}

module.exports = {
  renderAutomationExamplesGrid,
  renderBlogCard,
  renderBreadcrumbs,
  renderCTASection,
  renderFAQSection,
  renderFooter,
  renderHeader,
  renderHowItWorksSection,
  renderIndexGrid,
  renderInternalLinksSection,
  renderPainPointSection,
  renderSEOPageHero,
  renderToolShell,
  renderTrustSection,
  renderWorkflowAuditForm,
  section,
};
