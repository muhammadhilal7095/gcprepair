// Builds the site into dist/. No dependencies: run `node build.mjs`.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSite } from './src/render.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const biz = JSON.parse(readFileSync(join(ROOT, 'data/business.json'), 'utf8'));
const repairs = JSON.parse(readFileSync(join(ROOT, 'data/repairs.json'), 'utf8'));
const shop = JSON.parse(readFileSync(join(ROOT, 'data/shop.json'), 'utf8'));
// Version for cache busting: a hash of the files browsers cache. The data the admin
// edits keeps it, so pages published from the admin point at the same files.
biz.assetVersion = createHash('sha256')
  .update(readFileSync(join(ROOT, 'src/styles.css')))
  .update(readFileSync(join(ROOT, 'src/main.js')))
  .update(JSON.stringify(repairs))
  .digest('hex').slice(0, 10);

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'css'), { recursive: true });
mkdirSync(join(DIST, 'js'), { recursive: true });
cpSync(join(ROOT, 'public'), DIST, { recursive: true });
cpSync(join(ROOT, 'src/styles.css'), join(DIST, 'css/styles.css'));
cpSync(join(ROOT, 'src/main.js'), join(DIST, 'js/main.js'));


// Admin panel, contact form and the data they edit
cpSync(join(ROOT, 'server'), DIST, { recursive: true });
cpSync(join(ROOT, 'src/render.mjs'), join(DIST, 'admin/render.mjs'));
mkdirSync(join(DIST, '_private/data'), { recursive: true });
writeFileSync(join(DIST, '_private/data/business.json'), `${JSON.stringify(biz, null, 2)}\n`);
cpSync(join(ROOT, 'data/repairs.json'), join(DIST, '_private/data/repairs.json'));
cpSync(join(ROOT, 'data/shop.json'), join(DIST, '_private/data/shop.json'));

// One-time code for creating the admin password. Only its hash is uploaded.
const codeFile = join(ROOT, 'admin-setup-code.txt');
if (!existsSync(codeFile)) writeFileSync(codeFile, `${randomBytes(12).toString('hex')}\n`);
const setupHash = createHash('sha256').update(readFileSync(codeFile, 'utf8').trim()).digest('hex');
writeFileSync(join(DIST, '_private/setup-hash.php'), `<?php\nreturn '${setupHash}';\n`);

for (const [path, content] of renderSite(biz, repairs, shop)) {
  mkdirSync(dirname(join(DIST, path)), { recursive: true });
  writeFileSync(join(DIST, path), content);
}

// Old WordPress/WooCommerce demo URLs go to the home page
const OLD = ['cart', 'checkout', 'my-account', 'wishlist', 'compare', 'blog', 'promotions', 'stores', 'outlet', 'delivery-return-2', 'apple-shopping-event', 'broadway-store', 'valencia-store', 'emeryville-store', 'alameda-store', 'category', 'tag', 'author', '2022'];
writeFileSync(join(DIST, '.htaccess'), `ErrorDocument 404 /404.html
RewriteEngine On
RewriteRule ^_private(/|$) - [F,L]
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteRule ^(${OLD.join('|')})(/.*)?$ / [L,R=301]
RewriteRule ^product-category(/.*)?$ /kategorier/ [L,R=301]
RewriteRule ^product(/.*)?$ /shop/ [L,R=301]
`);

const count = Object.values(repairs).reduce((n, list) => n + list.length, 0);
console.log(`Built site with ${count} models into dist/`);
