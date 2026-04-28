const business = require("../config/business");
const services = require("../data/services");
const industries = require("../data/industries");
const locations = require("../data/locations");
const caseStudies = require("../data/caseStudies");
const blogPosts = require("../data/blogPosts");
const { homepageFaqs, workflowAuditFaqs } = require("../data/faqs");
const { absoluteUrl, buildStaticRoutes } = require("../lib/seo");
const {
  articleSchema,
  breadcrumbSchema,
  compactSchemas,
  faqPageSchema,
  localBusinessSchema,
  organizationSchema,
  serviceSchema,
  websiteSchema,
} = require("../lib/schema");
const { formatDisplayDate } = require("../lib/slugs");
const { escapeAttribute, escapeHtml, icon, listItems, markdownToHtml } = require("./html");
const { renderPage } = require("./layout");
const {
  renderAutomationExamplesGrid,
  renderBlogCard,
  renderBreadcrumbs,
  renderCTASection,
  renderFAQSection,
  renderHowItWorksSection,
  renderIndexGrid,
  renderInternalLinksSection,
  renderPainPointSection,
  renderSEOPageHero,
  renderToolShell,
  renderTrustSection,
  renderWorkflowAuditForm,
  section,
} = require("./components");

const serviceBySlug = new Map(services.map((item) => [item.slug, item]));
const industryBySlug = new Map(industries.map((item) => [item.slug, item]));
const locationBySlug = new Map(locations.map((item) => [item.slug, item]));
const caseStudyBySlug = new Map(caseStudies.map((item) => [item.slug, item]));
const sampleBlogBySlug = new Map(blogPosts.map((item) => [item.slug, item]));

const defaultExamples = [
  {
    icon: "reply",
    title: "Lead follow-up",
    description: "Respond to inquiries faster and create follow-up tasks automatically.",
  },
  {
    icon: "message-circle-question",
    title: "Customer FAQ workflows",
    description: "Answer repeated questions with approved business information.",
  },
  {
    icon: "calendar-clock",
    title: "Appointment reminders",
    description: "Reduce missed appointments with confirmations and reminders.",
  },
  {
    icon: "list-todo",
    title: "Form-to-task routing",
    description: "Turn forms into organized tasks, alerts, and next steps.",
  },
  {
    icon: "star",
    title: "Review requests",
    description: "Ask happy customers for reviews at the right time.",
  },
  {
    icon: "book-open-check",
    title: "Internal knowledge assistants",
    description: "Help staff find SOPs and answers without interrupting managers.",
  },
];

function page(body, meta, schemas = [], bodyClass = "") {
  return renderPage({
    meta,
    schemas: compactSchemas([organizationSchema(), websiteSchema(), ...schemas]),
    body,
    bodyClass,
    services,
    industries,
    locations,
  });
}

function renderHomePage(blogItems = []) {
  const body = `
    <main id="top">
      ${renderSEOPageHero({
        eyebrow: "Practical automation for Buffalo, Niagara, and WNY businesses",
        h1: "Get 3 practical automation ideas for one manual workflow.",
        subheading:
          "Tell WNY Automation Co the task your business keeps doing by hand. We will review it and send back practical ideas for saving time, improving follow-up, or reducing admin work.",
        primaryHref: "#workflow-form",
        primaryLabel: "Get 3 Automation Ideas",
        valueHighlights: [
          { icon: "speech", text: "No tech jargon" },
          { icon: "plug", text: "Current tools first" },
          { icon: "target", text: "Small pilot first" },
          { icon: "map-pin", text: "Local WNY support" },
        ],
        miniForm: true,
      })}
      ${renderTrustSection()}
      ${renderAutomationExamplesGrid({ title: "Practical fixes for work your team keeps repeating.", examples: defaultExamples })}
      ${renderHowItWorksSection()}
      ${renderFAQSection(homepageFaqs, "Short answers before you book")}
      ${renderCTASection({
        primaryHref: "#workflow-form",
        primaryLabel: "Get 3 Automation Ideas",
        text: "Tell us one manual task. We will review it and send back practical ideas before you commit to a paid project.",
        withForm: false,
      })}
    </main>`;

  return page(
    body,
    {
      title: business.defaultSeoTitle,
      description: business.defaultSeoDescription,
      path: "/",
    },
    [localBusinessSchema("/"), faqPageSchema(homepageFaqs)],
  );
}

function renderBlogPreview(posts) {
  return section(`
    <div class="section-heading">
      <p class="section-kicker">WNY Automation Co Blog</p>
      <h2>Practical automation ideas for local businesses.</h2>
      <p>Plain-English guides for reducing admin work, improving follow-up, and making operations smoother.</p>
    </div>
    <div class="blog-feed">${posts.length ? posts.map((post) => renderBlogCard(post)).join("") : `<p class="blog-empty">No blog posts are published yet.</p>`}</div>
    <div class="section-actions"><a class="button button-secondary" href="/blog">${icon("book-open")}View all posts</a></div>`, "blogs-section");
}

function renderWorkflowAuditPage() {
  const body = `
    <main>
      ${renderSEOPageHero({
        eyebrow: "Free workflow audit",
        h1: "Free Workflow Audit for Buffalo Small Businesses",
        subheading:
          "Submit one repetitive task and WNY Automation Co will help identify practical automation ideas that fit your current tools and team.",
        primaryHref: "#workflow-form",
      })}
      ${section(`
        <div class="two-column-section">
          <div>
            <p class="section-kicker">What the audit includes</p>
            <h2>A clear look at one workflow before you buy more tools.</h2>
            ${listItems([
              "The manual steps your team follows today",
              "The tools already connected to the task",
              "Where delays or missed opportunities happen",
              "A small first automation idea if it makes sense",
            ], "check-list")}
          </div>
          <div class="audit-panel">
            <h3>Good tasks to submit</h3>
            ${listItems([
              "Manual lead follow-up",
              "Appointment reminders",
              "Customer FAQs",
              "Quote follow-up",
              "Review requests",
              "Copying form data into another tool",
            ], "check-list")}
          </div>
        </div>`)}
      ${renderHowItWorksSection()}
      ${section(renderWorkflowAuditForm({ source: "Free Workflow Audit Page" }), "form-section")}
      ${renderFAQSection(workflowAuditFaqs, "Workflow audit questions")}
    </main>`;

  return page(
    body,
    {
      title: "Free Workflow Audit for Buffalo Small Businesses | WNY Automation Co",
      description:
        "Submit one manual task and get practical automation ideas for your Buffalo or Western New York small business.",
      path: "/free-workflow-audit",
    },
    [localBusinessSchema("/free-workflow-audit"), faqPageSchema(workflowAuditFaqs)],
  );
}

function renderServicesIndex() {
  return indexPage({
    path: "/services",
    title: "Workflow Automation Services for Buffalo Small Businesses | WNY Automation Co",
    h1: "Workflow automation services built around real small-business work.",
    intro:
      "Explore practical automation services for lead follow-up, customer questions, appointment reminders, CRM updates, admin workflows, and more.",
    items: services,
    basePath: "/services",
  });
}

function renderIndustriesIndex() {
  return indexPage({
    path: "/industries",
    title: "Workflow Automation by Industry | WNY Automation Co",
    h1: "Workflow automation ideas for local industries.",
    intro:
      "Browse practical workflow ideas for home services, professional offices, restaurants, med spas, contractors, property managers, and other local businesses.",
    items: industries,
    basePath: "/industries",
  });
}

function renderLocationsIndex() {
  return indexPage({
    path: "/locations",
    title: "Workflow Automation Locations in Western New York | WNY Automation Co",
    h1: "Practical workflow automation across Buffalo, Niagara, and WNY.",
    intro:
      "WNY Automation Co helps local businesses in Buffalo, Niagara Falls, Amherst, Williamsville, Cheektowaga, and nearby communities start with one practical workflow.",
    items: locations,
    basePath: "/locations",
  });
}

function indexPage({ path, title, h1, intro, items, basePath }) {
  const body = `
    <main>
      ${renderSEOPageHero({ eyebrow: "WNY Automation Co", h1, subheading: intro })}
      ${section(renderIndexGrid(items, basePath))}
      ${renderCTASection({ withForm: false })}
    </main>`;

  return page(body, { title, description: intro, path });
}

function renderServicePage(service) {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: service.title, href: `/services/${service.slug}` },
  ];
  const related = [...serviceLinks(service.relatedServices), ...industryLinks(service.relatedIndustries)];
  const body = `
    <main>
      <div class="section-inner">${renderBreadcrumbs(crumbs)}</div>
      ${renderSEOPageHero({
        eyebrow: "Workflow automation service",
        h1: service.h1,
        subheading: service.shortDescription,
      })}
      ${renderPainPointSection({ title: "Manual work this can help reduce", items: service.painPoints })}
      ${section(`
        <div class="two-column-section">
          <div>
            <p class="section-kicker">What this automation does</p>
            <h2>Simple workflow support without a giant software project.</h2>
            <p>${escapeHtml(service.shortDescription)}</p>
            <h3>Example workflow</h3>
            <p>${escapeHtml(service.exampleWorkflow)}</p>
          </div>
          <div class="audit-panel">
            <h3>Tools it can connect to</h3>
            ${listItems(service.toolsItCanConnect, "check-list")}
          </div>
        </div>`)}
      ${section(`
        <div class="section-heading"><p class="section-kicker">Benefits</p><h2>What a cleaner workflow can improve.</h2></div>
        <div class="check-card-grid">${service.benefits.map((item) => `<article class="check-card">${icon("check")}<p>${escapeHtml(item)}</p></article>`).join("")}</div>`)}
      ${renderHowItWorksSection()}
      ${renderInternalLinksSection("Related services and industries", related)}
      ${renderFAQSection(service.faqs, "Questions about this service")}
      ${renderCTASection({ withForm: true, source: service.title })}
    </main>`;

  return page(
    body,
    {
      title: service.metaTitle,
      description: service.metaDescription,
      path: `/services/${service.slug}`,
    },
    [breadcrumbSchema(crumbs), serviceSchema(service), faqPageSchema(service.faqs)],
  );
}

function renderIndustryPage(industry) {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Industries", href: "/industries" },
    { label: industry.title, href: `/industries/${industry.slug}` },
  ];
  const body = `
    <main>
      <div class="section-inner">${renderBreadcrumbs(crumbs)}</div>
      ${renderSEOPageHero({ eyebrow: "Industry automation", h1: industry.h1, subheading: industry.intro })}
      ${renderPainPointSection({ title: "Common manual tasks in this industry", items: industry.commonPainPoints })}
      ${renderAutomationExamplesGrid({
        title: "How workflow automation can help",
        examples: industry.automationIdeas.map((item) => ({ title: item, description: "A focused workflow that can be reviewed by a human before expanding." })),
      })}
      ${section(`
        <div class="two-column-section">
          <div>
            <p class="section-kicker">Example workflow</p>
            <h2>A realistic first automation.</h2>
            <p>${escapeHtml(industry.exampleWorkflow)}</p>
          </div>
          <div class="audit-panel">
            <h3>Start small</h3>
            <p>Pick one repeated task with clear steps. Prove the workflow, then decide whether to improve more of the operation.</p>
          </div>
        </div>`)}
      ${renderInternalLinksSection("Recommended automations", serviceLinks(industry.recommendedServices))}
      ${renderFAQSection(industry.faqs, "Questions for this industry")}
      ${renderCTASection({ withForm: true, source: industry.title })}
    </main>`;

  return page(
    body,
    {
      title: industry.metaTitle,
      description: industry.metaDescription,
      path: `/industries/${industry.slug}`,
    },
    [breadcrumbSchema(crumbs), faqPageSchema(industry.faqs)],
  );
}

function renderLocationPage(location) {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Locations", href: "/locations" },
    { label: `${location.city}, NY`, href: `/locations/${location.slug}` },
  ];
  const body = `
    <main>
      <div class="section-inner">${renderBreadcrumbs(crumbs)}</div>
      ${renderSEOPageHero({ eyebrow: "Local automation service area", h1: location.h1, subheading: location.intro })}
      ${section(`
        <div class="two-column-section">
          <div>
            <p class="section-kicker">Local businesses we help</p>
            <h2>Built for real small-business operations in ${escapeHtml(location.city)}.</h2>
            ${listItems(location.localBusinessTypes, "check-list")}
          </div>
          <div class="audit-panel">
            <h3>Common workflows to automate</h3>
            ${listItems(location.commonPainPoints, "check-list")}
          </div>
        </div>`)}
      ${renderInternalLinksSection("Recommended services", serviceLinks(location.recommendedServices))}
      ${renderFAQSection(location.faqs, `${location.city} automation questions`)}
      ${renderInternalLinksSection("Nearby locations", locationLinks(location.nearbyLocations))}
      ${renderCTASection({ withForm: true, source: location.title })}
    </main>`;

  return page(
    body,
    {
      title: location.metaTitle,
      description: location.metaDescription,
      path: `/locations/${location.slug}`,
    },
    [breadcrumbSchema(crumbs), localBusinessSchema(`/locations/${location.slug}`), faqPageSchema(location.faqs)],
  );
}

function renderResourcesPage() {
  const resources = [
    {
      slug: "missed-lead-cost-calculator",
      title: "Missed Lead Cost Calculator",
      intro: "Estimate what slow lead response could be costing.",
      path: "/tools/missed-lead-cost-calculator",
    },
    {
      slug: "automation-roi-calculator",
      title: "Automation ROI Calculator",
      intro: "Estimate the time cost of one manual workflow.",
      path: "/tools/automation-roi-calculator",
    },
    {
      slug: "ai-automation-readiness-quiz",
      title: "Workflow Automation Readiness Quiz",
      intro: "Find out whether your workflows are ready for a small pilot.",
      path: "/tools/ai-automation-readiness-quiz",
    },
    {
      slug: "workflow-audit-checklist",
      title: "Small Business Workflow Audit Checklist",
      intro: "Review the places where manual work usually hides.",
      path: "/resources/workflow-audit-checklist",
    },
  ];
  const cards = resources
    .map(
      (item) => `<article class="index-card"><h2><a href="${escapeAttribute(item.path)}">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.intro)}</p><a class="blog-read-link" href="${escapeAttribute(item.path)}">Open resource${icon("arrow-up-right")}</a></article>`,
    )
    .join("");
  const body = `<main>${renderSEOPageHero({ eyebrow: "Resources", h1: "Tools and guides for finding automation opportunities.", subheading: "Use these simple resources to spot repetitive work, estimate lost time, and prepare for a free workflow audit." })}${section(`<div class="index-card-grid">${cards}</div>`)}${renderCTASection({ withForm: false })}</main>`;
  return page(body, {
    title: "Workflow Automation Resources for Small Businesses | WNY Automation Co",
    description: "Calculators, checklists, guides, and blog resources for practical small business automation.",
    path: "/resources",
  });
}

function renderMissedLeadCalculatorPage() {
  return toolPage({
    path: "/tools/missed-lead-cost-calculator",
    title: "Missed Lead Cost Calculator | WNY Automation Co",
    h1: "Missed Lead Cost Calculator",
    intro: "Estimate how much missed lead follow-up could be costing your business.",
    toolHtml: renderToolShell({
      slug: "missed-lead",
      title: "Estimate missed lead opportunity",
      description: "Enter rough monthly numbers. The output is only a planning estimate.",
      resultId: "missed-lead-result",
      fields: [
        { name: "monthlyWebsiteLeads", label: "Monthly website leads", value: "20" },
        { name: "monthlyMissedCalls", label: "Monthly missed calls", value: "10" },
        { name: "averageJobValue", label: "Average job value", value: "750" },
        { name: "estimatedCloseRate", label: "Estimated close rate %", value: "25" },
        { name: "currentResponseTime", label: "Current response time in hours", value: "12" },
        { name: "missedOpportunityPercent", label: "Estimated missed opportunity %", value: "20" },
      ],
    }),
  });
}

function renderRoiCalculatorPage() {
  return toolPage({
    path: "/tools/automation-roi-calculator",
    title: "Automation ROI Calculator | WNY Automation Co",
    h1: "Automation ROI Calculator",
    intro: "Estimate the time cost of one manual workflow and what a small automation might help reduce.",
    toolHtml: renderToolShell({
      slug: "automation-roi",
      title: "Estimate manual workflow cost",
      description: "Use this to frame a workflow audit conversation. It is not a guaranteed ROI forecast.",
      resultId: "automation-roi-result",
      fields: [
        { name: "weeklyHours", label: "Hours spent weekly on task", value: "5" },
        { name: "hourlyCost", label: "Staff hourly cost", value: "25" },
        { name: "peopleInvolved", label: "Number of people involved", value: "2" },
        { name: "automationCost", label: "Estimated automation cost placeholder", value: "500" },
        { name: "monthlyVolume", label: "Monthly volume of task", value: "80" },
      ],
    }),
  });
}

function renderReadinessQuizPage() {
  const questions = [
    "Do you manually follow up with leads?",
    "Do customers ask the same questions repeatedly?",
    "Do you use spreadsheets to track important work?",
    "Do you manually send reminders?",
    "Do you manually request reviews?",
    "Do you copy and paste data between tools?",
    "Do you have a CRM?",
    "Do you have documented workflows?",
  ];
  const toolHtml = `
    <article class="calculator-card" data-calculator="readiness-quiz">
      <div><p class="section-kicker">Interactive quiz</p><h2>Workflow automation readiness quiz</h2><p>Check the items that are true for your business.</p></div>
      <div class="quiz-list">
        ${questions.map((question, index) => `<label><input type="checkbox" name="q${index}" /> <span>${escapeHtml(question)}</span></label>`).join("")}
      </div>
      <button class="button button-primary" type="button" data-calculate="readiness-quiz">${icon("list-check")}See readiness</button>
      <div class="calculator-result" id="readiness-quiz-result" aria-live="polite"></div>
    </article>`;

  return toolPage({
    path: "/tools/ai-automation-readiness-quiz",
    title: "Workflow Automation Readiness Quiz | WNY Automation Co",
    h1: "Workflow Automation Readiness Quiz",
    intro: "Find out whether your business has a strong first workflow for automation.",
    toolHtml,
  });
}

function toolPage({ path, title, h1, intro, toolHtml }) {
  const body = `<main>${renderSEOPageHero({ eyebrow: "Automation tool", h1, subheading: intro })}${section(toolHtml)}${renderCTASection({ withForm: true, source: h1 })}</main>`;
  return page(body, { title, description: intro, path });
}

function renderChecklistPage() {
  const sections = [
    "Lead capture",
    "Lead follow-up",
    "Scheduling",
    "Customer questions",
    "Quotes and estimates",
    "Invoices and payments",
    "Reviews",
    "Internal admin",
    "Reporting",
    "Staff questions",
  ];
  const body = `
    <main>
      ${renderSEOPageHero({
        eyebrow: "Checklist",
        h1: "Small Business Workflow Audit Checklist",
        subheading: "Use this checklist to find repetitive tasks that might be worth simplifying or automating.",
      })}
      ${section(`<div class="check-card-grid">${sections.map((item) => `<article class="check-card">${icon("square-check")}<p>${escapeHtml(item)}</p></article>`).join("")}</div>`)}
      ${renderCTASection({ withForm: true, source: "Workflow Audit Checklist" })}
    </main>`;
  return page(body, {
    title: "Small Business Workflow Audit Checklist | WNY Automation Co",
    description: "A practical checklist for finding lead, scheduling, FAQ, quote, review, and admin workflows to improve.",
    path: "/resources/workflow-audit-checklist",
  });
}

function renderCaseStudiesIndex() {
  const body = `
    <main>
      ${renderSEOPageHero({
        eyebrow: "Sample workflows",
        h1: "Workflow examples for future case studies.",
        subheading: "These are sample workflow examples, not client case studies. Replace them with approved real stories when ready.",
      })}
      ${section(renderIndexGrid(caseStudies, "/case-studies"))}
      ${renderCTASection({ withForm: false })}
    </main>`;
  return page(body, {
    title: "Sample Workflow Examples | WNY Automation Co",
    description: "Sample workflow examples for local business automation. These are not client case studies.",
    path: "/case-studies",
  });
}

function renderCaseStudyPage(caseStudy) {
  const body = `
    <main>
      ${renderSEOPageHero({
        eyebrow: caseStudy.disclaimer,
        h1: caseStudy.title,
        subheading: `${caseStudy.businessType} example workflow in ${caseStudy.location}. This is not a real client result.`,
      })}
      ${section(`
        <div class="two-column-section">
          <div>
            <p class="section-kicker">Problem</p>
            <h2>${escapeHtml(caseStudy.problem)}</h2>
            <p>${escapeHtml(caseStudy.solution)}</p>
          </div>
          <div class="audit-panel"><h3>Tools used</h3>${listItems(caseStudy.toolsUsed, "check-list")}</div>
        </div>`)}
      ${section(`<div class="section-heading"><p class="section-kicker">Workflow</p><h2>Sample steps.</h2></div>${listItems(caseStudy.workflow, "numbered-list")}`)}
      ${renderInternalLinksSection("Related services", serviceLinks(caseStudy.relatedServices))}
      ${renderCTASection({ withForm: false })}
    </main>`;
  return page(body, {
    title: `${caseStudy.title} | Sample Workflow | WNY Automation Co`,
    description: `${caseStudy.disclaimer}. ${caseStudy.problem}`,
    path: `/case-studies/${caseStudy.slug}`,
  });
}

function renderBlogIndexPage(posts) {
  const body = `
    <main>
      ${renderSEOPageHero({
        eyebrow: "WNY Automation Co Blog",
        h1: "Practical automation ideas for local businesses.",
        subheading:
          "Plain-English guides for reducing admin work, improving follow-up, and making operations smoother.",
      })}
      ${section(`<div class="blog-feed">${posts.length ? posts.map((post) => renderBlogCard(post)).join("") : `<p class="blog-empty">No posts have been published yet.</p>`}</div>`)}
      ${renderCTASection({ withForm: false })}
    </main>`;
  return page(body, {
    title: "Blog | WNY Automation Co",
    description: "Practical WNY Automation Co blog guides for automating repetitive work in Buffalo, Niagara, and Western New York.",
    path: "/blog",
  });
}

function renderBlogPostPage(post) {
  const isSample = post.status === "sample";
  const articleHtml = post.blog_html || markdownToHtml(post.body || post.blog_markdown || "");
  const related = [...serviceLinks(post.relatedServices), ...industryLinks(post.relatedIndustries)];
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: post.title, href: `/blog/${post.slug}` },
  ];
  const body = `
    <main>
      <article class="blog-page">
        <div class="section-inner blog-article-inner">
          ${renderBreadcrumbs(crumbs)}
          <div class="article-shell">
            <p class="section-kicker">${escapeHtml(isSample ? "Sample draft" : post.category || post.industry || "WNY Automation Co Blog")}</p>
            <h1>${escapeHtml(post.title)}</h1>
            <div class="article-meta">
              ${post.publish_date || post.publishDate ? `<span>${escapeHtml(formatDisplayDate(post.publish_date || post.publishDate))}</span>` : ""}
              <span>${escapeHtml(post.author || business.businessName)}</span>
            </div>
            ${isSample ? `<p class="sample-notice">Sample draft placeholder. Replace this with a real n8n-generated article before launch.</p>` : ""}
            ${
              post.image_url || post.featuredImage
                ? `<img class="blog-hero-image" src="${escapeAttribute(post.image_url || post.featuredImage)}" alt="${escapeAttribute(post.image_alt || post.title)}" loading="eager" />`
                : ""
            }
            <div class="article-body">${articleHtml}</div>
          </div>
        </div>
      </article>
      ${renderInternalLinksSection("Related reading and services", related)}
      ${renderCTASection({ withForm: false })}
    </main>`;
  return page(
    body,
    {
      title: `${post.meta_title || post.metaTitle || post.title} | WNY Automation Co`,
      description: post.meta_description || post.metaDescription || post.excerpt || "",
      path: `/blog/${post.slug}`,
      type: "article",
      image: post.image_url || post.featuredImage || "/assets/wny-automation-icon.svg",
    },
    [breadcrumbSchema(crumbs), articleSchema(post)],
  );
}

function renderLegalPage(type) {
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms";
  const body = `
    <main>
      ${renderSEOPageHero({
        eyebrow: "Legal placeholder",
        h1: title,
        subheading: "Placeholder legal copy. Review with a qualified professional before launch.",
      })}
      ${section(`
        <div class="article-body legal-copy">
          <h2>Review before launch</h2>
          <p>This page is placeholder copy for ${escapeHtml(business.businessName)} and should be reviewed before the site is used publicly.</p>
          <h2>Information collected</h2>
          <p>Lead forms may collect contact details, business information, page source, UTM values, and the manual task submitted by the visitor.</p>
          <h2>How information is used</h2>
          <p>Information is used to respond to workflow audit requests and improve communication with interested businesses.</p>
          <h2>Contact</h2>
          <p>Email ${escapeHtml(business.email)} with questions.</p>
        </div>`)}
    </main>`;
  return page(body, {
    title: `${title} | WNY Automation Co`,
    description: `${title} placeholder for WNY Automation Co. Review before launch.`,
    path: isPrivacy ? "/privacy-policy" : "/terms",
  });
}

function renderHtmlSitemapPage(staticRoutes, blogRoutes = []) {
  const all = [...staticRoutes, ...blogRoutes];
  const body = `
    <main>
      ${renderSEOPageHero({ eyebrow: "Sitemap", h1: "HTML sitemap", subheading: "A plain list of public WNY Automation Co pages." })}
      ${section(`<div class="sitemap-list">${all.map((route) => `<a href="${escapeAttribute(route.path)}">${escapeHtml(route.path)}</a>`).join("")}</div>`)}
    </main>`;
  return page(body, {
    title: "Sitemap | WNY Automation Co",
    description: "HTML sitemap for WNY Automation Co pages.",
    path: "/sitemap",
  });
}

function renderClientPortalPage() {
  const body = `
    <main>
      ${renderSEOPageHero({
        eyebrow: "Client portal",
        h1: "Client dashboards are coming soon.",
        subheading:
          "This portal will eventually give WNY Automation Co clients one place to view their custom automations, workflow status, and useful account resources.",
        primaryHref: "/#workflow-form",
        primaryLabel: "Request Automation Ideas",
        secondaryHref: `mailto:${business.email}`,
        secondaryLabel: "Email WNY Automation Co",
      })}
      ${section(`
        <div class="two-column-section">
          <div>
            <p class="section-kicker">Future client access</p>
            <h2>A home for the automations we build with you.</h2>
            <p>For now, this page is a placeholder. Once the dashboard is live, the Client Login button can point directly to the secure portal where clients manage their workflows.</p>
          </div>
          <div class="audit-panel">
            <h3>The portal can eventually include:</h3>
            ${listItems([
              "Active automation status",
              "Workflow notes and support links",
              "Client-specific resources",
              "Simple visibility into what is running",
            ], "check-list")}
          </div>
        </div>`)}
    </main>`;

  return page(body, {
    title: "Client Portal | WNY Automation Co",
    description: "Client portal placeholder for WNY Automation Co dashboards.",
    path: "/client-portal",
    noindex: true,
  });
}

function renderNotFoundPage() {
  const body = `
    <main class="not-found-page">
      ${renderSEOPageHero({
        eyebrow: "Not found",
        h1: "That page is not here.",
        subheading: "The link may have changed, or the article has not been published yet.",
        primaryHref: "/",
        primaryLabel: "Back to WNY Automation Co",
      })}
    </main>`;
  return page(body, { title: "Page Not Found | WNY Automation Co", description: "The requested WNY Automation Co page was not found.", path: "/", noindex: true });
}

function renderSitemapXml(routes) {
  const urls = routes
    .map(
      (route) => `
  <url>
    <loc>${escapeHtml(absoluteUrl(route.path))}</loc>
    <changefreq>${escapeHtml(route.changefreq || "weekly")}</changefreq>
    <priority>${escapeHtml(route.priority || "0.7")}</priority>
  </url>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

function renderRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${absoluteUrl("/sitemap.xml")}
`;
}

function getStaticRoutes() {
  return buildStaticRoutes({ services, industries, locations, caseStudies, blogPosts });
}

function serviceLinks(slugs = []) {
  return (slugs || [])
    .map((slug) => serviceBySlug.get(slug))
    .filter(Boolean)
    .map((item) => ({ label: item.title, href: `/services/${item.slug}`, description: item.shortDescription }));
}

function industryLinks(slugs = []) {
  return (slugs || [])
    .map((slug) => industryBySlug.get(slug))
    .filter(Boolean)
    .map((item) => ({ label: item.title, href: `/industries/${item.slug}`, description: item.intro }));
}

function locationLinks(slugs = []) {
  return (slugs || [])
    .map((slug) => locationBySlug.get(slug))
    .filter(Boolean)
    .map((item) => ({ label: `${item.city}, NY`, href: `/locations/${item.slug}`, description: item.intro }));
}

module.exports = {
  caseStudyBySlug,
  getStaticRoutes,
  industryBySlug,
  locationBySlug,
  renderBlogIndexPage,
  renderBlogPostPage,
  renderCaseStudiesIndex,
  renderCaseStudyPage,
  renderChecklistPage,
  renderClientPortalPage,
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
};
