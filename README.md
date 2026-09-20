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

## Join list

The homepage Join section collects a name and an email for meetup
announcements. Signups land in the `JOIN` KV namespace (key
`join:<lowercased email>`, so a repeat signup updates rather than duplicates)
and each one sends a notification to the club inbox with Reply-To the signer.
Luma stays the RSVP path for meetups.

Bindings on the Pages project (`bhw`):

- `JOIN` — KV namespace holding one entry per signup
- `JOIN_TOKEN` — secret guarding the CSV export
- `MAILER` — existing service binding to the `bhw-mailer` Worker (see
  Production services); join notifications go through it

Export the list:

```bash
curl "https://bhw.hu/api/join?token=$JOIN_TOKEN" -o join.csv
```

Without the token the endpoint returns 404. The HTTP export returns 503 once
the list exceeds 900 signups (KV caps a Worker invocation at 1,000
operations); for a larger list, read the namespace directly:

```bash
npx wrangler kv namespace list
npx wrangler kv key list --namespace-id <id> --remote
npx wrangler kv key get  --namespace-id <id> --remote "join:..."
```

A honeypot is the only abuse control on the public POST. If spam appears, add
a Cloudflare rate-limiting rule for `/api/join`; the KV free-tier write quota
(1,000/day) is the resource to watch.

## Production services

`/services/` offers club-run 3D printing, laser cutting, CAD and electronics
work. The form posts to `/api/request` (KV `REQUESTS`, notification mail) and
files go to `/api/upload` (R2 `bhw-uploads`), cited in the record by key.
Nothing is readable back over HTTP.

Bindings on the Pages project (`bhw`):

- `REQUESTS` — KV namespace holding one entry per brief, key `request:<iso>:<rand>`
- `UPLOADS` — R2 bucket `bhw-uploads`, private
- `MAILER` — service binding to the `bhw-mailer` Worker in `mailer/`

Notifications go through `bhw-mailer`, which uses Cloudflare Email Routing's
send binding: no credential at all, and it can only deliver to the verified
destination address on the account (`shylenkoa@gmail.com`). Deploy it from its
directory after any change:

```bash
cd mailer && npx wrangler deploy
```

Secrets, all optional:

- `SMTP_PASSWORD` — PrivateEmail password for andrii@shylenko.com; the fallback
  path for mail the send binding cannot carry (a customer reply, for instance)
- `SMTP_USER` — optional, defaults to the sender address
- `REQUEST_TO` — optional; setting it to an address other than the verified
  destination takes notifications off the credential-free path and needs SMTP

Local development with the bindings simulated:

```bash
npm run build
npx wrangler pages dev dist --kv REQUESTS --kv JOIN --r2 UPLOADS --service MAILER=bhw-mailer --binding JOIN_TOKEN=devtoken
```

Read the archive (wrangler defaults to *local* storage, so keep `--remote`):

```bash
npx wrangler kv namespace list
npx wrangler kv key list --namespace-id <id> --remote
npx wrangler kv key get  --namespace-id <id> --remote "request:..."
npx wrangler r2 object get bhw-uploads/<key> --remote --pipe
```

⚠️ Before promoting the page:

- **bhw.hu mail:** Cloudflare Email Routing is enabled (Cloudflare MX + SPF are
  live) and `bhw-mailer` sends club notifications to the verified destination.
  `hello@bhw.hu` is linked across the site; add a routing rule in the
  Cloudflare dashboard so it can receive and forward.
- Confirm the four prices (7,900 / 9,900 / 40,000 / 30,000 HUF floors).
- Publish a privacy notice covering the form and the uploads, and decide which
  entity quotes and invoices.

## Credits

Meetup #1 photography: Csaba Gábor.
