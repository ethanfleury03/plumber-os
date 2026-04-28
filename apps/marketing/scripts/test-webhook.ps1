param(
  [Parameter(Mandatory = $true)]
  [string]$WebhookUrl
)

function Write-ShortContent {
  param([string]$Content)

  if ($Content.Length -gt 700) {
    Write-Host ($Content.Substring(0, 700) + "...")
    return
  }

  Write-Host $Content
}

$payload = @{
  eventType = "lead"
  task = "TEST from WNY Automation Co local webhook check"
  business = "WNY Automation Co Test Business"
  industry = "Testing"
  name = "Ethan Test"
  email = "test@example.com"
  phone = ""
  website = ""
  companyWebsite = ""
  source = "PowerShell webhook test"
  pageUrl = "http://localhost:8000"
  userAgent = "PowerShell"
  submittedAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

Write-Host "Checking webhook health..."
try {
  $health = Invoke-WebRequest -Uri $WebhookUrl -Method Get -MaximumRedirection 5
  Write-Host "GET status:" $health.StatusCode
  Write-ShortContent $health.Content
} catch {
  Write-Host "GET failed:"
  Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "Submitting test lead..."
try {
  $response = Invoke-WebRequest -Uri $WebhookUrl -Method Post -Body $payload -ContentType "text/plain;charset=utf-8" -MaximumRedirection 5
  Write-Host "POST status:" $response.StatusCode
  Write-ShortContent $response.Content
} catch {
  Write-Host "POST failed:"
  Write-Host $_.Exception.Message
}

$visitPayload = @{
  eventType = "visit"
  visitedAt = (Get-Date).ToUniversalTime().ToString("o")
  ownerVisit = "Yes"
  anonymousVisitorId = "local-test-visitor"
  source = "PowerShell webhook test"
  pageUrl = "http://localhost:8000"
  pageTitle = "WNY Automation Co local test"
  referrer = "Direct / none"
  userAgent = "PowerShell"
  language = "en-US"
  screenSize = "test"
  viewportSize = "test"
  timezone = "America/New_York"
} | ConvertTo-Json

Write-Host ""
Write-Host "Submitting test visit..."
try {
  $visitResponse = Invoke-WebRequest -Uri $WebhookUrl -Method Post -Body $visitPayload -ContentType "text/plain;charset=utf-8" -MaximumRedirection 5
  Write-Host "POST visit status:" $visitResponse.StatusCode
  Write-ShortContent $visitResponse.Content
} catch {
  Write-Host "POST visit failed:"
  Write-Host $_.Exception.Message
}
