# ALVION Performance — website

Source for **alvionperformance.com**: vinyl wraps, paint protection film (PPF), window tint, ceramic coating and detailing in Los Angeles, Orange County, South Bay and Long Beach.

Plain HTML, CSS and JavaScript. No framework, no build step, no server code needed for the pages. It is hosted on GoDaddy and deployed by uploading the folder contents.

- How the code is organized and how each feature works: [ARCHITECTURE.md](ARCHITECTURE.md)
- What changed in each version: [CHANGELOG.md](CHANGELOG.md)

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | Home: hero, services, selected work, vinyl wrap visualizer, PPF visualizer, reviews |
| `services.html` | Services and pricing, with the "Preview your vehicle" estimator and the PPF visualizer |
| `vinyl-wrap.html` | Vinyl wrap service page with the wrap visualizer (loads `wrap-visualizer.html` in a frame) |
| `paint-protection-film.html` | PPF service page with the PPF visualizer |
| `window-tint.html` | Window tint service page with the tint visualizer |
| `ceramic-coating.html`, `detailing.html` | Service pages |
| `work.html` | Project gallery (Our Work) |
| `about.html`, `aftercare.html`, `faq.html`, `reviews.html` | Company, care guide, questions, reviews |
| `contact.html` | Contact details and the full quote form |
| `tesla-wrap-los-angeles.html`, `color-change-wrap-south-bay.html`, `car-wrap-long-beach.html` | Local search pages |
| `wrap-visualizer.html` | The vinyl wrap visualizer on its own; shown inside a frame on other pages |
| `privacy.html`, `terms.html`, `404.html` | Legal and error pages |

## What visitors can do

- **Get a quote from almost any page.** "Get a quote" buttons open a quote sheet over the current page. Any link ending in `#quote` opens it straight away, for example the Instagram bio link.
- **Preview a vehicle and price** (services page). Pick one of nine vehicles, a service and a film color (3M / Avery Dennison vinyl, PurePPF / XPEL color PPF) and see a starting price.
- **Try vinyl colors and finishes** on a car with a before/after slider.
- **See PPF coverage** (Full Front, Full Body, Color PPF), including an exploded view of the film layers.
- **Compare tint shades** with a VLT slider and presets.

Quote requests go into the ALVION CRM, with an email backup. See "Quote requests" in ARCHITECTURE.md.

## Deploy

1. Upload the folder contents to the website root on GoDaddy, keeping `css/`, `js/` and `assets/` intact.
2. Keep the existing `.htaccess` on the server. It caches CSS and JS for a month.
3. Because of that cache, every changed CSS or JS file gets a new `?v=` stamp where it is linked (for example `?v=20261115-fit1`). Without a new stamp, returning visitors keep the old file.
4. After uploading, hard-refresh once and test a page on a phone.

These are not needed on the public host and can be left out of the upload: `README.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `LICENSE`, `tests/`, `tools/`.

## Preview locally

Run any static server from this folder, for example:

    python3 -m http.server 8000

then open http://localhost:8000. Opening the HTML files directly from a folder also works; the visualizers switch to built-in copies of their car images in that case.

The quote form's "I'm human" check (Cloudflare Turnstile) only works on the real domain, so sending a quote can only be tested on the live site.

## Checks

    python3 tests/static_check.py .
    node tests/browser_check.js http://localhost:8000 "$(pwd)"

- `static_check.py` checks every page: links, anchors, scripts, stylesheets, images and sitemap entries resolve; structured data parses; titles and single headlines; removed files and old brand names are gone; vehicle art and paint maps exist.
- `browser_check.js` (needs Playwright) opens every page at phone and desktop size and checks the quote sheet, the contact form choices, all 540 vehicle × film combinations in the estimator, the PPF visualizer and its brand groups, and opening the site from a folder.
- `tests/structure.cjs` still passes. `tests/behavior.cjs` is from the October version and fails on the newer PPF visualizer; use `browser_check.js` instead.

## Do not run

`tools/rebuild-css.mjs` rebuilds `css/bundles/` from `tools/styles.json`. Both date from October and don't include later changes such as the compact vinyl visualizer added to `css/bundles/wrap-visualizer.css`. Running it now would undo those changes.
