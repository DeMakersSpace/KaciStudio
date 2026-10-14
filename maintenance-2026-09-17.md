# KACISTUDIO monthly maintenance — 17 September 2026

## Follow-up fixes — 17 September 2026

This section supersedes the original follow-up items below. All changes are local and uncommitted; no production deployment or real enquiry has been made.

- Added automatic content hashes to built CSS/JavaScript URLs. Returning visitors request changed assets through new URLs instead of retaining week-old navigation or style files.
- Removed build-time sitemap date rewriting. Dates now remain stable between builds and are maintained in the source sitemap. Today's content change affects every listed page because the shared availability banner changed.
- Replaced the unconfirmed Q3 intake claim with evergreen enquiry wording throughout the pages. No new capacity or quarter was invented.
- Added GA4 `generate_lead` after provider-confirmed submission only, with a fixed form ID and no visitor-entered fields. Failed submissions do not emit it; analytics exceptions cannot prevent the success confirmation.
- Updated `llms.txt` to match the current Studio/Atelier/Maison/Bespoke, Content Creation, and Event Branding packages. Case-study links point to their real pages; service links now select the corresponding category, including on hash changes.
- Kept Cloudflare Pages as the documented production target. GitHub Pages is now an explicit opt-in manual workflow; CI also runs on pull requests. These are repository changes, not changes to either hosting account.
- Documented the Cloudflare build/test gate and final release checks in README.

Validation: 39 regression tests passed; real-asset browser checks passed for 15 pages, 79 same-origin references, and seven private-path checks; desktop/mobile homepage screenshots reviewed. The public build contains 126 files (4.31 MB). `git diff --check` passed. A fresh npm audit reported zero vulnerabilities; `npm outdated` reported no updates.

Still requires account/client access:

1. Review the combined pre-existing working tree, commit/release the tested artifact through Cloudflare, set the dashboard build command to `npm test`, and check the live deployment. No connected hosting browser/account tooling or Cloudflare environment credentials were available in this session.
2. Verify `generate_lead` collection and key-event configuration in GA4. The browser behavior is tested; account configuration is not verified.
3. Arrange an explicitly authorized labelled test enquiry and have the client confirm inbox receipt. Mocked provider success is not proof of inbox delivery.

The neutral intake wording and optional GitHub Pages workflow are the documented defaults pending the user's answers about availability and hosting preference.

## Delivery status

Changes completed and verified locally; not deployed or committed. The project already contained extensive uncommitted page/navigation work and staged source-media deletions when this review began. Those changes were preserved. Publish only the generated `_site` artifact using the established deployment process after reviewing the combined working tree.

## Completed this maintenance pass

- Fixed mobile menu scroll locking when the viewport changes to desktop; focus moves to visible navigation.
- Fixed the mobile navigation overlapping introductory labels: horizontal clipping now avoids creating an unintended scroll container. Expanded overlap checks to include these labels.
- Fixed desktop navigation remaining hidden when a keyboard user focuses it, including after switching from mobile to desktop.
- Prevented blocked browser session storage from interrupting shared navigation initialization.
- Added a 15-second enquiry request timeout, duplicate-submit protection, and an accessible busy state. Failed requests keep the visitor's brief and allow retrying.
- Moved focus to the success confirmation after submission and respected reduced-motion preferences.
- Updated Puppeteer from 25.9.0 to 25.11.0 and refreshed the dependency lockfile.
- Added regression coverage for navigation resizing/focus and simulated enquiry success, rejection, and timeout.
- Added a reusable read-only browser/link maintenance check and documented the monthly procedure.

## Verification

- `npm test`: 36 passed, 0 failed, including after the dependency update.
- npm dependency audit: 0 known vulnerabilities reported. This is a dependency audit, not a penetration test.
- Production build: 126 public files, 4.31 MB. Internal documents and source tooling stay outside the public artifact.
- Live browser check: 15 pages, 78 unique same-origin references, and seven private-path checks passed; no page JavaScript errors recorded.
- Local browser checks load real images/fonts in addition to the asset-blocking regression suite. Homepage screenshots reviewed at 1440px and 390px.
- Local checks: 15 pages, 79 unique same-origin references, and seven private-path checks passed.
- Responsive regression coverage includes 320px, 390px, 1440px, 1863px, and 2560px where applicable.
- `git diff --check`: passed.
- Form scenarios use a mocked provider. No real enquiry was sent; actual inbox delivery and spam-folder routing remain unverified.
- Live checks describe the existing deployment, not the newly edited local code. External social links and every Cloudinary video were not exhaustively verified.

## Audit assessment

No broad redesign is needed. The custom typography, warm palette, and real studio photography give the site a distinctive identity. Existing automated checks cover selected contrast pairs, keyboard controls, reduced motion, mobile overflow, and progressive enhancement; they do not establish complete WCAG conformance.

| Dimension | Review score / 4 | Finding |
| --- | --- | --- |
| Accessibility | 3 | Navigation and form recovery improved; full manual assistive-technology review remains outstanding. |
| Performance | 3 | Small static artifact and optimized imagery; field Core Web Vitals were not available. |
| Responsive design | 3 | Tested layouts pass; viewport transition fixed. |
| Theming | 3 | Existing shared tokens and intentional light-only brand design. |
| Design anti-patterns | 4 | Distinctive editorial photography and typography; no generic redesign warranted. |
| Total | 16/20 | Good; scoped engineering assessment, not a certification. |

## Priorities and next monthly work

1. **P1 fixed — Navigation accessibility:** `assets/chrome.js`. Hidden navigation could conceal focused links; an open mobile menu could keep desktop scrolling locked. Covered by the new browser regression.
2. **P2 fixed — Enquiry recovery:** `contact.html`. A stalled provider could leave the submit button disabled indefinitely. Timeout, retry, retained input, and focused confirmation now cover this path.
3. **P2 content follow-up — Availability banner:** confirm whether “2 brands for Q3 2026” is still accurate. Q3 ends on 30 September. Obtain the client's actual capacity and next intake wording before changing this business claim. Suggested follow-up: `/clarify`.
4. **P2 operational follow-up — Lead delivery:** coordinate one clearly labelled enquiry with the client and confirm inbox receipt. Current tests verify browser behavior only.
5. **P2 measurement follow-up — Monthly results:** use authorized GA4/Search Console access to report enquiries, organic clicks, impressions, top landing pages, and available field Core Web Vitals. No performance or traffic improvement is claimed without measurements. Suggested follow-up: `/optimize` where measurements show a problem.
6. **P3 SEO accuracy — Sitemap dates:** the existing build changes every sitemap `lastmod` on every build. A future improvement is to track substantive page changes so unchanged pages keep their dates.
7. **P3 release process — Hosting clarity:** README describes Cloudflare Pages, while `.github/workflows/static.yml` also deploys GitHub Pages. Confirm whether that second deployment is intentional before retiring it; GitHub Pages does not use the Cloudflare `_headers` policy.
8. Finish any subsequent visual/content changes with `/polish` and repeat the scoped audit.

## Client-facing update

“Completed the monthly website maintenance review. Checked published pages, internal links, assets, and protection of internal files. Improved navigation accessibility and enquiry-form recovery, updated testing dependencies, and passed 36 regression checks. The updates are prepared locally for release. Please confirm the next intake availability message and arrange an inbox-delivery check.”
