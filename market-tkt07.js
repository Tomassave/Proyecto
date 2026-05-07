/* Sabana Market — frontend integrado API (TKT-01 … TKT-07) */
'use strict';

let API_BASE = '';
function apiUrl(path) {
  const x = path.startsWith('/') ? path : '/' + path;
  return API_BASE ? API_BASE.replace(/\/$/, '') + x : x;
}

function readMetaApiBase() {
  const el = document.querySelector('meta[name="sm-api-base"]');
  if (!el) return '';
  return (el.getAttribute('content') || '').trim().replace(/\/$/, '');
}

async function probeSabanaBackend() {
  for (let port = 3000; port <= 3015; port++) {
    for (const host of ['127.0.0.1', 'localhost']) {
      const base = 'http://' + host + ':' + port;
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(function () {
          ctrl.abort();
        }, 400);
        const r = await fetch(base + '/health', { method: 'GET', cache: 'no-store', signal: ctrl.signal });
        clearTimeout(tid);
        if (!r.ok) continue;
        const j = await r.json().catch(function () {
          return {};
        });
        if (j.ok === true) return base;
      } catch (_) {}
    }
  }
  return '';
}

let _apiDiscover = null;
async function resolveApiBase() {
  if (typeof window.SM_API_BASE === 'string' && window.SM_API_BASE.trim()) {
    API_BASE = window.SM_API_BASE.trim().replace(/\/$/, '');
    return;
  }
  const meta = readMetaApiBase();
  if (meta) {
    API_BASE = meta;
    return;
  }
  const h = location.hostname;
  const p = String(location.port || '');
  const staticPorts = new Set(['5500', '5501', '5502', '5173', '4173', '8080']);
  if (
    location.protocol === 'file:' ||
    ((h === 'localhost' || h === '127.0.0.1') && p && staticPorts.has(p))
  ) {
    API_BASE = await probeSabanaBackend();
    if (!API_BASE) API_BASE = 'http://localhost:3000';
    return;
  }
  API_BASE = '';
}

function ensureApiDiscovered() {
  if (!_apiDiscover) _apiDiscover = resolveApiBase();
  return _apiDiscover;
}

const SEED_PRODUCTS = [
  {
    id: 'p1',
    title: 'Cálculo Multivariable — Stewart 8ª ed.',
    desc: 'Buen estado.',
    price: 35000,
    state: 'usado',
    category: 'Libros',
    emoji: '📚',
    sellerId: 'seed',
    sellerName: 'Juan S.',
    sellerAv: 'JS',
    sellerColor: '#0D2167',
    stars: '★★★★★',
    ci: 'ci-blue',
  },
  {
    id: 'p2',
    title: 'Mouse inalámbrico Logitech M185',
    desc: 'Nuevo en caja.',
    price: 58000,
    state: 'nuevo',
    category: 'Tecnología',
    emoji: '💻',
    sellerId: 'seed',
    sellerName: 'María R.',
    sellerAv: 'MR',
    sellerColor: '#0F7A4A',
    stars: '★★★★☆',
    ci: 'ci-green',
  },
  {
    id: 'p3',
    title: 'Sony WH-1000XM4 sellado',
    desc: 'Sellado original.',
    price: 280000,
    state: 'nuevo',
    category: 'Tecnología',
    emoji: '🎧',
    sellerId: 'seed',
    sellerName: 'Carlos P.',
    sellerAv: 'CP',
    sellerColor: '#783CB4',
    stars: '★★★★★',
    ci: 'ci-purple',
    oldPrice: 320000,
  },
  {
    id: 'p4',
    title: 'Sudadera oficial Unisabana talla M',
    desc: 'Poco uso.',
    price: 45000,
    state: 'usado',
    category: 'Ropa',
    emoji: '👕',
    sellerId: 'seed',
    sellerName: 'Laura G.',
    sellerAv: 'LG',
    sellerColor: '#C9A84C',
    stars: '★★★★★',
    ci: 'ci-gold',
  },
  {
    id: 'p5',
    title: 'Kit dibujo técnico Staedtler',
    desc: 'Completo.',
    price: 22000,
    state: 'usado',
    category: 'Papelería',
    emoji: '📐',
    sellerId: 'seed',
    sellerName: 'Andrés F.',
    sellerAv: 'AF',
    sellerColor: '#1A4DB3',
    stars: '★★★★☆',
    ci: 'ci-blue',
    oldPrice: 38000,
  },
  {
    id: 'p6',
    title: 'Anatomía de Gray 41ª edición',
    desc: 'Buen estado.',
    price: 80000,
    state: 'usado',
    category: 'Libros',
    emoji: '📗',
    sellerId: 'seed',
    sellerName: 'Sofía R.',
    sellerAv: 'SR',
    sellerColor: '#1A4DB3',
    stars: '★★★★★',
    ci: 'ci-green',
    oldPrice: 120000,
  },
  {
    id: 'p7',
    title: 'Lámpara LED escritorio USB-C',
    desc: 'Regulable, nueva.',
    price: 35000,
    state: 'nuevo',
    category: 'Hogar',
    emoji: '💡',
    sellerId: 'seed',
    sellerName: 'Diana M.',
    sellerAv: 'DM',
    sellerColor: '#C9A84C',
    stars: '★★★★☆',
    ci: 'ci-gold',
  },
  {
    id: 'p8',
    title: 'Morral Totto 25L azul navy',
    desc: 'Poco uso.',
    price: 75000,
    state: 'usado',
    category: 'Ropa',
    emoji: '🎒',
    sellerId: 'seed',
    sellerName: 'Pedro V.',
    sellerAv: 'PV',
    sellerColor: '#C0392B',
    stars: '★★★★☆',
    ci: 'ci-rose',
    oldPrice: 95000,
  },
];

const EMOJI_MAP = {
  Libros: '📚',
  Tecnología: '💻',
  Ropa: '👕',
  Papelería: '✏️',
  Entretenimiento: '🎮',
  Alimentos: '🍱',
  Deportes: '🚴',
  Hogar: '🏠',
  Otros: '✨',
};
const CI_MAP = {
  Libros: 'ci-blue',
  Tecnología: 'ci-green',
  Ropa: 'ci-gold',
  Papelería: 'ci-blue',
  Entretenimiento: 'ci-purple',
  Alimentos: 'ci-teal',
  Deportes: 'ci-green',
  Hogar: 'ci-gold',
  Otros: 'ci-teal',
};

const PALETTE = ['#0D2167', '#1A4DB3', '#0F7A4A', '#C9A84C', '#783CB4', '#C0392B'];

let apiProducts = [];
let useSeedFallback = true;

/** TKT-09 / TKT-10: estado de listado y filtros (servidor) */
const catalogState = {
  page: 1,
  limit: 20,
  total: 0,
  search: '',
  category: '',
  state: '',
  minPrice: null,
  maxPrice: null,
};

let lastCartSnapshot = null;

function parsePriceInput(v) {
  const t = String(v || '')
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function buildProductsQueryString() {
  const params = new URLSearchParams();
  params.set('page', String(catalogState.page));
  params.set('limit', String(catalogState.limit));
  if (catalogState.search) params.set('search', catalogState.search);
  if (catalogState.category) params.set('category', catalogState.category);
  if (catalogState.state) params.set('state', catalogState.state);
  if (catalogState.minPrice != null) params.set('minPrice', String(catalogState.minPrice));
  if (catalogState.maxPrice != null) params.set('maxPrice', String(catalogState.maxPrice));
  return params.toString();
}

function getFilteredSeedList() {
  let list = SEED_PRODUCTS.slice();
  if (catalogState.category) {
    list = list.filter(function (p) {
      return p.category === catalogState.category;
    });
  }
  if (catalogState.state) {
    list = list.filter(function (p) {
      return p.state === catalogState.state;
    });
  }
  if (catalogState.minPrice != null) {
    list = list.filter(function (p) {
      return p.price >= catalogState.minPrice;
    });
  }
  if (catalogState.maxPrice != null) {
    list = list.filter(function (p) {
      return p.price <= catalogState.maxPrice;
    });
  }
  if (catalogState.search) {
    const q = catalogState.search.toLowerCase();
    list = list.filter(function (p) {
      return (
        p.title.toLowerCase().includes(q) || String(p.category).toLowerCase().includes(q)
      );
    });
  }
  return list;
}

function cartStorageKey() {
  const s = getSession();
  return s ? 'sm_last_cart_' + s.id : null;
}

function loadCartSnapshotFromStorage() {
  const k = cartStorageKey();
  if (!k) return null;
  try {
    return JSON.parse(sessionStorage.getItem(k) || 'null');
  } catch (_) {
    return null;
  }
}

function saveCartSnapshot(data) {
  lastCartSnapshot = data;
  const k = cartStorageKey();
  if (!k || data == null) return;
  try {
    sessionStorage.setItem(k, JSON.stringify(data));
  } catch (_) {}
}

function updateCartBadge(data) {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const d = data || loadCartSnapshotFromStorage();
  if (!d || !d.items || !d.items.length) {
    badge.textContent = '';
    badge.classList.remove('show');
    return;
  }
  const n = d.items.reduce(function (a, b) {
    return a + Number(b.quantity);
  }, 0);
  badge.textContent = n > 99 ? '99+' : String(n);
  badge.classList.toggle('show', n > 0);
}

function productTitleById(id) {
  const pool = useSeedFallback ? SEED_PRODUCTS : apiProducts;
  const p = pool.find(function (x) {
    return String(x.id) === String(id);
  });
  return p ? p.title : 'Producto';
}

function cartLineTitle(it) {
  if (it && it.title) return it.title;
  return productTitleById(it.productId);
}

function openCartOrLogin() {
  if (!getSession()) {
    openModal('login');
    return;
  }
  openCartOverlay();
}

function paintCartOverlay() {
  const d = loadCartSnapshotFromStorage();
  const empty = document.getElementById('cartOverlayEmpty');
  const body = document.getElementById('cartOverlayBody');
  const totalEl = document.getElementById('cartOverlayTotal');
  const checkoutBtn = document.getElementById('btnCartCheckout');
  const checkoutMsg = document.getElementById('cartCheckoutMsg');
  if (!empty || !body || !totalEl) return;
  if (checkoutMsg) {
    checkoutMsg.style.display = 'none';
    checkoutMsg.textContent = '';
  }

  const demo = useSeedFallback;
  const hasItems = d && d.items && d.items.length;

  if (!hasItems) {
    empty.style.display = 'block';
    body.style.display = 'none';
    totalEl.style.display = 'none';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  body.style.display = 'block';
  totalEl.style.display = 'block';
  if (checkoutBtn) checkoutBtn.style.display = demo ? 'none' : 'block';

  const anyUnavailable = d.items.some(function (it) {
    return it.available === false;
  });

  body.innerHTML = d.items
    .map(function (it) {
      const pid = it.productId;
      const title = escapeHtml(cartLineTitle(it));
      const line = Number(it.price) * Number(it.quantity);
      const bad = it.available === false;
      const idEsc = escapeJsStr(pid);
      return (
        '<div class="cart-edit-row' +
        (bad ? ' cart-edit-row-warn' : '') +
        '">' +
        '<div class="cart-edit-info">' +
        '<strong>' +
        title +
        '</strong>' +
        '<div class="cart-edit-meta">' +
        fmt(it.price) +
        ' c/u' +
        (bad ? ' · <span class="cart-bad">No disponible — quítalo para comprar</span>' : '') +
        '</div></div>' +
        '<div class="cart-edit-ctrl">' +
        '<input type="number" class="cart-qty-input" min="1" value="' +
        Number(it.quantity) +
        '" id="cart-qty-' +
        escapeHtml(pid) +
        '"' +
        (demo ? ' disabled' : '') +
        '/>' +
        '<button type="button" class="cart-btn-update" onclick="updateCartLineQty(\'' +
        idEsc +
        '\')" ' +
        (demo ? 'disabled' : '') +
        '>Actualizar</button>' +
        '<button type="button" class="cart-btn-remove" onclick="removeCartLine(\'' +
        idEsc +
        '\')" ' +
        (demo ? 'disabled' : '') +
        '>Quitar</button>' +
        '</div>' +
        '<div class="cart-edit-sub">' +
        'Subtotal: ' +
        fmt(line) +
        '</div></div>'
      );
    })
    .join('');

  totalEl.textContent = 'Total: ' + fmt(d.total);
  if (checkoutBtn) {
    checkoutBtn.disabled = demo || anyUnavailable;
    if (demo) checkoutBtn.title = 'Conecta el API para comprar';
    else if (anyUnavailable) checkoutBtn.title = 'Retira productos no disponibles';
    else checkoutBtn.title = '';
  }
}

async function refreshCartFromApi() {
  if (!getSession()) return;
  const res = await apiFetch('GET', '/cart');
  if (res.ok) {
    saveCartSnapshot(res.data);
    updateCartBadge(res.data);
  }
}

async function openCartOverlay() {
  if (!getSession()) {
    openModal('login');
    return;
  }
  if (!useSeedFallback) await refreshCartFromApi();
  paintCartOverlay();
  const o = document.getElementById('cartOverlay');
  if (o) o.classList.add('show');
}

async function updateCartLineQty(productId) {
  if (!getSession() || useSeedFallback) return;
  const inp = document.getElementById('cart-qty-' + productId);
  const qty = inp ? parseInt(inp.value, 10) : 0;
  if (!qty || qty < 1) {
    showToast('Cantidad inválida', 'error');
    return;
  }
  const res = await apiFetch('PUT', '/cart/items/' + encodeURIComponent(productId), {
    quantity: qty,
  });
  if (!res.ok) {
    showToast(apiErrMessage(res.data, 'No se pudo actualizar.'), 'error');
    return;
  }
  saveCartSnapshot(res.data);
  updateCartBadge(res.data);
  paintCartOverlay();
  showToast('Carrito actualizado', 'success');
}

async function removeCartLine(productId) {
  if (!getSession()) return;
  if (useSeedFallback) {
    showToast('Modo demo: no hay carrito en el servidor.', 'error');
    return;
  }
  const res = await apiFetch('DELETE', '/cart/items/' + encodeURIComponent(productId));
  if (!res.ok) {
    showToast(apiErrMessage(res.data, 'No se pudo quitar.'), 'error');
    return;
  }
  saveCartSnapshot(res.data);
  updateCartBadge(res.data);
  paintCartOverlay();
  showToast('Producto quitado del carrito', 'success');
}

async function checkoutCart() {
  if (!getSession() || useSeedFallback) {
    showToast('Conecta el API para confirmar la compra.', 'error');
    return;
  }
  const d = loadCartSnapshotFromStorage();
  if (!d || !d.items || !d.items.length) {
    showToast('El carrito está vacío.', 'error');
    return;
  }
  if (d.items.some(function (it) { return it.available === false; })) {
    showToast('Hay productos no disponibles en el carrito.', 'error');
    return;
  }
  const res = await apiFetch('POST', '/orders', {});
  if (!res.ok) {
    showToast(apiErrMessage(res.data, 'No se pudo crear la orden.'), 'error');
    return;
  }
  saveCartSnapshot({ cartId: d.cartId, items: [], total: 0 });
  updateCartBadge({ items: [], total: 0 });
  await refreshCartFromApi();
  paintCartOverlay();
  closeModal('cartOverlay');
  showToast(
    'Compra registrada · Orden ' + String(res.data.orderId).slice(0, 8) + '… (pendiente)',
    'success'
  );
}

function readFiltersFromSidebar() {
  const catRadio = document.querySelector('input[name="filterCat"]:checked');
  catalogState.category = catRadio ? catRadio.value : '';
  const stRadio = document.querySelector('input[name="filterState"]:checked');
  catalogState.state = stRadio ? stRadio.value : '';
  const minEl = document.getElementById('filterPriceMin');
  const maxEl = document.getElementById('filterPriceMax');
  catalogState.minPrice =
    minEl && String(minEl.value).trim() ? parsePriceInput(minEl.value) : null;
  catalogState.maxPrice =
    maxEl && String(maxEl.value).trim() ? parsePriceInput(maxEl.value) : null;
}

function syncCatBarHighlight() {
  document.querySelectorAll('.catbar .cat').forEach(function (c) {
    const v = c.getAttribute('data-cat') || '';
    c.classList.toggle('on', v === (catalogState.category || ''));
  });
}

function syncSidebarRadiosFromState() {
  const cat = catalogState.category || '';
  const st = catalogState.state || '';
  document.querySelectorAll('input[name="filterCat"]').forEach(function (inp) {
    inp.checked = (inp.value || '') === cat;
  });
  document.querySelectorAll('input[name="filterState"]').forEach(function (inp) {
    inp.checked = (inp.value || '') === st;
  });
}

function applySortToList(prods) {
  const sel = document.getElementById('tbSort');
  const mode = sel ? sel.value : 'recent';
  const copy = prods.slice();
  if (mode === 'priceAsc')
    copy.sort(function (a, b) {
      return a.price - b.price;
    });
  else if (mode === 'priceDesc')
    copy.sort(function (a, b) {
      return b.price - a.price;
    });
  return copy;
}

function updateCatalogToolbar() {
  const info = document.getElementById('catalogPageInfo');
  const prev = document.getElementById('btnCatalogPrev');
  const next = document.getElementById('btnCatalogNext');
  if (!info || !prev || !next) return;
  if (useSeedFallback) {
    info.textContent = catalogState.total
      ? catalogState.total + ' resultado(s) · modo demo (filtro local)'
      : '';
    prev.disabled = true;
    next.disabled = true;
    return;
  }
  const total = catalogState.total;
  const page = catalogState.page;
  const limit = catalogState.limit;
  const pages = Math.max(1, Math.ceil(total / limit));
  info.textContent = total
    ? 'Pág. ' + page + ' de ' + pages + ' · ' + total + ' en catálogo'
    : 'Sin resultados';
  prev.disabled = page <= 1;
  next.disabled = page >= pages || total === 0;
}

function sellerShortLabel(fullName) {
  const parts = String(fullName || 'Vendedor')
    .trim()
    .split(/\s+/);
  if (!parts.length) return 'Vendedor';
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return parts[0] + ' ' + last.charAt(0) + '.';
}

function initialsFromName(fullName) {
  const parts = String(fullName || '?')
    .trim()
    .split(/\s+/);
  const a = parts[0] ? parts[0][0] : '';
  const b = parts[1] ? parts[1][0] : '';
  return (a + b).toUpperCase() || '?';
}

function colorFromSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h += str.charCodeAt(i);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function mapApiProduct(row) {
  const sellerNameFull = row.seller_name || 'Vendedor';
  const sid = row.seller_id || '';
  return {
    id: row.id,
    title: row.title,
    desc: row.description,
    price: Number(row.price),
    state: row.state,
    category: row.category,
    emoji: EMOJI_MAP[row.category] || '📦',
    ci: CI_MAP[row.category] || 'ci-blue',
    sellerId: sid,
    sellerName: sellerShortLabel(sellerNameFull),
    sellerAv: initialsFromName(sellerNameFull),
    sellerColor: colorFromSeed(String(sid)),
    stars: '★★★★☆',
    imageUrls: row.image_urls,
  };
}

function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem('sm_session') || 'null');
    if (!s || !s.token) {
      localStorage.removeItem('sm_session');
      return null;
    }
    return s;
  } catch (e) {
    return null;
  }
}

function saveSession(s) {
  try {
    localStorage.setItem('sm_session', JSON.stringify(s));
  } catch (_) {}
}

function clearSession() {
  try {
    localStorage.removeItem('sm_session');
  } catch (_) {}
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('es-CO');
}

function displayProducts() {
  return useSeedFallback ? SEED_PRODUCTS.slice() : apiProducts.slice();
}

function allProducts() {
  return displayProducts();
}

async function apiFetch(method, path, body) {
  await ensureApiDiscovered();
  const headers = { 'Content-Type': 'application/json' };
  const s = getSession();
  if (s && s.token) headers.Authorization = 'Bearer ' + s.token;
  const opts = { method, headers };
  if (body !== undefined && body !== null) opts.body = JSON.stringify(body);
  const r = await fetch(apiUrl(path), opts);
  const text = await r.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = { error: text || 'Respuesta inválida' };
  }
  return { ok: r.ok, status: r.status, data };
}

function apiErrMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data.error === 'string') return data.error;
  if (Array.isArray(data.errors) && data.errors[0] && data.errors[0].message) return data.errors[0].message;
  return fallback;
}

async function loadCatalog() {
  await ensureApiDiscovered();
  try {
    const r = await fetch(apiUrl('/products?' + buildProductsQueryString()), {
      method: 'GET',
      cache: 'no-store',
    });
    if (!r.ok) throw new Error('fail');
    const data = await r.json();
    apiProducts = (data.products || []).map(mapApiProduct);
    useSeedFallback = false;
    catalogState.total =
      typeof data.total === 'number' ? data.total : apiProducts.length;
    if (typeof data.page === 'number') catalogState.page = data.page;
    if (typeof data.limit === 'number') catalogState.limit = data.limit;
  } catch (_) {
    apiProducts = [];
    useSeedFallback = true;
    const local = getFilteredSeedList();
    catalogState.total = local.length;
    showToast('Modo demo: sin conexión al API se muestran productos de ejemplo.', 'error');
    const sorted = applySortToList(local);
    renderGrid(sorted);
    updateCatalogToolbar();
    return;
  }
  const sorted = applySortToList(displayProducts());
  renderGrid(sorted);
  updateCatalogToolbar();
}

function renderNavRight() {
  const session = getSession();
  const el = document.getElementById('navRight');
  if (!session) {
    el.innerHTML =
      '<div class="nav-icon" onclick="openCartOrLogin()" title="Carrito">🛒<span class="nav-badge" id="cartBadge"></span></div>' +
      '<div class="nvline"></div>' +
      '<button class="btn-pub" onclick="openModal(\'register\')">+ Publicar</button>' +
      '<button class="btn-in" onclick="openModal(\'login\')">Ingresar</button>';
    document.getElementById('myProductsBar').style.display = 'none';
    updateCartBadge(null);
    return;
  }
  const initials = session.name
    .split(' ')
    .map(function (w) {
      return w[0];
    })
    .join('')
    .slice(0, 2)
    .toUpperCase();
  el.innerHTML =
    '<div class="nav-icon" onclick="openCartOrLogin()" title="Mi carrito">🛒<span class="nav-badge" id="cartBadge"></span></div>' +
    '<div class="nvline"></div>' +
    '<div class="nav-user" onclick="openProfile()" title="Mi perfil"><div class="nav-avatar">' +
    initials +
    '</div><span class="nav-uname">' +
    escapeHtml(session.name) +
    '</span></div>' +
    '<div class="nvline"></div>' +
    '<button class="btn-pub" onclick="openProductModal()">+ Publicar</button>' +
    '<button class="btn-logout" onclick="doLogout()">Salir</button>';
  document.getElementById('myProductsBar').style.display = 'block';
  updateCartBadge(loadCartSnapshotFromStorage());
  renderMyProducts();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsStr(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function renderGrid(prods) {
  if (!prods) prods = displayProducts();
  const grid = document.getElementById('prodGrid');
  const session = getSession();
  grid.innerHTML = prods
    .map(function (p) {
      const owned = session && String(p.sellerId) === String(session.id);
      const disc =
        p.oldPrice && p.oldPrice > p.price
          ? '<span class="pold">' +
            fmt(p.oldPrice) +
            '</span><span class="pdisc">−' +
            Math.round((1 - p.price / p.oldPrice) * 100) +
            '%</span>'
          : '';
      return (
        '<div class="pcard" onclick="openProductDetail(\'' +
        escapeJsStr(p.id) +
        '\')">' +
        '<div class="pimg ' +
        (p.ci || 'ci-blue') +
        '">' +
        '<span>' +
        (p.emoji || '📦') +
        '</span>' +
        '<span class="ptag ' +
        (p.state === 'nuevo' ? 't-new' : 't-used') +
        '">' +
        escapeHtml(p.state) +
        '</span>' +
        '<span class="pfav' +
        (owned ? ' liked' : '') +
        '" onclick="event.stopPropagation()">' +
        (owned ? '♥' : '♡') +
        '</span>' +
        '</div>' +
        '<div class="pbody">' +
        '<div class="pcat">' +
        escapeHtml(p.category) +
        '</div>' +
        '<div class="ptitle">' +
        escapeHtml(p.title) +
        '</div>' +
        '<div class="ppricerow">' +
        '<span class="pprice">' +
        fmt(p.price) +
        '</span>' +
        disc +
        '</div>' +
        '<div class="pmeta">' +
        '<div class="pseller"><div class="pav" style="background:' +
        (p.sellerColor || '#0D2167') +
        '">' +
        escapeHtml(p.sellerAv || '?') +
        '</div>' +
        escapeHtml(p.sellerName || 'Vendedor') +
        '</div>' +
        '<div class="pstars">' +
        (p.stars || '★★★★☆') +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
      );
    })
    .join('');
  const n = prods.length;
  document.getElementById('prodCount').textContent = n + ' producto' + (n !== 1 ? 's' : '');
  const cntEl = document.getElementById('cntAll');
  if (cntEl)
    cntEl.textContent = String(
      useSeedFallback ? Math.max(n, catalogState.total) : catalogState.total || n
    );
  document.getElementById('statProds').textContent = String(
    catalogState.total != null && catalogState.total > 0
      ? catalogState.total
      : displayProducts().length
  );
  renderHeroList(prods);
}

function renderHeroList(prods) {
  const list = (prods || displayProducts()).slice(0, 4);
  document.getElementById('heroList').innerHTML = list
    .map(function (p) {
      return (
        '<div class="hp-item" onclick="openProductDetail(\'' +
        escapeJsStr(p.id) +
        '\')">' +
        '<div class="hp-emo">' +
        (p.emoji || '📦') +
        '</div>' +
        '<div class="hp-info"><div class="hp-name">' +
        escapeHtml(p.title) +
        '</div><div class="hp-meta">' +
        escapeHtml(p.category) +
        ' · ' +
        escapeHtml(p.state) +
        '</div></div>' +
        '<div class="hp-price">' +
        fmt(p.price) +
        '</div>' +
        '</div>'
      );
    })
    .join('');
}

function renderMyProducts() {
  const session = getSession();
  if (!session) return;
  const mine = displayProducts().filter(function (p) {
    return String(p.sellerId) === String(session.id);
  });
  const el = document.getElementById('mpList');
  if (!mine.length) {
    el.innerHTML = '<div class="mp-empty">No tienes productos publicados aún.</div>';
    return;
  }
  el.innerHTML = mine
    .map(function (p) {
      return (
        '<div class="mpitem" id="mpitem-' +
        escapeHtml(p.id) +
        '">' +
        '<div class="mpitem-emo">' +
        (p.emoji || '📦') +
        '</div>' +
        '<div class="mpitem-info"><div class="mpitem-name">' +
        escapeHtml(p.title) +
        '</div><div class="mpitem-meta">' +
        escapeHtml(p.category) +
        ' · ' +
        escapeHtml(p.state) +
        '</div></div>' +
        '<span class="mpitem-price">' +
        fmt(p.price) +
        '</span>' +
        '<button type="button" class="mpitem-edit" onclick="editProduct(\'' +
        escapeJsStr(p.id) +
        '\')">Editar</button>' +
        '<button type="button" class="mpitem-del" onclick="deleteOwnProduct(\'' +
        escapeJsStr(p.id) +
        '\')">Eliminar</button>' +
        '</div>'
      );
    })
    .join('');
}

async function doRegister() {
  const name = document.getElementById('rName').value.trim();
  const email = document.getElementById('rEmail').value.trim().toLowerCase();
  const pass = document.getElementById('rPass').value;
  const career = document.getElementById('rCareer').value;
  const err = document.getElementById('regErr');
  const ok = document.getElementById('regOk');
  err.className = 'merr';
  ok.className = 'mok';
  if (!name) {
    err.textContent = 'El nombre es requerido.';
    err.className = 'merr show';
    return;
  }
  if (!email.endsWith('@unisabana.edu.co')) {
    err.textContent = 'Solo se permiten correos @unisabana.edu.co';
    err.className = 'merr show';
    return;
  }
  if (pass.length < 8) {
    err.textContent = 'La contraseña debe tener mínimo 8 caracteres.';
    err.className = 'merr show';
    return;
  }

  await ensureApiDiscovered();
  const payload = { email, password: pass, name, career: career || undefined };
  const res = await apiFetch('POST', '/auth/register', payload);
  if (!res.ok) {
    err.textContent = apiErrMessage(res.data, 'No se pudo crear la cuenta.');
    err.className = 'merr show';
    return;
  }
  const u = res.data.user;
  saveSession({
    token: res.data.token,
    id: u.id,
    email: u.email,
    name: name,
    role: u.role,
    career: career || null,
  });
  ok.textContent = '¡Cuenta creada!';
  ok.className = 'mok show';
  setTimeout(async function () {
    closeModal('authOverlay');
    renderNavRight();
    await loadCatalog();
    if (!useSeedFallback) await refreshCartFromApi();
    showToast('¡Bienvenido, ' + name.split(' ')[0] + '! 🎉', 'success');
  }, 350);
}

async function doLogin() {
  const email = document.getElementById('lEmail').value.trim().toLowerCase();
  const pass = document.getElementById('lPass').value;
  const err = document.getElementById('loginErr');
  err.className = 'merr';
  if (!email || !pass) {
    err.textContent = 'Completa todos los campos.';
    err.className = 'merr show';
    return;
  }
  await ensureApiDiscovered();
  const res = await apiFetch('POST', '/auth/login', { email, password: pass });
  if (!res.ok) {
    err.textContent = apiErrMessage(res.data, 'Correo o contraseña incorrectos.');
    err.className = 'merr show';
    return;
  }
  const u = res.data.user;
  saveSession({
    token: res.data.token,
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    career: u.career || null,
  });
  closeModal('authOverlay');
  renderNavRight();
  await loadCatalog();
  if (!useSeedFallback) await refreshCartFromApi();
  showToast('¡Hola de nuevo, ' + u.name.split(' ')[0] + '!', 'success');
}

async function doLogout() {
  const s = getSession();
  if (s && s.token) {
    await apiFetch('POST', '/auth/logout');
  }
  const ck = cartStorageKey();
  if (ck) {
    try {
      sessionStorage.removeItem(ck);
    } catch (_) {}
  }
  lastCartSnapshot = null;
  clearSession();
  renderNavRight();
  await loadCatalog();
  showToast('Sesión cerrada correctamente.');
}

function openProductModal(id) {
  const session = getSession();
  if (!session) {
    openModal('register');
    return;
  }
  if (session.role !== 'seller') {
    showToast('Actívete como vendedor: clic en tu nombre → «Activar cuenta vendedor».', 'error');
    return;
  }
  document.getElementById('prodErr').className = 'merr';
  document.getElementById('editingId').value = '';
  document.getElementById('prodModalTitle').textContent = 'Publicar producto';
  document.getElementById('prodModalSub').textContent = 'Tu producto llegará a toda la comunidad Sabana';
  document.getElementById('prodSubmitBtn').textContent = 'Publicar producto';
  ['pTitle', 'pDesc', 'pPrice'].forEach(function (i) {
    document.getElementById(i).value = '';
  });
  document.getElementById('pState').value = '';
  document.getElementById('pCat').value = '';

  if (id) {
    const p = displayProducts().find(function (x) {
      return String(x.id) === String(id);
    });
    if (p && String(p.sellerId) === String(session.id)) {
      document.getElementById('prodModalTitle').textContent = 'Editar producto';
      document.getElementById('prodModalSub').textContent = 'Modifica los datos de tu publicación';
      document.getElementById('prodSubmitBtn').textContent = 'Guardar cambios';
      document.getElementById('editingId').value = id;
      document.getElementById('pTitle').value = p.title;
      document.getElementById('pDesc').value = p.desc || '';
      document.getElementById('pPrice').value = p.price;
      document.getElementById('pState').value = p.state;
      document.getElementById('pCat').value = p.category;
    }
  }
  document.getElementById('prodOverlay').classList.add('show');
}

function editProduct(id) {
  openProductModal(id);
}

async function deleteOwnProduct(id) {
  const session = getSession();
  if (!session) {
    openModal('login');
    return;
  }

  const p = displayProducts().find(function (x) {
    return String(x.id) === String(id);
  });

  if (!p || String(p.sellerId) !== String(session.id)) {
    showToast('No tienes permiso para eliminar este producto.', 'error');
    return;
  }

  const ok = window.confirm('¿Seguro que quieres retirar "' + p.title + '"?');
  if (!ok) return;

  const res = await apiFetch('DELETE', '/products/' + encodeURIComponent(id));
  if (!res.ok) {
    showToast(apiErrMessage(res.data, 'No se pudo eliminar el producto.'), 'error');
    return;
  }

  await loadCatalog();
  renderMyProducts();
  showToast('Producto retirado correctamente.', 'success');
}

async function doSaveProduct() {
  const session = getSession();
  if (!session) {
    openModal('login');
    return;
  }
  const err = document.getElementById('prodErr');
  err.className = 'merr';
  const title = document.getElementById('pTitle').value.trim();
  const description = document.getElementById('pDesc').value.trim();
  const price = Number(document.getElementById('pPrice').value);
  const state = document.getElementById('pState').value;
  const category = document.getElementById('pCat').value;
  const editingId = document.getElementById('editingId').value;

  if (!title) {
    err.textContent = 'El título es requerido.';
    err.className = 'merr show';
    return;
  }
  if (!description) {
    err.textContent = 'La descripción es requerida.';
    err.className = 'merr show';
    return;
  }
  if (!price || price <= 0) {
    err.textContent = 'El precio debe ser mayor a 0.';
    err.className = 'merr show';
    return;
  }
  if (!state) {
    err.textContent = 'Selecciona el estado del producto.';
    err.className = 'merr show';
    return;
  }
  if (!category) {
    err.textContent = 'Selecciona una categoría.';
    err.className = 'merr show';
    return;
  }

  let res;
  if (editingId) {
    res = await apiFetch('PUT', '/products/' + encodeURIComponent(editingId), {
      title,
      description,
      price,
      state,
      category,
    });
  } else {
    res = await apiFetch('POST', '/products', {
      title,
      description,
      price,
      state,
      category,
    });
  }

  if (!res.ok) {
    err.textContent = apiErrMessage(res.data, 'No se pudo guardar el producto.');
    err.className = 'merr show';
    return;
  }

  closeModal('prodOverlay');
  await loadCatalog();
  renderMyProducts();
  showToast(editingId ? 'Producto actualizado ✓' : '¡Producto publicado! 🎉', 'success');
}

let _viewingProduct = null;

function openProductDetail(id) {
  const p = displayProducts().find(function (x) {
    return String(x.id) === String(id);
  });
  if (!p) return;
  _viewingProduct = p;
  document.getElementById('pdEmoji').textContent = p.emoji || '📦';
  document.getElementById('pdCat').textContent = p.category;
  document.getElementById('pdTitle').textContent = p.title;
  document.getElementById('pdPrice').textContent = fmt(p.price);
  document.getElementById('pdDesc').textContent = p.desc || p.description || 'Sin descripción.';
  document.getElementById('pdState').textContent = p.state === 'nuevo' ? '🟢 Nuevo' : '🟡 Usado';
  const av = document.getElementById('pdSellerAv');
  av.textContent = p.sellerAv || '?';
  av.style.background = p.sellerColor || '#0D2167';
  document.getElementById('pdSellerName').textContent = p.sellerName || 'Vendedor';
  document.getElementById('pdSellerRep').textContent = 'Comunidad Sabana Market';
  const session = getSession();
  const own = session && String(p.sellerId) === String(session.id);
  const row = document.getElementById('pdCartRow');
  const note = document.getElementById('pdOwnProductNote');
  const qty = document.getElementById('pdQty');
  const btn = document.getElementById('btnPdAddCart');
  if (qty) qty.value = '1';
  if (row && note) {
    if (own) {
      row.style.display = 'none';
      note.style.display = 'block';
    } else {
      row.style.display = 'flex';
      note.style.display = 'none';
    }
  }
  if (btn) btn.disabled = !!own || useSeedFallback;
  document.getElementById('productDetailOverlay').classList.add('show');
}

async function addViewedProductToCart() {
  const session = getSession();
  if (!session) {
    openModal('login');
    return;
  }
  const p = _viewingProduct;
  if (!p) return;
  if (String(p.sellerId) === String(session.id)) {
    showToast('No puedes añadir tu propia publicación al carrito.', 'error');
    return;
  }
  if (useSeedFallback) {
    showToast('Conecta el servidor (API) para usar el carrito.', 'error');
    return;
  }
  const qtyEl = document.getElementById('pdQty');
  const qty = Math.max(1, parseInt(qtyEl && qtyEl.value, 10) || 1);
  const res = await apiFetch('POST', '/cart/items', { productId: p.id, quantity: qty });
  if (!res.ok) {
    showToast(apiErrMessage(res.data, 'No se pudo añadir al carrito.'), 'error');
    return;
  }
  saveCartSnapshot(res.data);
  updateCartBadge(res.data);
  showToast('Añadido al carrito · Total ' + fmt(res.data.total), 'success');
}

function closePdOverlay(e) {
  if (e.target.id === 'productDetailOverlay')
    document.getElementById('productDetailOverlay').classList.remove('show');
}

function closeProfileOverlay(e) {
  if (e.target.id === 'profileOverlay') closeModal('profileOverlay');
}

async function openProfile() {
  const s = getSession();
  if (!s) {
    openModal('login');
    return;
  }
  document.getElementById('profileErr').className = 'merr';
  document.getElementById('profileOverlay').classList.add('show');

  const res = await apiFetch('GET', '/users/' + encodeURIComponent(s.id));
  if (!res.ok) {
    document.getElementById('profEmail').value = s.email || '';
    document.getElementById('profName').value = s.name || '';
    document.getElementById('profCareer').value = s.career || '';
    document.getElementById('profPhotoUrl').value = '';
    document.getElementById('profRep').value = '—';
    document.getElementById('profRole').value = s.role || '';
    document.getElementById('btnBecomeSeller').style.display = s.role === 'buyer' ? 'block' : 'none';
    showToast(apiErrMessage(res.data, 'No se pudo cargar el perfil desde el servidor.'), 'error');
    return;
  }

  const u = res.data.user;
  document.getElementById('profEmail').value = u.email || '';
  document.getElementById('profName').value = u.name || '';
  document.getElementById('profCareer').value = u.career || '';
  document.getElementById('profPhotoUrl').value = u.photoUrl || '';
  document.getElementById('profRep').value =
    u.reputation != null ? String(u.reputation) : 'Sin reseñas';
  document.getElementById('profRole').value = u.role || '';
  document.getElementById('btnBecomeSeller').style.display = u.role === 'buyer' ? 'block' : 'none';

  saveSession({
    token: s.token,
    id: s.id,
    email: u.email || s.email,
    name: u.name || s.name,
    role: u.role || s.role,
    career: u.career != null ? u.career : s.career,
  });
}

async function saveProfile() {
  const s = getSession();
  if (!s) return;
  const errEl = document.getElementById('profileErr');
  errEl.className = 'merr';
  const name = document.getElementById('profName').value.trim();
  if (!name) {
    errEl.textContent = 'El nombre no puede estar vacío.';
    errEl.className = 'merr show';
    return;
  }
  const career = document.getElementById('profCareer').value.trim();
  const photoUrl = document.getElementById('profPhotoUrl').value.trim();

  const res = await apiFetch('PUT', '/users/' + encodeURIComponent(s.id), {
    name,
    career: career || null,
    photoUrl: photoUrl || null,
  });

  if (!res.ok) {
    errEl.textContent = apiErrMessage(res.data, 'No se pudo guardar.');
    errEl.className = 'merr show';
    return;
  }

  const u = res.data.user;
  saveSession({
    token: s.token,
    id: s.id,
    email: u.email || s.email,
    name: u.name,
    role: u.role || s.role,
    career: u.career != null ? u.career : null,
  });
  renderNavRight();
  showToast('Perfil actualizado ✓', 'success');
  closeModal('profileOverlay');
}

async function doBecomeSeller() {
  const s = getSession();
  if (!s) return;
  const errEl = document.getElementById('profileErr');
  errEl.className = 'merr';

  const res = await apiFetch(
    'PUT',
    '/users/' + encodeURIComponent(s.id) + '/become-seller',
    {}
  );

  if (!res.ok) {
    errEl.textContent = apiErrMessage(res.data, 'No se pudo activar el rol.');
    errEl.className = 'merr show';
    return;
  }

  const tok = res.data.token || s.token;
  saveSession({
    token: tok,
    id: s.id,
    email: s.email,
    name: s.name,
    role: 'seller',
    career: s.career,
  });
  document.getElementById('profRole').value = 'seller';
  document.getElementById('btnBecomeSeller').style.display = 'none';
  renderNavRight();
  showToast('¡Ahora eres vendedor! Ya puedes publicar productos 🎉', 'success');
}

function openModal(tab) {
  document.getElementById('authOverlay').classList.add('show');
  switchTab(tab || 'login');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

function closeAuth(e) {
  if (e.target.id === 'authOverlay') closeModal('authOverlay');
}

function closeProdModal(e) {
  if (e.target.id === 'prodOverlay') closeModal('prodOverlay');
}

function switchTab(tab) {
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tabLogin').className = 'mtab' + (tab === 'login' ? ' on' : '');
  document.getElementById('tabReg').className = 'mtab' + (tab === 'register' ? ' on' : '');
  document.getElementById('authTitle').textContent = tab === 'login' ? 'Ingresar' : 'Crear cuenta';
  document.getElementById('authSub').textContent =
    tab === 'login' ? 'Accede a tu cuenta Sabana Market' : 'Únete a la comunidad Sabana Market';
  document.getElementById('loginErr').className = 'merr';
  document.getElementById('regErr').className = 'merr';
  document.getElementById('regOk').className = 'mok';
}

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type || '');
  setTimeout(function () {
    t.classList.add('show');
  }, 10);
  setTimeout(function () {
    t.classList.remove('show');
  }, 3200);
}

document.addEventListener('DOMContentLoaded', function () {
  let searchDebounce = null;
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(searchDebounce);
      const self = this;
      searchDebounce = setTimeout(function () {
        catalogState.search = String(self.value || '').trim();
        catalogState.page = 1;
        loadCatalog();
      }, 380);
    });
  }

  const applyBtn = document.getElementById('btnApplyFilters');
  if (applyBtn) {
    applyBtn.addEventListener('click', function () {
      readFiltersFromSidebar();
      catalogState.page = 1;
      syncCatBarHighlight();
      loadCatalog();
    });
  }

  const sideCat = document.getElementById('sidebarCategories');
  if (sideCat) {
    sideCat.addEventListener('change', function () {
      readFiltersFromSidebar();
      catalogState.page = 1;
      syncCatBarHighlight();
      loadCatalog();
    });
  }

  const sideState = document.getElementById('sidebarState');
  if (sideState) {
    sideState.addEventListener('change', function () {
      readFiltersFromSidebar();
      catalogState.page = 1;
      loadCatalog();
    });
  }

  document.querySelectorAll('.catbar .cat').forEach(function (el) {
    el.addEventListener('click', function () {
      catalogState.category = this.getAttribute('data-cat') || '';
      catalogState.page = 1;
      syncSidebarRadiosFromState();
      syncCatBarHighlight();
      loadCatalog();
    });
  });

  const prev = document.getElementById('btnCatalogPrev');
  const next = document.getElementById('btnCatalogNext');
  if (prev) {
    prev.addEventListener('click', function () {
      if (catalogState.page > 1) {
        catalogState.page--;
        loadCatalog();
      }
    });
  }
  if (next) {
    next.addEventListener('click', function () {
      const pages = Math.max(1, Math.ceil(catalogState.total / catalogState.limit));
      if (catalogState.page < pages) {
        catalogState.page++;
        loadCatalog();
      }
    });
  }

  const sortEl = document.getElementById('tbSort');
  if (sortEl) {
    sortEl.addEventListener('change', function () {
      if (useSeedFallback) {
        const local = getFilteredSeedList();
        renderGrid(applySortToList(local));
      } else {
        renderGrid(applySortToList(displayProducts()));
      }
    });
  }
});

(function boot() {
  ensureApiDiscovered().then(function () {
    syncSidebarRadiosFromState();
    syncCatBarHighlight();
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value) catalogState.search = searchInput.value.trim();
    renderNavRight();
    loadCatalog();
  });
})();
