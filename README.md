# IDSSPL CRM - frontend source

Snapshot packaged on 23 November 2026.

## Run locally

1. Clone this repository:

   git clone https://github.com/prathamxxh999-code/AI-CRM.git
   cd AI-CRM

   Alternatively, download and extract the source ZIP.
2. Open a terminal in this folder (the folder containing this README).
3. With Python 3 installed, run:

   python -m http.server 8765 --bind 127.0.0.1 --directory dist

   On Windows, you can use `py -3` instead of `python`.

4. Open http://127.0.0.1:8765/ in your browser.
5. Keep the terminal open; press Ctrl+C to stop the server.

If port 8765 is already in use, choose another port such as 8766 and open that port's URL. Use a local HTTP server rather than double-clicking index.html because maps and document tools load assets using fetch and modules.

## Source layout

- dist/index.html: application entry point.
- dist/*.js: editable application code and frontend data models.
- dist/*.css: theme, layouts and module styles.
- dist/assets/: images, videos, map data, fonts and map library files.
- dist/task-personas/: supplied team avatars.
- dist/vendor/: bundled document import/OCR libraries and their license notices.
- scripts/check-*.cjs: existing Node.js verification scripts.
- docs/: existing interface and map documentation.

Despite its name, dist contains the directly maintained HTML, CSS and JavaScript for the current CRM. No npm installation or compilation is required to serve it. The unused framework starter from the development workspace is not needed and is not included.

To run an existing check, install Node.js, then run from this folder, for example:

   node scripts/check-workspace-ui.cjs
   node scripts/check-listings-catalog.cjs

## Data and functionality

This is the current frontend-only CRM prototype. Seed data is included. User-created data is saved in the browser and is not included in this repository. A different browser, device or origin has separate local data. There is no production backend, real authentication or cross-device team synchronization in this package. Some features may use external network resources.

Bundled third-party license and map attribution files are retained with the assets.
