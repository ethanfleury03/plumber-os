# WNY Automation Website

Public website and blog publishing API for WNY Automation.

## Local Development

Run from the monorepo root:

```powershell
npm run dev:marketing
```

Then open:

```text
http://localhost:3000
```

## Production Storage

The app is Vercel-native Next.js. In production, configure:

```text
DATABASE_URL
BLOG_API_TOKEN
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_PUBLIC_BASE_URL
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_CLIENT_PORTAL_URL=https://app.wnyautomation.com/sign-in
```

Blog rows are stored in Postgres table `marketing_blogs`. Blog images posted as
`image_data_url` are uploaded to Cloudflare R2 under `marketing/blogs/`.

## Routes

```text
GET  /
GET  /services
GET  /industries
GET  /locations
GET  /resources
GET  /blog
GET  /blog/:slug
GET  /sitemap.xml
GET  /robots.txt
POST /api/leads
GET  /api/blogs?limit=6
GET  /api/blogs/:slug
POST /api/blogs
```

`/client-portal` redirects to `NEXT_PUBLIC_CLIENT_PORTAL_URL`.

## Blog Publishing

Protected write endpoint:

```text
POST /api/blogs
Authorization: Bearer <BLOG_API_TOKEN>
Content-Type: application/json
```

Posting the same `slug` updates the existing blog.

## n8n Blog Auto-Post

After `Merge Blog + Image`, add a Code node named `Prepare Blog API Payload`
using:

```text
n8n/code/prepare-blog-api-payload.js
```

Then add an HTTP Request node:

- Method: `POST`
- URL: `https://wnyautomation.com/api/blogs`
- Header: `Authorization` = `Bearer YOUR_BLOG_API_TOKEN`
- Header: `Content-Type` = `application/json`
- Body: JSON from the current item

Keep `BLOG_API_TOKEN` out of saved files.

## Tests

From the monorepo root:

```powershell
npm run test --workspace @wnyautomation/marketing
npm run build --workspace @wnyautomation/marketing
```
