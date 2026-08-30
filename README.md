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

## Cloudflare Pages

Use these project settings:

- Root directory: repository root (leave the dashboard field blank)
- Build command: `npm run build`
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

## Content releases

The build stamps every sitemap entry with the release date. Set `SITE_LASTMOD=YYYY-MM-DD` when a reproducible date is required; otherwise the UTC build date is used.

Testimonials intentionally require approved client/company attribution before names are added. Do not invent or infer attribution.
