# Bio Page

A personal bio/portfolio site — plain HTML, CSS, and JavaScript, no build step.

## Structure

```
bio-page/
├── index.html          Home
├── about.html           Background, military service, certifications
├── projects.html         Project showcase
├── contact.html          Contact links
├── partials/            Shared header/footer, injected at runtime via fetch()
├── css/style.css        Single stylesheet, CSS custom properties, responsive nav
├── js/include.js        Loads partials, highlights active nav link
├── js/main.js            Page-specific behavior (mobile nav toggle)
└── assets/               Static assets (SVG avatar placeholder, etc.)
```

Pages share a header and footer via `js/include.js`, which fetches
`partials/header.html` / `partials/footer.html` into any element carrying a
`data-include` attribute. That means **this only works over HTTP** (via a
local dev server or once deployed) — opening `index.html` directly as a
`file://` URL will not load the header/footer, since `fetch()` can't read
local files that way.

## Local development

Open the folder in VS Code and use the **Live Server** extension
(right-click `index.html` → "Open with Live Server"), or run any static
server, e.g.:

```
npx serve .
```

## Deployment

Deployed to AWS S3 + CloudFront on every push to `main` that touches
`bio-page/**`, via `.github/workflows/deploy-bio-page.yml`. See
[DEPLOYMENT.md](./DEPLOYMENT.md) for the one-time AWS setup.
