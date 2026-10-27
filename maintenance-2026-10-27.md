# KACISTUDIO review — 27 October 2026

## Result and scope

Reviewed the production HTML/CSS/JavaScript, shared interactions, enquiry flow, build allow-list, preview and screenshot tooling, package/lockfile, CI configuration, edge guard and routes, security headers, sitemap/metadata, media references, and previous maintenance records. Inspected the directory inventory and preserved the existing staged original-media deletions and unrelated reference images. Historical archives, client documents, original photography and font licensing were not independently fact-checked.

Six findings were addressed locally (two P1, three P2, one P3). No P0 blocker was found. Changes have **not been committed, pushed or deployed**. Live checks describe the existing published site, not this new local version.

## Design and technical assessment

Anti-pattern verdict: pass in the inspected screens. The existing cream/mahogany palette, custom type, real photography and editorial composition form a recognizable brand. The review preserved that direction. Some legacy presentation code and hard-coded styling remain; this was not a redesign.

These scores summarize the inspected implementation, not a WCAG certification or laboratory performance benchmark.

| Dimension | Score | Finding |
|---|---:|---|
| Accessibility | 3/4 | Motion and onboarding contrast fixes; keyboard/form tests pass. Full assistive-technology and caption review remains outside this check. |
| Performance | 3/4 | 4.31 MB static artifact, deferred portfolio media, optimized images; rotations now stop off-screen and in background tabs. No new field Core Web Vitals measurement. |
| Responsive design | 4/4 | 75 page/viewport combinations pass the measured overflow/image checks; existing enlarged-text interaction tests pass. |
| Theming | 3/4 | Shared brand tokens remain consistent; some legacy hard-coded declarations remain. Light-only is the documented design. |
| Anti-patterns | 4/4 | Brand-specific typography, imagery and composition preserved in visual spot checks. |
| **Total** | **17/20** | **Good; bounded by the verification limits below.** |

## Findings fixed

### P1 — Carousels advanced despite reduced motion and lacked persistent pause

Locations: `about.html`, `services.html`, new `assets/carousel-rotation.js`, `assets/tokens.css`.

The values and onboarding carousels continued replacing content on timers with reduced motion enabled. Values did not pause for keyboard focus; onboarding pause flags could be overwritten by unrelated hover/entrance events. Neither had a persistent user-operated pause control. This shortened reading time and prevented reliable control of changing content (WCAG 2.2.2 concern).

Added a shared rotation controller and visible 44px-minimum pause/resume controls. Rotation respects reduced motion, focus, hover, viewport visibility and document visibility. Manual navigation remains available. Explicit user pause survives entrance/resume events. Controls inherit the section colors and have a visible focus outline and scroll clearance below the banner.

### P1 — Onboarding step labels and selected numeral had insufficient contrast

Location: `services.css`, `.onboard-chip` and `.onboard-chip-num`.

Inactive labels combined 55% text alpha with 70% element opacity. The selected numeral inherited the section's cream accent token while sitting on a cream fill. The selected step number was effectively invisible. This affects text readability (WCAG 1.4.3).

Inactive labels now use opaque cream, active numerals inherit the dark button text, and inactive boundaries are clearer. Regression coverage measures label and numeral contrast against their actual active/inactive backgrounds and requires at least 4.5:1.

### P2 — Malformed requests could terminate the preview server

Location: `serve.mjs`; coverage: `tests/preview-server.test.mjs`.

An invalid percent escape reached unguarded `decodeURIComponent`. Windows backslash separators also bypassed the intended slash-segment dotfile check. Invalid encoding now returns 400; backslashes, NULs and dot paths return 404. Tests confirm the server continues serving normal routes afterward. The development server now defaults to loopback; `HOST` can explicitly enable network sharing.

### P2 — Early banner setup threw when session storage was unavailable

Location: early inline banner script in the 14 public pages that contain a banner.

The shared navigation code already guarded storage access, but the early inline read did not. Browser storage restrictions could cause an uncaught page error. The early read now has the same safe fallback. Tests visit all 15 public routes with a throwing session-storage getter and verify banner dismissal where a banner exists, with no page errors.

### P2 — Screenshot helper depended on an obsolete machine-specific Chrome path

Location: `screenshot.mjs`.

Replaced the fixed Chrome 146 cache path with an explicit environment override, installed Windows Chrome discovery, and Puppeteer's default browser fallback. Browser cleanup now runs in `finally`, including after navigation/capture errors. Executed the helper successfully against the built site at 390px.

### P3 — Browser test dependency was behind the current release

Locations: `package.json`, `package-lock.json`.

Updated Puppeteer 25.13.0 to 25.16.0 after checking the [official release notes](https://github.com/puppeteer/puppeteer/releases/tag/puppeteer-v25.16.0). npm's audit reported zero known vulnerabilities, including after installation. A final successful `npm outdated --json` returned `{}`. This update concerns development/testing dependencies; the production site still has no client-side package bundle.

Installation skipped browser-download lifecycle scripts locally and used installed Chrome for verification. CI retains its explicit browser installation step. No global Node/npm installation was changed.

## Verification

- Existing baseline: 54/54 tests passed.
- Updated suite: **59/59 tests passed**, including storage-denied pages, both carousel controllers, step contrast, and malformed preview requests.
- Production build: **129 public files, 4.31 MB**; allow-list/privacy and content-hash tests pass.
- Fresh browser scan: **15 routes × five widths (320, 390, 768, 1024, 1440) = 75 combinations**. No measured page-wide overflow, broken loaded images, missing image alt attributes, wrong H1 counts, invalid JSON-LD or missing expected metadata. **37 distinct internal links/fragments** resolved.
- Existing interaction coverage includes mobile menu focus trapping/restoration, mobile/desktop switching, service controls/FAQs, Work selectors/videos, no-JavaScript content, image dimensions, and normal/enlarged mobile text.
- Enquiry success, rejection and timeout cases use intercepted responses. **No real enquiry was submitted.**
- Real-asset local maintenance check passes all 15 routes and private-path checks. The added shared carousel script is included and versioned by the build.
- Visual spot checks of both changed carousels at 390px and 1440px with actual fonts and images; fixed controls retain brand colors and readable layout.
- Read-only live maintenance check: **15/15 pages, 81 references, seven private paths, zero failures**.
- All **20 unique Cloudinary portfolio video URLs** returned 200 with video content types. This verifies availability, not complete playback or caption quality.
- Live CSP, nosniff, referrer policy, HSTS and permissions policy headers were present.
- `git diff --check` passed, with Git's existing line-ending warnings only.

The first new storage test assumed the 404 page had a banner; corrected the test to verify dismissal only where that control exists. The final suite passed. Full-page screenshots can show blanks for off-screen content-visibility sections; changed sections were checked using viewport screenshots while in view.

## Remaining release and account checks

1. Release the local changes through the normal review/deployment process, including the new shared script and new server test. Existing staged source-media deletions remain separate and untouched. No deployment was performed for this review.
2. Verify this dependency update in hosted CI and the deployed version after release. Local tests used Chrome on Windows, not the CI-downloaded browser.
3. Coordinate a labelled enquiry with the client to verify actual inbox receipt and account-side GA4 lead reporting. Mocked/API success cannot establish inbox delivery.
4. Spot-check a physical iPhone/Safari and assistive technology before claiming device-specific or full accessibility conformance. Browser emulation does not establish either.
5. Client approval remains necessary to substantiate business claims, results, testimonial attribution, availability, font/media rights and actual data-retention practices. Existing content was not invented or re-approved during this code review.

No additional design overhaul is recommended. Future visual changes should receive a focused `/polish` pass; account and release checks above are the substantive remaining work.

## Evidence

- `.tmp-checks/review-2026-10-27-final-tests.txt`
- `.tmp-checks/review-2026-10-27-assets.txt`
- `.tmp-checks/review-2026-10-27-live.txt`
- `.tmp-checks/review-2026-10-27/results.json`
- `.tmp-checks/review-2026-10-27/external.json`
- `.tmp-checks/review-2026-10-27/*-control-390.png` and `*-control-1440.png`

Reports, browser captures, test code and historical material remain outside `_site`.

## Same-day follow-up: CI release versions

A subsequent explicit check of all five GitHub Actions release feeds found two outdated actions missed in the initial review. Updated the optional manual GitHub Pages job from `configure-pages@v5` to `v6.0.0`, and `upload-pages-artifact@v3` to `v5.0.0`. Also replaced the floating `deploy-pages@v5` reference with exact `v5.0.1`; the floating major was not itself evidence of an outdated action. Checkout `v7.0.1` and setup-node `v7.1.0` already match the current releases.

Reviewed official release notes and action definitions: configure-pages now uses the action's Node 24 runtime; upload-pages-artifact retains the existing `_site` path input and excludes hidden files by default. The generated artifact has no required dotfiles. The job uses GitHub-hosted `ubuntu-latest`; its project Node 22 setting is separate from the action runtime. Triggers, permissions and the manual-only deployment condition remain unchanged. No workflow was run and no site was deployed. Diff validation passed; execution in hosted CI remains outstanding.

This adds one P3 maintenance finding to the original six (seven addressed findings total). It does not expand the earlier accessibility, performance, business-content or device-verification claims.

Official sources: [configure-pages v6.0.0](https://github.com/actions/configure-pages/releases/tag/v6.0.0), [upload-pages-artifact v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0), [deploy-pages v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1).
