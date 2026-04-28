// Edit this file to add or revise industry pages.
// Each object becomes a public page at /industries/{slug}.

const industries = [
  industry({
    slug: "hvac-companies",
    title: "Workflow Automation for HVAC Companies",
    h1: "Workflow Automation for HVAC Companies in Buffalo and WNY",
    primaryKeyword: "workflow automation for HVAC companies",
    intro:
      "HVAC companies deal with seasonal spikes, urgent service calls, maintenance reminders, and quote follow-up. WNY Automation Co helps turn those repeatable steps into cleaner workflows.",
    commonPainPoints: [
      "Missed calls during busy service windows",
      "After-hours service inquiries",
      "Manual appointment reminders",
      "Quote follow-up that depends on memory",
      "Seasonal maintenance reminders",
      "Review requests after completed work",
    ],
    automationIdeas: [
      "Missed call response workflow",
      "Seasonal maintenance reminder sequence",
      "Estimate follow-up reminders",
      "Form-to-service-request routing",
    ],
    exampleWorkflow:
      "A no-heat request comes through the website after hours, gets an immediate response, and is routed to the service team with the customer's details summarized.",
    recommendedServices: [
      "automated-lead-follow-up",
      "missed-call-website-lead-automation",
      "appointment-reminder-automation",
    ],
  }),
  industry({
    slug: "plumbing-companies",
    title: "Workflow Automation for Plumbers",
    h1: "Workflow Automation for Plumbing Companies",
    primaryKeyword: "workflow automation for plumbers",
    intro:
      "Plumbing teams need fast lead response, clean job details, and fewer manual reminders. Automation can help organize requests without making the business feel robotic.",
    commonPainPoints: [
      "Emergency calls happen while crews are working",
      "Website forms lack key job details",
      "Customers need appointment confirmations",
      "Quotes need follow-up",
      "Reviews are requested inconsistently",
      "Office staff retype request details",
    ],
    automationIdeas: ["Emergency inquiry routing", "Appointment reminders", "Quote follow-up", "Review request automation"],
    exampleWorkflow:
      "A plumbing request is categorized as urgent or routine, then routed to the right person with a summary and customer contact details.",
    recommendedServices: ["missed-call-website-lead-automation", "form-to-task-automation", "review-request-automation"],
  }),
  industry({
    slug: "roofing-companies",
    title: "Workflow Automation for Roofing Companies",
    h1: "Workflow Automation for Roofing Companies",
    primaryKeyword: "workflow automation for roofing companies",
    intro:
      "Roofing companies handle estimate requests, storm damage questions, quote follow-up, and project updates. WNY Automation Co helps make those workflows easier to track.",
    commonPainPoints: [
      "Estimate requests come from many channels",
      "Storm damage inquiries spike quickly",
      "Lead qualification takes time",
      "Quotes are not followed up consistently",
      "Project status updates create admin work",
      "Review requests happen too late",
    ],
    automationIdeas: ["Storm inquiry triage", "Estimate intake workflow", "Quote follow-up", "Project update summaries"],
    exampleWorkflow:
      "A storm damage lead submits a form, AI summarizes the issue, a follow-up task is created, and the prospect receives a clear next step.",
    recommendedServices: ["automated-lead-follow-up", "quote-follow-up-automation", "crm-automation-small-business"],
  }),
  industry({
    slug: "home-service-businesses",
    title: "Workflow Automation for Home Service Businesses",
    h1: "Workflow Automation for Home Service Businesses",
    primaryKeyword: "workflow automation for home service businesses",
    intro:
      "Home service businesses win when they respond quickly and keep jobs organized. WNY Automation Co focuses on practical workflows around leads, scheduling, reminders, and reviews.",
    commonPainPoints: [
      "Leads arrive while crews are in the field",
      "Scheduling details live in text messages",
      "Customers need reminders",
      "Quotes need follow-up",
      "Job notes are inconsistent",
      "Review requests are easy to forget",
    ],
    automationIdeas: ["Lead response workflow", "Job intake forms", "Calendar reminders", "Review request automation"],
    exampleWorkflow:
      "A service request becomes a structured task with customer details, job type, urgency, and a suggested next step for the office.",
    recommendedServices: ["automated-lead-follow-up", "appointment-reminder-automation", "review-request-automation"],
  }),
  industry({
    slug: "med-spas",
    title: "Workflow Automation for Med Spas",
    h1: "Workflow Automation for Med Spas",
    primaryKeyword: "workflow automation for med spas",
    intro:
      "Med spas often manage consultation requests, appointment reminders, treatment FAQs, and follow-up messages. Automation can help keep communication organized.",
    commonPainPoints: [
      "New consultation leads wait too long",
      "Treatment FAQs repeat daily",
      "No-shows interrupt the schedule",
      "Review requests are inconsistent",
      "Booking questions come after hours",
      "Staff copy client details between systems",
    ],
    automationIdeas: ["Consultation lead follow-up", "Treatment FAQ assistant", "Appointment reminders", "Review requests"],
    exampleWorkflow:
      "A consultation inquiry gets a quick response, basic service questions are answered, and the team receives a structured booking request.",
    recommendedServices: ["ai-chatbots-small-business", "appointment-reminder-automation", "review-request-automation"],
  }),
  industry({
    slug: "dental-offices",
    title: "Workflow Automation for Dental Offices",
    h1: "Workflow Automation for Dental Offices",
    primaryKeyword: "workflow automation for dental offices",
    intro:
      "Dental offices can reduce repetitive communication around scheduling, reminders, FAQs, and follow-up while keeping sensitive conversations with the team.",
    commonPainPoints: [
      "Patients ask the same scheduling questions",
      "Reminders are time-consuming",
      "New patient forms create admin work",
      "Missed calls need follow-up",
      "Reviews are not requested consistently",
      "Staff answer policy questions repeatedly",
    ],
    automationIdeas: ["Appointment reminders", "New patient intake routing", "FAQ automation", "Missed call follow-up"],
    exampleWorkflow:
      "A new patient request is summarized, routed to the front desk, and followed by a clear next-step message.",
    recommendedServices: ["appointment-reminder-automation", "customer-faq-automation", "missed-call-website-lead-automation"],
  }),
  industry({
    slug: "property-managers",
    title: "Workflow Automation for Property Managers",
    h1: "Workflow Automation for Property Managers",
    primaryKeyword: "workflow automation for property managers",
    intro:
      "Property managers juggle tenant questions, maintenance requests, rent reminders, vendors, inspections, and documents. WNY Automation Co helps organize the repeatable parts.",
    commonPainPoints: [
      "Maintenance requests arrive in messy messages",
      "Tenant questions repeat often",
      "Rent reminders are manual",
      "Vendor coordination takes follow-up",
      "Inspection scheduling is time-consuming",
      "Documents are hard to organize",
    ],
    automationIdeas: ["Maintenance request intake", "Tenant FAQ automation", "Vendor follow-up", "Inspection reminders"],
    exampleWorkflow:
      "A tenant maintenance request is summarized, categorized by urgency, routed to the right vendor list, and tracked for follow-up.",
    recommendedServices: ["form-to-task-automation", "customer-faq-automation", "admin-workflow-automation"],
  }),
  industry({
    slug: "real-estate-agents",
    title: "Workflow Automation for Real Estate Agents",
    h1: "Workflow Automation for Real Estate Agents",
    primaryKeyword: "workflow automation for real estate agents",
    intro:
      "Real estate agents need fast lead response, organized showings, and consistent follow-up. WNY Automation Co helps create lightweight workflows that support the relationship.",
    commonPainPoints: [
      "Buyer and seller leads arrive at odd hours",
      "Follow-up depends on memory",
      "Showing details are copied manually",
      "FAQs repeat across prospects",
      "CRM updates fall behind",
      "Open house leads need sorting",
    ],
    automationIdeas: ["Lead capture follow-up", "Open house intake", "CRM task creation", "FAQ response drafts"],
    exampleWorkflow:
      "A new buyer lead is captured, tagged by intent, sent a quick response, and added to a follow-up list for the agent.",
    recommendedServices: ["automated-lead-follow-up", "crm-automation-small-business", "customer-faq-automation"],
  }),
  industry({
    slug: "restaurants",
    title: "Workflow Automation for Restaurants",
    h1: "Workflow Automation for Restaurants",
    primaryKeyword: "workflow automation for restaurants",
    intro:
      "Restaurants can reduce repetitive questions around hours, reservations, catering, private events, and reviews without losing the local hospitality feel.",
    commonPainPoints: [
      "Staff answer repeated hours and menu questions",
      "Reservation or event requests need follow-up",
      "Catering inquiries lack details",
      "Reviews are requested inconsistently",
      "Managers field the same policy questions",
      "Messages arrive during service rushes",
    ],
    automationIdeas: ["FAQ assistant", "Catering inquiry intake", "Event request routing", "Review request workflow"],
    exampleWorkflow:
      "A catering inquiry gets a fast confirmation, missing details are requested, and the manager receives a summarized task.",
    recommendedServices: ["ai-chatbots-small-business", "customer-faq-automation", "review-request-automation"],
  }),
  industry({
    slug: "law-firms",
    title: "Workflow Automation for Law Firms",
    h1: "Workflow Automation for Law Firms",
    primaryKeyword: "workflow automation for law firms",
    intro:
      "Law firms can use careful automation for intake organization, appointment reminders, internal knowledge, and admin routing while keeping legal judgment with attorneys.",
    commonPainPoints: [
      "New inquiries need structured intake",
      "Consultation reminders are manual",
      "Staff answer repeated admin questions",
      "Documents are hard to search",
      "Follow-up tasks are scattered",
      "Sensitive matters need human review",
    ],
    automationIdeas: ["Intake summaries", "Consultation reminders", "Internal knowledge assistant", "Admin task routing"],
    exampleWorkflow:
      "A potential client form is summarized for staff review, categorized by matter type, and routed without giving legal advice.",
    recommendedServices: ["form-to-task-automation", "appointment-reminder-automation", "internal-knowledge-base-ai-assistant"],
  }),
  industry({
    slug: "accountants",
    title: "Workflow Automation for Accountants",
    h1: "Workflow Automation for Accountants",
    primaryKeyword: "workflow automation for accountants",
    intro:
      "Accounting teams handle recurring document requests, client questions, reminders, and internal checklists. WNY Automation Co helps reduce repeat admin around those workflows.",
    commonPainPoints: [
      "Clients forget documents",
      "Repeated questions slow staff down",
      "Deadlines require manual reminders",
      "Internal checklists are inconsistent",
      "Email becomes the task system",
      "Reports take time to prepare",
    ],
    automationIdeas: ["Document request reminders", "Client FAQ workflow", "Deadline follow-up", "Internal checklist assistant"],
    exampleWorkflow:
      "A client reminder sequence requests missing documents and flags the account for staff review if nothing is received.",
    recommendedServices: ["admin-workflow-automation", "customer-faq-automation", "internal-knowledge-base-ai-assistant"],
  }),
  industry({
    slug: "insurance-agencies",
    title: "Workflow Automation for Insurance Agencies",
    h1: "Workflow Automation for Insurance Agencies",
    primaryKeyword: "workflow automation for insurance agencies",
    intro:
      "Insurance agencies need organized intake, renewals, quote follow-up, and customer communication. WNY Automation Co helps make those repeatable steps easier to manage.",
    commonPainPoints: [
      "Quote requests need follow-up",
      "Renewal reminders are manual",
      "Client questions repeat often",
      "Documents arrive through several channels",
      "CRM updates fall behind",
      "Producers need better task visibility",
    ],
    automationIdeas: ["Quote follow-up", "Renewal reminders", "Client FAQ automation", "CRM task creation"],
    exampleWorkflow:
      "A quote request is summarized, entered into a CRM workflow, and assigned a follow-up reminder for the producer.",
    recommendedServices: ["quote-follow-up-automation", "crm-automation-small-business", "customer-faq-automation"],
  }),
  industry({
    slug: "contractors",
    title: "Workflow Automation for Contractors",
    h1: "Workflow Automation for Contractors",
    primaryKeyword: "workflow automation for contractors",
    intro:
      "Contractors need clean lead intake, estimate follow-up, project updates, and review requests while crews stay focused on the work.",
    commonPainPoints: [
      "Estimate requests lack enough details",
      "Photos and notes are scattered",
      "Quotes need follow-up",
      "Project updates take time",
      "Reviews are easy to forget",
      "Owners handle too much admin",
    ],
    automationIdeas: ["Estimate intake", "Quote follow-up", "Project update summaries", "Review request automation"],
    exampleWorkflow:
      "A project inquiry becomes a structured estimate request with details, photos, and a next-step task for the owner.",
    recommendedServices: ["form-to-task-automation", "quote-follow-up-automation", "review-request-automation"],
  }),
  industry({
    slug: "local-retail-businesses",
    title: "Workflow Automation for Local Retail Businesses",
    h1: "Workflow Automation for Local Retail Businesses",
    primaryKeyword: "workflow automation for local retail businesses",
    intro:
      "Local retailers can reduce repetitive questions, product inquiries, review requests, and admin work without becoming impersonal.",
    commonPainPoints: [
      "Customers ask repeated inventory questions",
      "Staff answer hours and policy questions",
      "Special orders need follow-up",
      "Reviews are requested inconsistently",
      "Promotions require manual communication",
      "Owner time is eaten by admin",
    ],
    automationIdeas: ["Customer FAQ workflow", "Special order follow-up", "Review requests", "Admin summaries"],
    exampleWorkflow:
      "A product inquiry is captured, routed to staff, and followed up with a clear next step if the customer wants availability or ordering help.",
    recommendedServices: ["customer-faq-automation", "review-request-automation", "admin-workflow-automation"],
  }),
  industry({
    slug: "auto-repair-shops",
    title: "Workflow Automation for Auto Repair Shops",
    h1: "Workflow Automation for Auto Repair Shops",
    primaryKeyword: "workflow automation for auto repair shops",
    intro:
      "Auto repair shops handle appointment requests, status questions, estimate approvals, reminders, and reviews. Automation can reduce front-desk pressure.",
    commonPainPoints: [
      "Appointment requests arrive during busy shop hours",
      "Customers ask repeated status questions",
      "Estimate approvals need follow-up",
      "Reminder calls take time",
      "Review requests are inconsistent",
      "Vehicle details need organizing",
    ],
    automationIdeas: ["Appointment intake", "Status update routing", "Estimate follow-up", "Review requests"],
    exampleWorkflow:
      "A repair request is captured with vehicle details, summarized for the shop, and followed by a confirmation or next-step message.",
    recommendedServices: ["appointment-reminder-automation", "customer-faq-automation", "quote-follow-up-automation"],
  }),
];

function industry(overrides) {
  return {
    metaTitle: overrides.metaTitle || `${overrides.title} | WNY Automation Co`,
    metaDescription:
      overrides.metaDescription ||
      `${overrides.title} for Buffalo and Western New York businesses. Start with practical workflows, not AI hype.`,
    secondaryKeywords: overrides.secondaryKeywords || [
      "small business automation",
      "local AI automation",
      "workflow automation",
    ],
    faqs: overrides.faqs || defaultIndustryFaqs(overrides.title),
    relatedIndustries: overrides.relatedIndustries || ["home-service-businesses", "contractors", "local-retail-businesses"],
    relatedLocations: overrides.relatedLocations || ["buffalo-ny", "amherst-ny", "niagara-falls-ny"],
    ctaLabel: overrides.ctaLabel || "Get My Free Automation Ideas",
    ...overrides,
  };
}

function defaultIndustryFaqs(title) {
  return [
    {
      question: `Can ${title.toLowerCase()} start with one automation?`,
      answer:
        "Yes. The safest way to start is one repeatable workflow with clear steps, clear ownership, and human review where needed.",
    },
    {
      question: "What if our team is not technical?",
      answer:
        "That is normal. WNY Automation Co explains the workflow in plain language and focuses on practical tasks like follow-up, reminders, and intake.",
    },
    {
      question: "Do we need a CRM first?",
      answer:
        "No. A CRM can help, but many first automations can start with forms, email, calendars, or spreadsheets you already use.",
    },
    {
      question: "How do we know what to automate first?",
      answer:
        "Look for tasks that repeat often, waste time, delay customers, or cause missed opportunities. A workflow audit helps rank the options.",
    },
  ];
}

module.exports = industries;
