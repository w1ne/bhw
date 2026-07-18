import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(packageJson.scripts.deploy, 'wrangler pages deploy dist --project-name bhw');

const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

assert.match(page, /BaseLayout/);
for (const component of ['Navigation', 'Hero', 'WhatWeDo', 'Events', 'NewsRecap', 'Join', 'Footer']) {
  assert.match(page, new RegExp(component));
}
assert.doesNotMatch(page, /Gallery|#gallery|Meetup #1 in photos/);

const recap = await readFile(new URL('../src/components/NewsRecap.astro', import.meta.url), 'utf8');
assert.match(recap, /images\/hero.jpg/);
assert.match(recap, /Build before the hardware arrives/);
assert.match(recap, /recap-presenter.jpg/);
assert.match(recap, /recap-room.jpg/);
assert.match(recap, /If you want to sponsor/);
assert.doesNotMatch(recap, /Read the full recap|Teljes összefoglaló|Roland Halbaksz/);

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
