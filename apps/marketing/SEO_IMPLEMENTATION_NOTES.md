# WNY Automation Co SEO Implementation Notes

## Pages Created

- Main pages: `/`, `/free-workflow-audit`, `/services`, `/industries`, `/locations`, `/resources`, `/case-studies`, `/privacy-policy`, `/terms`, `/sitemap`
- Service pages: generated from `src/data/services.js`
- Industry pages: generated from `src/data/industries.js`
- Location pages: generated from `src/data/locations.js`
- Tools: `/tools/missed-lead-cost-calculator`, `/tools/automation-roi-calculator`, `/tools/ai-automation-readiness-quiz`
- Resource: `/resources/workflow-audit-checklist`
- Blog: `/blog`, `/blog/:slug`, with `/blogs` kept as a redirect
- Technical SEO: `/sitemap.xml`, `/robots.txt`

## Where To Edit Content

- Business info and public placeholders: `src/config/business.js`
- Services: `src/data/services.js`
- Industries: `src/data/industries.js`
- Locations: `src/data/locations.js`
- FAQs: `src/data/faqs.js`
- Sample workflow examples: `src/data/caseStudies.js`
- Sample draft blog posts: `src/data/blogPosts.js`

## Lead Form And n8n

The reusable workflow audit forms submit to:

```text
POST /api/leads
```

Set this environment variable to forward leads to n8n:

```text
N8N_LEAD_WEBHOOK_URL=
```

If it is blank, the server logs the payload in development and still returns a safe success response.

## Analytics Variables

Optional tracking placeholders are in `.env.example`:

```text
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GSC_VERIFICATION=
NEXT_PUBLIC_META_PIXEL_ID=
```

No tracking scripts are rendered unless the values are set.

## Blog Pipeline

The n8n blog pipeline should continue posting to:

```text
POST /api/blogs
```

Published SQLite posts are preferred over sample blog placeholders. Sample posts are clearly labeled as sample drafts.

## Limitations

- Privacy policy and terms are placeholders and should be reviewed before launch.
- Case study pages are sample workflow examples only. Do not mark anything as real until a client-approved story exists.
- Phone, address, social links, Google Business Profile, and booking URL should be updated before launch.

## Recommended Next Manual Tasks

1. Set `NEXT_PUBLIC_SITE_URL` to the live domain.
2. Add the real phone, email, and booking link.
3. Connect `N8N_LEAD_WEBHOOK_URL`.
4. Replace sample draft blog posts with real n8n-generated content.
5. Add real, approved case studies only when available.
