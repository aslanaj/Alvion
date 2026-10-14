# ALVION website architecture

This remains a plain HTML/CSS/JavaScript website with the existing PHP inquiry endpoint. No framework, package installation, bundler or server migration is required. Public page URLs stay the same. Classic script loading is intentional: it preserves the existing direct-file preview workflow as well as ordinary hosting.

## Organization

| Directory | Responsibility |
| --- | --- |
| `js/core/` | Pure shared operations, including quote URL creation |
| `js/data/` | Vehicle/service price catalog, film catalog, review data and image fallbacks |
| `js/features/ppf/` | PPF catalog, template, DOM/SVG view and animation controller |
| `js/features/vinyl/` | Vinyl selections and embedded preview sizing |
| `js/features/tint/` | Tint controls and VLT readout |
| `js/features/estimator/` | Vehicle rendering/selection and estimate interactions |
| `js/features/contact/` | Quote selection, form submission and upload interactions |
| `js/features/reviews/` | Rendering of configured customer reviews |
| `js/rendering/` | Shared photographic car renderer |
| `js/shared/` | Navigation, page interactions and analytics consent |
| `js/pages/` | Existing page-specific scripts extracted from inline HTML |
| `css/` | Base, layout, site, typography and component styles |
| `css/features/` | Visualizer styles, including the shared studio design |
| `css/pages/` | Existing page-level styles extracted in original cascade order |
| `assets/` | Photos, masks, icons and other media |
| `tests/` | Dependency-free behavior checks |

## PPF dependency direction

The controller owns selected state and animation sequencing. It receives a view and timer/motion services, rather than directly reading or changing the document. The view translates state into DOM/SVG output and passes user actions to the controller. The catalog holds geometry, package descriptions, colors and animation timing. The template holds markup; CSS has one external source of truth rather than being duplicated inside JavaScript.

The small composition root at the bottom of the controller connects browser services to each instance. State is instance-local. Switching packages or choosing another color cancels outstanding animation callbacks. Reduced-motion users receive immediate updates. The PPF visualizer contains no displayed prices.

## Editing common values

- Estimator vehicles and starting prices: `js/data/estimator-catalog.js`. Existing static service price tables in `services.html` must be kept consistent when changing prices.
- Vinyl product names/codes/colors: `js/data/vinyl-films.js`.
- PPF panels, package descriptions and colors: `js/features/ppf/catalog.js`.
- PPF animation timings: `timing` in the same catalog.
- Shared quote URL format: `js/core/quote-url.js`.
- Visualizer styling: `css/features/studios.css`; PPF has isolated `css/features/ppf.css`.
- Typography: `css/typography.css`.
- Inquiry server handling: `send-inquiry.php` retains its original URL and behavior.

## Validation and deployment

Run `node tests/behavior.cjs` from this folder. Preview with any static HTTP server for frontend QA. PHP form delivery requires the actual PHP hosting environment and is not exercised by a static preview.

Upload the folder contents to the website root, keeping the directory structure intact. Preserve hosting configuration and existing inquiry storage. Do not upload development tests or this document if you do not want them publicly accessible; they are not needed to run the site.

## Refactor boundaries

This is a pragmatic modular refactor, not a complete rewrite. The existing canvas-rendering algorithms and legacy page-interaction implementations are preserved. Some extracted page files retain compact formatting and historical CSS cascade layers. Those can be consolidated independently with additional visual regression coverage. The estimator still combines its established drawing and UI logic; its data and shared quote boundary are now separate. No deployment, pricing changes or backend changes are included.
