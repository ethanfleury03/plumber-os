// Edit this file to add or revise location pages.
// Each object becomes a public page at /locations/{slug}.

const locations = [
  location({
    slug: "buffalo-ny",
    city: "Buffalo",
    intro:
      "Buffalo small businesses often handle leads, service requests, customer questions, and admin follow-up with lean teams. WNY Automation Co helps local owners start with one practical workflow.",
    localBusinessTypes: ["Home services", "Professional offices", "Restaurants", "Med spas", "Contractors", "Local retail"],
    commonPainPoints: [
      "Busy owners miss follow-up during the workday",
      "Website leads wait in an inbox",
      "Customers ask the same questions repeatedly",
      "Teams copy details between email, calendars, and spreadsheets",
    ],
    recommendedServices: ["automated-lead-follow-up", "admin-workflow-automation", "customer-faq-automation"],
    nearbyLocations: ["amherst-ny", "cheektowaga-ny", "west-seneca-ny"],
  }),
  location({
    slug: "niagara-falls-ny",
    city: "Niagara Falls",
    intro:
      "Niagara Falls businesses serve residents, visitors, and nearby communities. Automation can help organize inquiries, bookings, reminders, and customer communication.",
    localBusinessTypes: ["Tourism-adjacent businesses", "Restaurants", "Home services", "Retail", "Property managers"],
    commonPainPoints: [
      "Customer questions come from many channels",
      "Seasonal demand changes quickly",
      "Booking and appointment details need follow-up",
      "Owners need cleaner lead tracking",
    ],
    recommendedServices: ["ai-chatbots-small-business", "appointment-reminder-automation", "form-to-task-automation"],
    nearbyLocations: ["lewiston-ny", "wheatfield-ny", "north-tonawanda-ny"],
  }),
  location({
    slug: "amherst-ny",
    city: "Amherst",
    intro:
      "Amherst has a mix of professional offices, service businesses, medical-adjacent teams, and local operators that need cleaner workflows without extra complexity.",
    localBusinessTypes: ["Professional services", "Dental offices", "Med spas", "Insurance agencies", "Home services"],
    commonPainPoints: [
      "Appointment reminders take staff time",
      "New inquiries need faster response",
      "Office workflows rely on manual lists",
      "Customers need better follow-up after forms",
    ],
    recommendedServices: ["appointment-reminder-automation", "crm-automation-small-business", "automated-lead-follow-up"],
    nearbyLocations: ["williamsville-ny", "buffalo-ny", "tonawanda-ny"],
  }),
  location({
    slug: "williamsville-ny",
    city: "Williamsville",
    intro:
      "Williamsville businesses often depend on strong customer communication and repeat local trust. WNY Automation Co helps make routine follow-up easier to manage.",
    localBusinessTypes: ["Med spas", "Dental offices", "Professional services", "Restaurants", "Local retail"],
    commonPainPoints: [
      "Consultation and appointment requests need quick handling",
      "Front desks answer repeated questions",
      "Review requests happen inconsistently",
      "CRM or spreadsheet updates fall behind",
    ],
    recommendedServices: ["customer-faq-automation", "review-request-automation", "appointment-reminder-automation"],
    nearbyLocations: ["amherst-ny", "cheektowaga-ny", "buffalo-ny"],
  }),
  location({
    slug: "cheektowaga-ny",
    city: "Cheektowaga",
    intro:
      "Cheektowaga businesses need practical systems for leads, scheduling, service requests, and admin work. WNY Automation Co focuses on workflows that fit small teams.",
    localBusinessTypes: ["Contractors", "Retail", "Auto repair", "Restaurants", "Home services"],
    commonPainPoints: [
      "Calls and forms arrive while staff are busy",
      "Scheduling details get scattered",
      "Quotes and estimates need follow-up",
      "Manual admin work delays service",
    ],
    recommendedServices: ["missed-call-website-lead-automation", "quote-follow-up-automation", "form-to-task-automation"],
    nearbyLocations: ["buffalo-ny", "west-seneca-ny", "williamsville-ny"],
  }),
  location({
    slug: "tonawanda-ny",
    city: "Tonawanda",
    intro:
      "Tonawanda businesses can use automation to respond faster, keep customer requests organized, and reduce routine admin work across lean teams.",
    localBusinessTypes: ["Home services", "Auto repair", "Contractors", "Property managers", "Local retail"],
    commonPainPoints: [
      "Service requests arrive from multiple places",
      "Follow-up depends on memory",
      "Job details are copied by hand",
      "Customers need reminders and status updates",
    ],
    recommendedServices: ["form-to-task-automation", "automated-lead-follow-up", "appointment-reminder-automation"],
    nearbyLocations: ["north-tonawanda-ny", "amherst-ny", "wheatfield-ny"],
  }),
  location({
    slug: "north-tonawanda-ny",
    city: "North Tonawanda",
    intro:
      "North Tonawanda small businesses often need simple improvements around intake, follow-up, reminders, and customer questions rather than a large software overhaul.",
    localBusinessTypes: ["Contractors", "Home services", "Restaurants", "Retail", "Property managers"],
    commonPainPoints: [
      "Manual intake slows down new requests",
      "After-hours inquiries need a useful response",
      "Repeated questions interrupt the day",
      "Owners need better visibility into follow-up",
    ],
    recommendedServices: ["missed-call-website-lead-automation", "customer-faq-automation", "admin-workflow-automation"],
    nearbyLocations: ["tonawanda-ny", "wheatfield-ny", "niagara-falls-ny"],
  }),
  location({
    slug: "lockport-ny",
    city: "Lockport",
    intro:
      "Lockport businesses can benefit from practical automation around appointment reminders, service requests, quotes, and customer communication.",
    localBusinessTypes: ["Home services", "Contractors", "Insurance agencies", "Retail", "Auto repair"],
    commonPainPoints: [
      "Quote follow-up is inconsistent",
      "Customer details live in messages",
      "Staff manually send reminders",
      "Review requests are easy to forget",
    ],
    recommendedServices: ["quote-follow-up-automation", "appointment-reminder-automation", "review-request-automation"],
    nearbyLocations: ["wheatfield-ny", "lewiston-ny", "north-tonawanda-ny"],
  }),
  location({
    slug: "lewiston-ny",
    city: "Lewiston",
    intro:
      "Lewiston businesses often balance local customers, visitors, and seasonal patterns. WNY Automation Co helps improve the repeatable communication that supports that work.",
    localBusinessTypes: ["Restaurants", "Retail", "Professional services", "Home services", "Tourism-adjacent businesses"],
    commonPainPoints: [
      "Seasonal inquiry volume changes",
      "Customer questions repeat",
      "Bookings and follow-ups need consistency",
      "Small teams need cleaner task routing",
    ],
    recommendedServices: ["customer-faq-automation", "ai-chatbots-small-business", "form-to-task-automation"],
    nearbyLocations: ["niagara-falls-ny", "wheatfield-ny", "lockport-ny"],
  }),
  location({
    slug: "grand-island-ny",
    city: "Grand Island",
    intro:
      "Grand Island businesses can use simple automation to keep leads, appointment reminders, and customer questions moving without adding more admin time.",
    localBusinessTypes: ["Home services", "Professional offices", "Restaurants", "Retail", "Contractors"],
    commonPainPoints: [
      "Owners juggle field work and office follow-up",
      "Leads need a faster first response",
      "Appointments need reminders",
      "Customer questions interrupt the day",
    ],
    recommendedServices: ["automated-lead-follow-up", "appointment-reminder-automation", "customer-faq-automation"],
    nearbyLocations: ["buffalo-ny", "tonawanda-ny", "niagara-falls-ny"],
  }),
  location({
    slug: "wheatfield-ny",
    city: "Wheatfield",
    intro:
      "Wheatfield businesses can start small with automations that organize intake, follow-up, reminders, and customer service tasks.",
    localBusinessTypes: ["Contractors", "Home services", "Property managers", "Retail", "Auto repair"],
    commonPainPoints: [
      "Manual service intake takes too long",
      "Follow-up tasks get missed",
      "Customers need clearer next steps",
      "Job details are stored inconsistently",
    ],
    recommendedServices: ["form-to-task-automation", "automated-lead-follow-up", "admin-workflow-automation"],
    nearbyLocations: ["north-tonawanda-ny", "lockport-ny", "niagara-falls-ny"],
  }),
  location({
    slug: "west-seneca-ny",
    city: "West Seneca",
    intro:
      "West Seneca small businesses need dependable systems for lead response, scheduling, customer questions, and admin work. WNY Automation Co helps map one workflow at a time.",
    localBusinessTypes: ["Home services", "Contractors", "Dental offices", "Retail", "Restaurants"],
    commonPainPoints: [
      "Inquiries wait when staff are busy",
      "Scheduling messages create back-and-forth",
      "Reviews are not requested consistently",
      "Owners rebuild reports and lists manually",
    ],
    recommendedServices: ["missed-call-website-lead-automation", "appointment-reminder-automation", "review-request-automation"],
    nearbyLocations: ["buffalo-ny", "cheektowaga-ny", "amherst-ny"],
  }),
];

function location(overrides) {
  const city = overrides.city;
  return {
    region: "Western New York",
    state: "NY",
    title: `Workflow Automation Services in ${city}, NY`,
    h1: `Workflow Automation for Small Businesses in ${city}, NY`,
    metaTitle: `Workflow Automation in ${city}, NY | WNY Automation Co`,
    metaDescription:
      overrides.metaDescription ||
      `Practical workflow automation for ${city} small businesses. Reduce manual follow-up, admin work, reminders, and repeated customer questions.`,
    faqs: overrides.faqs || defaultLocationFaqs(city),
    ctaLabel: overrides.ctaLabel || "Get My Free Automation Ideas",
    ...overrides,
  };
}

function defaultLocationFaqs(city) {
  return [
    {
      question: `Does WNY Automation Co work with small businesses in ${city}?`,
      answer:
        `Yes. WNY Automation Co helps ${city} and Western New York small businesses identify practical workflows that may be worth automating.`,
    },
    {
      question: "What kind of automation should we start with?",
      answer:
        "Start with one repeated task that wastes time, delays customers, or causes missed follow-up. Lead response, reminders, intake, and FAQs are common first fits.",
    },
    {
      question: "Do we need to buy new software first?",
      answer:
        "No. WNY Automation Co reviews the tools you already use before recommending any new platform or automation setup.",
    },
    {
      question: "Is the workflow audit free?",
      answer:
        "Yes. The free workflow audit is designed to identify a practical first automation idea and whether it is worth pursuing.",
    },
  ];
}

module.exports = locations;
