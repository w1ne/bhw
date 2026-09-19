# Budapest Hardware Club

The website for the Budapest Hardware Club: a bilingual (EN/HU) community for people building hardware, firmware, embedded systems and robotics.

## Local development

```bash
npm install
npm run dev
```

Run the production checks with:

```bash
npm test
npm run build
```

## Deployment

Cloudflare Pages hosts this static Astro site.

- Build command: `npm run build`
- Build output directory: `dist`

The Pages project is connected to this GitHub repo and deploys automatically:

- push to `main` → production, live on bhw.hu
- push any other branch → a preview deployment on `*.bhw-38w.pages.dev`

Manual publishing is still possible with an authenticated Cloudflare session, but
it is not the normal path:

```bash
npm run build
npm run deploy
```

The public repository contains no deployment credential. Log in locally with `npx wrangler login` before the first deploy on a new machine.

## Jobs

Listings are static data in `public/jobs.json`, rendered client-side by
`src/components/Jobs.astro` (newest first, hidden after 45 days). The
**Post a job** button opens a prefilled email to hello@bhw.hu — review the
submission, then append an entry:

```json
{
  "title": "Senior Firmware Engineer",
  "company": "Acme Kft.",
  "location": "Budapest",
  "remote": false,
  "salary": "HUF 1.2M-1.6M / month",
  "tags": ["firmware", "Zephyr", "Rust"],
  "url": "https://example.com/jobs/123",
  "email": "",
  "posted": "2026-09-15"
}
```

`title`, `company` and `posted` (YYYY-MM-DD) are required; `url` is preferred
for the Apply button, `email` is the fallback. The contract test pins the
45-day expiry and the posting mailto.

### Retired interest list

The old homepage form is gone. `functions/api/interest.js` keeps only the
token-gated CSV export so the addresses it already collected can be pulled and
mailed about the event; it no longer accepts submissions. It still needs two
bindings on the Pages project:

- `INTEREST` — KV namespace holding one entry per signup, keyed by lowercased email
- `INTEREST_TOKEN` — secret guarding the CSV export

Export the signups:

```bash
curl "https://bhw.hu/api/interest?token=$INTEREST_TOKEN" -o interest.csv
```

Without the token the endpoint returns 404, so the list is not discoverable.
Once the list has been exported and mailed, delete the function and the KV
namespace.

## Production services

`/services/` offers club-run 3D printing, laser cutting, CAD and electronics
work. The form posts to `/api/request` (KV `REQUESTS`, notification mail) and
files go to `/api/upload` (R2 `bhw-uploads`), cited in the record by key.
Nothing is readable back over HTTP.

Bindings on the Pages project (`bhw`):

- `REQUESTS` — KV namespace holding one entry per brief, key `request:<iso>:<rand>`
- `UPLOADS` — R2 bucket `bhw-uploads`, private

Secrets:

- `SMTP_PASSWORD` — PrivateEmail password for andrii@shylenko.com (notifications)
- `SMTP_USER` — optional, defaults to the sender address
- `REQUEST_TO` — optional, defaults to shylenkoa@gmail.com

Local development with the bindings simulated:

```bash
npm run build
npx wrangler pages dev dist --kv REQUESTS --r2 UPLOADS
```

Read the archive (wrangler defaults to *local* storage, so keep `--remote`):

```bash
npx wrangler kv namespace list
npx wrangler kv key list --namespace-id <id> --remote
npx wrangler kv key get  --namespace-id <id> --remote "request:..."
npx wrangler r2 object get bhw-uploads/<key> --remote --pipe
```

⚠️ Before promoting the page:

- **bhw.hu publishes no MX records** — `hello@bhw.hu` cannot receive mail today.
  Set up Cloudflare Email Routing (or a real mailbox) before linking the address.
- Confirm the four prices (7,900 / 9,900 / 40,000 / 30,000 HUF floors).
- Publish a privacy notice covering the form and the uploads, and decide which
  entity quotes and invoices.

## Credits

Meetup #1 photography: Csaba Gábor.
