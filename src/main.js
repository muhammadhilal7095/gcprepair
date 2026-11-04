// Close the desktop repair menu on an outside click
const mega = document.querySelector('.mega');
document.addEventListener('click', (e) => {
  if (mega.open && !mega.contains(e.target)) mega.open = false;
});

// Filter the model list on brand pages
const filter = document.querySelector('[data-filter]');
if (filter) {
  const cards = [...document.querySelectorAll('.device')];
  const groups = [...document.querySelectorAll('[data-series]')];
  const links = [...document.querySelectorAll('[data-series-nav] a')];
  const empty = document.querySelector('[data-filter-empty]');
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    let shown = 0;
    for (const c of cards) {
      const hit = c.dataset.name.includes(q);
      c.hidden = !hit;
      if (hit) shown++;
    }
    groups.forEach((g, i) => {
      const hasHits = [...g.querySelectorAll('.device')].some((c) => !c.hidden);
      g.hidden = !hasHits;
      links[i].hidden = !hasHits;
    });
    empty.hidden = shown > 0;
  });
}

// Highlight the series in view and keep its button visible in the bar
const seriesNav = document.querySelector('[data-series-nav]');
if (seriesNav) {
  const links = new Map([...seriesNav.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const link = links.get(e.target.id);
      link.setAttribute('aria-current', 'true');
      seriesNav.scrollTo({ left: link.offsetLeft - seriesNav.clientWidth / 2 + link.offsetWidth / 2, behavior: 'smooth' });
    }
  }, { rootMargin: '-170px 0px -65% 0px' });
  document.querySelectorAll('[data-series]').forEach((s) => spy.observe(s));
}

// Keep an opened model in view, since it moves to its own row
document.querySelectorAll('.devices .device').forEach((d) => {
  d.addEventListener('toggle', () => {
    if (d.open) d.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
});

// Open the model linked from search results
const openFromHash = () => {
  if (!location.hash) return;
  const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (el && el.tagName === 'DETAILS') {
    el.open = true;
    el.scrollIntoView({ block: 'center' });
  }
};
addEventListener('hashchange', openFromHash);
openFromHash();

// Site-wide model search
const search = document.querySelector('[data-search]');
if (search && window.GCP_DEVICES) {
  const list = document.querySelector('[data-search-results]');
  const render = () => {
    const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    list.replaceChildren();
    if (!words.length) { list.hidden = true; return; }
    const hits = window.GCP_DEVICES
      .filter(([name]) => words.every((w) => name.toLowerCase().includes(w)))
      .slice(0, 8);
    for (const [name, href] of hits) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = search.dataset.root + href;
      a.textContent = name;
      li.append(a);
      list.append(li);
    }
    if (!hits.length) {
      const li = document.createElement('li');
      li.className = 'none';
      li.textContent = 'Ingen model fundet. Ring til os, så hjælper vi.';
      list.append(li);
    }
    list.hidden = false;
  };
  search.addEventListener('input', render);
  search.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const first = list.querySelector('a');
    if (first) location.href = first.href;
  });
}

// Mark today's opening hours (Danish time)
const today = new Intl.DateTimeFormat('da-DK', { weekday: 'long', timeZone: 'Europe/Copenhagen' }).format(new Date());
document.querySelectorAll('[data-days]').forEach((row) => {
  if (!row.dataset.days.toLowerCase().split(',').includes(today.toLowerCase())) return;
  row.classList.add('today');
  const pill = row.closest('.shop')?.querySelector('[data-today]');
  if (!pill) return;
  const hours = row.cells[1].textContent;
  pill.lastChild.textContent = hours === 'Lukket' ? 'Lukket i dag' : `I dag: ${hours}`;
  pill.hidden = false;
});

// Reveal sections as they scroll into view
const reveal = document.querySelectorAll('[data-reveal]');
if (reveal.length) {
  document.documentElement.classList.add('js');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { rootMargin: '0px 0px -40px 0px' });
  reveal.forEach((el) => io.observe(el));
}

// Contact form: sends through the server, or opens the visitor's mail app if it can't
const form = document.querySelector('[data-mail-form]');
if (form) {
  const status = form.querySelector('[data-form-status]');
  const button = form.querySelector('button[type="submit"]');
  // Filled in when arriving from "Spørg om varen" in the shop
  const topic = new URLSearchParams(location.search).get('emne');
  if (topic) form.elements.subject.value = topic;
  const openMailApp = (d) => {
    const body = `${d.get('message')}\n\nNavn: ${d.get('name')}\nE-mail: ${d.get('email')}\nButik: ${d.get('shop')}`;
    status.textContent = 'Beskeden åbnes i din mail-app, klar til at blive sendt.';
    location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(d.get('subject'))}&body=${encodeURIComponent(body)}`;
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    button.disabled = true;
    status.textContent = 'Sender…';
    try {
      const res = await fetch(form.dataset.endpoint, { method: 'POST', body: d });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      status.textContent = 'Tak! Din besked er sendt. Vi vender tilbage hurtigst muligt.';
    } catch {
      openMailApp(d);
    } finally {
      button.disabled = false;
    }
  });
}

// Analytics only load after the visitor accepts cookies
const tracking = window.GCP_TRACKING;
if (tracking) {
  const KEY = 'gcp-cookies';
  const addScript = (src) => {
    const s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.append(s);
  };
  const startTracking = () => {
    if (tracking.ga4) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', tracking.ga4);
      addScript(`https://www.googletagmanager.com/gtag/js?id=${tracking.ga4}`);
    }
    if (tracking.pixel) {
      const fbq = function fbq() { fbq.queue.push(arguments); };
      fbq.queue = [];
      fbq.version = '2.0';
      window.fbq = fbq;
      window._fbq = fbq;
      fbq('init', tracking.pixel);
      fbq('track', 'PageView');
      addScript('https://connect.facebook.net/en_US/fbevents.js');
    }
  };
  const showBanner = () => {
    if (document.querySelector('.cookie-banner')) return;
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookies');
    banner.innerHTML = '<p>Vi vil gerne bruge cookies til statistik og markedsføring, så vi kan forbedre siden. Du bestemmer selv.</p><div class="btns"><button class="btn primary" type="button" data-choice="yes">Acceptér</button><button class="btn outline" type="button" data-choice="no">Afvis</button></div>';
    banner.addEventListener('click', (e) => {
      const choice = e.target.dataset?.choice;
      if (!choice) return;
      const before = localStorage.getItem(KEY);
      localStorage.setItem(KEY, choice);
      banner.remove();
      if (choice === 'yes' && before !== 'yes') startTracking();
      // Scripts already running can only be stopped by reloading
      if (choice === 'no' && before === 'yes') location.reload();
    });
    document.body.append(banner);
  };
  const saved = localStorage.getItem(KEY);
  if (saved === 'yes') startTracking();
  else if (saved !== 'no') showBanner();
  document.querySelector('[data-cookie-settings]')?.addEventListener('click', showBanner);
}
