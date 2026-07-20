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

## Hackathon interest form

`functions/api/interest.js` backs the signup form on the homepage. It needs two
bindings on the Pages project (both already configured for production and preview):

- `INTEREST` — KV namespace holding one entry per signup, keyed by lowercased email
- `INTEREST_TOKEN` — secret guarding the CSV export

Export the signups:

```bash
curl "https://bhw.hu/api/interest?token=$INTEREST_TOKEN" -o interest.csv
```

Without the token the endpoint returns 404, so the list is not discoverable.

## Credits

Meetup #1 photography: Csaba Gábor.
