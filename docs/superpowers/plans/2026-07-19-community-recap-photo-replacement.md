# Community recap photo replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the presenter-focused recap images with the two organiser-selected community photos and deploy the update through Cloudflare Pages.

**Architecture:** The static image files live in `public/images`, while `NewsRecap.astro` owns the ordered recap image strip and its descriptive alt text. The existing source-contract test will assert the selected filenames and reject the retired presenter/hero images in that strip.

**Tech Stack:** Astro, static JPEG assets, Node.js source-contract test, Cloudflare Pages Git deployment.

---

### Task 1: Replace and verify the recap image strip

**Files:**
- Create: `public/images/recap-community-1.jpg`
- Create: `public/images/recap-community-2.jpg`
- Modify: `src/components/NewsRecap.astro`
- Modify: `tests/site-contract.mjs`

- [ ] **Step 1: Write the failing source-contract assertions**

Add assertions requiring the recap image strip to include the two selected community filenames, retain `recap-room.jpg`, and exclude `hero.jpg` and `recap-presenter.jpg` from the image strip.

- [ ] **Step 2: Run the contract test to verify it fails**

Run: `npm test`

Expected: FAIL because `NewsRecap.astro` still references `hero.jpg` and `recap-presenter.jpg`.

- [ ] **Step 3: Add the selected image assets and update the strip**

Download the two organiser-selected Google Photos assets as `recap-community-1.jpg` and `recap-community-2.jpg`. Replace the first two `<img>` elements inside `.recap-photos` with:

```astro
<img src="/images/recap-community-1.jpg" alt="Budapest Hardware Club members working and talking together at Meetup #1" loading="lazy" />
<img src="/images/recap-community-2.jpg" alt="Budapest Hardware Club community gathered during Meetup #1" loading="lazy" />
```

Keep the existing `recap-room.jpg` image as the third element.

- [ ] **Step 4: Run validation**

Run: `npm test && npm run build`

Expected: both commands exit successfully and Astro writes the production site to `dist`.

- [ ] **Step 5: Commit and push the published change**

Run:

```bash
git add public/images/recap-community-1.jpg public/images/recap-community-2.jpg src/components/NewsRecap.astro tests/site-contract.mjs
git commit -m "feat: use community photos in recap"
git push origin main
```

Expected: GitHub accepts the commit and Cloudflare Pages automatically begins a deployment for the new `main` revision.

- [ ] **Step 6: Verify production deployment**

Run: `npx wrangler pages deployment list --project-name bhw`

Expected: the newest production deployment has the commit from Step 5 as its source and reaches `Active` status.
