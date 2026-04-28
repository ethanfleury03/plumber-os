// Sample workflow examples only. Replace or add real case studies later.
// Never mark a story as "real" unless it is a real client-approved case study.

const caseStudies = [
  {
    slug: "local-service-business-lead-follow-up",
    title: "Local Service Business Lead Follow-Up",
    businessType: "Local service business",
    location: "Buffalo, NY",
    problem: "New leads arrive through forms, calls, and emails, but follow-up depends on whoever sees the message first.",
    solution: "Create one intake path that summarizes the request, alerts the team, and creates a follow-up task.",
    workflow: [
      "Capture website form or missed call details.",
      "Summarize the request and identify the likely service category.",
      "Send a quick first response to the customer.",
      "Create a task for the owner or office team.",
      "Trigger a reminder if no one marks the lead as handled.",
    ],
    toolsUsed: ["Website form", "Email", "CRM or spreadsheet", "SMS tool"],
    result: "Sample result placeholder. Add real client-approved outcomes only after launch.",
    disclaimer: "Sample Workflow - Not a Client Case Study",
    status: "sample",
    relatedServices: ["automated-lead-follow-up", "missed-call-website-lead-automation"],
  },
  {
    slug: "property-manager-maintenance-request-automation",
    title: "Property Manager Maintenance Request Automation",
    businessType: "Property management",
    location: "Niagara County, NY",
    problem: "Maintenance requests arrive through texts, emails, and forms with missing details and unclear urgency.",
    solution: "Use a structured intake workflow that categorizes requests and routes the next step.",
    workflow: [
      "Collect tenant name, unit, issue, photo link, and urgency.",
      "Summarize the request for staff review.",
      "Route urgent requests separately from routine maintenance.",
      "Create a vendor or internal task.",
      "Send the tenant a confirmation message.",
    ],
    toolsUsed: ["Form", "Email", "Task board", "Vendor list"],
    result: "Sample result placeholder. Add real client-approved outcomes only after launch.",
    disclaimer: "Sample Workflow - Not a Client Case Study",
    status: "sample",
    relatedServices: ["form-to-task-automation", "admin-workflow-automation"],
  },
  {
    slug: "med-spa-appointment-reminder-automation",
    title: "Med Spa Appointment Reminder Automation",
    businessType: "Med spa",
    location: "Amherst, NY",
    problem: "The front desk manually answers repeat questions, confirms appointments, and follows up after visits.",
    solution: "Automate reminders and common follow-up while routing sensitive questions to staff.",
    workflow: [
      "Send confirmation after booking.",
      "Send a reminder before the appointment.",
      "Route common preparation questions to approved FAQ content.",
      "Notify staff when a customer needs a human response.",
      "Send a polite review request after the visit.",
    ],
    toolsUsed: ["Calendar", "Email", "SMS", "FAQ content"],
    result: "Sample result placeholder. Add real client-approved outcomes only after launch.",
    disclaimer: "Sample Workflow - Not a Client Case Study",
    status: "sample",
    relatedServices: ["appointment-reminder-automation", "review-request-automation"],
  },
];

module.exports = caseStudies;
