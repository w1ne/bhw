# Recap Photo Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the supplied Meetup #1 post as the complete on-site recap with three curated event images and no LinkedIn continuation link.

**Architecture:** `NewsRecap.astro` owns all bilingual article content and the three-image strip. Local image files in `public/images` make the post independent of Google Photos URLs; the global stylesheet supplies the responsive editorial layout.

**Tech Stack:** Astro, plain CSS, Node built-in assertions, Wrangler.

---

### Task 1: Add the selected album images and recap contract

**Files:**
- Create: `public/images/recap-presenter.jpg`
- Create: `public/images/recap-room.jpg`
- Modify: `tests/site-contract.mjs`

- [ ] **Step 1: Write the failing contract assertions**

```js
assert.match(recap, /recap-presenter.jpg/);
assert.match(recap, /recap-room.jpg/);
assert.match(recap, /If you want to sponsor/);
assert.doesNotMatch(recap, /Read the full recap|Teljes összefoglaló|Roland Halbaksz/);
```

- [ ] **Step 2: Run the contract test**

Run: `npm test`

Expected: failure because the supporting image paths and sponsor call to action are absent.

- [ ] **Step 3: Add the two selected image files**

Copy the selected wide presenter-and-audience shot to `public/images/recap-presenter.jpg` and the room-wide group shot to `public/images/recap-room.jpg`.

- [ ] **Step 4: Run the contract test**

Run: `npm test`

Expected: it still fails until the recap component is updated.

### Task 2: Publish the complete recap and responsive photo strip

**Files:**
- Modify: `src/components/NewsRecap.astro`
- Modify: `src/styles/global.css`
- Modify: `tests/site-contract.mjs`

- [ ] **Step 1: Replace the short recap with the supplied article**

Use an opening paragraph, a three-item technical lesson list, the existing feedback ladder, the board-adapter/AI paragraph, the ESP32-C3 hands-on paragraph, a general thanks/credit paragraph, and a sponsor/cooperation call to action. Keep EN/HU spans, omit the LinkedIn link and individual attendee names.

```astro
<div class="recap-photos">
  <img src="/images/hero.jpg" alt="People attending a Budapest Hardware Club presentation" loading="lazy" />
  <img src="/images/recap-presenter.jpg" alt="Presenter and audience at Meetup #1" loading="lazy" />
  <img src="/images/recap-room.jpg" alt="Meetup #1 audience in the room" loading="lazy" />
</div>
```

- [ ] **Step 2: Add responsive photo-strip styles**

```css
.recap-photos{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:26px}
.recap-photos img{width:100%;aspect-ratio:4/3;object-fit:cover;border:1px solid var(--line);border-radius:12px}
@media(max-width:760px){.recap-photos{grid-template-columns:1fr}.recap-photos img{aspect-ratio:16/10}}
```

- [ ] **Step 3: Run source and production checks**

Run: `npm test && npm run build && ! rg -n 'Read the full recap|Teljes összefoglaló|Roland Halbaksz' dist`

Expected: all commands succeed.

- [ ] **Step 4: Commit and deploy**

Run: `git add public src tests docs && git commit -m "feat: publish full Meetup #1 recap" && git push && npm run deploy`

Expected: the new Cloudflare Pages deployment URL is printed.

### Task 3: Verify production content

**Files:**
- Modify: none

- [ ] **Step 1: Verify the deployed page**

Run: `curl -fsSL <deployment-url> | rg -q 'Build before the hardware arrives' && ! curl -fsSL <deployment-url> | rg -q 'Read the full recap|Roland Halbaksz'`

Expected: the article appears and neither removed text is present.

## Plan self-review

- Spec coverage: Task 1 adds the two selected album images; Task 2 implements the complete recap, photo strip, exclusions and responsive layout; Task 3 verifies the live deployment.
- Placeholder scan: no deferred requirements remain.
- Consistency: the image filenames and no-link assertions match across all tasks.
