import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

assert.match(page, /BaseLayout/);
for (const component of ['Navigation', 'Hero', 'WhatWeDo', 'Events', 'NewsRecap', 'Join', 'Footer']) {
  assert.match(page, new RegExp(component));
}
assert.doesNotMatch(page, /Gallery|#gallery|Meetup #1 in photos/);

const recap = await readFile(new URL('../src/components/NewsRecap.astro', import.meta.url), 'utf8');
assert.match(recap, /images\/hero.jpg/);
assert.match(recap, /Build before the hardware arrives/);
assert.match(recap, /linkedin.com\/company\/budapest-hardware-club/);

const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
assert.match(layout, /bhw-lang/);
assert.match(layout, /data-set/);

console.log('site contract passed');
