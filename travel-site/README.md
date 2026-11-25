# Run locally
fetch() needs HTTP, so use a local server from this folder:
  python3 -m http.server 8000      # then open http://localhost:8000
  (or: npx serve .)
# Add a page
Copy hotels.html, replace the <main> content, set data-module="yourpage" on <body>, and create js/yourpage.js exporting init().
