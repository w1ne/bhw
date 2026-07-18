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

Publish the current build with an authenticated Cloudflare session:

```bash
npm run build
npm run deploy
```

The public repository contains no deployment credential. Log in locally with `npx wrangler login` before the first deploy on a new machine.

## Credits

Meetup #1 photography: Csaba Gábor.
