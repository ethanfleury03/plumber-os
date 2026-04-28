// Edit this file to add, remove, or revise service pages.
// Each object becomes a public page at /services/{slug}.

const defaultTools = ["Website forms", "Email", "Calendars", "CRM", "Spreadsheets", "SMS tools", "n8n or Zapier"];

const services = [
  service({
    slug: "workflow-automation-company-buffalo",
    title: "Workflow Automation Company Buffalo",
    h1: "Workflow Automation Company for Buffalo Small Businesses",
    primaryKeyword: "workflow automation company Buffalo",
    shortDescription: "Practical AI-powered workflow automation planning and pilots for Buffalo and Western New York small businesses.",
    painPoints: [
      "Owners are stuck answering the same questions every week",
      "Lead follow-up depends on memory or a busy inbox",
      "Teams copy information between tools by hand",
      "New software feels expensive or confusing",
      "Manual admin work slows down sales and service",
    ],
    exampleWorkflow:
      "A website form comes in, AI summarizes the request, the lead is added to a CRM or spreadsheet, and the owner gets a clear notification with the next action.",
    relatedServices: ["automated-lead-follow-up", "admin-workflow-automation", "small-business-ai-consulting"],
  }),
  service({
    slug: "workflow-automation-consultant-buffalo",
    title: "Workflow Automation Consultant Buffalo",
    h1: "Workflow Automation Consultant in Buffalo, NY",
    primaryKeyword: "workflow automation consultant Buffalo",
    shortDescription: "Workflow mapping and small automation pilots for local teams that want less repetitive work.",
    painPoints: [
      "Workflows live in someone owner's head",
      "Staff use spreadsheets as a workaround",
      "Tasks move through email without a clear owner",
      "Important follow-ups are easy to miss",
      "Managers cannot see what is stuck",
    ],
    exampleWorkflow:
      "A repeated admin task is mapped step by step, then converted into a simple form-to-task process with reminders and owner review.",
    relatedServices: ["form-to-task-automation", "crm-automation-small-business", "admin-workflow-automation"],
  }),
  service({
    slug: "automated-lead-follow-up",
    title: "Automated Lead Follow-Up",
    h1: "Automated Lead Follow-Up for Small Businesses",
    primaryKeyword: "automated lead follow-up",
    shortDescription: "Respond to new inquiries faster and keep prospects warm without watching every channel all day.",
    painPoints: [
      "Website forms sit unanswered",
      "Calls are missed after hours",
      "Staff forget to follow up",
      "Leads are not added to the CRM",
      "Quotes do not get followed up on",
    ],
    exampleWorkflow:
      "A new website lead receives a quick first response, the team gets notified, the lead is added to a CRM, and a follow-up reminder is created.",
    relatedServices: ["crm-automation-small-business", "missed-call-website-lead-automation", "quote-follow-up-automation"],
    relatedIndustries: ["hvac-companies", "roofing-companies", "home-service-businesses"],
  }),
  service({
    slug: "ai-chatbots-small-business",
    title: "AI Chatbots for Small Business",
    h1: "AI Chatbots for Small Business Websites",
    primaryKeyword: "AI chatbots for small business",
    shortDescription: "Plain-English website chatbots that answer common questions and route real leads to a person.",
    painPoints: [
      "Customers ask the same questions repeatedly",
      "Staff lose time answering basic service questions",
      "Website visitors leave before contacting you",
      "After-hours questions wait until the next day",
      "Important questions are mixed with low-priority messages",
    ],
    exampleWorkflow:
      "A visitor asks a service question, the chatbot answers from approved business information, then captures contact details when a human should follow up.",
    relatedServices: [
      "customer-faq-automation",
      "ai-receptionist-small-business",
      "internal-knowledge-base-ai-assistant",
    ],
    relatedIndustries: ["restaurants", "med-spas", "dental-offices"],
  }),
  service({
    slug: "ai-receptionist-small-business",
    title: "AI Receptionist for Small Business",
    h1: "AI Receptionist for Small Business Calls, FAQs, and Booking",
    primaryKeyword: "AI receptionist for small business",
    shortDescription: "Help callers get basic answers, booking direction, and clean handoffs when your team is busy.",
    painPoints: [
      "Calls come in while staff are serving customers",
      "After-hours callers need a useful next step",
      "Basic FAQs interrupt higher-value work",
      "Messages are written down inconsistently",
      "Booking requests need faster routing",
    ],
    exampleWorkflow:
      "A caller asks about availability, receives a clear next step, and the team gets a structured summary for follow-up.",
    relatedServices: ["customer-faq-automation", "appointment-reminder-automation", "missed-call-website-lead-automation"],
  }),
  service({
    slug: "crm-automation-small-business",
    title: "CRM Automation for Small Business",
    h1: "CRM Automation for Small Businesses",
    primaryKeyword: "CRM automation for small business",
    shortDescription: "Keep leads, tasks, and follow-ups organized without manually updating every field.",
    painPoints: [
      "Leads are tracked in too many places",
      "CRM updates depend on busy staff",
      "Follow-up stages are inconsistent",
      "Owners cannot tell which leads are stale",
      "Manual data entry slows down sales",
    ],
    exampleWorkflow:
      "A new form submission creates a CRM record, assigns a stage, sends a team alert, and schedules a follow-up task.",
    relatedServices: ["automated-lead-follow-up", "quote-follow-up-automation", "form-to-task-automation"],
  }),
  service({
    slug: "appointment-reminder-automation",
    title: "Appointment Reminder Automation",
    h1: "Appointment Reminder Automation for Local Businesses",
    primaryKeyword: "appointment reminder automation",
    shortDescription: "Reduce no-shows and back-and-forth scheduling with simple reminder workflows.",
    painPoints: [
      "Customers forget appointments",
      "Staff manually send reminders",
      "Calendar changes are easy to miss",
      "No-shows waste service time",
      "Booking details are spread across messages",
    ],
    exampleWorkflow:
      "A booked appointment triggers a confirmation, a reminder, and a same-day check-in message while keeping staff in the loop.",
    relatedServices: ["ai-receptionist-small-business", "customer-faq-automation", "review-request-automation"],
  }),
  service({
    slug: "review-request-automation",
    title: "Review Request Automation",
    h1: "Review Request Automation for Local Businesses",
    primaryKeyword: "review request automation",
    shortDescription: "Ask happy customers for reviews at the right time without making staff remember every request.",
    painPoints: [
      "Happy customers are not asked for reviews",
      "Review requests happen inconsistently",
      "Staff forget after busy jobs",
      "Owners want more recent reputation signals",
      "Customers need a simple review link",
    ],
    exampleWorkflow:
      "After a completed job or visit, the customer receives a polite review request and the owner can see who was contacted.",
    relatedServices: ["appointment-reminder-automation", "customer-faq-automation", "admin-workflow-automation"],
  }),
  service({
    slug: "quote-follow-up-automation",
    title: "Quote Follow-Up Automation",
    h1: "Quote Follow-Up Automation for Small Businesses",
    primaryKeyword: "quote follow-up automation",
    shortDescription: "Follow up on open quotes without relying on memory, sticky notes, or inbox searches.",
    painPoints: [
      "Quotes go quiet after they are sent",
      "Sales follow-up depends on manual reminders",
      "Owners do not know which estimates are stale",
      "Customers need a simple way to ask questions",
      "Missed follow-up can mean missed revenue",
    ],
    exampleWorkflow:
      "A sent quote triggers a friendly follow-up sequence and creates a task if the customer has not responded.",
    relatedServices: ["automated-lead-follow-up", "crm-automation-small-business", "missed-call-website-lead-automation"],
  }),
  service({
    slug: "customer-faq-automation",
    title: "Customer FAQ Automation",
    h1: "Customer FAQ Automation for Small Business Teams",
    primaryKeyword: "customer FAQ automation",
    shortDescription: "Answer repeated customer questions with approved information and clean human handoffs.",
    painPoints: [
      "Staff answer the same questions every day",
      "Customers cannot find simple information",
      "Answers vary by employee",
      "Busy teams miss messages",
      "Complex questions need better routing",
    ],
    exampleWorkflow:
      "A customer asks a common question, receives a clear approved answer, and a human is notified if the topic needs review.",
    relatedServices: ["ai-chatbots-small-business", "ai-receptionist-small-business", "internal-knowledge-base-ai-assistant"],
  }),
  service({
    slug: "internal-knowledge-base-ai-assistant",
    title: "Internal Knowledge Base AI Assistant",
    h1: "Internal Knowledge Base AI Assistant for Small Teams",
    primaryKeyword: "internal knowledge base AI assistant",
    shortDescription: "Help staff find SOPs, policies, and answers without interrupting the owner or manager.",
    painPoints: [
      "Staff questions interrupt managers",
      "SOPs are buried in folders",
      "Policies are hard to search",
      "New employees need repeated guidance",
      "Answers depend on who is available",
    ],
    exampleWorkflow:
      "An employee asks a process question and gets a summarized answer from approved internal documents with links back to the source.",
    relatedServices: ["customer-faq-automation", "admin-workflow-automation", "small-business-ai-consulting"],
  }),
  service({
    slug: "admin-workflow-automation",
    title: "Admin Workflow Automation",
    h1: "Admin Workflow Automation for Small Businesses",
    primaryKeyword: "admin workflow automation",
    shortDescription: "Turn repetitive office work into cleaner workflows with reminders, routing, and summaries.",
    painPoints: [
      "Admin tasks eat into sales and service time",
      "Owners chase status updates manually",
      "Emails become task lists",
      "Reports are rebuilt by hand",
      "Small errors repeat every week",
    ],
    exampleWorkflow:
      "A recurring admin process is converted into a form, checklist, reminder sequence, and weekly summary for the owner.",
    relatedServices: ["form-to-task-automation", "internal-knowledge-base-ai-assistant", "workflow-automation-consultant-buffalo"],
  }),
  service({
    slug: "form-to-task-automation",
    title: "Form-to-Task Automation",
    h1: "Form-to-Task Automation for Local Business Workflows",
    primaryKeyword: "form-to-task automation",
    shortDescription: "Turn intake forms and website submissions into organized tasks, alerts, and follow-up steps.",
    painPoints: [
      "Forms arrive with no clear owner",
      "Staff copy details into spreadsheets",
      "Requests lack next steps",
      "Managers miss urgent submissions",
      "Tasks are created inconsistently",
    ],
    exampleWorkflow:
      "A form submission is summarized, categorized, routed to the right person, and turned into a task with due date guidance.",
    relatedServices: ["admin-workflow-automation", "crm-automation-small-business", "automated-lead-follow-up"],
  }),
  service({
    slug: "missed-call-website-lead-automation",
    title: "Missed Call and Website Lead Automation",
    h1: "Missed Call and Website Lead Automation",
    primaryKeyword: "missed call and website lead automation",
    shortDescription: "Give missed calls and website inquiries a faster first response and a cleaner follow-up path.",
    painPoints: [
      "After-hours calls do not get a quick response",
      "Website leads wait in an inbox",
      "Voicemails are hard to track",
      "Urgent requests are mixed with routine questions",
      "Owners cannot see every missed opportunity",
    ],
    exampleWorkflow:
      "A missed call or form submission triggers a quick response, captures the request, and routes the lead to the right follow-up list.",
    relatedServices: ["automated-lead-follow-up", "ai-receptionist-small-business", "quote-follow-up-automation"],
  }),
  service({
    slug: "small-business-ai-consulting",
    title: "Small Business AI Consulting",
    h1: "Small Business AI Consulting in Buffalo and Western New York",
    primaryKeyword: "small business AI consulting",
    shortDescription: "Practical guidance for owners who want useful AI workflows without jargon or tool overload.",
    painPoints: [
      "AI tools feel confusing",
      "Owners do not know where to start",
      "Teams worry about over-automation",
      "Software choices pile up quickly",
      "No one has mapped the workflow first",
    ],
    exampleWorkflow:
      "WNY Automation Co reviews one manual process, identifies whether AI is useful, and recommends a small pilot or a simpler process fix.",
    relatedServices: ["workflow-automation-company-buffalo", "workflow-automation-consultant-buffalo", "admin-workflow-automation"],
  }),
];

function service(overrides) {
  return {
    metaTitle: overrides.metaTitle || `${overrides.title} | WNY Automation Co`,
    metaDescription:
      overrides.metaDescription ||
      `${overrides.shortDescription} Built for Buffalo, Niagara, and Western New York small businesses.`,
    secondaryKeywords: overrides.secondaryKeywords || [
      "small business automation",
      "AI workflow automation",
      "Buffalo business automation",
    ],
    howItWorks: overrides.howItWorks || [
      "Tell us the manual task that wastes time.",
      "We map the current workflow, tools, and handoffs.",
      "We recommend or build one focused automation pilot.",
    ],
    toolsItCanConnect: overrides.toolsItCanConnect || defaultTools,
    idealFor: overrides.idealFor || [
      "Small business owners",
      "Local service teams",
      "Busy offices",
      "Operators who want less manual follow-up",
    ],
    benefits: overrides.benefits || [
      "Faster response times",
      "Less repetitive admin work",
      "Cleaner task ownership",
      "Better visibility into follow-up",
    ],
    relatedIndustries: overrides.relatedIndustries || [
      "home-service-businesses",
      "contractors",
      "professional-services",
    ],
    ctaLabel: overrides.ctaLabel || "Get My Free Automation Ideas",
    faqs: overrides.faqs || defaultServiceFaqs(overrides.title),
    ...overrides,
  };
}

function defaultServiceFaqs(serviceTitle) {
  return [
    {
      question: `What does ${serviceTitle.toLowerCase()} include?`,
      answer:
        "It starts with mapping one repeatable workflow, then identifying the smallest useful automation that can save time or reduce missed follow-up.",
    },
    {
      question: "Do we need to replace our current tools?",
      answer:
        "Usually not. WNY Automation Co looks at your current website, forms, email, calendars, CRM, and spreadsheets before recommending anything new.",
    },
    {
      question: "Will AI replace our staff?",
      answer:
        "No. The goal is to reduce repetitive manual work so your team can spend more time with customers, jobs, and higher-value tasks.",
    },
    {
      question: "How should we start?",
      answer:
        "Start with one workflow that is repetitive, easy to describe, and worth improving. A free workflow audit helps identify that first step.",
    },
  ];
}

module.exports = services;
