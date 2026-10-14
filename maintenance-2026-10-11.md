# KACISTUDIO maintenance and audit — 11 October 2026

## Status
Local maintenance and review only; no deployment, commit, or real enquiry sent. Existing staged media deletions were preserved. KacisStudio HEAD 31fb122 (21 September) includes release snapshot commit 47028bb (18 September), verified with git merge-base --is-ancestor.

## Completed maintenance
- Fixed Windows Chrome discovery in tests/site-regressions.test.mjs:54–56, accepting mixed-case environment names and conventional installation paths.
- Built 126 public files (4.31 MB).
- All 42 regression tests passed after the browser-discovery fix. Initial failures were browser setup failures.
- Local real-asset check passed: 15 pages, 79 same-origin references, seven private-path checks.
- Reviewed homepage screenshots at 390px and 1440px. No obvious hero clipping was observed.
- git diff --check passed after the code change.
- Evidence logs: .tmp-checks/maintenance-2026-10-11/. Additional audit reproduction: .tmp-checks/audit-probe.mjs.

## Audit verdict and score
Anti-pattern verdict: pass. Custom typography, real photography, editorial composition, and established brand tokens give the site a distinct identity. No broad redesign is justified by this review.

| Dimension | Score / 4 | Finding |
| --- | --- | --- |
| Accessibility | 2 | Low text contrast, moving focused testimonials, broken panel labels |
| Performance | 3 | Small static build; six hidden videos preload metadata |
| Responsive design | 3 | Existing mobile/desktop checks pass; full zoom and assistive-technology testing remains outstanding |
| Theming | 3 | Shared tokens and intentional light-only design; approved palette compromises readability |
| Anti-patterns | 4 | Distinctive brand presentation |
| Total | 15/20 | Good; address accessibility first |

These are scoped review scores, not certification or measured field performance. Four prioritised findings: P0 0, P1 3, P2 1, P3 0.

## Findings

### P1 — Low contrast in functional text
Location: assets/tokens.css:173–174; tests/site-regressions.test.mjs:507–525.
Category: Accessibility / Theming.
Cream #F8F6DA on logo blue #93A9D2 is approximately 2.17:1. Primary CTA labels, navigation CTA, and selected service names inherit this pairing. Blue text on cream has the same ratio. This falls below both normal-text (4.5:1) and large-text (3:1) thresholds in WCAG 1.4.3. The existing design context and tests explicitly preserve this earlier brand choice; it is not a newly introduced regression.
Recommendation: retain the logo blue for branding while agreeing on readable functional text/surfaces using the existing neutral palette; then update palette assertions to check functional text contrast. Suggested command: /normalize.
Reference: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

### P1 — Testimonials keep moving during keyboard reading
Location: index.html:726–755 and index.css:350–357.
Category: Accessibility.
The testimonial animation pauses for mouse hover or drag, but has no keyboard-focus pause or explicit persistent pause button. Browser reproduction at 390px focused .love-expand-btn while #loveTrack continued translating. Logo animation also offers hover pause only (outside reduced-motion mode). Keyboard/touch visitors need a reliable way to stop continuous movement while reading. Reduced-motion support is useful but does not replace an accessible on-page pause mechanism for all users.
Recommendation: add a labelled pause/resume control, pause testimonials on focus and expansion, and preserve access to every card when paused. Suggested command: /harden.
Reference: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html (WCAG 2.2.2).

### P1 — Work panels reference nonexistent accessible labels
Location: work.html:218,250,281,307,346,392,427,456.
Category: Accessibility.
All eight role=tabpanel articles have aria-labelledby pointing to missing tab-* IDs. Browser DOM verification confirmed all eight missing references. The current selector uses a listbox, so the leftover tab-panel naming scheme no longer matches the interface. This removes the intended accessible panel names and leaves inconsistent semantics.
Recommendation: use labelled article/region sections tied to their real headings, or implement a complete matching tabs pattern. Preserve the current client selector keyboard behavior. Suggested command: /harden.

### P2 — Hidden case-study videos preload metadata
Location: work.html:253–256,430–431.
Category: Performance.
Six video elements inside initially hidden case panels use preload=metadata, unlike the other cases using preload=none. Browsers may request these before the visitor chooses the case; hidden markup does not itself defer network loading. DOM count confirmed six elements. Network byte cost was not measured because external media access is restricted here.
Recommendation: use preload=none for hidden cases, or attach their sources when selected. Verify poster visibility and playback after selection. Suggested command: /optimize.

## Systemic gaps and strengths
The regression suite checks selected behaviors, palette consistency and unique IDs, but does not check all accessible-name references, continuous-motion keyboard behavior, or readable contrast for the approved light/blue pair. Add targeted checks alongside the corresponding fixes.
Preserve the public-file allowlist, content-hashed assets, responsive geometry checks, inert closed menus, contact timeout/retry behavior, and mocked submission tests. Those protections already work locally.

## Outstanding verification (not confirmed website defects)
- Full live browser/private-file checks were blocked by ERR_NETWORK_ACCESS_DENIED / EACCES. A web-tool homepage read succeeded, but does not replace production verification.
- npm audit failed to reach its registry endpoint. npm outdated did not produce a verified result before session interruption. No claim of zero current vulnerabilities or current dependencies is made.
- Confirm actual inbox delivery through an explicitly coordinated test with the client. Mocked success only verifies browser behavior.
- Verify GA4 lead-event collection and Search Console/field performance with account access. No traffic or conversion improvement is claimed.
- External video playback, captions and fallback quality need a separate live media check. The local checker tests same-origin references, not every Cloudinary video.

## Recommended order
1. /harden — panel labels and accessible motion controls.
2. /normalize — agreed accessible treatment for functional text while preserving brand identity.
3. /optimize — defer hidden video metadata.
4. /polish — review all affected desktop/mobile states, then re-run /audit.

## Client-facing maintenance note
Completed local October website checks covering 15 pages and 79 internal references, reviewed desktop/mobile presentation, and passed 42 regression tests after repairing Windows test setup. Identified follow-up improvements to text readability, testimonial motion, case-study accessibility and video loading. Production, dependency-security and inbox-delivery verification remain outstanding. No website changes have been published.

## Implementation follow-up — 11 October 2026

This section supersedes the open findings above. All four reported findings have been addressed locally. Nothing has been deployed or committed.

- Changed semantic accent-text tokens to mahogany on light surfaces and on the unchanged logo-blue fill. Cream remains on dark surfaces. Measured token contrast: mahogany/blue 4.77:1; mahogany/cream 10.35:1. Updated the approved design context and regression expectations.
- Added assets/marquee.js as a shared motion controller with accessible pause/resume, previous/next, keyboard focus pausing, native scrolling, reduced-motion support and offscreen/background suspension. Expanded letters stay paused; all original items remain reachable. Decorative duplicates are inert and hidden from assistive technology. Reserved logo-strip height for reliable initialization and shortened control labels to fit narrow screens.
- Connected all eight Work-page articles to actual heading IDs and removed the obsolete tabpanel roles.
- Changed all Work-page videos to preload=none. The browser regression observes no media requests before playback and confirms a request is made when playback is initiated for the selected case. External video decoding/delivery remains outside this offline test.
- Added regression coverage for broken ARIA references across all public routes, media loading behavior, and both normal/reduced-motion marquee operation.

Verification: full suite 46 passed, zero failed; real-asset check 15 pages, 80 internal references, seven private-path checks, zero failures. Built 127 public files (4.31 MB). Screenshot/overflow checks covered testimonials, brand strip and service selection at 320, 390, 768 and 1440px; no horizontal page overflow. Reviewed representative mobile and desktop screenshots. The final narrow-screen control-label polish passed all nine targeted regression checks and all 12 screenshot/overflow checks. Evidence is saved in .tmp-checks/maintenance-2026-10-11/.

Remaining limits: production deployment verification, npm registry audit/outdated, actual enquiry inbox receipt, external video playback/captions and real-device/screen-reader validation remain unverified. The four scoped findings are resolved; this is not a claim of universal perfection or full accessibility certification.

## Additional maintenance pass — 11 October 2026

Five more improvements completed locally:

1. Wired both upper and lower Work-page Previous/Next controls and synchronized their disabled states. Previously only the first pair had event handlers.
2. Removed duplicate Brixx Derma video arrows; all seven multi-video Work strips now have exactly one control pair.
3. Improved the client selector: arrow-key opening, Tab dismissal, focus restoration on closing/scrolling, resizing dismissal, viewport-bounded scrolling and above/below positioning. Case changes now respect reduced motion.
4. Added shared video error recovery on Work and all eight standalone case studies: status message, direct video link, duplicate-safe retry, bounded retry wait, and focus restoration after recovery. Native playback is still used. External delivery remains unverified; tests intentionally block the provider and simulate recovery.
5. Removed opacity-based dimming from unselected service descriptions. Calculated effective contrast improved from 3.56:1 to approximately 7.27:1; the active blue fill remains distinct.

Verification: all 53 tests passed. The three navigation bugs were reproduced with failing tests before the fixes. Real-asset checks passed 15 pages, 81 internal references and seven private-file checks. At 768px, programmatically doubling computed text sizes caused no horizontal page overflow on Home, Services, Work or Contact; this is a scoped text-resize check, not a full zoom or assistive-technology certification. Client selector interaction passed at 320×568 and 768×600. Video error UI was visually reviewed at 768px. Final production build: 128 public files, 4.31 MB. git diff --check passed. Logs are stored in .tmp-checks/maintenance-2026-10-11/additional-*.log.

Deployment, live dependency security checks, external media playback and actual inbox receipt remain outstanding. No deployment, commit, or real enquiry was made.
