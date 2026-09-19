import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(packageJson.scripts.deploy, 'wrangler pages deploy dist --project-name bhw');

const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

assert.match(page, /BaseLayout/);
for (const component of ['Navigation', 'Hero', 'WhatWeDo', 'Events', 'NewsRecap', 'Jobs', 'Join', 'Footer']) {
  assert.match(page, new RegExp(component));
}
assert.doesNotMatch(page, /Gallery|#gallery|Meetup #1 in photos/);
assert.doesNotMatch(page, /Interest/);
assert.doesNotMatch(page, /Hackathon/);

const recap = await readFile(new URL('../src/components/NewsRecap.astro', import.meta.url), 'utf8');
assert.match(recap, /getEntry\('news', 'meetup-1-build-before-the-hardware-arrives'\)/);
assert.match(recap, /<Content \/>/);

const contentConfig = await readFile(new URL('../src/content.config.ts', import.meta.url), 'utf8');
assert.match(contentConfig, /news/);
await assert.rejects(access(new URL('../src/content/config.ts', import.meta.url)));

const article = await readFile(new URL('../src/content/news/meetup-1-build-before-the-hardware-arrives.md', import.meta.url), 'utf8');
assert.match(article, /Build before the hardware arrives/);
assert.match(article, /What we dug into/);
assert.match(article, /recap-community-2.jpg/);
assert.match(article, /recap-room.jpg/);

const newsIndex = await readFile(new URL('../src/pages/news/index.astro', import.meta.url), 'utf8');
assert.match(newsIndex, /getCollection\('news'\)/);
assert.match(newsIndex, /\/news\/\$\{post\.slug\}\//);

const newsArticle = await readFile(new URL('../src/pages/news/[slug].astro', import.meta.url), 'utf8');
assert.match(newsArticle, /getStaticPaths/);
assert.match(newsArticle, /render\(post\)/);

// The hackathon is over: its banner, section, nav entry and Join mention are
// gone for good, and the old interest form stays gone.
await assert.rejects(access(new URL('../src/components/Hackathon.astro', import.meta.url)));
await assert.rejects(access(new URL('../src/components/HackathonBanner.astro', import.meta.url)));
await assert.rejects(access(new URL('../src/components/Interest.astro', import.meta.url)));

const nav = await readFile(new URL('../src/components/Navigation.astro', import.meta.url), 'utf8');
assert.match(nav, /href="\/#jobs"/);
assert.match(nav, /Jobs/);
assert.doesNotMatch(nav, /hackathon/i);

const join = await readFile(new URL('../src/components/Join.astro', import.meta.url), 'utf8');
assert.doesNotMatch(join, /hackathon/i);

// Jobs board: static catalog in public/jobs.json, rendered by Jobs.astro.
const jobs = await readFile(new URL('../src/components/Jobs.astro', import.meta.url), 'utf8');
assert.match(jobs, /id="jobs"/);
assert.match(jobs, /EXPIRY_DAYS = 45/);
assert.match(jobs, /fetch\('\/jobs\.json'\)/);
assert.match(jobs, /mailto:hello@bhw\.hu/);

const jobsData = JSON.parse(await readFile(new URL('../public/jobs.json', import.meta.url), 'utf8'));
assert.ok(Array.isArray(jobsData));

// The signup endpoint is read-only now: export what was collected, accept nothing new.
const fn = await readFile(new URL('../functions/api/interest.js', import.meta.url), 'utf8');
assert.match(fn, /onRequestGet/);
assert.doesNotMatch(fn, /onRequestPost/);

await assert.rejects(access(new URL('../docs/superpowers', import.meta.url)));

const whatWeDo = await readFile(new URL('../src/components/WhatWeDo.astro', import.meta.url), 'utf8');
assert.equal((whatWeDo.match(/class="card"/g) ?? []).length, 3);
assert.match(whatWeDo, /Firmware engineering/);
assert.match(whatWeDo, /Product, hardware &amp; CAD/);
assert.match(whatWeDo, /Open knowledge/);
assert.doesNotMatch(whatWeDo, /Digital twins/);

const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
assert.match(layout, /bhw-lang/);
assert.match(layout, /data-set/);

// Production services: one page, one intake, files in R2 only.
const services = await readFile(new URL('../src/pages/services.astro', import.meta.url), 'utf8');
assert.match(services, /BaseLayout/);
assert.match(services, /class="en"/);
assert.match(services, /class="hu"/);
assert.match(services, /fetch\('\/api\/upload'/);
assert.match(services, /fetch\('\/api\/request'/);
assert.match(services, /never run someone else's G-code/);

assert.match(nav, /href="\/services\/"/);
assert.match(nav, /Gyártás/);

const request = await readFile(new URL('../functions/api/request.js', import.meta.url), 'utf8');
assert.match(request, /onRequestPost/);
assert.doesNotMatch(request, /onRequestGet/);

const upload = await readFile(new URL('../functions/api/upload.js', import.meta.url), 'utf8');
assert.match(upload, /onRequestPost/);
const permitList = upload.slice(upload.indexOf('const EXT = new Set(['), upload.indexOf(']);', upload.indexOf('const EXT')));
assert.ok(!/gcode/i.test(permitList), 'the upload permit list must not accept gcode');

console.log('site contract passed');
