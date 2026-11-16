# ALVION website architecture

Plain HTML, CSS and JavaScript, with classic `<script>` tags so the site works both on ordinary hosting and when opened from a folder. No framework, bundler or package install.

## Rules for changes

1. Put new code in the folder that matches its job (table below). No inline scripts or styles in the HTML.
2. Give every changed CSS or JS file a new `?v=` stamp everywhere it is linked. `.htaccess` caches CSS and JS for a month.
3. Car images in visualizers must recolor completely: no panel left in the old color and no color spilling onto glass, wheels or background.
4. Respect reduced motion: every animation has a `prefers-reduced-motion` fallback.

## Folders

| Folder | What lives there |
| --- | --- |
| `css/base.css`, `layout.css`, `components.css`, `typography.css`, `fonts.css`, `site.css` | Foundation styles |
| `css/bundles/` | One stylesheet per page: the page's original styles joined into one file, loaded first |
| `css/pages/` | Original per-page source styles (the bundles were built from these) |
| `css/features/` | Styles for one feature: visualizers, estimator, nav motion |
| `css/quote-sheet.css`, `reviews.css`, `phase01.css`, `bento.css`, `accent.css` | Site-wide layers loaded after the bundle (see load order) |
| `js/core/` | Small shared helpers (quote link building) |
| `js/data/` | Catalogs: vehicles and prices, vinyl films, PPF colors, reviews, image fallbacks |
| `js/features/<name>/` | One folder per feature: `contact`, `estimator`, `ppf`, `vinyl`, `tint`, `reviews` |
| `js/rendering/` | Shared photo car renderer (vinyl and tint visualizers) |
| `js/shared/` | Site-wide behavior: navigation, nav motion, press ripple, layout helpers, analytics consent |
| `js/pages/` | Scripts that belong to a single page |
| `assets/` | Photos (`projects/`, `process/`), vehicle art and paint maps (`vehicles/`), fonts, icons |
| `tests/` | Checks (see README) |
| `tools/` | Old CSS bundle builder; out of date, do not run |

## Stylesheet load order

Each page loads, in order:

1. `css/bundles/<page>.css`: the page's original look
2. `css/reviews.css`, `css/quote-sheet.css`: shared components
3. `css/phase01.css`: phone layout fixes, footer area links
4. `css/bento.css`: the tiled "bento" layout and compact grids
5. `css/features/visualizers-compact.css`: only on pages with the estimator or tint visualizer
6. `css/features/nav-motion.css`: mobile nav bar motion
7. `css/accent.css`: always last; brand accent buttons and press feedback

`bento.css` uses many `!important` rules, so overrides of its layout also need `!important`.

## Theme

- Accent ("Ice blue") lives in `css/accent.css` as `--accent`, `--accent-hi`, `--accent-lo`, `--on-accent`. Change those values to recolor every primary button.
- Primary buttons have a raised edge and press down when tapped. `js/shared/press.js` adds a ripple to them.
- Dark greys across the site are tinted slightly toward the logo navy (#02122D).

## Layout: bento grids

Pages use `body.bento bento-<page>`. Each section is a tile; sizes come from `--b-gap`, `--b-pad`, `--b-r` and others in `css/bento.css`.

On screens wider than 820px, `--b-fit` is the screen height minus the sticky header, clamped between 380px and 660px. Hero tiles, card grids and gallery covers take their height from it, so each grid group fits one screen on a laptop. Phones use `--b-fit-m` the same way, with smaller limits.

## Quote requests

- **Quote sheet.** Every page except `404.html` and `wrap-visualizer.html` has a `<dialog id="home-quote-sheet">` with the form `#homeQuoteForm`. Links marked `data-track="quote"` open it through `Alvion.openQuote()` instead of going to the contact page. `js/features/contact/quote-flow.js` also opens it when the address ends in `#quote`.
- **Contact page.** `contact.html` has the full form, `#projectForm`.
- **Sending.** `js/features/contact/web3form.js` sends the request to the CRM (a Supabase Edge Function, `website-inquiry`), with Web3Forms email as the backup. A Cloudflare Turnstile check loads when someone starts typing. While sending, the form gets `aria-busy="true"`; when it's done, `data-sent="true"`.
- The keys in `web3form.js` are public by design: a Supabase publishable key and a Turnstile site key. Turnstile only works on the real domain.
- `js/features/contact/form.js` and `send-inquiry.php` are the older email/PHP path, kept as a fallback.

## Visualizers

All four fit one laptop screen on desktop: car on the left, choices and the quote button on the right. Their quote buttons fill the quote form with the chosen vehicle, film and finish.

### Preview your vehicle (estimator, `services.html`)

- Files: `js/features/estimator/controller.js`, `lazy.js`, `js/data/estimator-catalog.js`, `js/data/vinyl-films.js`, `js/data/ppf-colors.js`, `css/features/estimator.css`, `estimator-films.css`, `visualizers-compact.css`.
- `lazy.js` loads the estimator only when it scrolls into view.
- Each vehicle has a photo, `assets/vehicles/<slug>.webp`, and a paint map, `<slug>-mask.webp`. In the paint map, red marks painted panels and green marks glass. The controller recolors only the red area and keeps the photo's light and shadow; finish (gloss, satin, matte) changes the shading. Glass is darkened separately for tint.
- Vehicles: tesla, cybertruck, sedan, coupe, s-class, sport, suv, pickup, g-wagon. They sit in one scrolling row with arrow buttons.
- To add a vehicle: add the photo and paint map in `assets/vehicles/`, then an entry with `art` in `estimator-catalog.js`.

### PPF visualizer (home, services, PPF page)

- Files: `js/features/ppf/catalog.js` (packages, panels, timing), `template.js` (markup), `view.js` (draws the view, groups swatches by brand), `controller.js` (state and animation), `css/features/ppf.css`, `js/data/ppf-colors.js`, `assets/ppf-porsche-911-mask.webp`.
- It renders inside a shadow root, so page CSS doesn't reach it; all its styles live in `ppf.css`.
- Packages: Full Front, Full Body, Color PPF. Color PPF repaints the car through its paint map (red = paint, blue = Full Front area).
- Colors are `[brand, name, finish, hex]` rows in `ppf-colors.js`: 14 PurePPF and 16 XPEL. The hex values were matched by eye and are approximate.

### Vinyl wrap visualizer (`wrap-visualizer.html`, shown in a frame)

- Files: `js/features/vinyl/controller.js`, `js/data/vinyl-films.js`, `js/rendering/car-renderer.js`, `css/bundles/wrap-visualizer.css` (the compact layout is also kept in `css/features/wrap-compact.css`).
- `js/features/vinyl/embed.js` on the parent page sets the frame's height from messages the visualizer sends.
- Because it runs in a frame, it doesn't get the site's `accent.css`; its button styles live in its own bundle.

### Tint visualizer (`window-tint.html`)

- Files: `js/features/tint/controller.js`, `readout.js`, `css/features/tint.css`, `studios.css`, `visualizers-compact.css`.

### Opening from a folder

Browsers block reading image pixels when a page is opened from a folder. In that case only, the visualizers load built-in copies of their images: `js/data/vehicle-art-fallback.js`, `ppf-art-fallback.js`, `car-image-fallback.js`.

## Mobile nav bar motion

- Files: `js/shared/nav-motion.js`, `css/features/nav-motion.css`.
- A highlight pill sits behind the current tab. When you tap another tab, the pill slides and stretches to it and the icon pops; the page changes about 0.17 seconds later.
- On the new page the pill settles with a small bounce. The pill also follows the Menu button when the menu opens and closes.
- On phones, pages cross-fade while the bar and header stay still, in browsers that support it.
- The bar's design comes from the page styles and is unchanged.

## Press feedback

Every tappable control shrinks slightly when pressed: buttons, cards, tabs, swatches and links. Site controls get it from `css/accent.css`. The PPF visualizer gets it from `ppf.css` and the vinyl visualizer from its bundle, since they don't inherit page styles.

## Search

- Each page has a title, description, canonical link and share image (`assets/og-share-q60.jpg`).
- The local pages carry Service, BreadcrumbList and FAQPage structured data that points to the business entry on the home page.
- `sitemap.xml` lists every public page.

## Editing common values

| To change | Edit |
| --- | --- |
| Vehicles and starting prices | `js/data/estimator-catalog.js`; keep the price tables in `services.html` and the service pages matching |
| Vinyl film names and colors | `js/data/vinyl-films.js` |
| PPF colors | `js/data/ppf-colors.js` |
| PPF packages, panels, animation timing | `js/features/ppf/catalog.js` |
| Accent color | `css/accent.css`, `:root` variables |
| Quote link format | `js/core/quote-url.js` |
| Where quote requests go | `js/features/contact/web3form.js`, `CRM` settings |
