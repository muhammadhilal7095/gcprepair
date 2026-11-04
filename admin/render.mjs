// Renders every generated page from the site data. Runs both in Node (build.mjs)
// and in the browser (admin panel), so it must not import anything.
export function renderSite(biz, repairs, shop) {
  const files = new Map();
  const [greve, amager] = biz.shops;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const mapsUrl = (s) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.street}, ${s.postal} ${s.city}, Denmark`)}`;
const address = (s) => `${s.street}, ${s.postal ? `${s.postal} ` : ''}${s.city}`;

const BRANDS = [
  { slug: 'iphone-reparation', name: 'iPhone', mark: 'brands/apple.png', parent: ['mobile', 'Mobil'] },
  { slug: 'samsung-reparation', name: 'Samsung', mark: 'brands/samsung.png', parent: ['mobile', 'Mobil'] },
  { slug: 'huawei-reparation', name: 'Huawei', mark: 'brands/huawei.png', parent: ['mobile', 'Mobil'] },
  { slug: 'oneplus-reparation', name: 'OnePlus', mark: 'brands/oneplus.png', parent: ['mobile', 'Mobil'] },
  { slug: 'sony-reparation', name: 'Sony', mark: 'brands/sony.png', parent: ['mobile', 'Mobil'] },
  { slug: 'google-pixel-reparation', name: 'Google Pixel', mark: 'brands/google.png', parent: ['mobile', 'Mobil'] },
  { slug: 'xiaomi-reparation', name: 'Xiaomi', mark: 'brands/xiaomi.png', parent: ['mobile', 'Mobil'] },
  { slug: 'oppo-reparation', name: 'OPPO', mark: 'brands/oppo.png', parent: ['mobile', 'Mobil'] },
  { slug: 'ipad-reparation', name: 'iPad', mark: 'products/ipad.jpg', parent: ['tablet', 'Tablet'] },
  { slug: 'mac-reparation', name: 'Mac', mark: 'brands/macbook.png', parent: ['computer', 'Computer'] },
  { slug: 'pc-reparation', name: 'PC', mark: 'brands/pc.png', parent: ['computer', 'Computer'] },
  { slug: 'watch', name: 'Apple Watch', mark: 'products/watch.jpg', parent: null },
];
const brand = (slug) => BRANDS.find((b) => b.slug === slug);
const phones = BRANDS.filter((b) => b.parent?.[0] === 'mobile');

// ---- Icons ----
const ICONS = {
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  device: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
};
const icon = (n) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;
const STARS = '<div class="stars" role="img" aria-label="5 ud af 5 stjerner">★★★★★</div>';
const modelCount = (slug) => (slug === 'pc-reparation' ? `${repairs[slug][0].services.length} reparationer` : `${repairs[slug].length} modeller`);

// ---- Layout ----
function callButtons(root, cls = 'btn outline') {
  return biz.shops.map((s) => `<a class="${cls}" href="tel:${s.phone}">${icon('phone')}Ring ${esc(s.short)}</a>`).join('');
}

function header(root, current) {
  const link = (href, text) => `<a href="${root}${href}/">${text}</a>`;
  const noticeItems = (hidden) => {
    const tab = hidden ? ' tabindex="-1"' : '';
    return [
      `<a href="${root}${biz.announcement.link}/"${tab}>${esc(biz.announcement.text)}</a>`,
      ...biz.shops.map((s) => `<a href="tel:${s.phone}"${tab}>${icon('phone')}${esc(s.short)}: ${s.phoneDisplay}</a>`),
    ].map((item) => `${item}<span class="announcement-dot" aria-hidden="true"></span>`).join('');
  };
  // Enough repeats to fill wide screens; the second half makes the loop seamless
  const noticeRepeats = (hidden) => Array.from({ length: 4 }, (_, i) => `<div class="announcement-set"${hidden || i ? ' aria-hidden="true"' : ''}>${noticeItems(hidden || i > 0)}</div>`).join('');
  const notice = biz.announcement.enabled
    ? `<div class="announcement" role="region" aria-label="Nyheder"><div class="announcement-track">${noticeRepeats(false)}${noticeRepeats(true)}</div></div>`
    : '';
  return `${notice}<div class="topbar"><div class="wrap">
  <ul>${biz.shops.map((s) => `<li>${icon('pin')}<span class="topbar-street">${esc(s.street)}</span><span class="topbar-short">${esc(s.short)}</span><a href="tel:${s.phone}">${s.phoneDisplay}</a></li>`).join('')}</ul>
  <ul class="topbar-mail"><li>${icon('mail')}<a href="mailto:${biz.emails[0]}">${biz.emails[0]}</a></li></ul>
</div></div>
<header class="header"><div class="wrap">
  <a class="logo" href="${root}"><img src="${root}images/site/logo.png" width="376" height="148" alt="GCPrepair.dk"></a>
  <input type="checkbox" id="menu" hidden>
  <label class="menu-toggle" for="menu">Menu</label>
  <nav class="nav" aria-label="Hovedmenu">
    <a href="${root}"${current === 'home' ? ' aria-current="page"' : ''}>Forside</a>
    <details class="mega">
      <summary>Reparation</summary>
      <div class="mega-panel">
        <div><strong>Apple</strong>${link('iphone-reparation', 'iPhone')}${link('ipad-reparation', 'iPad')}${link('mac-reparation', 'Mac')}${link('watch', 'Apple Watch')}</div>
        <div><strong>Android</strong>${['samsung', 'huawei', 'google-pixel', 'oneplus', 'sony', 'xiaomi', 'oppo'].map((s) => link(`${s}-reparation`, brand(`${s}-reparation`).name)).join('')}</div>
        <div><strong>Kategorier</strong>${link('mobile', 'Mobil')}${link('tablet', 'Tablet')}${link('computer', 'Computer')}${link('pc-reparation', 'PC')}</div>
      </div>
    </details>
    <a href="${root}shop/"${current === 'shop' ? ' aria-current="page"' : ''}>Shop</a>
    <a href="${root}kategorier/"${current === 'categories' ? ' aria-current="page"' : ''}>Kategorier</a>
    <a href="${root}our-contacts/"${current === 'contact' ? ' aria-current="page"' : ''}>Kontakt</a>
    <a class="btn primary" href="${root}our-contacts/">${icon('pin')}Find butik</a>
  </nav>
</div></header>`;
}

const SOCIAL_ICONS = {
  Facebook: '<svg class="icon solid" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
  Instagram: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
  TikTok: '<svg class="icon solid" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>',
  YouTube: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>',
};

function footer(root) {
  const socialLink = (name, url, label) => `<a href="${url}" rel="noopener" aria-label="${esc(name)}, ${esc(label)}" title="${esc(name)}, ${esc(label)}">${SOCIAL_ICONS[name]}</a>`;
  const shop = (s) => `<section class="footer-shop" aria-label="${esc(s.name)}">
    <div class="footer-shop-head">
      <img src="${root}images/site/${s.image}" width="1000" height="1000" loading="lazy" alt="">
      <div>
        <span class="footer-area">${esc(s.short)}${s.legalLine ? ` · ${esc(s.legalLine)}` : ''}</span>
        <h3>${esc(s.name)}</h3>
      </div>
    </div>
    <a class="footer-phone" href="tel:${s.phone}">${icon('phone')}+45 ${s.phoneDisplay}</a>
    <table class="footer-hours"><caption class="skip">Åbningstider for ${esc(s.name)}</caption><tbody>
      ${groupHours(s.hours).map(({ days, time }) => `<tr data-days="${days.join(',')}"><td>${days.length > 1 ? `${days[0]} – ${days.at(-1).toLowerCase()}` : days[0]}</td><td>${time}</td></tr>`).join('')}
    </tbody></table>
    <a class="footer-map" href="${mapsUrl(s)}" rel="noopener">${icon('pin')}<span>${esc(address(s))}, Danmark</span></a>
  </section>`;
  return `<footer class="footer"><div class="wrap">
  <div class="footer-cta">
    <div>
      <h2>Skal din enhed repareres?</h2>
      <p>Ring, eller kig forbi en af vores butikker. Du er velkommen uden aftale.</p>
    </div>
    <div class="footer-cta-calls">
      ${biz.shops.map((s) => `<a href="tel:${s.phone}">${icon('phone')}<span><small>Ring ${esc(s.short)}</small>${s.phoneDisplay}</span></a>`).join('')}
    </div>
  </div>
  <div class="footer-brand">
    <a class="footer-logo" href="${root}"><img src="${root}images/site/logo.png" width="376" height="148" loading="lazy" alt="GCPrepair.dk"></a>
    <p>Reparation af mobil, tablet, computer og Apple Watch i Greve og på Amagerbro.</p>
  </div>
  <div class="footer-grid">
    ${biz.shops.map(shop).join('')}
    <div class="footer-side">
      <nav aria-label="Genveje">
        <h3>Genveje</h3>
        <ul class="footer-links">
          <li><a href="${root}shop/">Shop</a></li>
          <li><a href="${root}kategorier/">Kategorier</a></li>
          <li><a href="${root}mobile/">Mobil</a></li>
          <li><a href="${root}computer/">Computer</a></li>
          <li><a href="${root}tablet/">Tablet</a></li>
          <li><a href="${root}watch/">Apple Watch</a></li>
          <li><a href="${root}iphone-reparation/">iPhone</a></li>
          <li><a href="${root}samsung-reparation/">Samsung</a></li>
        </ul>
      </nav>
      <div>
        <h3>Skriv til os</h3>
        ${biz.emails.map((m) => `<a class="footer-mail" href="mailto:${m}">${m}</a>`).join('')}
        <a class="more" href="${root}our-contacts/">Kontakt os ${icon('arrow')}</a>
      </div>
    </div>
  </div>
  <div class="footer-end">
    <p>© ${new Date().getFullYear()} gcprepair.dk${hasTracking ? ' · <button class="link-button" type="button" data-cookie-settings>Cookie-indstillinger</button>' : ''}</p>
    <div class="footer-socials">
      ${biz.shops.map((s) => `<div class="footer-social"><span>${esc(s.short)}</span>${s.social.map(([n, u]) => socialLink(n, u, s.short)).join('')}${s.id === 'greve' ? socialLink('YouTube', biz.youtube, 'video') : ''}</div>`).join('')}
    </div>
  </div>
</div></footer>
<div class="callbar">${callButtons(root, 'btn primary')}</div>`;
}

// Search engine verification and, once visitors accept cookies (see main.js), analytics
const integrations = biz.integrations ?? {};
const tracking = {
  ...(/^G-[A-Z0-9]+$/.test(integrations.ga4 ?? '') ? { ga4: integrations.ga4 } : {}),
  ...(/^\d+$/.test(integrations.facebookPixel ?? '') ? { pixel: integrations.facebookPixel } : {}),
};
const hasTracking = Object.keys(tracking).length > 0;
const integrationTags = [
  /^[\w-]+$/.test(integrations.googleVerification ?? '') ? `<meta name="google-site-verification" content="${integrations.googleVerification}">` : '',
  /^[\w-]+$/.test(integrations.bingVerification ?? '') ? `<meta name="msvalidate.01" content="${integrations.bingVerification}">` : '',
  hasTracking ? `<script>window.GCP_TRACKING=${JSON.stringify(tracking)}</script>` : '',
].filter(Boolean).join('\n');

function page({ path, title, description, current, body, extraHead = '', extraScripts = '' }) {
  const depth = path === '' ? 0 : path.split('/').length;
  const root = '../'.repeat(depth) || './';
  const url = `${biz.domain}/${path ? `${path}/` : ''}`;
  const html = `<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${biz.domain}/images/site/technician.jpg">
<meta name="theme-color" content="#0b0d12">
<link rel="icon" href="${root}images/site/favicon.png">
<link rel="preload" href="${root}fonts/manrope.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}css/styles.css">
${extraHead}${integrationTags}
</head>
<body>
<a class="skip" href="#main">Gå til indhold</a>
${header(root, current)}
<main id="main">
${body(root)}
</main>
${footer(root)}
${extraScripts.replaceAll('{root}', root)}
<script src="${root}js/main.js"></script>
</body>
</html>
`;
  files.set(`${path ? `${path}/` : ''}index.html`, html);
}

function pageHead(root, title, lead, { crumbs = [], mark = null, stat = null, statIcon = 'tool' } = {}) {
  const trail = [`<a href="${root}">Forside</a>`, ...crumbs.map(([href, t]) => `<a href="${root}${href}/">${esc(t)}</a>`)];
  return `<section class="page-head"><div class="wrap">
  <div>
    <p class="crumbs">${trail.join(' / ')}</p>
    <h1>${esc(title)}</h1>
    ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
    ${stat ? `<span class="head-stat">${icon(statIcon)}${esc(stat)}</span>` : ''}
  </div>
  ${mark ? `<div class="head-mark"><img src="${root}images/site/${mark}" alt=""></div>` : ''}
</div></section>`;
}

// Merges neighbouring days with the same hours: "Mandag – torsdag"
function groupHours(hours) {
  const groups = [];
  for (const [day, time] of hours) {
    const last = groups.at(-1);
    if (last?.time === time) last.days.push(day);
    else groups.push({ days: [day], time });
  }
  return groups;
}

function shopCard(root, s) {
  const hours = groupHours(s.hours).map(({ days, time }) => {
    const label = days.length > 1 ? `${days[0]} – ${days.at(-1).toLowerCase()}` : days[0];
    return `<tr data-days="${days.join(',')}"><td>${label}</td><td>${time}</td></tr>`;
  }).join('');
  return `<article class="shop">
  <div class="shop-photo"><img src="${root}images/site/${s.image}" width="1000" height="1000" loading="lazy" alt="${esc(s.name)}, ${esc(s.street)}"></div>
  <div class="shop-info">
    <span class="eyebrow">${esc(s.short)}</span>
    <h3>${esc(s.name)}</h3>
    ${s.legalLine ? `<p class="shop-legal">${esc(s.legalLine)}</p>` : ''}
    <p class="shop-addr">${icon('pin')}<span>${esc(address(s))}</span></p>
    <div class="btns"><a class="btn primary" href="tel:${s.phone}">${icon('phone')}+45 ${s.phoneDisplay}</a><a class="btn outline" href="${mapsUrl(s)}" rel="noopener">Find vej</a></div>
  </div>
  <div class="shop-hours">
    <div class="shop-hours-head"><h4>Åbningstider</h4><span class="pill" data-today hidden>${icon('clock')}<span></span></span></div>
    <table class="hours"><caption class="skip">Åbningstider for ${esc(s.name)}</caption><tbody>${hours}</tbody></table>
    <div class="socials">${s.social.map(([n, u]) => `<a href="${u}" rel="noopener">${n}</a>`).join('')}<a href="${s.reviewUrl}" rel="noopener">${s.reviewLabel}</a></div>
  </div>
</article>`;
}

function deviceCard(root, d, { open = false } = {}) {
  const hasPrice = d.services.some((r) => r.price);
  const hasTime = d.services.some((r) => r.time);
  const n = d.services.length;
  const rows = d.services.map((r) => `<tr><td>${esc(r.name)}${r.note ? `<small>${esc(r.note)}</small>` : ''}</td>${hasTime ? `<td>${esc(r.time ?? '')}</td>` : ''}${hasPrice ? `<td>${r.price ? `<span class="price">${esc(r.price)}</span>` : '<span class="ask">Kontakt for pris</span>'}</td>` : ''}</tr>`).join('');
  const table = n ? `<table class="rows"><thead><tr><th>Reparation</th>${hasTime ? '<th>Tid</th>' : ''}${hasPrice ? '<th>Pris</th>' : ''}</tr></thead><tbody>${rows}</tbody></table>` : '';
  const note = hasPrice ? '' : `<p class="note">${n ? 'Ring eller skriv for en pris.' : 'Ring eller skriv, så fortæller vi, hvad vi kan reparere, og hvad det koster.'}</p>`;
  const thumb = d.image ? `<span class="thumb"><img src="${root}images/devices/${d.image}" width="300" height="300" loading="lazy" alt=""></span>` : '';
  return `<details class="device" name="models" id="${d.id}" data-name="${esc(d.name.toLowerCase())}"${open ? ' open' : ''}>
  <summary>${thumb}<span class="device-title"><b>${esc(d.name)}</b><small>${n ? `${n} ${n === 1 ? 'reparation' : 'reparationer'}` : 'Kontakt os'}</small></span></summary>
  <div class="device-body">${table}<div class="device-side">${note}<div class="btns">${callButtons(root)}</div></div></div>
</details>`;
}

// Series a model belongs to, per brand page. Brands left out are shown as one flat list.
const SERIES = {
  'iphone-reparation': (n) => {
    if (/Duo/.test(n)) return 'iPhone 18 og Duo';
    if (/SE/.test(n)) return 'iPhone SE';
    if (/iPhone X/.test(n)) return 'iPhone X';
    const num = Number(n.match(/iPhone (\d+)/)?.[1]);
    if (num === 18) return 'iPhone 18 og Duo';
    return num >= 11 ? `iPhone ${num}` : 'iPhone 8 og ældre';
  },
  'samsung-reparation': (n) => {
    if (/Note/.test(n)) return 'Galaxy Note';
    if (/Samsung A/.test(n)) return 'Galaxy A';
    const num = Number(n.match(/Samsung S(\d+)/)?.[1]);
    return num >= 20 ? `Galaxy S${num}` : 'Galaxy S10 og ældre';
  },
  'ipad-reparation': (n) => (/Pro/.test(n) ? 'iPad Pro' : /Air/.test(n) ? 'iPad Air' : 'iPad'),
  'mac-reparation': (n) => {
    if (/Air/.test(n)) return 'MacBook Air';
    if (/Neo/.test(n)) return 'MacBook Neo';
    const inches = n.match(/Pro (\d+)/)?.[1];
    return inches ? `MacBook Pro ${inches}"` : 'MacBook';
  },
  watch: (n) => (/Ultra/.test(n) ? 'Ultra' : /SE/.test(n) ? 'SE' : 'Series'),
  'huawei-reparation': (n) => (/Pura/.test(n) ? 'Pura' : /Smart/.test(n) ? 'P Smart' : /Nova/.test(n) ? 'Nova' : 'P-serien'),
  'google-pixel-reparation': (n) => {
    const num = Number(n.match(/Pixel (\d+)/)?.[1]);
    return num >= 3 ? `Pixel ${num}` : 'Pixel 2 og ældre';
  },
  'oneplus-reparation': (n) => (/Nord/.test(n) ? 'OnePlus Nord' : 'OnePlus'),
  'sony-reparation': (n) => {
    const letter = n.match(/Xperia ([A-Z])/)?.[1];
    return letter ? `Xperia ${letter}` : 'Xperia 1, 5 og 10';
  },
};

const SERIES_ORDER = { 'mac-reparation': ['MacBook Air', 'MacBook Neo', 'MacBook Pro 16"', 'MacBook Pro 15"', 'MacBook Pro 13"', 'MacBook Pro 17"'] };

function deviceList(root, slug) {
  const list = repairs[slug];
  const fallback = brand(slug).mark;
  if (list.length === 1) return `<div class="solo">${deviceCard(root, list[0], { open: true })}<div class="solo-aside"><img src="${root}images/site/${fallback}" alt="" loading="lazy"><h3>Fejl, vi ikke har listet?</h3><p class="note">Fortæl os, hvad der er galt. Vi kigger gerne på det.</p></div></div>`;
  const search = list.length > 8 ? `<div class="filter"><label for="filter">Find din model</label><span class="filter-field">${icon('search')}<input id="filter" type="search" data-filter placeholder="Skriv modelnavn" autocomplete="off"></span></div>` : '';
  const seriesOf = SERIES[slug];
  const groups = new Map();
  for (const d of list) {
    const label = seriesOf ? seriesOf(d.name) : '';
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(d);
  }
  const anchor = (label) => `serie-${label.toLowerCase().replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}`;
  const cards = (items) => `<div class="devices${items.some((d) => d.image) ? '' : ' plain'}">${items.map((d) => deviceCard(root, d)).join('')}</div>`;
  const empty = '<p class="filter-empty" data-filter-empty hidden>Vi fandt ingen model med det navn. Ring til os, så hjælper vi.</p>';
  if (groups.size < 2) return `${search}${empty}${cards(list)}`;
  const order = SERIES_ORDER[slug];
  const entries = order
    ? [...order.filter((label) => groups.has(label)).map((label) => [label, groups.get(label)]), ...[...groups].filter(([label]) => !order.includes(label))]
    : [...groups];
  return `${search}
  <nav class="series-nav" aria-label="Spring til serie" data-series-nav>
    ${entries.map(([label]) => `<a href="#${anchor(label)}">${esc(label)}</a>`).join('')}
  </nav>
  ${empty}
  ${entries.map(([label, items]) => `<section class="series" id="${anchor(label)}" data-series>
    <div class="series-head"><h2>${esc(label)}</h2><span>${items.length} ${items.length === 1 ? 'model' : 'modeller'}</span></div>
    ${cards(items)}
  </section>`).join('')}`;
}

const brandCards = (root, items) => `<div class="brand-grid" data-reveal>${items.map((b) => `<a class="brand-card" href="${root}${b.slug}/"><span class="brand-mark"><img src="${root}images/site/${b.mark}" alt="" loading="lazy"></span><span><b>${esc(b.name)}</b><small>${modelCount(b.slug)}</small></span>${icon('arrow')}</a>`).join('')}</div>`;

const initials = (n) => n.replace(/\d+/g, '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const reviewFig = ([n, t]) => `<figure class="review">${STARS}<blockquote>${esc(t)}</blockquote><figcaption><span class="avatar" aria-hidden="true">${esc(initials(n))}</span><span><b>${esc(n)}</b>Google</span></figcaption></figure>`;

// ---- Structured data ----
const SCHEMA_DAYS = { Mandag: 'Monday', Tirsdag: 'Tuesday', Onsdag: 'Wednesday', Torsdag: 'Thursday', Fredag: 'Friday', Lørdag: 'Saturday', Søndag: 'Sunday' };
const schemaHours = (hours) => hours.flatMap(([day, time]) => {
  const m = time.match(/(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/);
  return m ? [[SCHEMA_DAYS[day], m[1], m[2]]] : [];
});
const schema = `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': biz.shops.map((s) => ({
    '@type': 'LocalBusiness',
    '@id': `${biz.domain}/#${s.id}`,
    name: s.name,
    url: `${biz.domain}/`,
    image: `${biz.domain}/images/site/${s.image}`,
    telephone: s.phone,
    email: biz.emails[0],
    address: { '@type': 'PostalAddress', streetAddress: s.street, postalCode: s.postal || undefined, addressLocality: s.city, addressCountry: 'DK' },
    openingHoursSpecification: schemaHours(s.hours).map(([d, o, c]) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: d, opens: o, closes: c })),
    sameAs: s.social.map(([, u]) => u),
  })),
})}</script>`;

const index = BRANDS.flatMap((b) => repairs[b.slug]
  .filter((d) => b.slug !== 'pc-reparation')
  .map((d) => [d.name, `${b.slug}/#${d.id}`]));
index.push(['PC', 'pc-reparation/#pc']);
files.set('js/devices.js', `window.GCP_DEVICES=${JSON.stringify(index)};\n`);

// ---- Home ----
const WHY = [
  ['tool', 'Erfarne teknikere', 'Hurtig og pålidelig reparation udført af teknikere med erfaring.'],
  ['award', 'Kvalitetsreservedele', 'Vi bruger kun kvalitetsreservedele for at sikre langvarig funktionalitet.'],
  ['tag', 'Ingen skjulte gebyrer', 'Vores priser er konkurrencedygtige og gennemskuelige, uden overraskelser.'],
  ['shield', 'Garanti på reparationer', 'Vi giver garanti på vores reparationer, så du kan føle dig tryg.'],
  ['clock', 'Nem at komme til', 'Bekvem placering og fleksible åbningstider, så det er nemt at få din enhed fikset.'],
];
const PRODUCT_SIZES = { iphone: [530, 483], samsung: [436, 529], ipad: [483, 529], macbook: [295, 275], watch: [458, 542] };
const models = (...slugs) => slugs.reduce((n, s) => n + repairs[s].length, 0);
const CATEGORIES = [
  { path: 'mobile', cls: 'cat-lg', title: 'Mobil', count: `${models(...phones.map((p) => p.slug))} modeller`, text: 'iPhone, Samsung, Huawei, Google Pixel, OnePlus, Sony, Xiaomi og OPPO.', fixes: ['Skærm', 'Batteri', 'Ladestik', 'Bagcover'], images: ['iphone', 'samsung'] },
  { path: 'tablet', title: 'iPad og tablet', count: `${models('ipad-reparation')} iPad-modeller`, fixes: ['Skærm', 'Batteri', 'Ladestik'], images: ['ipad'] },
  { path: 'computer', title: 'Computer', count: `${models('mac-reparation')} Mac-modeller og PC`, fixes: ['Batteri', 'Tastatur', 'Virus'], images: ['macbook'] },
  { path: 'watch', cls: 'cat-wide', title: 'Apple Watch', count: `${models('watch')} modeller`, fixes: ['Skærm', 'Batteri', 'Software'], images: ['watch'] },
];
const SERVICES = [
  { href: 'iphone-reparation', img: 'crack-iphone.webp', size: [645, 922], kicker: 'Ny skærm til iPhone', title: 'Knust skærm?', text: 'Vi udskifter skærmen med kvalitetsreservedele. Vores erfarne teknikere sikrer en fejlfri installation og optimal visningskvalitet.', link: 'Find din iPhone' },
  { href: 'iphone-reparation', img: 'work-1.jpg', size: [600, 600], cover: true, kicker: 'Batteriskift på iPhone', title: 'Løber batteriet hurtigt tør?', text: 'Vi skifter batteriet hurtigt og effektivt med pålidelige reservedele, så du får optimal batterilevetid tilbage.', link: 'Find din iPhone' },
  { href: 'computer', img: 'crack-macbook.webp', size: [951, 828], kicker: 'Computerreparation', title: 'Driller din computer?', text: 'Uanset om det er hardware- eller softwareproblemer, kan vi hjælpe med at få din computer til at køre problemfrit igen.', link: 'Se computerreparation' },
];
const EXPERT = [
  ['IC-lodning', 'Lodning af komponenter på printkortet.'],
  ['Vandskade', 'Hjælp til enheder, der har fået vand.'],
  ['Fjernelse af kode', 'På Mac og PC, uden at du mister data.'],
  ['Backup af data', 'Sikkerhedskopi af dine data på Mac og PC.'],
];
const featured = biz.reviews.find(([n]) => n === 'Rasmus Thomsen');
const sale = biz.campaign.enabled ? biz.campaign : null;
const saleStrip = () => {
  const items = Array(8).fill(`<span>${esc(sale.name)}</span><span class="dot"></span><span>${sale.percent}% rabat på reparationer</span><span class="dot"></span>`).join('');
  return `<div class="sale-strip" aria-hidden="true"><div class="sale-track"><div>${items}</div><div>${items}</div></div></div>`;
};
page({
  path: '',
  current: 'home',
  title: 'GCPrepair.dk | Mobil-, tablet- og computerreparation i Greve og på Amagerbro',
  description: 'Hurtig og pålidelig reparation af iPhone, Samsung, iPad, Mac, PC og Apple Watch. Butikker i Greve Midtby Center og på Amagerbrogade 144.',
  extraHead: schema,
  extraScripts: '<script src="{root}js/devices.js"></script>',
  body: (root) => `
<section class="hero${sale ? ' sale' : ''}"><div class="wrap">
  <div>
    ${sale ? `<span class="sale-tag">${esc(sale.name)}</span>
    <h1><em>${sale.percent}% rabat</em> på din reparation</h1>
    <p class="lead">Hurtig og pålidelig reparation af mobil, tablet, computer og Apple Watch i Greve og på Amagerbro. Book en tid, eller kom bare forbi.</p>` : `<span class="eyebrow">Greve og Amagerbro</span>
    <h1>Din enhed er i <em>gode hænder</em></h1>
    <p class="lead">Hurtig, pålidelig og prisvenlig reparation af mobil, tablet, computer og Apple Watch. Book en tid, eller kom bare forbi.</p>`}
    <form class="search" role="search">
      <label for="q">Find din model</label>
      <span class="search-field">${icon('search')}<input id="q" type="search" data-search data-root="${root}" placeholder="F.eks. iPhone 15 eller Samsung S24" autocomplete="off"></span>
      <ul data-search-results hidden></ul>
    </form>
    <div class="btns">${callButtons(root, 'btn primary')}</div>
    <ul class="checks">
      <li>${icon('check')}Kvalitetsreservedele</li>
      <li>${icon('check')}Garanti på reparationer</li>
      <li>${icon('check')}Ingen skjulte gebyrer</li>
    </ul>
  </div>
  <div class="hero-photo">
    ${sale ? `<div class="sale-sticker"><strong>&minus;${sale.percent}%</strong><span>${esc(sale.name)}</span></div>` : ''}
    <img src="${root}images/site/technician.jpg" width="1000" height="1000" alt="Tekniker reparerer en telefon under mikroskop">
    <figure class="hero-quote">${STARS}<blockquote>${esc(featured[1])}</blockquote><figcaption>${esc(featured[0])}, Google</figcaption></figure>
  </div>
</div></section>
${sale ? saleStrip() : ''}

<section class="logos" aria-label="Mærker vi reparerer"><div class="wrap"><div class="logos-row">
  ${BRANDS.filter((b) => b.parent?.[0] === 'mobile').map((b) => `<a href="${root}${b.slug}/" aria-label="${esc(b.name)}"><img src="${root}images/site/${b.mark}" alt="" loading="lazy"></a>`).join('')}
</div></div></section>

<section class="section"><div class="wrap">
  <div class="section-split">
    <div><span class="eyebrow">Reparationer</span><h2>Hvad skal repareres?</h2></div>
    <p>Vælg din type enhed, og se modeller og reparationer.</p>
  </div>
  <div class="cats" data-reveal>
    ${CATEGORIES.map((c) => `<a class="cat ${c.cls ?? ''}" href="${root}${c.path}/">
      <span class="cat-arrow">${icon('arrow')}</span>
      <span class="cat-text">
        <h3>${c.title}</h3>
        <span class="cat-count">${c.count}</span>
        ${c.text ? `<span class="cat-desc">${c.text}</span>` : ''}
        <span class="cat-fixes">${c.fixes.map((f) => `<span>${f}</span>`).join('')}</span>
      </span>
      <span class="cat-img">${c.images.map((i) => `<img src="${root}images/site/products/${i}.jpg" width="${PRODUCT_SIZES[i][0]}" height="${PRODUCT_SIZES[i][1]}" style="--ratio:${(PRODUCT_SIZES[i][0] / PRODUCT_SIZES[i][1]).toFixed(3)}" loading="lazy" alt="">`).join('')}</span>
    </a>`).join('')}
  </div>
</div></section>

<section class="section tint"><div class="wrap why">
  <div class="why-head">
    <span class="eyebrow">Hvorfor os</span>
    <h2>Hvorfor vælge os til din reparation?</h2>
    <p class="lead">Greve Cell Phone &amp; PC Repair og iTelefix tilbyder hurtig og pålidelig reparation med erfarne teknikere.</p>
  </div>
  <figure class="why-photo" data-reveal>
    <img src="${root}images/site/work-3.jpg" loading="lazy" alt="Tekniker arbejder ved reparationsbordet på værkstedet">
    <figcaption class="why-stats">
      <div><strong>2</strong><span>butikker, i Greve og på Amagerbro</span></div>
      <div><strong>${models(...BRANDS.map((b) => b.slug))}</strong><span>modeller på vores reparationslister</span></div>
    </figcaption>
  </figure>
  <ul class="why-list" data-reveal>
    ${WHY.map(([i, t, d]) => `<li><span class="why-icon">${icon(i)}</span><div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}
  </ul>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-split">
    <div><span class="eyebrow">Populært</span><h2>Det hjælper vi tit med</h2></div>
    <a class="more" href="${root}mobile/">Se alle mobilmærker ${icon('arrow')}</a>
  </div>
  <div class="services" data-reveal>
    ${SERVICES.map((s) => `<a class="service" href="${root}${s.href}/">
      <span class="service-img${s.cover ? ' cover' : ''}"><img src="${root}images/site/${s.img}" width="${s.size[0]}" height="${s.size[1]}" loading="lazy" alt=""></span>
      <span class="service-kicker">${s.kicker}</span>
      <h3>${s.title}</h3>
      <p>${s.text}</p>
      <span class="more">${s.link} ${icon('arrow')}</span>
    </a>`).join('')}
  </div>
</div></section>

<section class="section dark"><div class="wrap">
  <div class="section-split">
    <div><span class="eyebrow">Sådan foregår det</span><h2>Din reparation i tre trin</h2></div>
    <p>Book en tid i forvejen, eller kom bare forbi. Det er helt op til dig.</p>
  </div>
  <ol class="process" data-reveal>
    <li>
      <h3>Find din model</h3>
      <p>Søg på siden, og se hvad vi kan reparere på netop din enhed.</p>
      <a class="process-action" href="#q">Søg efter din model ${icon('arrow')}</a>
    </li>
    <li>
      <h3>Ring, eller kom forbi</h3>
      <p>Book en tid i forvejen, eller kig bare ind i en af vores to butikker.</p>
      <a class="process-action" href="#butikker">Se butikker og åbningstider ${icon('arrow')}</a>
    </li>
    <li>
      <h3>Vi klarer reparationen</h3>
      <p>Vores teknikere bruger kvalitetsreservedele, og du får garanti på reparationen.</p>
      <span class="process-note">${icon('shield')}Garanti på reparationer</span>
    </li>
  </ol>
</div></section>

<section class="section"><div class="wrap reviews-layout">
  <div class="reviews-intro">
    <span class="eyebrow">Anmeldelser</span>
    <h2>Det siger vores kunder</h2>
    <div class="reviews-source">
      <img src="${root}images/site/brands/google.png" width="180" height="181" loading="lazy" alt="Google">
      <div>${STARS}<span>Udvalgte anmeldelser fra Google</span></div>
    </div>
    <div class="reviews-links">
      <a class="btn outline" href="${greve.reviewUrl}" rel="noopener">Se Greve på Google</a>
      <a class="more" href="${amager.reviewUrl}" rel="noopener">Se iTelefix på Trustpilot ${icon('arrow')}</a>
    </div>
  </div>
  <div class="reviews" data-reveal>
    ${biz.reviews.filter((r) => r !== featured).map((r) => reviewFig(r)).join('')}
  </div>
</div></section>

<section class="expert">
  <div class="expert-photo"><img src="${root}images/site/expert.jpg" width="1500" height="1000" loading="lazy" alt="Tekniker arbejder ved et mikroskop"></div>
  <div class="wrap"><div class="expert-body">
    <span class="eyebrow">Specialreparationer</span>
    <h2>Også de svære reparationer</h2>
    <p class="lead">Vi klarer mere end skærm og batteri. Vores erfarne teknikere tager sig også af de fejl, der kræver specialviden.</p>
    <ul class="expert-list" data-reveal>
      ${EXPERT.map(([t, d]) => `<li>${icon('check')}<div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}
    </ul>
    <div class="btns">${callButtons(root, 'btn primary')}</div>
  </div></div>
</section>

<section class="section" id="butikker"><div class="wrap">
  <div class="section-split">
    <div><span class="eyebrow">Butikker</span><h2>Her finder du os</h2></div>
    <p>Book en tid, eller kom bare forbi en af vores to butikker.</p>
  </div>
  <div class="shops">${biz.shops.map((s) => shopCard(root, s)).join('')}</div>
</div></section>`,
});

// ---- Category pages ----
page({
  path: 'mobile',
  title: 'Mobilreparation | GCPrepair.dk',
  description: 'Reparation af iPhone, Samsung, Huawei, OnePlus, Sony, Google Pixel, Xiaomi og OPPO. Skærm, batteri, kamera, knapper og IC-lodning.',
  body: (root) => `${pageHead(root, 'Mobilreparation', 'Vi kan reparere langt de fleste skader på din smartphone. Vores teknikere skifter alt fra batteri, skærm, højttaler og knapper til IC-lodning.')}
<section class="section"><div class="wrap">
  <div class="section-head"><h2>Vælg dit mærke</h2><p>Har du et andet mærke, f.eks. LG, Nokia eller HTC? Ring til os.</p></div>
  ${brandCards(root, phones)}
</div></section>
<section class="section tint"><div class="wrap">
  <div class="section-head"><h2>Det kan vi hjælpe med</h2></div>
  <div class="cards" data-reveal>
    <article class="card"><img src="${root}images/site/repair-1.jpg" width="800" height="533" loading="lazy" alt=""><div><h3>Skærm og andre fejl</h3><p>Få din smartphone til at fungere fejlfrit igen. Med erfarne teknikere og pålidelige reservedele tilbyder vi hurtige reparationer til konkurrencedygtige priser.</p></div></article>
    <article class="card"><img src="${root}images/site/work-1.jpg" width="600" height="600" loading="lazy" alt=""><div><h3>Batteri</h3><p>Slip af med det slidte batteri, og få din enheds ydeevne tilbage. Vi udskifter med kvalitetskomponenter, hurtigt og nemt.</p></div></article>
    <article class="card"><img src="${root}images/site/teardown.jpg" width="900" height="600" loading="lazy" alt=""><div><h3>Kamera og mere</h3><p>Vi håndterer alt fra kameraudskiftning til andre reparationer med kvalitetsreservedele. Vi ved, hvor vigtig din mobil er i hverdagen.</p></div></article>
  </div>
</div></section>`,
});

page({
  path: 'tablet',
  title: 'Tablet- og iPad-reparation | GCPrepair.dk',
  description: 'Skærmudskiftning, batteriskift og løsning af softwareproblemer på iPad og tablets. Kontakt os også for andre mærker.',
  body: (root) => `${pageHead(root, 'Tabletreparation', 'Skærmudskiftning, batteriskift og løsning af softwareproblemer med ægte reservedele.')}
<section class="section"><div class="wrap split">
  <div class="stack">
    ${brandCards(root, [brand('ipad-reparation')])}
    <div>
      <h2>Hurtig ekspedition, høj kvalitet</h2>
      <p>Vores erfarne teknikere sikrer høj kvalitet for optimal ydeevne, med hurtig ekspeditionstid og konkurrencedygtige priser. Vi dækker et bredt udvalg af modeller, og du kan nemt booke en tid.</p>
      <p class="note">Kontakt os for andre mærker.</p>
    </div>
  </div>
  <img src="${root}images/site/repair-1.jpg" width="800" height="533" loading="lazy" alt="Reparation af enhed på værkstedet">
</div></section>`,
});

page({
  path: 'computer',
  title: 'Computerreparation | Mac og PC | GCPrepair.dk',
  description: 'Reparation af Mac, MacBook og PC. Hardwarefejl, softwareproblemer og virus. Book en tid, eller kom forbi.',
  body: (root) => `${pageHead(root, 'Computerreparation', 'Book en tid i forvejen, eller kom bare forbi. Vores erfarne teknikere står klar til at hjælpe med enhver computerfejl.')}
<section class="section"><div class="wrap">
  <div class="section-head"><h2>Vælg din computer</h2></div>
  ${brandCards(root, [brand('mac-reparation'), brand('pc-reparation')])}
</div></section>
<section class="section tint"><div class="wrap">
  <div class="features" data-reveal>
    <div class="feature"><span class="badge-icon">${icon('tool')}</span><h3>Erfaren computerreparatør</h3><p>Vores teknikere har omfattende erfaring med en bred vifte af computerproblemer. Uanset om det er hardwarefejl, softwareproblemer eller virusinfektioner, kan vi hjælpe.</p></div>
    <div class="feature"><span class="badge-icon">${icon('clock')}</span><h3>Hurtig computerreparation</h3><p>Vi prioriterer effektivitet og kvalitet for at få din computer tilbage på sporet hurtigt, med konkurrencedygtige priser og en bekvem beliggenhed.</p></div>
    <div class="feature"><span class="badge-icon">${icon('pin')}</span><h3>Book tid, eller kom forbi</h3><p>Vi tilbyder pålidelige og effektive løsninger. Kontakt os, så vi kan få din computer til at køre problemfrit igen.</p></div>
  </div>
</div></section>`,
});

// ---- Brand pages ----
const LEADS = {
  watch: 'Skærmudskiftning, batteriskift og reparation af hardware og software. Vores dygtige teknikere arbejder med ægte reservedele.',
  'pc-reparation': 'Fra fejlsøgning og virusfjernelse til grafikkort, vandskade og IC-lodning. Her kan du se, hvor lang tid reparationen typisk tager.',
};
const HEAD_MARK = { 'ipad-reparation': 'brands/apple.png', watch: 'brands/apple.png', 'mac-reparation': 'brands/apple.png' };
for (const b of BRANDS) {
  const label = b.slug === 'watch' ? 'Apple Watch-reparation' : `${b.name}-reparation`;
  page({
    path: b.slug,
    title: `${label} | GCPrepair.dk`,
    description: `${label} i Greve og på Amagerbro. Se modeller og reparationer, og ring for en pris.`,
    body: (root) => `${pageHead(root, label, LEADS[b.slug] ?? 'Vælg din model for at se, hvad vi kan reparere. Ring eller skriv for en pris.', { crumbs: b.parent ? [[b.parent[0], b.parent[1]]] : [], mark: HEAD_MARK[b.slug] ?? b.mark, stat: modelCount(b.slug) })}
<section class="section"><div class="wrap">${deviceList(root, b.slug)}</div></section>`,
  });
}

// ---- Shop and categories ----
const productsIn = (id) => shop.products.filter((p) => p.category === id);
const categoryIcon = (c) => icon(ICONS[c?.icon] ? c.icon : 'device');
const countLabel = (n) => `${n} ${n === 1 ? 'vare' : 'varer'}`;

function productCard(root, p) {
  const category = shop.categories.find((c) => c.id === p.category);
  return `<article class="product">
    <div class="product-img">${p.image ? `<img src="${root}images/shop/${esc(p.image)}" loading="lazy" alt="${esc(p.name)}">` : categoryIcon(category)}</div>
    <div class="product-body">
      ${category ? `<a class="product-cat" href="${root}kategori/${category.id}/">${esc(category.name)}</a>` : ''}
      <h3>${esc(p.name)}</h3>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      <div class="product-foot">
        <span class="product-price">${p.price ? esc(p.price) : '<span class="ask">Kontakt for pris</span>'}</span>
        ${p.inStock === false ? '<span class="product-out">Ikke på lager</span>' : ''}
      </div>
      <a class="btn outline" href="${root}our-contacts/?emne=${encodeURIComponent(p.name)}#skriv">Spørg om varen</a>
    </div>
  </article>`;
}

const categoryNav = (root, activeId) => `<nav class="series-nav" aria-label="Kategorier">
  <a href="${root}shop/"${activeId ? '' : ' aria-current="true"'}>Alle varer</a>
  ${shop.categories.map((c) => `<a href="${root}kategori/${c.id}/"${c.id === activeId ? ' aria-current="true"' : ''}>${esc(c.name)}</a>`).join('')}
</nav>`;

const productGrid = (root, items) => (items.length
  ? `<div class="products" data-reveal>${items.map((p) => productCard(root, p)).join('')}</div>`
  : '<p class="shop-empty">Vi er ved at opdatere udvalget her. Ring, eller kig forbi butikken, så hjælper vi dig.</p>');

const shopNotice = `<div class="shop-notice">${icon('pin')}<p><b>Køb i butikken.</b> Du betaler og henter dine varer i Greve eller på Amagerbro. Spørg gerne først, om varen er hjemme.</p></div>`;

page({
  path: 'shop',
  current: 'shop',
  title: 'Shop | Telefoner, computere og tilbehør | GCPrepair.dk',
  description: 'Mobiltelefoner, computere, covers, skærmbeskyttelse, opladere og kabler. Se udvalget, og køb i vores butikker i Greve og på Amagerbro.',
  body: (root) => `${pageHead(root, 'Shop', 'Mobiltelefoner, computere og tilbehør. Se udvalget, og køb det i en af vores to butikker.', { stat: countLabel(shop.products.length), statIcon: 'tag' })}
<section class="section"><div class="wrap">
  ${shopNotice}
  ${categoryNav(root, null)}
  ${shop.categories.filter((c) => productsIn(c.id).length).map((c) => `<section class="shop-section">
    <div class="series-head"><h2>${esc(c.name)}</h2><span>${countLabel(productsIn(c.id).length)}</span><a class="more" href="${root}kategori/${c.id}/">Se kategori ${icon('arrow')}</a></div>
    ${productGrid(root, productsIn(c.id))}
  </section>`).join('')}
</div></section>`,
});

page({
  path: 'kategorier',
  current: 'categories',
  title: 'Kategorier | Tilbehør og reparation | GCPrepair.dk',
  description: 'Find varer og reparationer efter kategori: mobiltelefoner, computere, covers, skærmbeskyttelse, opladere og reparation.',
  body: (root) => `${pageHead(root, 'Kategorier', 'Find det, du leder efter: telefoner, computere, tilbehør eller en reparation.')}
<section class="section"><div class="wrap">
  <div class="section-head"><span class="eyebrow">Shop</span><h2>Køb i butikken</h2></div>
  <div class="category-grid" data-reveal>
    ${shop.categories.map((c) => `<a class="category-card" href="${root}kategori/${c.id}/">
      <span class="category-icon">${categoryIcon(c)}</span>
      <h3>${esc(c.name)}</h3>
      <p>${esc(c.description ?? '')}</p>
      <span class="more">${countLabel(productsIn(c.id).length)} ${icon('arrow')}</span>
    </a>`).join('')}
  </div>
</div></section>
<section class="section tint"><div class="wrap">
  <div class="section-head"><span class="eyebrow">Værksted</span><h2>Reparation</h2></div>
  <div class="category-grid four" data-reveal>
    ${CATEGORIES.map((c) => `<a class="category-card" href="${root}${c.path}/">
      <img class="category-photo" src="${root}images/site/products/${c.images[0]}.jpg" width="${PRODUCT_SIZES[c.images[0]][0]}" height="${PRODUCT_SIZES[c.images[0]][1]}" loading="lazy" alt="">
      <h3>${c.title}</h3>
      <p>${c.count}</p>
      <span class="more">Se reparationer ${icon('arrow')}</span>
    </a>`).join('')}
  </div>
</div></section>`,
});

for (const c of shop.categories) {
  const items = productsIn(c.id);
  page({
    path: `kategori/${c.id}`,
    current: 'shop',
    title: `${c.name} | Shop | GCPrepair.dk`,
    description: `${c.name} i vores butikker i Greve og på Amagerbro. ${c.description ?? ''}`.trim(),
    body: (root) => `${pageHead(root, c.name, c.description ?? '', { crumbs: [['shop', 'Shop'], ['kategorier', 'Kategorier']], stat: countLabel(items.length), statIcon: 'tag' })}
<section class="section"><div class="wrap">
  ${shopNotice}
  ${categoryNav(root, c.id)}
  <div class="shop-grid-wrap">${productGrid(root, items)}</div>
</div></section>`,
  });
}

// ---- Contact ----
page({
  path: 'our-contacts',
  current: 'contact',
  title: 'Kontakt | GCPrepair.dk',
  description: 'Kontakt Greve Cell Phone & PC Repair i Greve Midtby Center eller iTelefix på Amagerbrogade 144. Telefon, e-mail og åbningstider.',
  extraHead: schema,
  body: (root) => `${pageHead(root, 'Kontakt os', 'Ring, skriv, eller kig forbi en af vores butikker.')}
<section class="section"><div class="wrap">
  <div class="shops">${biz.shops.map((s) => shopCard(root, s)).join('')}</div>
</div></section>
<section class="section tint" id="skriv"><div class="wrap">
  <div class="contact-panel">
    <div class="contact-aside">
      <h2>Skriv til os</h2>
      <p>Fortæl os, hvilken enhed du har, og hvad der er galt.</p>
      <ul class="contact-lines">${biz.emails.map((e) => `<li>${icon('mail')}<a href="mailto:${e}">${e}</a></li>`).join('')}${biz.shops.map((s) => `<li>${icon('phone')}<a href="tel:${s.phone}">${esc(s.short)}: +45 ${s.phoneDisplay}</a></li>`).join('')}</ul>
    </div>
    <form class="form" data-mail-form data-to="${biz.emails[0]}" data-endpoint="${root}contact.php">
      <label class="form-trap" aria-hidden="true">Lad dette felt være tomt<input name="website" tabindex="-1" autocomplete="off"></label>
      <label>Dit navn<input name="name" required autocomplete="name"></label>
      <label>Din e-mail<input name="email" type="email" required autocomplete="email"></label>
      <label>Butik<select name="shop">${biz.shops.map((s) => `<option>${esc(s.short)}</option>`).join('')}</select></label>
      <label>Emne<input name="subject" required placeholder="F.eks. iPhone 14, ny skærm"></label>
      <label>Din besked<textarea name="message"></textarea></label>
      <button class="btn primary" type="submit">${icon('mail')}Send besked</button>
      <p class="hint" data-form-status role="status"></p>
    </form>
  </div>
</div></section>`,
});

// ---- 404, sitemap, robots, redirects ----
page({
  path: '404-page',
  title: 'Siden findes ikke | GCPrepair.dk',
  description: 'Siden findes ikke.',
  body: (root) => `${pageHead(root, 'Siden findes ikke', 'Prøv forsiden, eller ring til os.')}`,
});
// The 404 is served from any depth, so it needs root-relative asset links
const notFound = files.get('404-page/index.html')
  .replaceAll('"../', '"/')
  .replace(/<link rel="canonical"[^>]*>\n/, '<meta name="robots" content="noindex">\n');
files.set('404.html', notFound);
files.delete('404-page/index.html');

const paths = ['', 'shop', 'kategorier', ...shop.categories.map((c) => `kategori/${c.id}`), 'mobile', 'tablet', 'computer', 'our-contacts', ...BRANDS.map((b) => b.slug)];
files.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${biz.domain}/${p ? `${p}/` : ''}</loc></url>`).join('\n')}
</urlset>
`);
files.set('robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${biz.domain}/sitemap.xml\n`);

  return files;
}
