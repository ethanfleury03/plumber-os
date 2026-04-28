const CONFIG = {
  bookingLink: window.WNY_AUTOMATION_CONFIG?.bookingLink || "https://calendly.com/wnyautomation/free-workflow-audit",
  businessEmail: window.WNY_AUTOMATION_CONFIG?.businessEmail || "hello@wnyautomation.co",
  leadEndpoint: window.WNY_AUTOMATION_CONFIG?.leadEndpoint || "/api/leads",
};

document.querySelectorAll("[data-calendly-link]").forEach((link) => {
  link.href = CONFIG.bookingLink;
  link.target = "_blank";
  link.rel = "noopener";
});

if (window.lucide) {
  window.lucide.createIcons();
} else {
  window.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });
}

function getUtmValues() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
  };
}

function trackEvent(name, params = {}) {
  const payload = {
    event_category: "lead_capture",
    ...params,
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
  }

  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", name, payload);
  }
}

function serializeWorkflowForm(form) {
  const data = new FormData(form);
  const utm = getUtmValues();

  return {
    submittedAt: new Date().toISOString(),
    name: value(data, "name"),
    email: value(data, "email"),
    phone: value(data, "phone"),
    businessName: value(data, "businessName") || value(data, "business"),
    website: value(data, "website"),
    industry: value(data, "industry"),
    manualTask: value(data, "manualTask") || value(data, "task"),
    source: value(data, "pageSource") || form.dataset.source || "website",
    pageUrl: window.location.href,
    pageTitle: document.title,
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    userAgent: navigator.userAgent,
    companyWebsite: value(data, "companyWebsite"),
    formVariant: value(data, "formVariant") || form.dataset.formVariant || "",
    conversionPath: value(data, "conversionPath") || form.dataset.conversionPath || "",
    detailFieldsProvided: getProvidedDetailFields(data).join(","),
  };
}

function value(data, key) {
  return data.get(key)?.toString().trim() || "";
}

function getProvidedDetailFields(data) {
  return ["name", "businessName", "business", "industry", "phone", "website"].filter((key) => value(data, key));
}

function storeLocalBackup(payload) {
  try {
    const storageKey = "wny_automation_leads";
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
    existing.push(payload);
    localStorage.setItem(storageKey, JSON.stringify(existing.slice(-50)));
  } catch (error) {
    // Local backup is helpful in development, but the form should still submit.
  }
}

async function sendLead(payload) {
  const response = await fetch(CONFIG.leadEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let body = {};
  try {
    body = await response.json();
  } catch (error) {
    body = {};
  }

  if (!response.ok || body.ok === false) {
    throw new Error("Lead submission failed");
  }

  return body;
}

function buildMailto(payload) {
  const subject = encodeURIComponent(`New WNY Automation Co workflow audit request from ${payload.businessName || "website lead"}`);
  const body = encodeURIComponent(
    [
      "New WNY Automation Co workflow audit request",
      "",
      `Task: ${payload.manualTask}`,
      `Business: ${payload.businessName}`,
      `Industry: ${payload.industry}`,
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Phone: ${payload.phone || "Not provided"}`,
      `Website: ${payload.website || "Not provided"}`,
      `Page: ${payload.pageUrl}`,
      `Submitted: ${payload.submittedAt}`,
    ].join("\n"),
  );

  return `mailto:${CONFIG.businessEmail}?subject=${subject}&body=${body}`;
}

function setFormStatus(form, message, options = {}) {
  const status = form.querySelector(".form-status");
  if (!status) return;

  const { isError = false, showBooking = false, mailto = "" } = options;
  status.textContent = "";
  status.classList.toggle("active", Boolean(message));
  status.classList.toggle("error", isError);

  if (!message) return;

  const text = document.createElement("span");
  text.textContent = message;
  status.append(text);

  if (showBooking || mailto) {
    const actions = document.createElement("div");
    actions.className = "status-actions";

    if (showBooking) {
      actions.append(createStatusLink("Book the Audit Call", CONFIG.bookingLink, "button-primary"));
    }

    if (mailto) {
      actions.append(createStatusLink("Email us directly", mailto));
    }

    status.append(actions);
  }
}

function createStatusLink(label, href, variant = "button-secondary") {
  const link = document.createElement("a");
  link.className = `button ${variant}`;
  link.href = href;
  link.textContent = label;

  if (href.startsWith("http")) {
    link.target = "_blank";
    link.rel = "noopener";
  }

  return link;
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;

  const href = link.getAttribute("href") || "";
  const label = link.textContent.trim().replace(/\s+/g, " ");

  if (href.includes("#workflow-form")) {
    trackEvent("cta_click", {
      conversion_path: "workflow_form",
      cta_label: label,
      cta_href: href,
    });
  }

  if (link.matches("[data-calendly-link]") || href.includes("calendly.com")) {
    trackEvent("calendly_click", {
      conversion_path: "calendly",
      cta_label: label,
      cta_href: href,
    });
  }

  if (link.classList.contains("header-login") || href.includes("client-portal")) {
    trackEvent("client_login_click", {
      conversion_path: "client_portal",
      cta_label: label,
      cta_href: href,
    });
  }
});

const workflowForms = new Set(document.querySelectorAll(".workflow-form, #workflow-form"));

workflowForms.forEach((form) => {
  form.addEventListener(
    "input",
    () => {
      trackEvent("form_start", {
        conversion_path: form.dataset.conversionPath || "",
        form_variant: form.dataset.formVariant || "",
      });
    },
    { once: true },
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const payload = serializeWorkflowForm(form);
    submitButton.disabled = true;
    setFormStatus(form, "Sending your workflow request...");

    try {
      storeLocalBackup(payload);
      await sendLead(payload);
      form.reset();
      trackEvent("lead_submit_success", {
        conversion_path: payload.conversionPath,
        detail_fields_provided: payload.detailFieldsProvided,
        form_variant: payload.formVariant,
      });
      setFormStatus(form, "Thanks - WNY Automation Co will review your workflow and send back a few practical automation ideas.", {
        showBooking: true,
      });
    } catch (error) {
      trackEvent("lead_submit_error", {
        conversion_path: payload.conversionPath,
        detail_fields_provided: payload.detailFieldsProvided,
        form_variant: payload.formVariant,
      });
      setFormStatus(form, "Something went wrong. Please try again or email us directly.", {
        isError: true,
        showBooking: true,
        mailto: buildMailto(payload),
      });
    } finally {
      submitButton.disabled = false;
    }
  });
});

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function numberValue(container, name) {
  return Number.parseFloat(container.querySelector(`[name="${name}"]`)?.value || "0") || 0;
}

function resultHtml(title, lines) {
  return `<strong>${title}</strong>${lines.map((line) => `<span>${line}</span>`).join("")}<a class="button button-primary button-small" href="/free-workflow-audit#workflow-form">Get My Free Automation Ideas</a>`;
}

function calculateMissedLead(container) {
  const totalLeads = numberValue(container, "monthlyWebsiteLeads") + numberValue(container, "monthlyMissedCalls");
  const averageJobValue = numberValue(container, "averageJobValue");
  const closeRate = numberValue(container, "estimatedCloseRate") / 100;
  const missedPercent = numberValue(container, "missedOpportunityPercent") / 100;
  const responseTime = numberValue(container, "currentResponseTime");
  const responsePenalty = responseTime > 8 ? 1.15 : responseTime > 2 ? 1.05 : 1;
  const estimatedMissedRevenue = totalLeads * averageJobValue * closeRate * missedPercent * responsePenalty;
  const result = container.querySelector("#missed-lead-result");

  result.innerHTML = resultHtml("Estimated missed opportunity", [
    `${formatCurrency(estimatedMissedRevenue)} per month may be worth reviewing.`,
    "Recommended automation: missed call and website lead follow-up.",
    "This is an estimate, not a guarantee.",
  ]);
}

function calculateAutomationRoi(container) {
  const weeklyHours = numberValue(container, "weeklyHours");
  const hourlyCost = numberValue(container, "hourlyCost");
  const people = Math.max(1, numberValue(container, "peopleInvolved"));
  const automationCost = numberValue(container, "automationCost");
  const monthlyVolume = numberValue(container, "monthlyVolume");
  const monthlyTimeCost = weeklyHours * hourlyCost * people * 4.33;
  const annualTimeCost = monthlyTimeCost * 12;
  const estimatedHoursSaved = weeklyHours * people * 0.35;
  const result = container.querySelector("#automation-roi-result");

  result.innerHTML = resultHtml("Estimated manual task cost", [
    `${formatCurrency(monthlyTimeCost)} per month in time cost.`,
    `${formatCurrency(annualTimeCost)} per year in time cost.`,
    `A first automation might target about ${estimatedHoursSaved.toFixed(1)} hours saved per week across ${monthlyVolume || "your"} monthly tasks.`,
    automationCost ? `Use the ${formatCurrency(automationCost)} placeholder as a planning input, not a quote.` : "Recommended next step: workflow audit.",
  ]);
}

function calculateReadiness(container) {
  const checked = [...container.querySelectorAll('input[type="checkbox"]')].filter((input) => input.checked).length;
  const result = container.querySelector("#readiness-quiz-result");
  let level = "Low";
  let recommendation = "Start by documenting one manual workflow before adding automation.";

  if (checked >= 6) {
    level = "High";
    recommendation = "You likely have a strong first workflow for a small automation pilot.";
  } else if (checked >= 3) {
    level = "Medium";
    recommendation = "You may have one or two useful workflows to review in a free audit.";
  }

  result.innerHTML = resultHtml(`${level} automation readiness`, [
    `${checked} signals matched.`,
    recommendation,
    "Recommended next step: submit the most repetitive task for review.",
  ]);
}

document.querySelectorAll("[data-calculate]").forEach((button) => {
  button.addEventListener("click", () => {
    const calculator = button.dataset.calculate;
    const container = button.closest("[data-calculator]");
    if (!container) return;

    if (calculator === "missed-lead") calculateMissedLead(container);
    if (calculator === "automation-roi") calculateAutomationRoi(container);
    if (calculator === "readiness-quiz") calculateReadiness(container);
  });
});

document.querySelectorAll("[data-calculator]").forEach((calculator) => {
  const button = calculator.querySelector("[data-calculate]");
  if (button) button.click();
});
