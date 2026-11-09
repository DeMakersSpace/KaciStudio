# KACISTUDIO maintenance - 9 November 2026

## Changes

- Fixed navigation staying hidden during slow upward scrolling. The visibility threshold now accumulates movement in one direction instead of requiring more than six pixels in a single animation frame. Direction changes, viewport changes and forced visibility reset the accumulated movement.
- Fixed a video retry race: a delayed rejection from an older playback attempt could restore the error panel after recovery or cancel a newer retry. Rejections now affect only their own pending attempt.
- Updated the maintenance checker to honor an explicit browser path on every platform, discover installed Windows Chrome, and fall back to Puppeteer's browser. Its preview server explicitly binds to loopback and hides its Windows process window.
- Added browser regressions for slow scrolling and stale retry rejections. Both reproduced failures before the fixes.

## Verification

- Baseline: 59/59 tests passed.
- Final `npm.cmd test`: 61/61 tests passed; production build contains 129 files (4.31 MB).
- `node tests/maintenance-check.mjs`: 15/15 pages loaded, 82 references and seven private paths checked, zero failures.
- Reviewed homepage screenshots at 390px and 1440px. No layout changes were introduced.
- `git diff --check`: passed (existing line-ending warnings only).

## Limits and working tree

`npm outdated` and `npm audit` could not reach the npm registry under this environment's access restrictions (EACCES). Dependency versions were left unchanged; current release and vulnerability status remain unverified. No live-site or hosted-CI verification was performed during this review. Contact-form tests used intercepted responses; no real enquiry was sent.

Existing staged original-media deletions and unrelated untracked files were preserved. Changes are local, uncommitted and not deployed. Only `_site` is the public build artifact; this report remains outside it.
