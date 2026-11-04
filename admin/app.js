// Admin panel. Edits the site data, renders every page in the browser with the same
// code as the local build (render.mjs), and sends the result to api.php to publish.
import { renderSite } from './render.mjs';

const BRANDS = {
  'iphone-reparation': 'iPhone', 'samsung-reparation': 'Samsung', 'huawei-reparation': 'Huawei', 'oneplus-reparation': 'OnePlus',
  'sony-reparation': 'Sony', 'google-pixel-reparation': 'Google Pixel', 'xiaomi-reparation': 'Xiaomi', 'oppo-reparation': 'OPPO',
  'ipad-reparation': 'iPad', 'mac-reparation': 'Mac', 'pc-reparation': 'PC', watch: 'Apple Watch',
};
const SOCIALS = ['Facebook', 'Instagram', 'TikTok'];
const root = document.getElementById('app');
const state = { csrf: '', business: null, repairs: null, shop: null, smtp: null, backups: [], tab: 'notices', dirty: false, brand: 'iphone-reparation', modelSearch: '', openModel: null };

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
  if (s) { s.textContent = 'Unpublished changes'; s.classList.add('dirty'); }
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

function toggle(label, obj, key) {
  return h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!obj[key], onchange: (e) => { obj[key] = e.target.checked; touch(); } }), label);
}

const card = (title, ...children) => h('section', { class: 'card' }, h('h2', {}, title), ...children);

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
  return h('div', { class: 'thumb' }, img, h('label', {}, 'Change image', h('small', {}, 'JPG, PNG or WebP, up to 5 MB'), input));
}

// ---- Login ----
function showAuth(setup) {
  const pw = h('input', { type: 'password', autocomplete: setup ? 'new-password' : 'current-password', required: true });
  const code = h('input', { type: 'text', autocomplete: 'off', required: true });
  const msg = h('p', { class: 'msg err', hidden: true });
  root.replaceChildren(h('form', {
    class: 'auth',
    onsubmit: async (e) => {
      e.preventDefault();
      msg.hidden = true;
      try {
        const res = setup ? await api('setup', { code: code.value, password: pw.value }) : await api('login', { password: pw.value });
        state.csrf = res.csrf;
        await loadAll();
      } catch (err) {
        msg.textContent = err.message;
        msg.hidden = false;
      }
    },
  },
  h('h1', {}, setup ? 'Create your admin password' : 'Website admin'),
  setup && h('p', { class: 'muted' }, 'First time here. Enter the setup code from the file admin-setup-code.txt in your project folder, and choose a password.'),
  setup && h('label', {}, 'Setup code', code),
  h('label', {}, setup ? 'New password (at least 10 characters)' : 'Password', pw),
  h('button', { class: 'btn primary', type: 'submit' }, setup ? 'Create password' : 'Log in'),
  msg));
}

// ---- Tabs ----
const TABS = {
  notices: ['Notices & offer', tabNotices],
  shops: ['Shops & hours', tabShops],
  repairs: ['Repairs & prices', tabRepairs],
  shop: ['Shop & categories', tabShop],
  reviews: ['Reviews', tabReviews],
  connections: ['Email & Google', tabConnections],
  account: ['Backups & password', tabAccount],
};

function tabNotices() {
  const { announcement: a, campaign: c, business } = { ...state.business, business: state.business };
  return [
    card('Announcement bar', h('p', { class: 'muted' }, 'The scrolling blue bar at the top of every page. Both shop phone numbers are added to it automatically.'),
      toggle('Show the announcement bar', a, 'enabled'),
      field('Message', a, 'text'),
    ),
    card('Special offer on the home page', h('p', { class: 'muted' }, 'When on, the home page shows the offer heading, sticker and scrolling strip. Turn it off when the sale ends.'),
      toggle('Show the offer', c, 'enabled'),
      h('div', { class: 'grid2' }, field('Offer name', c, 'name'), field('Discount (%)', c, 'percent', { type: 'number' })),
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
    card('Email addresses and video',
      h('div', { class: 'grid2' }, b.emails.map((_, i) => field(i ? 'Second email' : 'Main email', b.emails, i, { type: 'email' }))),
      field('YouTube link', b, 'youtube', { type: 'url' }),
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
    card('Change password',
      h('label', {}, 'Current password', current),
      h('label', {}, 'New password (at least 10 characters)', next),
      h('button', { class: 'btn', type: 'button', onclick: async () => {
        try { await api('password', { current: current.value, new: next.value }); current.value = ''; next.value = ''; toast('Password changed.'); } catch (e) { toast(e.message, false); }
      } }, 'Change password'),
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
    const s = document.querySelector('.state');
    s.textContent = 'All changes are live';
    s.classList.remove('dirty');
    toast('Published! Your changes are live.');
  } catch (e) {
    toast(`Not published: ${e.message}`, false);
  }
  btn.disabled = false;
  btn.textContent = 'Publish changes';
}

function show() {
  const tabs = Object.entries(TABS).map(([key, [label]]) => h('button', { type: 'button', class: state.tab === key ? 'on' : null, onclick: () => { state.tab = key; show(); } }, label));
  root.replaceChildren(
    h('header', { class: 'top' },
      h('h1', {}, 'Website admin'),
      h('a', { href: '../', target: '_blank', rel: 'noopener' }, 'View site'),
      h('span', { class: 'spacer' }),
      h('span', { class: `state${state.dirty ? ' dirty' : ''}` }, state.dirty ? 'Unpublished changes' : 'All changes are live'),
      h('button', { class: 'btn primary', type: 'button', onclick: (e) => publish(e.target) }, 'Publish changes'),
      h('button', { class: 'btn', type: 'button', onclick: async () => {
        if (state.dirty && !confirm('You have unpublished changes. Log out anyway?')) return;
        await api('logout', {}).catch(() => {});
        state.dirty = false;
        location.reload();
      } }, 'Log out'),
    ),
    h('div', { class: 'layout' }, h('nav', { class: 'tabs', 'aria-label': 'Sections' }, tabs), h('main', { class: 'panel' }, TABS[state.tab][1]())),
  );
}

async function loadAll() {
  const d = await api('load', {});
  state.business = d.business;
  state.repairs = d.repairs;
  state.shop = d.shop?.categories ? d.shop : { categories: [], products: [] };
  state.smtp = d.smtp;
  state.backups = d.backups;
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
    root.replaceChildren(h('div', { class: 'auth' }, h('h1', {}, 'Website admin'), h('p', { class: 'msg err' }, e.message)));
  }
})();
