# ALVION — organized website source

This is the latest website revision, refactored into feature modules. The approved styling, slow PPF color animation, studio visualizers, compact cookie notice and hero quote button are retained. PPF displays no prices; estimator and service price tables retain existing prices.

Read ARCHITECTURE.md for the folder map, dependency boundaries and editing guide.

## Upload

Upload the contents of this directory to your existing website root, preserving the css/, js/ and assets/ directories. Public HTML page names and send-inquiry.php remain unchanged. Preserve your hosting configuration and any existing inquiry storage. No Node.js server or build step is required in production.

The inquiry handler still needs compatible PHP hosting and working server mail configuration. Its contents were not changed. A static preview cannot verify email delivery.

## Preview and checks

Use a static HTTP server for frontend testing. The browser scripts also retain the site's classic-script approach for local-file previews.

With Node.js installed, run:

    node tests/behavior.cjs
    node tests/structure.cjs

The tests/ directory and Markdown documentation are development resources and are not required on the public host.

## Verification performed

- JavaScript parsing and local-link checks.
- PPF animation phases, timer cancellation, package switching and reduced motion.
- Quote URL encoding and allowed parameters.
- Browser checks of homepage/PPF, estimator pricing and quote prefill, tint quote prefill, vinyl finish selection and mobile width.
- Original PHP inquiry endpoint preserved unchanged; no test inquiry was submitted.

This package has not been deployed.
