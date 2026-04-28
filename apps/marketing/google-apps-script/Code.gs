const LEAD_SHEET_NAME = "Leads";
const VISIT_SHEET_NAME = "Visits";
const SPREADSHEET_ID = "";
const NOTIFICATION_EMAIL = "hello@wnyautomation.co";

const LEAD_HEADERS = [
  "Submitted At",
  "Business",
  "Industry",
  "Name",
  "Email",
  "Phone",
  "Website",
  "Manual Task",
  "Source",
  "Page URL",
  "User Agent",
];

const VISIT_HEADERS = [
  "Visited At",
  "Owner Visit",
  "Anonymous Visitor ID",
  "Page URL",
  "Page Title",
  "Referrer",
  "Source",
  "Language",
  "Screen Size",
  "Viewport Size",
  "Timezone",
  "User Agent",
];

function doPost(event) {
  try {
    const payload = parsePayload_(event);

    if (payload.eventType === "visit") {
      logVisit_(payload);
      return jsonResponse_({ ok: true, eventType: "visit" });
    }

    if (payload.companyWebsite) {
      return jsonResponse_({ ok: true, skipped: true });
    }

    validatePayload_(payload);

    logLead_(payload);
    sendNotification_(payload);

    return jsonResponse_({ ok: true, eventType: "lead" });
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message });
  }
}

function doGet() {
  return jsonResponse_({
    ok: true,
    service: "WNY Automation Co lead webhook",
    message: "Webhook is reachable. POST a visit or lead event to save it to Google Sheets.",
  });
}

function parsePayload_(event) {
  if (!event) {
    return {};
  }

  if (event.postData && event.postData.contents) {
    try {
      return JSON.parse(event.postData.contents);
    } catch (error) {
      // Fall back to form parameters below.
    }
  }

  return event.parameter || {};
}

function validatePayload_(payload) {
  const requiredFields = ["task", "business", "industry", "name", "email"];
  const missingFields = requiredFields.filter((field) => !payload[field]);

  if (missingFields.length) {
    throw new Error("Missing required fields: " + missingFields.join(", "));
  }
}

function logLead_(payload) {
  const sheet = getSheet_(LEAD_SHEET_NAME, LEAD_HEADERS);
  sheet.appendRow([
    payload.submittedAt || new Date().toISOString(),
    payload.business || "",
    payload.industry || "",
    payload.name || "",
    payload.email || "",
    payload.phone || "",
    payload.website || "",
    payload.task || "",
    payload.source || "WNY Automation Co landing page",
    payload.pageUrl || "",
    payload.userAgent || "",
  ]);
}

function logVisit_(payload) {
  const sheet = getSheet_(VISIT_SHEET_NAME, VISIT_HEADERS);
  sheet.appendRow([
    payload.visitedAt || new Date().toISOString(),
    payload.ownerVisit || "No",
    payload.anonymousVisitorId || "",
    payload.pageUrl || "",
    payload.pageTitle || "",
    payload.referrer || "",
    payload.source || "WNY Automation Co landing page",
    payload.language || "",
    payload.screenSize || "",
    payload.viewportSize || "",
    payload.timezone || "",
    payload.userAgent || "",
  ]);

  if (payload.ownerVisit === "Yes") {
    const row = sheet.getLastRow();
    sheet.getRange(row, 1, 1, sheet.getLastColumn()).setBackground("#d9eaff");
  }
}

function getSpreadsheet_() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(sheetName, headers) {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else {
    ensureHeaders_(sheet, headers);
  }

  return sheet;
}

function ensureHeaders_(sheet, headers) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const missingHeaders = headers.filter(function(header) {
    return existingHeaders.indexOf(header) === -1;
  });

  if (!missingHeaders.length) {
    return;
  }

  sheet.getRange(1, lastColumn + 1, 1, missingHeaders.length).setValues([missingHeaders]);
}

function sendNotification_(payload) {
  if (!NOTIFICATION_EMAIL || NOTIFICATION_EMAIL === "hello@wnyautomation.co") {
    return;
  }

  const subject = "New WNY Automation Co workflow audit request from " + payload.business;
  const body = [
    "New WNY Automation Co workflow audit request",
    "",
    "Manual task:",
    payload.task || "",
    "",
    "Business: " + (payload.business || ""),
    "Industry: " + (payload.industry || ""),
    "Name: " + (payload.name || ""),
    "Email: " + (payload.email || ""),
    "Phone: " + (payload.phone || "Not provided"),
    "Website: " + (payload.website || "Not provided"),
    "Source: " + (payload.source || "WNY Automation Co landing page"),
    "Page URL: " + (payload.pageUrl || ""),
    "Submitted: " + (payload.submittedAt || new Date().toISOString()),
  ].join("\n");

  MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
