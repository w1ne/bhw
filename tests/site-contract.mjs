import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(packageJson.scripts.deploy, 'wrangler pages deploy dist --project-name bhw');

const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

assert.match(page, /BaseLayout/);
for (const component of ['Navigation', 'Hero', 'Events', 'NewsRecap', 'Jobs', 'Production', 'Join', 'Footer']) {
  assert.match(page, new RegExp(component));
}
assert.doesNotMatch(page, /Gallery|#gallery|Meetup #1 in photos/);
assert.doesNotMatch(page, /Interest/);
assert.doesNotMatch(page, /Hackathon/);

const recap = await readFile(new URL('../src/components/NewsRecap.astro', import.meta.url), 'utf8');
assert.match(recap, /getCollection\('news'\)/);
assert.match(recap, /event-grid/);

const contentConfig = await readFile(new URL('../src/content.config.ts', import.meta.url), 'utf8');
assert.match(contentConfig, /news/);
await assert.rejects(access(new URL('../src/content/config.ts', import.meta.url)));

const article = await readFile(new URL('../src/content/news/meetup-1-build-before-the-hardware-arrives.md', import.meta.url), 'utf8');
assert.match(article, /Build before the hardware arrives/);
assert.match(article, /What we covered/);
assert.match(article, /recap-community-2.jpg/);
assert.match(article, /recap-room.jpg/);

const newsIndex = await readFile(new URL('../src/pages/news/index.astro', import.meta.url), 'utf8');
assert.match(newsIndex, /getCollection\('news'\)/);
assert.match(newsIndex, /\/news\/\$\{post\.slug\}\//);

const newsArticle = await readFile(new URL('../src/pages/news\/[slug].astro', import.meta.url), 'utf8');
assert.match(newsArticle, /getStaticPaths/);
assert.match(newsArticle, /render\(post\)/);

// The hackathon is over: its banner, section, nav entry and Join mention are
// gone for good, and the old interest form stays gone.
await assert.rejects(access(new URL('../src/components/Hackathon.astro', import.meta.url)));
await assert.rejects(access(new URL('../src/components/HackathonBanner.astro', import.meta.url)));
await assert.rejects(access(new URL('../src/components/Interest.astro', import.meta.url)));

const nav = await readFile(new URL('../src/components/Navigation.astro', import.meta.url), 'utf8');
assert.match(nav, /href="\/#join"/);
assert.doesNotMatch(nav, /luma\.com/);
assert.match(nav, /Join|Csatlakozz/);
assert.match(nav, /mailto:hello@bhw\.hu\?subject=Job%20posting/);
assert.match(nav, /Post a job|Állást hirdetek/);
assert.match(nav, /href="\/services\/#request"/);
assert.match(nav, /Production|Gyártás/);
assert.match(nav, /nav-cta/);
assert.doesNotMatch(nav, /href="\/machines\/"/);
assert.doesNotMatch(nav, /Machines|Gépek/);
assert.doesNotMatch(nav, /nav-toggle/);
assert.doesNotMatch(nav, /aria-expanded/);
assert.doesNotMatch(nav, /is-open|nav-open/);
assert.doesNotMatch(nav, /href="\/#jobs"/);
assert.doesNotMatch(nav, /href="\/#what"/);
assert.doesNotMatch(nav, /href="\/#events"/);
assert.doesNotMatch(nav, /href="\/news\/"/);
assert.doesNotMatch(nav, /hackathon/i);

const join = await readFile(new URL('../src/components/Join.astro', import.meta.url), 'utf8');
assert.doesNotMatch(join, /hackathon/i);
assert.doesNotMatch(join, /luma\.com/);
assert.match(join, /id="join"/);
assert.match(join, /id="joinform"/);
assert.match(join, /name="name"/);
assert.match(join, /name="email"/);
assert.match(join, /name="bhw_hp"/);
assert.match(join, /fetch\('\/api\/join'/);
assert.match(join, /mailto:hello@bhw\.hu/);

// Jobs board: static catalog in public/jobs.json, rendered by Jobs.astro.
const jobs = await readFile(new URL('../src/components/Jobs.astro', import.meta.url), 'utf8');
assert.match(jobs, /id="jobs"/);
assert.match(jobs, /EXPIRY_DAYS = 45/);
assert.match(jobs, /fetch\('\/jobs\.json'\)/);
assert.match(jobs, /mailto:hello@bhw\.hu/);

const jobsData = JSON.parse(await readFile(new URL('../public/jobs.json', import.meta.url), 'utf8'));
assert.ok(Array.isArray(jobsData));

// Machines feature removed: no page, no catalog, no nav.
await assert.rejects(access(new URL('../src/pages/machines.astro', import.meta.url)));
await assert.rejects(access(new URL('../public/machines.json', import.meta.url)));

// The signup endpoint is read-only now: export what was collected, accept nothing new.
const fn = await readFile(new URL('../functions/api/interest.js', import.meta.url), 'utf8');
assert.match(fn, /onRequestGet/);
assert.doesNotMatch(fn, /onRequestPost/);

const joinFn = await readFile(new URL('../functions/api/join.js', import.meta.url), 'utf8');
assert.match(joinFn, /onRequestPost/);
assert.match(joinFn, /onRequestGet/);
assert.match(joinFn, /env\.JOIN\b/);
assert.match(joinFn, /JOIN_TOKEN/);
assert.match(joinFn, /join:\$\{email\.toLowerCase\(\)\}/);
assert.match(joinFn, /lib\/mail\.js/);

await assert.rejects(access(new URL('../docs/superpowers', import.meta.url)));

const whatWeDo = await readFile(new URL('../src/components/WhatWeDo.astro', import.meta.url), 'utf8');
assert.equal((whatWeDo.match(/class="card"/g) ?? []).length, 3);
assert.match(whatWeDo, /Firmware engineering/);
assert.match(whatWeDo, /Product, hardware &amp; CAD/);
assert.match(whatWeDo, /Project discussions/);
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
assert.doesNotMatch(services, /href="\/machines\/"/);
assert.doesNotMatch(services, /See machines/);
assert.match(services, /process-tiles|data-process/);
assert.match(services, /price-table/);
assert.match(services, /#request/);
assert.match(services, /#prices/);

assert.match(nav, /href="\/services\/#request"/);
assert.match(nav, /Production|Gyártás/);

const production = await readFile(new URL('../src/components/Production.astro', import.meta.url), 'utf8');
assert.match(production, /href="\/services\/#request"/);
assert.match(production, /href="\/services\/#prices"/);
assert.doesNotMatch(production, /href="\/machines\/"/);
assert.match(production, /class="en"/);
assert.match(production, /class="hu"/);

const footer = await readFile(new URL('../src/components/Footer.astro', import.meta.url), 'utf8');
assert.match(footer, /href="\/services\/"/);
assert.doesNotMatch(footer, /href="\/machines\/"/);
assert.doesNotMatch(footer, /Machines|Gépek/);
assert.match(footer, /href="\/#events"/);
assert.match(footer, /href="\/news\/"/);
assert.match(footer, /href="\/#jobs"/);
assert.doesNotMatch(footer, /koamtachi/);

const request = await readFile(new URL('../functions/api/request.js', import.meta.url), 'utf8');
assert.match(request, /onRequestPost/);
assert.doesNotMatch(request, /onRequestGet/);

const upload = await readFile(new URL('../functions/api/upload.js', import.meta.url), 'utf8');
assert.match(upload, /onRequestPost/);
const permitList = upload.slice(upload.indexOf('const EXT = new Set(['), upload.indexOf(']);', upload.indexOf('const EXT')));
assert.ok(!/gcode/i.test(permitList), 'the upload permit list must not accept gcode');

const globalCss = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');
assert.doesNotMatch(globalCss, /nav-toggle/);
assert.doesNotMatch(globalCss, /\.nav\.is-open/);
assert.doesNotMatch(globalCss, /nav-open/);
assert.doesNotMatch(globalCss, /machine-grid|machine-card/);
assert.match(globalCss, /nav-cta/);
assert.match(globalCss, /prod-actions/);


const hero = await readFile(new URL('../src/components/Hero.astro', import.meta.url), 'utf8');
assert.match(hero, /luma\.com\/BudapestHardware/);
assert.match(hero, /Join the next meetup/);
assert.doesNotMatch(hero, /href="\/machines\/"/);


for (const path of [
  '../src/pages/services.astro',
  '../src/components/Production.astro',
  '../src/components/Hero.astro',
  '../src/components/Navigation.astro',
  '../src/components/Footer.astro',
]) {
  const body = await readFile(new URL(path, import.meta.url), 'utf8');
  assert.doesNotMatch(body, /Not a CO₂ workshop laser/i);
  assert.doesNotMatch(body, /Not a walk-in self-serve machine/i);
  assert.doesNotMatch(body, /Hard specs below/i);
  assert.doesNotMatch(body, /No walk-in; club jobs only/i);
  assert.doesNotMatch(body, /Nem CO₂-s műhelylézer/);
  assert.doesNotMatch(body, /Nem önkiszolgáló/);
  assert.doesNotMatch(body, /Kemény specifikáció/);
  assert.doesNotMatch(body, /Nincs önkiszolgálás; csak klubmunkák/);
}

console.log('site contract passed');
