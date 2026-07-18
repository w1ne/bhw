import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(packageJson.scripts.deploy, 'wrangler pages deploy dist --project-name bhw');

const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

assert.match(page, /BaseLayout/);
for (const component of ['Navigation', 'Hero', 'WhatWeDo', 'Events', 'NewsRecap', 'Join', 'Footer']) {
  assert.match(page, new RegExp(component));
}
assert.doesNotMatch(page, /Gallery|#gallery|Meetup #1 in photos/);

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

console.log('site contract passed');
