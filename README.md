# gcprepair.dk

Website for Greve Cell Phone & PC Repair and iTelefix: static pages plus a small PHP admin panel. Building needs only Node; the admin panel and contact form need PHP 8 on the host.

    node build.mjs     # writes the finished site to dist/

## After going live: use the admin panel

Open `/admin/` on the website to edit notices, the offer, shops, opening hours, repairs, prices, shop products and categories, reviews, email (SMTP) and Google connections. **Publish changes** rebuilds the pages. Each publish keeps a backup, up to 15.

First visit: create a password using the code in `admin-setup-code.txt`. Only its hash is uploaded, and the code stops working once a password exists.

**Do not upload a new build over a live site without care.** `dist/_private/data/` and the generated pages would overwrite changes made in the admin. To update code only, upload just the changed files (`css/`, `js/main.js`, `admin/`, `contact.php`).

## Files

- `data/*.json`: starting content (`shop.json` holds the shop's categories and products). After launch the live copy is `_private/data/` on the server.
- `src/render.mjs`: all page templates, used by both the local build and the admin panel.
- `src/styles.css`, `src/main.js`: styling and behaviour of the public site.
- `server/admin/`: admin interface (`app.js`) and API (`api.php`).
- `server/contact.php`: contact form. Without SMTP settings the form opens the visitor's mail app.
- `server/_private/`: shared PHP helpers. Passwords and SMTP login are stored here in `secrets.php`, blocked from the web.
- `public/`: images and font, copied as is.

## Publishing the first time

Run the build, then upload the contents of `dist/`, including the hidden `.htaccess` files, to the web root (`public_html` on Hostinger).

After uploading, check that `/_private/data/business.json` shows "Forbidden".
