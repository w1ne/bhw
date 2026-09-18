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

## Credits

Meetup #1 photography: Csaba Gábor.
