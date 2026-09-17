# KACISTUDIO website

Static marketing site for KACISTUDIO. Source files live in this directory; only the generated `_site` directory is safe to publish.

## Local development

Requirements: Node.js 22 or newer.

```sh
npm ci
node serve.mjs
```

Open `http://localhost:3000`. The local server refuses unknown file types and dotfiles, but it serves from the source tree for convenient editing.

## Verification

```sh
npm test
```

The test command first creates the production artifact, then checks its privacy boundary, accessibility, responsive geometry, progressive enhancement, and core page behavior.

To build without running browser tests:

```sh
npm run build
```

Never publish the repository root. The allow-listed build in `build-site.mjs` is the deployment boundary.

Monthly maintenance: run `npm test`, `npm audit`, and `npm outdated`. After building, run `node tests/maintenance-check.mjs` for real-asset browser checks and desktop/mobile screenshots, then `node tests/maintenance-check.mjs --live` for read-only checks of the published site. These checks never submit enquiries. Confirm actual inbox delivery separately with the client. Reports stay outside `_site`.

## Asset policy

Git tracks only the web-ready files in `media/optimized`, `media/posters`, and `media/Kaci's Clients`. Keep original photography in the local/client asset archive rather than committing it to this repository.

## Cloudflare Pages

Use these project settings:

- Root directory: repository root (leave the dashboard field blank)
- Build command: `npm test`
- Build output directory: `_site`
- Node.js version: 22

`wrangler.jsonc` records the same output directory for direct Pages deployments. `_headers` adds the production security and caching policy and is copied into `_site` by the build.

After every production deployment, verify that public pages load and these representative internal paths return `404`:

- `/package.json`
- `/Website%20Discovery%20Guide.docx`
- `/tests/site-regressions.test.mjs`
- `/serve.mjs`
- `/.impeccable.md`
- `/colour-reference.html`

Production is Cloudflare Pages. GitHub Actions runs regression checks on pushes and pull requests. A secondary GitHub Pages deployment requires a manual workflow run with `deploy_github_pages` enabled; it does not apply Cloudflare headers or Functions. No push automatically deploys that secondary copy. For Cloudflare Git integration, use `npm test` as the dashboard build command to gate deployment on regression checks (it also generates `_site`).

## Content releases

The build preserves the dates in `sitemap.xml`. Update only the affected URLs when making substantive content changes; do not change dates for rebuilds. The build adds a content hash to local CSS and JavaScript URLs, so changed assets get new browser cache keys automatically.

Availability uses evergreen enquiry wording until the client confirms a dated intake and capacity. Keep banners and the Services, Work, and Contact calls to action consistent when updating it.

Confirmed form submissions emit the GA4 `generate_lead` event with only `form_id: brief`; no entered form values are included. Mark `generate_lead` as a key event in the existing GA4 property and verify it in Realtime after an authorized test submission. Failed requests must not count as leads. Analytics blocking must not affect form delivery.

Release verification requiring account access: deploy `_site` with its existing Functions from the repository root, run the live maintenance check, confirm the new versioned asset URLs and security headers, then have the client confirm inbox receipt of one labelled test enquiry. An HTTP success from Web3Forms alone does not prove delivery to the inbox. Never send an unsolicited test enquiry.

Testimonials intentionally require approved client/company attribution before names are added. Do not invent or infer attribution.
