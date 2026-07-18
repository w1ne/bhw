# Three-Pillar Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four “What happens” cards with the approved three bilingual pillars.

**Architecture:** `WhatWeDo.astro` remains the sole owner of the card copy. The source contract verifies the number of cards and the approved English titles before Astro generates the unchanged responsive card layout.

**Tech Stack:** Astro, plain CSS, Node built-in assertions, Wrangler.

---

### Task 1: Update and verify the three bilingual cards

**Files:**
- Modify: `src/components/WhatWeDo.astro`
- Modify: `tests/site-contract.mjs`

- [ ] **Step 1: Write the failing card assertions**

```js
const whatWeDo = await readFile(new URL('../src/components/WhatWeDo.astro', import.meta.url), 'utf8');
assert.equal((whatWeDo.match(/class="card"/g) ?? []).length, 3);
assert.match(whatWeDo, /Firmware engineering/);
assert.match(whatWeDo, /Product, hardware &amp; CAD/);
assert.match(whatWeDo, /Open knowledge/);
assert.doesNotMatch(whatWeDo, /Digital twins/);
```

- [ ] **Step 2: Run the test**

Run: `npm test`

Expected: failure because the component still has four cards and Digital twins copy.

- [ ] **Step 3: Replace the four cards with the approved three cards**

```astro
<div class="card"><div class="ic">⚙️</div><h3><span class="en">Firmware engineering</span><span class="hu">Firmware mérnökség</span></h3><p><span class="en">Testable firmware, reliable CI, and lessons from real failures.</span><span class="hu">Tesztelhető firmware, megbízható CI és tanulságok valódi hibákból.</span></p></div>
<div class="card"><div class="ic">🔩</div><h3><span class="en">Product, hardware &amp; CAD</span><span class="hu">Termék, hardver és CAD</span></h3><p><span class="en">From concepts and digital models to boards, sensors, embedded systems and robotics.</span><span class="hu">A koncepcióktól és digitális modellektől a panelekig, szenzorokig, beágyazott rendszerekig és robotikáig.</span></p></div>
<div class="card"><div class="ic">🤝</div><h3><span class="en">Open knowledge</span><span class="hu">Nyílt tudás</span></h3><p><span class="en">Show what you’re building, share what breaks, and learn together.</span><span class="hu">Mutasd meg, min dolgozol, oszd meg, mi törik el, és tanuljunk együtt.</span></p></div>
```

- [ ] **Step 4: Run production verification**

Run: `npm test && npm run build && ! rg -n 'Digital twins' dist`

Expected: all commands succeed.

- [ ] **Step 5: Commit, publish and deploy**

Run: `git add src tests docs && git commit -m "feat: focus what-we-do on three pillars" && git push && npm run deploy`

Expected: Wrangler prints a new production deployment URL.

## Plan self-review

- Spec coverage: the card count, removal, approved English/Hungarian titles and copy are all implemented in Task 1.
- Placeholder scan: no deferred requirements remain.
- Consistency: the component, contract and deployment commands use the same file names and titles.
