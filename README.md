# WNY Automation Monorepo

This repository contains the production apps for WNY Automation.

```text
apps/marketing  Public WNY Automation website
apps/portal     WNY Automation Portal app
packages/       Reserved for shared code
```

## Local Development

```powershell
npm ci
npm run dev:marketing
npm run dev:portal
```

Marketing runs on `http://localhost:3000`.
Portal runs on `http://localhost:3003`.

## Production Domains

```text
wnyautomation.com      -> apps/marketing
www.wnyautomation.com  -> apps/marketing
app.wnyautomation.com  -> apps/portal
```

In Vercel, create two projects from this repo and set each project's root
directory to the matching app folder.
