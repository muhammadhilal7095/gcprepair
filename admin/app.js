// Admin panel. Edits the site data, renders every page in the browser with the same
// code as the local build (src/render.mjs), and sends the result to api.php to publish.
import { renderSite } from './render.js?v=c3fda3049b';

const BRANDS = {
  'iphone-reparation': 'iPhone', 'samsung-reparation': 'Samsung', 'huawei-reparation': 'Huawei', 'oneplus-reparation': 'OnePlus',
  'sony-reparation': 'Sony', 'google-pixel-reparation': 'Google Pixel', 'xiaomi-reparation': 'Xiaomi', 'oppo-reparation': 'OPPO',
  'ipad-reparation': 'iPad', 'mac-reparation': 'Mac', 'pc-reparation': 'PC', watch: 'Apple Watch',
};
const SOCIALS = ['Facebook', 'Instagram', 'TikTok'];
const ICONS = {
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h14v-7"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  bag: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  plug: '<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0z"/><path d="M12 18v4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  photo: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
};
const icon = (name) => {
  const span = document.createElement('span');
  span.className = 'ico';
  span.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ICONS.tool}</svg>`;
  return span;
};
const root = document.getElementById('app');
const state = { csrf: '', business: null, repairs: null, shop: null, username: '', smtp: null, backups: [], tab: 'notices', dirty: false, brand: 'iphone-reparation', modelSearch: '', openModel: null };

// ---- Helpers ----
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'open') el[k] = v;
    else el.setAttribute(k, v);
  }
  el.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
  return el;
}

async function api(action, body) {
  const options = { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: { 'X-CSRF-Token': state.csrf } };
  if (body instanceof FormData) options.body = body;
  else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`api.php?action=${action}`, options);
  } catch {
    throw new Error('Could not reach the server. Check your connection.');
  }
  const data = await res.json().catch(() => null);
  if (!data) throw new Error('The admin server did not answer. It needs PHP, so it only works on your web hosting.');
  if (res.status === 401) showAuth(false);
  if (!data.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function toast(text, ok = true) {
  document.querySelector('.toast')?.remove();
  const el = h('p', { class: `msg toast ${ok ? 'ok' : 'err'}`, role: 'status' }, text);
  document.body.append(el);
  setTimeout(() => el.remove(), ok ? 3500 : 8000);
}

const touch = () => {
  state.dirty = true;
  const s = document.querySelector('.state');
  if (s) setState(s);
};

// A text input bound to obj[key]
function field(label, obj, key, { type = 'text', help, placeholder, onchange } = {}) {
  return h('label', {}, label, help && h('small', {}, help), h('input', {
    type, value: obj[key] ?? '', placeholder,
    oninput: (e) => {
      obj[key] = type === 'number' ? Number(e.target.value) : e.target.value;
      touch();
      onchange?.(e.target.value);
    },
  }));
}

function toggle(label, obj, key, onchange) {
  return h('label', { class: 'check' }, h('input', {
    type: 'checkbox', role: 'switch', checked: !!obj[key],
    onchange: (e) => { obj[key] = e.target.checked; touch(); onchange?.(e.target.checked); },
  }), h('span', { class: 'switch', 'aria-hidden': 'true' }), label);
}

// Card icons by title; a leading description paragraph moves into the header
const CARD_ICONS = {
  'Announcement bar': 'megaphone', 'Special offer on the home page': 'tag', Site: 'globe', 'Repairs and prices': 'tool',
  Products: 'bag', Categories: 'tag', 'Customer reviews': 'star', 'Email sending (SMTP)': 'mail', 'Google Search Console': 'globe',
  'Google Analytics and Facebook Pixel': 'plug', 'Google Business Profile': 'store', 'Bing Webmaster Tools': 'globe',
  Backups: 'clock', 'Change login': 'shield', 'Email, WhatsApp and video': 'phone',
};
const card = (title, ...children) => {
  const flat = children.flat();
  const desc = flat[0] instanceof HTMLElement && flat[0].matches('p.muted') ? flat.shift() : null;
  return h('section', { class: 'card' },
    h('header', { class: 'card-head' }, icon(CARD_ICONS[title] ?? 'store'), h('div', {}, h('h2', {}, title), desc)),
    h('div', { class: 'card-body' }, ...flat));
};

function imagePicker(current, src, name, kind, onDone) {
  const img = h('img', { src: current ? src(current) : '', alt: '', hidden: !current });
  const input = h('input', {
    type: 'file', accept: 'image/jpeg,image/png,image/webp',
    onchange: async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const form = new FormData();
      form.append('image', file);
      form.append('kind', kind);
      form.append('name', name());
      try {
        const { file: saved } = await api('upload', form);
        onDone(saved);
        img.src = src(saved);
        img.hidden = false;
        touch();
        toast('Image uploaded. Press Publish to use it.');
      } catch (err) {
        toast(err.message, false);
      }
    },
  });
  return h('div', { class: 'thumb' }, h('div', { class: 'thumb-img' }, img, current ? null : icon('photo')), h('label', { class: 'upload' }, icon('upload'), h('span', {}, h('b', {}, 'Change image'), h('small', {}, 'JPG, PNG or WebP, up to 5 MB')), input));
}

// ---- Login ----
function showAuth(setup) {
  const logo = h('img', { class: 'auth-logo', src: '../images/site/logo.png', alt: 'GCPrepair.dk' });
  if (setup) {
    root.replaceChildren(h('div', { class: 'auth-page' }, h('div', { class: 'auth' }, logo,
      h('h1', {}, 'Website admin'),
      h('p', { class: 'msg err' }, 'No admin login has been created on this server yet. Contact your web developer.'))));
    return;
  }
  const user = h('input', { type: 'email', autocomplete: 'username', required: true, placeholder: 'info@gcprepair.dk' });
  const pw = h('input', { type: 'password', autocomplete: 'current-password', required: true });
  const msg = h('p', { class: 'msg err', hidden: true });
  const button = h('button', { class: 'btn primary block', type: 'submit' }, 'Log in');
  root.replaceChildren(h('div', { class: 'auth-page' }, h('form', {
    class: 'auth',
    onsubmit: async (e) => {
      e.preventDefault();
      msg.hidden = true;
      button.disabled = true;
      try {
        const res = await api('login', { username: user.value, password: pw.value });
        state.csrf = res.csrf;
        await loadAll();
      } catch (err) {
        msg.textContent = err.message;
        msg.hidden = false;
        button.disabled = false;
      }
    },
  },
  logo,
  h('h1', {}, 'Website admin'),
  h('p', { class: 'muted' }, 'Log in to update your website.'),
  h('label', {}, 'Username', user),
  h('label', {}, 'Password', pw),
  button,
  msg)));
}

// ---- Tabs ----
const TABS = {
  notices: ['Notices & offer', tabNotices, 'megaphone', 'The announcement bar and the special offer on the home page.'],
  shops: ['Shops & hours', tabShops, 'store', 'Addresses, phone numbers, opening hours and social media.'],
  repairs: ['Repairs & prices', tabRepairs, 'tool', 'Models, repairs and prices on the repair pages.'],
  shop: ['Shop & categories', tabShop, 'bag', 'Products for sale and their categories.'],
  reviews: ['Reviews', tabReviews, 'star', 'Customer reviews on the home page.'],
  connections: ['Email & Google', tabConnections, 'plug', 'Email sending, Google and visitor statistics.'],
  account: ['Backups & password', tabAccount, 'shield', 'Earlier versions of the site and your login.'],
};

function tabNotices() {
  const { announcement: a, campaign: c, business } = { ...state.business, business: state.business };
  const barPreview = h('div', { class: 'bar-preview', 'aria-label': 'Preview' });
  const offerPreview = h('div', { class: 'offer-preview', 'aria-label': 'Preview' });
  function drawPreviews() {
    const phones = business.shops.map((s) => `${s.short}: ${s.phoneDisplay}`).join('   •   ');
    barPreview.replaceChildren(h('span', { class: 'preview-label' }, a.enabled ? 'Preview' : 'Hidden'), h('span', { class: 'bar-text' }, `${a.text || 'Your message'}   •   ${phones}`));
    barPreview.classList.toggle('off', !a.enabled);
    offerPreview.replaceChildren(h('strong', {}, `−${c.percent || 0}%`), h('span', {}, c.name || 'Offer'));
    offerPreview.classList.toggle('off', !c.enabled);
  }
  drawPreviews();
  return [
    card('Announcement bar', h('p', { class: 'muted' }, 'The scrolling blue bar at the top of every page. Both shop phone numbers are added to it automatically.'),
      barPreview,
      toggle('Show the announcement bar', a, 'enabled', drawPreviews),
      field('Message', a, 'text', { onchange: drawPreviews }),
    ),
    card('Special offer on the home page', h('p', { class: 'muted' }, 'When on, the home page shows the offer heading, sticker and scrolling strip. Turn it off when the sale ends.'),
      h('div', { class: 'offer-row' }, offerPreview, h('div', {},
        toggle('Show the offer', c, 'enabled', drawPreviews),
        h('div', { class: 'grid2' }, field('Offer name', c, 'name', { onchange: drawPreviews }), field('Discount (%)', c, 'percent', { type: 'number', onchange: drawPreviews })),
      )),
    ),
    card('Site', field('Website address', business, 'domain', { type: 'url', help: 'Used in Google links and the sitemap, with no slash at the end.' })),
  ];
}

function tabShops() {
  const b = state.business;
  return [
    ...b.shops.map((s) => card(s.name || 'Shop',
      h('div', { class: 'grid2' },
        field('Shop name', s, 'name'), field('Short name', s, 'short', { help: 'Used on buttons, like "Ring Greve".' }),
        field('Street', s, 'street'), field('Company line', s, 'legalLine', { help: 'Optional, like Zeenat Telecom.' }),
        field('Postal code', s, 'postal'), field('City', s, 'city'),
        field('Phone for calling', s, 'phone', { help: 'With country code and no spaces: +4591921420' }), field('Phone as shown', s, 'phoneDisplay', { help: 'Like 91 92 14 20' }),
        field('Review link', s, 'reviewUrl', { type: 'url' }), field('Review link text', s, 'reviewLabel'),
      ),
      imagePicker(s.image, (f) => `../images/site/${f}`, () => `shop-${s.id}`, 'site', (f) => { s.image = f; }),
      h('h3', {}, 'Opening hours'),
      h('p', { class: 'muted' }, 'Write the times like 10:00 – 18:00, or Lukket when closed.'),
      h('div', { class: 'grid2' }, s.hours.map((row) => field(row[0], row, 1))),
      h('h3', {}, 'Social media'),
      SOCIALS.map((name) => {
        const entry = s.social.find(([n]) => n === name);
        return h('label', {}, name, h('input', {
          type: 'url', value: entry?.[1] ?? '', placeholder: 'Leave empty to hide',
          oninput: (e) => {
            s.social = s.social.filter(([n]) => n !== name);
            if (e.target.value.trim()) {
              s.social.push([name, e.target.value.trim()]);
              s.social.sort((x, y) => SOCIALS.indexOf(x[0]) - SOCIALS.indexOf(y[0]));
            }
            touch();
          },
        }));
      }),
    )),
    card('Email, WhatsApp and video',
      h('div', { class: 'grid2' }, b.emails.map((_, i) => field(i ? 'Second email' : 'Main email', b.emails, i, { type: 'email' }))),
      field('YouTube link', b, 'youtube', { type: 'url' }),
      (b.whatsapp ??= { number: '' }, field('WhatsApp number for shop orders', b.whatsapp, 'number', { help: 'With country code, like +4591921420. Leave empty to hide the WhatsApp buttons.' })),
    ),
  ];
}

const slug = (s) => s.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function renderModels(list) {
  const box = h('div');
  const draw = () => {
    const q = state.modelSearch.toLowerCase();
    box.replaceChildren(...list.filter((m) => m.name.toLowerCase().includes(q)).map((m) => modelCard(list, m, draw)));
  };
  draw();
  return box;
}

function modelCard(list, m, redraw) {
  const rows = h('tbody');
  const drawRows = () => rows.replaceChildren(...m.services.map((r, i) => h('tr', {},
    h('td', {}, h('input', { type: 'text', 'aria-label': 'Repair', placeholder: 'Repair', value: r.name, oninput: (e) => { r.name = e.target.value; touch(); } })),
    h('td', {}, h('input', { type: 'text', 'aria-label': 'Price', placeholder: 'Empty = contact for price', value: r.price ?? '', oninput: (e) => { r.price = e.target.value.trim() || null; touch(); } })),
    h('td', {}, h('input', { type: 'text', 'aria-label': 'Time', placeholder: 'Time, optional', value: r.time ?? '', oninput: (e) => { r.time = e.target.value.trim() || null; touch(); } })),
    h('td', {}, h('button', { class: 'btn small danger', type: 'button', onclick: () => { m.services.splice(i, 1); touch(); drawRows(); } }, 'Remove')),
  )));
  drawRows();
  return h('details', { class: 'model', open: state.openModel === m.id, ontoggle: (e) => { if (e.target.open) state.openModel = m.id; } },
    h('summary', {}, m.image && h('img', { src: `../images/devices/${m.image}`, alt: '', loading: 'lazy' }), m.name, h('span', { class: 'muted' }, `${m.services.length} repairs`)),
    h('div', { class: 'model-body' },
      h('label', {}, 'Model name', h('input', { type: 'text', value: m.name, oninput: (e) => { m.name = e.target.value; touch(); } })),
      imagePicker(m.image, (f) => `../images/devices/${f}`, () => m.id, 'devices', (f) => { m.image = f; }),
      h('table', { class: 'rows' }, h('thead', {}, h('tr', {}, h('th', {}, 'Repair'), h('th', {}, 'Price, like 899 kr.'), h('th', {}, 'Time'), h('th'))), rows),
      h('div', { class: 'row', style: 'margin-top:10px' },
        h('button', { class: 'btn small', type: 'button', onclick: () => { m.services.push({ name: '', price: null, time: null, note: null }); touch(); drawRows(); } }, '+ Add repair'),
        h('button', { class: 'btn small danger', type: 'button', onclick: () => {
          if (!confirm(`Delete ${m.name}?`)) return;
          list.splice(list.indexOf(m), 1);
          touch();
          redraw();
        } }, 'Delete this model'),
      ),
    ));
}

function tabRepairs() {
  const list = state.repairs[state.brand];
  const models = renderModels(list);
  const newName = h('input', { type: 'text', placeholder: 'New model name, like iPhone 19' });
  const search = h('input', { type: 'text', placeholder: 'Find a model', value: state.modelSearch, oninput: (e) => { state.modelSearch = e.target.value; const fresh = renderModels(list); wrap.replaceChildren(fresh); } });
  const wrap = h('div', {}, models);
  return [card('Repairs and prices',
    h('div', { class: 'grid2' },
      h('label', {}, 'Page', h('select', { onchange: (e) => { state.brand = e.target.value; state.modelSearch = ''; show(); } }, Object.entries(BRANDS).map(([k, v]) => h('option', { value: k, selected: k === state.brand ? 'selected' : null }, v)))),
      h('label', {}, 'Search', search),
    ),
    h('div', { class: 'row', style: 'margin-bottom:14px' }, h('div', { style: 'flex:1;min-width:200px' }, newName), h('button', {
      class: 'btn', type: 'button',
      onclick: () => {
        const name = newName.value.trim();
        if (!name) return;
        let id = slug(name) || 'model';
        while (list.some((m) => m.id === id)) id += '-2';
        list.unshift({ id, name, image: null, services: [] });
        state.openModel = id;
        state.modelSearch = '';
        touch();
        show();
      },
    }, '+ Add model')),
    wrap,
  )];
}

const CATEGORY_ICONS = [['device', 'Phone'], ['monitor', 'Computer'], ['shield', 'Shield'], ['zap', 'Lightning'], ['tool', 'Tool'], ['tag', 'Price tag'], ['award', 'Award']];

function tabShop() {
  const { categories, products } = state.shop;
  const productBox = h('div');
  const catOptions = (p) => categories.map((c) => h('option', { value: c.id, selected: p.category === c.id ? 'selected' : null }, c.name));
  const productCard = (p) => h('details', { class: 'model', open: state.openModel === p.id, ontoggle: (e) => { if (e.target.open) state.openModel = p.id; } },
    h('summary', {}, p.image && h('img', { src: `../images/shop/${p.image}`, alt: '', loading: 'lazy' }), p.name, h('span', { class: 'muted' }, p.price || 'Contact for price')),
    h('div', { class: 'model-body' },
      h('div', { class: 'grid2' },
        field('Product name', p, 'name'),
        h('label', {}, 'Category', h('select', { onchange: (e) => { p.category = e.target.value; touch(); } }, catOptions(p))),
        h('label', {}, 'Price, like 199 kr.', h('small', {}, 'Leave empty to show "Kontakt for pris".'), h('input', { type: 'text', value: p.price ?? '', oninput: (e) => { p.price = e.target.value.trim() || null; touch(); } })),
        field('Short description', p, 'description', { help: 'Optional.' }),
      ),
      toggle('In stock (when off, shows "Ikke på lager")', p, 'inStock'),
      imagePicker(p.image, (f) => `../images/shop/${f}`, () => p.id, 'shop', (f) => { p.image = f; }),
      h('button', { class: 'btn small danger', type: 'button', onclick: () => {
        if (!confirm(`Delete ${p.name}?`)) return;
        products.splice(products.indexOf(p), 1);
        touch();
        show();
      } }, 'Delete this product'),
    ));
  productBox.append(...products.map(productCard));
  const newCat = h('input', { type: 'text', placeholder: 'New category, like Høretelefoner' });
  const newProduct = h('input', { type: 'text', placeholder: 'New product name' });
  return [
    card('Products', h('p', { class: 'muted' }, 'Shown on the Shop page and on each category page. Customers buy in the shops, there is no online payment.'),
      h('div', { class: 'row', style: 'margin-bottom:14px' }, h('div', { style: 'flex:1;min-width:200px' }, newProduct), h('button', {
        class: 'btn', type: 'button', disabled: !categories.length,
        onclick: () => {
          const name = newProduct.value.trim();
          if (!name) return;
          let id = slug(name) || 'product';
          while (products.some((p) => p.id === id)) id += '-2';
          products.unshift({ id, name, category: categories[0].id, price: null, image: null, description: '', inStock: true });
          state.openModel = id;
          touch();
          show();
        },
      }, '+ Add product')),
      productBox,
    ),
    card('Categories', h('p', { class: 'muted' }, 'Each category gets its own page and appears on the Kategorier page. A category with products cannot be deleted.'),
      categories.map((c) => h('div', { class: 'grid3' },
        field('Name', c, 'name'),
        field('Description', c, 'description'),
        h('label', {}, 'Icon', h('div', { class: 'row' },
          h('select', { style: 'flex:1;width:auto', onchange: (e) => { c.icon = e.target.value; touch(); } }, CATEGORY_ICONS.map(([v, t]) => h('option', { value: v, selected: c.icon === v ? 'selected' : null }, t))),
          h('button', { class: 'btn small danger', type: 'button', onclick: () => {
            if (products.some((p) => p.category === c.id)) { toast('Move or delete its products first.', false); return; }
            categories.splice(categories.indexOf(c), 1);
            touch();
            show();
          } }, 'Delete'))),
      )),
      h('div', { class: 'row' }, h('div', { style: 'flex:1;min-width:200px' }, newCat), h('button', {
        class: 'btn', type: 'button',
        onclick: () => {
          const name = newCat.value.trim();
          if (!name) return;
          let id = slug(name) || 'kategori';
          while (categories.some((c) => c.id === id)) id += '-2';
          categories.push({ id, name, icon: 'device', description: '' });
          touch();
          show();
        },
      }, '+ Add category')),
    ),
  ];
}

function tabReviews() {
  const list = state.business.reviews;
  const box = h('div');
  const draw = () => box.replaceChildren(...list.map((r, i) => h('div', { class: 'grid2' },
    h('label', {}, 'Name', h('input', { type: 'text', value: r[0], oninput: (e) => { r[0] = e.target.value; touch(); } })),
    h('label', {}, 'Review', h('div', { class: 'row' }, h('input', { type: 'text', style: 'flex:1;width:auto', value: r[1], oninput: (e) => { r[1] = e.target.value; touch(); } }),
      h('button', { class: 'btn small danger', type: 'button', disabled: r[0] === 'Rasmus Thomsen', title: r[0] === 'Rasmus Thomsen' ? 'Shown in the top section of the home page' : null, onclick: () => { list.splice(i, 1); touch(); draw(); } }, 'Remove'))),
  )));
  draw();
  return [card('Customer reviews', h('p', { class: 'muted' }, 'Only add real reviews, written the way the customer wrote them.'), box,
    h('button', { class: 'btn small', type: 'button', onclick: () => { list.push(['', '']); touch(); draw(); } }, '+ Add review'))];
}

function tabConnections() {
  const s = state.smtp;
  s.password = '';
  const i = state.business.integrations;
  const smtpMsg = h('p', { class: 'msg', hidden: true });
  const say = (text, ok) => { smtpMsg.textContent = text; smtpMsg.className = `msg ${ok ? 'ok' : 'err'}`; smtpMsg.hidden = false; };
  const saveSmtp = async () => {
    const { smtp } = await api('smtp-save', s);
    state.smtp = smtp;
    state.smtp.password = '';
  };
  const domain = state.business.domain;
  return [
    card('Email sending (SMTP)',
      h('p', { class: 'muted' }, 'The contact form sends messages through this account. Until it is set up, the form opens the visitor\'s own mail app instead. This saves immediately, without pressing Publish.'),
      h('div', { class: 'grid2' },
        field('Mail server', s, 'host', { help: 'Hostinger: smtp.hostinger.com. Gmail: smtp.gmail.com' }),
        h('div', { class: 'grid2' }, field('Port', s, 'port', { type: 'number', help: '465 or 587' }), h('label', {}, 'Security', h('small', {}, '465: SSL. 587: STARTTLS'), h('select', { onchange: (e) => { s.encryption = e.target.value; } }, [['ssl', 'SSL'], ['tls', 'STARTTLS'], ['none', 'None']].map(([v, t]) => h('option', { value: v, selected: s.encryption === v ? 'selected' : null }, t))))),
        field('Username', s, 'username', { help: 'Usually the full email address.' }),
        field('Password', s, 'password', { type: 'password', placeholder: s.hasPassword ? 'Saved. Leave empty to keep it.' : '', help: 'Gmail needs an app password, not your normal one.' }),
        field('Send from', s, 'from', { type: 'email', help: 'Usually the same address as the username.' }),
        field('Send to', s, 'to', { type: 'email', help: 'Where contact messages should arrive.' }),
      ),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', type: 'button', onclick: async () => { try { await saveSmtp(); say('Email settings saved.', true); } catch (e) { say(e.message, false); } } }, 'Save email settings'),
        h('button', { class: 'btn', type: 'button', onclick: async (e) => {
          e.target.disabled = true;
          say('Sending a test email…', true);
          try { await saveSmtp(); await api('smtp-test', {}); say(`Test email sent to ${state.smtp.to}. Check that inbox.`, true); } catch (err) { say(err.message, false); }
          e.target.disabled = false;
        } }, 'Save and send test email'),
      ),
      smtpMsg,
    ),
    card('Google Search Console',
      h('p', { class: 'muted' }, 'Gets your site listed and shows how people find you on Google.'),
      h('ol', { class: 'steps' },
        h('li', {}, 'Open ', h('a', { href: 'https://search.google.com/search-console', target: '_blank', rel: 'noopener' }, 'Search Console'), ' and add the URL prefix ', h('code', {}, `${domain}/`), '.'),
        h('li', {}, 'Choose the "HTML tag" method and copy only the code from content="…".'),
        h('li', {}, 'Paste it below, press Publish, then press Verify in Google.'),
        h('li', {}, 'Submit your sitemap: ', h('code', {}, `${domain}/sitemap.xml`)),
      ),
      h('br'),
      field('Google verification code', i, 'googleVerification'),
    ),
    card('Google Analytics and Facebook Pixel',
      h('p', { class: 'muted' }, 'Visitor statistics. When one is filled in, the site shows a cookie banner and only starts these after the visitor accepts, as Danish rules require. You should also add a privacy policy.'),
      h('div', { class: 'grid2' },
        field('Google Analytics ID', i, 'ga4', { placeholder: 'G-XXXXXXXXXX', help: 'From analytics.google.com, under Data streams.' }),
        field('Facebook Pixel ID', i, 'facebookPixel', { placeholder: '123456789012345', help: 'Numbers only, from Meta Events Manager.' }),
      ),
    ),
    card('Google Business Profile',
      h('p', { class: 'muted' }, 'Your shops on Google Maps. Manage them at ', h('a', { href: 'https://business.google.com/', target: '_blank', rel: 'noopener' }, 'business.google.com'), '. Put your website address there, and put your Google link in the review link field under Shops & hours.'),
    ),
    card('Bing Webmaster Tools', field('Bing verification code', i, 'bingVerification', { help: 'Optional. From bing.com/webmasters, the same way as Google.' })),
  ];
}

function tabAccount() {
  const current = h('input', { type: 'password', autocomplete: 'current-password' });
  const next = h('input', { type: 'password', autocomplete: 'new-password' });
  const newUser = h('input', { type: 'email', autocomplete: 'username', placeholder: 'Leave empty to keep it' });
  const backups = state.backups;
  return [
    card('Backups', h('p', { class: 'muted' }, 'A copy is saved each time you publish, keeping the last 15. Loading one lets you check it, then press Publish to make it live.'),
      backups.length ? h('table', {}, h('tbody', {}, backups.map((name) => h('tr', {}, h('td', {}, name.replace('_', ' ').replace(/(\d\d)(\d\d)(\d\d)$/, '$1:$2:$3')), h('td', { style: 'text-align:right' }, h('button', {
        class: 'btn small', type: 'button',
        onclick: async () => {
          if (state.dirty && !confirm('This replaces your unpublished changes. Continue?')) return;
          try {
            const r = await api('restore', { name });
            state.business = r.business;
            state.repairs = r.repairs;
            if (r.shop?.categories) state.shop = r.shop;
            touch();
            toast('Backup loaded. Press Publish to make it live.');
          } catch (e) { toast(e.message, false); }
        },
      }, 'Load')))))) : h('p', {}, 'No backups yet. The first one is made when you publish.'),
    ),
    card('Change login',
      h('label', {}, 'Current password', h('small', {}, 'Needed for any change.'), current),
      h('label', {}, 'New username', newUser),
      h('label', {}, 'New password (at least 10 characters)', h('small', {}, 'Leave empty to keep it.'), next),
      h('button', { class: 'btn', type: 'button', onclick: async () => {
        try { await api('password', { current: current.value, username: newUser.value, new: next.value }); current.value = ''; next.value = ''; newUser.value = ''; toast('Login changed.'); } catch (e) { toast(e.message, false); }
      } }, 'Save login'),
    ),
  ];
}

// ---- Shell ----
async function publish(btn) {
  btn.disabled = true;
  btn.textContent = 'Publishing…';
  try {
    const files = Object.fromEntries(renderSite(state.business, state.repairs, state.shop));
    const res = await api('publish', { business: state.business, repairs: state.repairs, shop: state.shop, files });
    state.backups = res.backups;
    state.dirty = false;
    setState(document.querySelector('.state'));
    toast('Published! Your changes are live.');
  } catch (e) {
    toast(`Not published: ${e.message}`, false);
  }
  btn.disabled = false;
  btn.textContent = 'Publish changes';
}

function setState(el) {
  el.className = `state${state.dirty ? ' dirty' : ''}`;
  el.lastChild.textContent = state.dirty ? 'Unpublished changes' : 'All changes are live';
}

function show() {
  const [title, render, , subtitle] = TABS[state.tab];
  const tabs = Object.entries(TABS).map(([key, [label, , ic]]) => h('button', {
    type: 'button', class: state.tab === key ? 'on' : null, 'aria-current': state.tab === key ? 'page' : null,
    onclick: () => { state.tab = key; show(); scrollTo(0, 0); },
  }, icon(ic), h('span', {}, label)));
  const status = h('span', { class: 'state' }, h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span'));
  setState(status);
  root.replaceChildren(h('div', { class: 'shell' },
    h('aside', { class: 'side' },
      h('a', { class: 'brand', href: '../', target: '_blank', rel: 'noopener' }, h('img', { src: '../images/site/logo.png', alt: 'GCPrepair.dk' }), h('span', {}, 'Admin')),
      h('nav', { class: 'tabs', 'aria-label': 'Sections' }, tabs),
      h('div', { class: 'side-foot' },
        h('a', { class: 'side-link', href: '../', target: '_blank', rel: 'noopener' }, icon('external'), h('span', {}, 'View website')),
        state.username && h('div', { class: 'who' }, icon('user'), h('span', {}, state.username)),
        h('button', { class: 'side-link', type: 'button', onclick: async () => {
          if (state.dirty && !confirm('You have unpublished changes. Log out anyway?')) return;
          await api('logout', {}).catch(() => {});
          state.dirty = false;
          location.reload();
        } }, icon('logout'), h('span', {}, 'Log out')),
      ),
    ),
    h('div', { class: 'main' },
      h('header', { class: 'top' },
        h('div', { class: 'top-title' }, h('h1', {}, title), h('p', {}, subtitle)),
        status,
        h('button', { class: 'btn primary', type: 'button', onclick: (e) => publish(e.currentTarget) }, 'Publish changes'),
      ),
      h('main', { class: 'panel' }, render()),
    ),
  ));
}

async function loadAll() {
  const d = await api('load', {});
  state.business = d.business;
  state.repairs = d.repairs;
  state.shop = d.shop?.categories ? d.shop : { categories: [], products: [] };
  state.smtp = d.smtp;
  state.backups = d.backups;
  state.username = d.username ?? '';
  state.business.integrations ??= {};
  show();
}

addEventListener('beforeunload', (e) => { if (state.dirty) e.preventDefault(); });

(async () => {
  try {
    const s = await api('state');
    state.csrf = s.csrf;
    if (s.loggedIn) await loadAll();
    else showAuth(s.setupNeeded);
  } catch (e) {
    root.replaceChildren(h('div', { class: 'auth-page' }, h('div', { class: 'auth' }, h('h1', {}, 'Website admin'), h('p', { class: 'msg err' }, e.message))));
  }
})();
