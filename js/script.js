/**
 * SuperEletroLar — Script principal v2
 * API, auth, checkout, detalhe de produto, PWA
 */

const SuperEletroLar = (() => {
  'use strict';

  let CATEGORIES = [];
  let PRODUCTS = [];
  let HERO_SLIDES = [];
  let cart = JSON.parse(localStorage.getItem('sel-cart') || '[]');
  let favorites = JSON.parse(localStorage.getItem('sel-favorites') || '[]');
  let currentView = 'home';
  let viewHistory = ['home'];
  let activeCategory = null;
  let currentProduct = null;
  let checkoutStep = 1;
  let selectedShipping = 'standard';
  let heroIndex = 0;
  let heroTimer = null;
  let currentOrder = null;
  let currentPayment = null;
  let deferredPrompt = null;

  const formatPrice = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const installment = (p) => `ou 12x de ${formatPrice(p / 12)} sem juros`;
  const saveCart = () => localStorage.setItem('sel-cart', JSON.stringify(cart));
  const saveFavorites = () => localStorage.setItem('sel-favorites', JSON.stringify(favorites));
  const getShippingCost = () => selectedShipping === 'express' ? 49.90 : 0;
  const getCartSubtotal = () => cart.reduce((s, i) => {
    const p = PRODUCTS.find(pr => pr.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const getCartTotal = () => getCartSubtotal() + getShippingCost();

  function renderStars(rating) {
    const full = Math.floor(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  /* ── API Data Loading ── */
  async function loadData() {
    try {
      [CATEGORIES, PRODUCTS, HERO_SLIDES] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getCarousel(),
      ]);
    } catch {
      showToast('⚠️ Modo offline — usando dados em cache');
      CATEGORIES = getFallbackCategories();
      PRODUCTS = getFallbackProducts();
      HERO_SLIDES = getFallbackHero();
    }
    renderAll();
  }

  function getFallbackHero() {
    return [
      { id: 1, badge: '⚡ Novidade', title: 'Tecnologia que transforma seu lar', subtitle: 'Eletrodomésticos para a família brasileira.', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80', gradient: 'gradient-brand', cta: 'explore', ctaLabel: 'Explorar produtos' },
      { id: 2, badge: '🔥 Ofertas', title: 'Até 40% OFF em Linha Branca', subtitle: 'Geladeiras, fogões e lavadoras.', image: 'https://images.unsplash.com/photo-1571175443880-49e1b58a9b91?w=1200&q=80', gradient: 'gradient-warm', cta: 'offers', ctaLabel: 'Ver ofertas' },
    ];
  }

  function getFallbackCategories() {
    return [
      { id: 'geladeiras', name: 'Geladeiras', icon: '🧊' },
      { id: 'fogoes', name: 'Fogões', icon: '🔥' },
      { id: 'lavadoras', name: 'Lavadoras', icon: '🫧' },
      { id: 'tvs', name: 'Smart TVs', icon: '📺' },
      { id: 'ar', name: 'Ar-condicionado', icon: '❄️' },
      { id: 'micro', name: 'Micro-ondas', icon: '📡' },
      { id: 'celulares', name: 'Celulares', icon: '📱' },
      { id: 'notebooks', name: 'Notebooks', icon: '💻' },
    ];
  }

  function getFallbackProducts() {
    return [];
  }

  /* ── Product Card ── */
  function productCardHTML(product) {
    const isFav = favorites.includes(product.id);
    const catName = CATEGORIES.find(c => c.id === product.category)?.name || product.category;
    const img = product.image
      ? `<img src="${product.image}" alt="${product.name}" loading="lazy" width="300" height="300">`
      : `<span style="font-size:5rem" aria-hidden="true">${product.emoji || '📦'}</span>`;

    return `
      <article class="product-card" role="listitem" data-product-id="${product.id}">
        <div class="product-image" data-open-product="${product.id}" style="cursor:pointer">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
          <button class="product-favorite ${isFav ? 'active' : ''}" aria-label="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" data-fav="${product.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          ${img}
        </div>
        <div class="product-info" data-open-product="${product.id}" style="cursor:pointer">
          <span class="product-category">${catName}</span>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-rating">
            <span class="stars" aria-hidden="true">${renderStars(product.rating)}</span>
            <span>(${product.reviews})</span>
          </div>
          <div class="product-price">
            <span class="price-current">${formatPrice(product.price)}</span>
            ${product.oldPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : ''}
            <div class="price-installment">${installment(product.price)}</div>
          </div>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary btn-sm add-to-cart" data-add="${product.id}" aria-label="Adicionar ${product.name} ao carrinho">Adicionar ao carrinho</button>
        </div>
      </article>`;
  }

  function renderProducts(containerId, products) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!products.length) {
      el.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem">Nenhum produto encontrado.</p>';
      return;
    }
    el.innerHTML = products.map(productCardHTML).join('');
    updateProductSchema(products);
  }

  function renderCategories() {
    const scroll = document.getElementById('categories-scroll');
    if (scroll) {
      scroll.innerHTML = CATEGORIES.map(cat => `
        <button class="category-card has-image" role="tab" data-category="${cat.id}" aria-label="Categoria ${cat.name}">
          ${cat.image ? `<img class="category-img" src="${cat.image}" alt="${cat.name}" loading="lazy" width="120" height="80">` : `<span class="category-icon" aria-hidden="true">${cat.icon}</span>`}
          <span class="category-name">${cat.name}</span>
        </button>`).join('');
    }
    const grid = document.getElementById('categories-grid');
    if (grid) {
      grid.innerHTML = CATEGORIES.map(cat => `
        <button class="category-card has-image" style="min-height:140px" data-category="${cat.id}" aria-label="Ver ${cat.name}">
          ${cat.image ? `<img class="category-img" src="${cat.image}" alt="${cat.name}" loading="lazy" width="200" height="100">` : `<span class="category-icon" style="font-size:2.5rem">${cat.icon}</span>`}
          <span class="category-name">${cat.name}</span>
        </button>`).join('');
    }
  }

  function renderHeroCarousel() {
    const track = document.getElementById('hero-track');
    const dots = document.getElementById('hero-dots');
    if (!track || !HERO_SLIDES.length) return;

    track.innerHTML = HERO_SLIDES.map((slide, i) => `
      <div class="hero-slide ${slide.gradient || 'gradient-brand'}" role="tabpanel" aria-label="${slide.title}" ${i === 0 ? '' : 'aria-hidden="true"'}>
        <div class="hero-slide-bg" style="background-image:url('${slide.image}')"></div>
        <div class="hero-slide-content">
          <span class="hero-slide-badge">${slide.badge || '⚡ SuperEletroLar'}</span>
          <h2>${slide.title}</h2>
          <p>${slide.subtitle}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" data-action="${slide.cta || 'explore'}">${slide.ctaLabel || 'Explorar'}</button>
          </div>
        </div>
      </div>`).join('');

    dots.innerHTML = HERO_SLIDES.map((_, i) => `
      <button class="hero-dot ${i === 0 ? 'active' : ''}" data-hero-dot="${i}" aria-label="Slide ${i + 1}" role="tab"></button>
    `).join('');

    heroIndex = 0;
    startHeroAutoplay();
  }

  function goToHeroSlide(index) {
    const track = document.getElementById('hero-track');
    const dots = document.querySelectorAll('.hero-dot');
    if (!track || !HERO_SLIDES.length) return;

    heroIndex = (index + HERO_SLIDES.length) % HERO_SLIDES.length;
    track.style.transform = `translateX(-${heroIndex * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === heroIndex));
    track.querySelectorAll('.hero-slide').forEach((s, i) => {
      s.setAttribute('aria-hidden', i !== heroIndex);
    });
  }

  function startHeroAutoplay() {
    clearInterval(heroTimer);
    heroTimer = setInterval(() => goToHeroSlide(heroIndex + 1), 5000);
  }

  function renderShowcase() {
    const track = document.getElementById('showcase-track');
    if (!track) return;

    const items = CATEGORIES.map(cat => {
      const product = PRODUCTS.find(p => p.category === cat.id);
      return { ...cat, productPrice: product?.price, badge: product?.badge };
    });

    track.innerHTML = items.map(cat => `
      <div class="showcase-item" role="listitem" data-category="${cat.id}" tabindex="0">
        ${cat.badge ? `<span class="showcase-item-badge">${cat.badge}</span>` : ''}
        <img src="${cat.image}" alt="${cat.name}" loading="lazy" width="200" height="140">
        <div class="showcase-item-info">
          <h4>${cat.icon} ${cat.name}</h4>
          <span>${cat.description?.slice(0, 40) || 'Ver produtos'}...</span>
        </div>
      </div>`).join('');
  }

  function renderFavorites() {
    const favProducts = PRODUCTS.filter(p => favorites.includes(p.id));
    renderProducts('favorites-grid', favProducts);
    const grid = document.getElementById('favorites-grid');
    if (grid && !favProducts.length) {
      grid.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem;grid-column:1/-1">Nenhum favorito ainda. Toque no ❤️ nos produtos.</p>';
    }
  }

  async function renderOrders() {
    const el = document.getElementById('orders-content');
    if (!el) return;

    if (!api.getUser()) {
      el.innerHTML = '<div class="checkout-panel"><p>Faça login para ver seus pedidos.</p><button class="btn btn-primary btn-sm" id="btn-orders-login">Entrar</button></div>';
      return;
    }

    try {
      const orders = await api.getOrders();
      if (!orders.length) {
        el.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem">Você ainda não fez nenhum pedido.</p>';
        return;
      }
      el.innerHTML = `<div class="orders-list">${orders.map(o => `
        <div class="order-card">
          <div class="order-card-header">
            <strong>${o.trackingCode || o.id.slice(0, 8).toUpperCase()}</strong>
            <span class="order-status ${o.status === 'paid' ? 'paid' : 'pending'}">${o.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}</span>
          </div>
          <p style="font-size:0.875rem;color:var(--color-text-secondary)">${new Date(o.createdAt).toLocaleDateString('pt-BR')} · ${o.items?.length || 0} item(s)</p>
          <p style="font-weight:700;margin-top:0.5rem">${formatPrice(o.total)}</p>
        </div>`).join('')}</div>`;
    } catch {
      el.innerHTML = '<p class="form-error">Erro ao carregar pedidos.</p>';
    }
  }

  function renderAll() {
    renderHeroCarousel();
    renderShowcase();
    renderCategories();
    renderProducts('products-grid', PRODUCTS.slice(0, 8));
    renderProducts('offers-grid', PRODUCTS.filter(p => p.badge));
    if (activeCategory) {
      renderProducts('category-products-grid', PRODUCTS.filter(p => p.category === activeCategory));
    }
    renderFavorites();
    renderCart();
    updateAccountView();
  }

  /* ── Product Detail ── */
  async function openProduct(productId) {
    try {
      currentProduct = await api.getProduct(productId);
    } catch {
      currentProduct = PRODUCTS.find(p => p.id === productId);
    }
    if (!currentProduct) return;

    document.title = `${currentProduct.name} — SuperEletroLar`;
    updateProductSchema([currentProduct]);

    const specs = currentProduct.specs
      ? Object.entries(currentProduct.specs).map(([k, v]) =>
          `<div class="spec-item"><strong>${k}</strong>${v}</div>`).join('')
      : '';

    const el = document.getElementById('product-detail-content');
    if (!el) return;

    const images = currentProduct.images?.length ? currentProduct.images : [currentProduct.image];
    const thumbs = images.map((img, i) =>
      `<img src="${img}" alt="${currentProduct.name} - foto ${i + 1}" class="${i === 0 ? 'active' : ''}" data-gallery-thumb="${i}" loading="lazy" width="64" height="64">`
    ).join('');

    el.innerHTML = `
      <div class="product-detail">
        <div class="product-detail-gallery product-gallery">
          <div class="product-gallery-main">
            <img id="gallery-main" src="${images[0]}" alt="${currentProduct.name}" width="600" height="600">
          </div>
          ${images.length > 1 ? `<div class="product-gallery-thumbs">${thumbs}</div>` : ''}
        </div>
        <div class="product-detail-info">
          <span class="product-category">${CATEGORIES.find(c => c.id === currentProduct.category)?.name || ''}</span>
          <h1>${currentProduct.name}</h1>
          <p class="product-detail-brand">Marca: ${currentProduct.brand || '—'}</p>
          <div class="product-rating" style="margin-bottom:1rem">
            <span class="stars">${renderStars(currentProduct.rating)}</span>
            <span>(${currentProduct.reviews} avaliações)</span>
          </div>
          <div class="stock-badge ${currentProduct.stock < 10 ? 'low' : ''}">
            ${currentProduct.stock < 10 ? '⚠️ Últimas unidades' : '✅ Em estoque'}
          </div>
          <div class="product-detail-price">
            <span class="price-current">${formatPrice(currentProduct.price)}</span>
            ${currentProduct.oldPrice ? `<span class="price-old">${formatPrice(currentProduct.oldPrice)}</span>` : ''}
            <div class="price-installment">${installment(currentProduct.price)}</div>
          </div>
          <p class="product-detail-desc">${currentProduct.description || ''}</p>
          ${specs ? `<div class="specs-grid">${specs}</div>` : ''}
          <div class="product-detail-actions">
            <button class="btn btn-primary" data-add="${currentProduct.id}">Adicionar ao carrinho</button>
            <button class="btn btn-outline" data-buy-now="${currentProduct.id}">Comprar agora</button>
          </div>
        </div>
      </div>
      ${currentProduct.related?.length ? `
        <div class="section-header"><h2 class="section-title">Produtos relacionados</h2></div>
        <div class="products-grid" id="related-products" role="list"></div>` : ''}`;

    if (currentProduct.related?.length) {
      renderProducts('related-products', currentProduct.related);
    }

    navigateTo('product');
  }

  /* ── Cart ── */
  function renderCart() {
    const container = document.getElementById('cart-content');
    if (!container) return;

    if (!cart.length) {
      container.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon" aria-hidden="true">🛒</div>
          <h2>Seu carrinho está vazio</h2>
          <p>Explore nossos produtos e encontre o ideal para seu lar.</p>
          <button class="btn btn-primary" data-action="explore">Explorar produtos</button>
        </div>`;
      return;
    }

    const items = cart.map(item => {
      const product = PRODUCTS.find(p => p.id === item.id);
      if (!product) return '';
      const img = product.image
        ? `<img src="${product.image}" alt="${product.name}" width="80" height="80">`
        : `<span style="font-size:2.5rem">${product.emoji || '📦'}</span>`;
      return `
        <div class="cart-item" data-cart-id="${item.id}">
          <div class="cart-item-image">${img}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${product.name}</div>
            <div class="cart-item-price">${formatPrice(product.price)}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" data-qty-minus="${item.id}" aria-label="Diminuir">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" data-qty-plus="${item.id}" aria-label="Aumentar">+</button>
              <button class="qty-btn" data-remove="${item.id}" aria-label="Remover" style="margin-left:auto;color:var(--color-secondary)">✕</button>
            </div>
          </div>
        </div>`;
    }).join('');

    const subtotal = getCartSubtotal();
    const shipping = getShippingCost();
    const total = subtotal + shipping;

    container.innerHTML = `
      <div class="cart-items">${items}</div>
      <div class="cart-summary">
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Frete</span><span style="color:var(--color-accent)">${shipping ? formatPrice(shipping) : 'Grátis'}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
        <button class="btn btn-primary" style="width:100%" id="btn-go-checkout">Finalizar compra</button>
      </div>`;
  }

  function updateCartBadge() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = total;
      badge.dataset.count = total;
    }
  }

  function addToCart(productId) {
    const existing = cart.find(i => i.id === productId);
    if (existing) existing.qty++;
    else cart.push({ id: productId, qty: 1 });
    saveCart();
    updateCartBadge();
    const product = PRODUCTS.find(p => p.id === productId);
    showToast(`✅ ${product?.name || 'Produto'} adicionado ao carrinho`);
  }

  /* ── Checkout ── */
  function renderCheckout() {
    const el = document.getElementById('checkout-content');
    if (!el) return;

    const subtotal = getCartSubtotal();
    const shipping = getShippingCost();
    const total = getCartTotal();

    const steps = ['Dados', 'Endereço', 'Pagamento', 'Confirmação'];
    const stepsHTML = steps.map((s, i) =>
      `<div class="checkout-step ${checkoutStep === i + 1 ? 'active' : ''} ${checkoutStep > i + 1 ? 'done' : ''}">${i + 1}. ${s}</div>`
    ).join('');

    let panelHTML = '';

    if (checkoutStep === 1) {
      const user = api.getUser();
      panelHTML = `
        <div class="checkout-panel">
          <h3>Seus dados</h3>
          <div class="form-group"><label class="form-label" for="ck-name">Nome completo *</label>
            <input class="form-input" id="ck-name" value="${user?.name || ''}" required></div>
          <div class="form-group"><label class="form-label" for="ck-email">E-mail *</label>
            <input class="form-input" id="ck-email" type="email" value="${user?.email || ''}" required></div>
          <div class="form-group"><label class="form-label" for="ck-phone">Telefone</label>
            <input class="form-input" id="ck-phone" type="tel" value="${user?.phone || ''}" placeholder="(11) 99999-9999"></div>
          <button class="btn btn-primary" id="ck-next-1" style="width:100%">Continuar</button>
        </div>`;
    } else if (checkoutStep === 2) {
      panelHTML = `
        <div class="checkout-panel">
          <h3>Endereço de entrega</h3>
          <div class="form-group"><label class="form-label" for="ck-cep">CEP *</label>
            <input class="form-input" id="ck-cep" placeholder="00000-000" maxlength="9" required></div>
          <div class="form-group"><label class="form-label" for="ck-street">Rua *</label>
            <input class="form-input" id="ck-street" required></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label" for="ck-number">Número *</label>
              <input class="form-input" id="ck-number" required></div>
            <div class="form-group"><label class="form-label" for="ck-comp">Complemento</label>
              <input class="form-input" id="ck-comp"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label" for="ck-city">Cidade *</label>
              <input class="form-input" id="ck-city" required></div>
            <div class="form-group"><label class="form-label" for="ck-state">UF *</label>
              <input class="form-input" id="ck-state" maxlength="2" required></div>
          </div>
          <h4 style="margin:1rem 0 0.5rem;font-size:0.9rem">Opções de frete</h4>
          <div class="shipping-options">
            <label class="shipping-option ${selectedShipping === 'standard' ? 'selected' : ''}" data-shipping="standard">
              <input type="radio" name="shipping" value="standard" ${selectedShipping === 'standard' ? 'checked' : ''}>
              <div class="shipping-option-info"><strong>📦 Entrega Padrão</strong><small>5 a 10 dias úteis</small></div>
              <span class="shipping-option-price">Grátis</span>
            </label>
            <label class="shipping-option ${selectedShipping === 'express' ? 'selected' : ''}" data-shipping="express">
              <input type="radio" name="shipping" value="express" ${selectedShipping === 'express' ? 'checked' : ''}>
              <div class="shipping-option-info"><strong>🚀 Entrega Expressa</strong><small>2 a 4 dias úteis</small></div>
              <span class="shipping-option-price">${formatPrice(49.90)}</span>
            </label>
          </div>
          <button class="btn btn-primary" id="ck-next-2" style="width:100%">Continuar</button>
        </div>`;
    } else if (checkoutStep === 3) {
      panelHTML = `
        <div class="checkout-panel">
          <h3>Forma de pagamento</h3>
          <div class="payment-methods">
            <label class="payment-option selected" data-payment="pix">
              <input type="radio" name="payment" value="pix" checked>
              <span class="payment-icon">💚</span>
              <div><strong>Pix</strong><br><small>Aprovação instantânea</small></div>
            </label>
            <label class="payment-option" data-payment="card">
              <input type="radio" name="payment" value="card">
              <span class="payment-icon">💳</span>
              <div><strong>Cartão de crédito</strong><br><small>Até 12x sem juros</small></div>
            </label>
            <label class="payment-option" data-payment="mercadopago">
              <input type="radio" name="payment" value="mercadopago">
              <span class="payment-icon">🛒</span>
              <div><strong>Mercado Pago</strong><br><small>Pix, boleto ou cartão</small></div>
            </label>
          </div>
          <div id="card-fields" style="display:none;margin-top:1rem">
            <div class="form-group"><label class="form-label">Número do cartão</label>
              <input class="form-input" id="ck-card" placeholder="0000 0000 0000 0000" maxlength="19"></div>
            <div class="form-group"><label class="form-label">Nome no cartão</label>
              <input class="form-input" id="ck-card-name"></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Validade</label>
                <input class="form-input" id="ck-expiry" placeholder="MM/AA" maxlength="5"></div>
              <div class="form-group"><label class="form-label">CVV</label>
                <input class="form-input" id="ck-cvv" placeholder="000" maxlength="4" type="password"></div>
            </div>
            <div class="form-group"><label class="form-label">Parcelas</label>
              <select class="form-input" id="ck-installments">
                ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}x de ${formatPrice(total / (i + 1))}</option>`).join('')}
              </select></div>
          </div>
          <button class="btn btn-primary" id="ck-pay" style="width:100%;margin-top:1rem">Pagar ${formatPrice(total)}</button>
        </div>`;
    } else if (checkoutStep === 4) {
      panelHTML = `
        <div class="order-success">
          <div class="order-success-icon">🎉</div>
          <h2>Pedido confirmado!</h2>
          <p>Obrigado pela preferência. Seu pedido foi recebido com sucesso.</p>
          ${currentOrder?.trackingCode ? `<div class="tracking-code">${currentOrder.trackingCode}</div>` : ''}
          <p style="color:var(--color-text-secondary);font-size:0.875rem">Guarde o código acima para rastrear seu pedido.</p>
          <button class="btn btn-primary" data-action="explore" style="margin-top:1rem">Continuar comprando</button>
        </div>`;
    }

    el.innerHTML = `
      <div class="checkout-steps">${stepsHTML}</div>
      <div class="cart-summary" style="margin-bottom:1.5rem;position:static">
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Frete</span><span>${shipping ? formatPrice(shipping) : 'Grátis'}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
      </div>
      ${panelHTML}`;
  }

  async function processPayment() {
    const total = getCartTotal();

    const method = document.querySelector('input[name="payment"]:checked')?.value || 'pix';

    try {
      const order = await api.createOrder({
        items: cart,
        shipping: selectedShipping,
        customer: {
          name: document.getElementById('ck-name')?.value,
          email: document.getElementById('ck-email')?.value,
          phone: document.getElementById('ck-phone')?.value,
        },
        address: {
          cep: document.getElementById('ck-cep')?.value,
          street: document.getElementById('ck-street')?.value,
          number: document.getElementById('ck-number')?.value,
          complement: document.getElementById('ck-comp')?.value,
          city: document.getElementById('ck-city')?.value,
          state: document.getElementById('ck-state')?.value,
        },
      });

      currentOrder = order;

      if (method === 'pix') {
        currentPayment = await api.createPixPayment(order.id, total);
        const el = document.getElementById('checkout-content');
        el.innerHTML = `
          <div class="checkout-panel">
            <h3>💚 Pague com Pix</h3>
            <div class="pix-qr">
              <img src="${currentPayment.pixQrCode}" alt="QR Code Pix" width="250" height="250">
              <p style="margin-bottom:1rem;color:var(--color-text-secondary)">Escaneie o QR Code ou copie o código abaixo</p>
              <div class="pix-code" id="pix-code">${currentPayment.pixCode}</div>
              <button class="btn btn-outline btn-sm" id="btn-copy-pix" style="margin-bottom:1rem">📋 Copiar código Pix</button>
              <p style="font-size:0.75rem;color:var(--color-text-muted)">Expira em 30 minutos</p>
              <button class="btn btn-primary" id="btn-confirm-pix" style="width:100%;margin-top:1rem">Já paguei</button>
            </div>
          </div>`;
        return;
      }

      if (method === 'card') {
        const result = await api.payWithCard({
          orderId: order.id,
          amount: total,
          cardNumber: document.getElementById('ck-card')?.value,
          cardName: document.getElementById('ck-card-name')?.value,
          expiry: document.getElementById('ck-expiry')?.value,
          cvv: document.getElementById('ck-cvv')?.value,
          installments: document.getElementById('ck-installments')?.value,
        });
        currentOrder.trackingCode = result.trackingCode;
      } else if (method === 'mercadopago') {
        const result = await api.payWithMercadoPago(order.id, total);
        currentOrder.trackingCode = result.trackingCode || `SEL${Date.now().toString(36).toUpperCase()}`;
      }

      cart = [];
      saveCart();
      updateCartBadge();
      checkoutStep = 4;
      renderCheckout();
      showToast('🎉 Pagamento aprovado!');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  }

  /* ── Auth Modal ── */
  function showAuthModal(tab = 'login') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'auth-modal';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-label="Autenticação">
        <div class="modal-header">
          <h2 class="modal-title">Minha Conta</h2>
          <button class="modal-close" aria-label="Fechar">✕</button>
        </div>
        <div class="form-tabs">
          <button class="form-tab ${tab === 'login' ? 'active' : ''}" data-auth-tab="login">Entrar</button>
          <button class="form-tab ${tab === 'register' ? 'active' : ''}" data-auth-tab="register">Cadastrar</button>
        </div>
        <form id="auth-form">
          <div id="register-name" style="display:${tab === 'register' ? 'block' : 'none'}">
            <div class="form-group"><label class="form-label" for="auth-name">Nome</label>
              <input class="form-input" id="auth-name" autocomplete="name"></div>
          </div>
          <div class="form-group"><label class="form-label" for="auth-email">E-mail</label>
            <input class="form-input" id="auth-email" type="email" required autocomplete="email"></div>
          <div class="form-group"><label class="form-label" for="auth-password">Senha</label>
            <input class="form-input" id="auth-password" type="password" required minlength="6" autocomplete="current-password"></div>
          <div id="auth-error" class="form-error" style="display:none"></div>
          <button type="submit" class="btn btn-primary" style="width:100%">${tab === 'login' ? 'Entrar' : 'Criar conta'}</button>
        </form>
      </div>`;
    document.body.appendChild(overlay);
    overlay.dataset.tab = tab;

    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  /* ── Account View ── */
  function updateAccountView() {
    const user = api.getUser();
    const header = document.querySelector('#view-account .profile-header');
    if (!header) return;

    if (user) {
      header.innerHTML = `
        <div class="profile-avatar" aria-hidden="true">${user.name.charAt(0).toUpperCase()}</div>
        <h2>Olá, ${user.name.split(' ')[0]}!</h2>
        <p style="color:var(--color-text-secondary)">${user.email}</p>
        <button class="btn btn-outline btn-sm" id="btn-logout" style="margin-top:1rem">Sair</button>`;
    }
  }

  /* ── Navigation ── */
  function navigateTo(view, pushHistory = true) {
    if (pushHistory && view !== currentView) viewHistory.push(view);
    currentView = view;

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`)?.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
      const active = item.dataset.view === view;
      item.classList.toggle('active', active);
      item.setAttribute('aria-current', active ? 'page' : 'false');
    });

    document.querySelectorAll('.desktop-nav a').forEach(link => {
      link.classList.toggle('active', link.dataset.view === view);
    });

    document.getElementById('btn-back')?.classList.toggle('visible', viewHistory.length > 1);

    if (view === 'cart') renderCart();
    if (view === 'checkout') { checkoutStep = 1; renderCheckout(); }
    if (view === 'orders') renderOrders();
    if (view === 'favorites') renderFavorites();
    if (view === 'home') document.title = 'SuperEletroLar — Tecnologia que transforma seu lar';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    if (viewHistory.length > 1) {
      viewHistory.pop();
      navigateTo(viewHistory[viewHistory.length - 1], false);
    }
  }

  /* ── SEO Schema ── */
  function updateProductSchema(products) {
    let script = document.getElementById('schema-products');
    if (!script) {
      script = document.createElement('script');
      script.id = 'schema-products';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          image: p.image,
          description: p.description,
          brand: { '@type': 'Brand', name: p.brand },
          offers: {
            '@type': 'Offer',
            price: p.price,
            priceCurrency: 'BRL',
            availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: p.rating,
            reviewCount: p.reviews,
          },
        },
      })),
    });
  }

  /* ── Toast ── */
  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  /* ── PWA ── */
  function initPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (!localStorage.getItem('sel-install-dismissed')) showInstallBanner();
    });

    window.addEventListener('online', () => document.getElementById('offline-badge')?.classList.remove('visible'));
    window.addEventListener('offline', () => document.getElementById('offline-badge')?.classList.add('visible'));
  }

  function showInstallBanner() {
    if (document.getElementById('install-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.className = 'install-banner';
    banner.innerHTML = `
      <p>📲 Instale o SuperEletroLar no seu celular!</p>
      <button class="btn" id="btn-install">Instalar</button>
      <button class="modal-close" id="btn-dismiss-install" aria-label="Fechar">✕</button>`;
    document.body.appendChild(banner);

    document.getElementById('btn-install')?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        banner.remove();
      }
    });
    document.getElementById('btn-dismiss-install')?.addEventListener('click', () => {
      localStorage.setItem('sel-install-dismissed', '1');
      banner.remove();
    });
  }

  /* ── Theme ── */
  function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    localStorage.setItem('sel-theme', html.dataset.theme);
  }

  /* ── Carousel ── */
  function initCarousel() {
    const scroll = document.getElementById('categories-scroll');
    const prev = document.getElementById('cat-prev');
    const next = document.getElementById('cat-next');
    if (!scroll) return;
    prev?.addEventListener('click', () => scroll.scrollBy({ left: -200, behavior: 'smooth' }));
    next?.addEventListener('click', () => scroll.scrollBy({ left: 200, behavior: 'smooth' }));

    document.getElementById('hero-prev')?.addEventListener('click', () => { goToHeroSlide(heroIndex - 1); startHeroAutoplay(); });
    document.getElementById('hero-next')?.addEventListener('click', () => { goToHeroSlide(heroIndex + 1); startHeroAutoplay(); });

    document.getElementById('hero-dots')?.addEventListener('click', (e) => {
      const dot = e.target.closest('[data-hero-dot]');
      if (dot) { goToHeroSlide(Number(dot.dataset.heroDot)); startHeroAutoplay(); }
    });

    const showcase = document.getElementById('showcase-track');
    if (showcase) {
      let showcaseTimer = setInterval(() => {
        if (showcase.scrollLeft + showcase.clientWidth >= showcase.scrollWidth - 10) {
          showcase.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          showcase.scrollBy({ left: 220, behavior: 'smooth' });
        }
      }, 4000);
      showcase.addEventListener('mouseenter', () => clearInterval(showcaseTimer));
    }
  }

  async function lookupCep(cep) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    try {
      const data = await api.getCep(digits);
      const street = document.getElementById('ck-street');
      const city = document.getElementById('ck-city');
      const state = document.getElementById('ck-state');
      if (street && data.street) street.value = data.street;
      if (city && data.city) city.value = data.city;
      if (state && data.state) state.value = data.state;
      document.getElementById('ck-number')?.focus();
    } catch {
      showToast('CEP não encontrado');
    }
  }

  /* ── Events ── */
  function bindEvents() {
    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', (e) => { e.preventDefault(); navigateTo(el.dataset.view); });
    });

    document.getElementById('btn-back')?.addEventListener('click', goBack);
    document.getElementById('brand-link')?.addEventListener('click', (e) => {
      e.preventDefault(); viewHistory = ['home']; navigateTo('home', false);
    });
    document.getElementById('btn-cart-header')?.addEventListener('click', () => navigateTo('cart'));
    document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);
    document.getElementById('btn-search')?.addEventListener('click', () => {
      document.getElementById('search-input')?.focus();
      navigateTo('home');
    });

    document.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const a = actionBtn.dataset.action;
        if (a === 'explore') { viewHistory = ['home']; navigateTo('home', false); }
        if (a === 'offers') navigateTo('offers');
        if (a === 'categories') navigateTo('categories');
      }
    });

    document.addEventListener('blur', (e) => {
      if (e.target.id === 'ck-cep') lookupCep(e.target.value);
    }, true);

    document.getElementById('search-input')?.addEventListener('input', async (e) => {
      const q = e.target.value;
      try {
        const results = q ? await api.getProducts({ search: q }) : PRODUCTS.slice(0, 8);
        renderProducts('products-grid', results);
      } catch {
        const results = PRODUCTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
        renderProducts('products-grid', results);
      }
    });

    document.addEventListener('click', async (e) => {
      const openProd = e.target.closest('[data-open-product]');
      if (openProd) { openProduct(Number(openProd.dataset.openProduct)); return; }

      const add = e.target.closest('[data-add]');
      if (add) { addToCart(Number(add.dataset.add)); return; }

      const buyNow = e.target.closest('[data-buy-now]');
      if (buyNow) { addToCart(Number(buyNow.dataset.buyNow)); navigateTo('checkout'); return; }

      const fav = e.target.closest('[data-fav]');
      if (fav) {
        const id = Number(fav.dataset.fav);
        const idx = favorites.indexOf(id);
        if (idx >= 0) { favorites.splice(idx, 1); showToast('Removido dos favoritos'); }
        else { favorites.push(id); showToast('❤️ Adicionado aos favoritos'); }
        saveFavorites();
        renderAll();
        return;
      }

      const cat = e.target.closest('[data-category]');
      if (cat) {
        activeCategory = cat.dataset.category;
        const c = CATEGORIES.find(x => x.id === activeCategory);
        document.getElementById('category-products-title').textContent = `${c?.icon || ''} ${c?.name || ''}`;
        renderProducts('category-products-grid', PRODUCTS.filter(p => p.category === activeCategory));
        navigateTo('categories');
        return;
      }

      if (e.target.id === 'btn-go-checkout') { navigateTo('checkout'); return; }

      if (e.target.id === 'btn-orders-login') { showAuthModal('login'); return; }

      if (e.target.id === 'ck-next-1') {
        const name = document.getElementById('ck-name')?.value?.trim();
        const email = document.getElementById('ck-email')?.value?.trim();
        if (!name || !email) { showToast('Preencha nome e e-mail'); return; }
        checkoutStep = 2; renderCheckout(); return;
      }
      if (e.target.id === 'ck-next-2') {
        const cep = document.getElementById('ck-cep')?.value?.trim();
        const street = document.getElementById('ck-street')?.value?.trim();
        const number = document.getElementById('ck-number')?.value?.trim();
        if (!cep || !street || !number) { showToast('Preencha CEP, rua e número'); return; }
        checkoutStep = 3; renderCheckout(); return;
      }
      if (e.target.id === 'ck-pay') { await processPayment(); return; }

      const shipOpt = e.target.closest('[data-shipping]');
      if (shipOpt) {
        selectedShipping = shipOpt.dataset.shipping;
        document.querySelectorAll('.shipping-option').forEach(o => o.classList.remove('selected'));
        shipOpt.classList.add('selected');
        renderCheckout();
        return;
      }

      const thumb = e.target.closest('[data-gallery-thumb]');
      if (thumb && currentProduct) {
        const idx = Number(thumb.dataset.galleryThumb);
        const images = currentProduct.images?.length ? currentProduct.images : [currentProduct.image];
        const main = document.getElementById('gallery-main');
        if (main && images[idx]) {
          main.src = images[idx];
          document.querySelectorAll('[data-gallery-thumb]').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
        }
        return;
      }

      const showcase = e.target.closest('.showcase-item');
      if (showcase) {
        activeCategory = showcase.dataset.category;
        const c = CATEGORIES.find(x => x.id === activeCategory);
        document.getElementById('category-products-title').textContent = `${c?.icon || ''} ${c?.name || ''}`;
        renderProducts('category-products-grid', PRODUCTS.filter(p => p.category === activeCategory));
        navigateTo('categories');
        return;
      }

      if (e.target.id === 'btn-copy-pix') {
        navigator.clipboard?.writeText(currentPayment?.pixCode || '');
        showToast('📋 Código Pix copiado!');
        return;
      }

      if (e.target.id === 'btn-confirm-pix') {
        try {
          const result = await api.confirmPixPayment(currentPayment.id);
          currentOrder.trackingCode = result.trackingCode;
          cart = []; saveCart(); updateCartBadge();
          checkoutStep = 4; renderCheckout();
          showToast('🎉 Pagamento Pix confirmado!');
        } catch (err) { showToast(`❌ ${err.message}`); }
        return;
      }

      const minus = e.target.closest('[data-qty-minus]');
      if (minus) { updateQty(Number(minus.dataset.qtyMinus), -1); return; }
      const plus = e.target.closest('[data-qty-plus]');
      if (plus) { updateQty(Number(plus.dataset.qtyPlus), 1); return; }
      const remove = e.target.closest('[data-remove]');
      if (remove) { removeFromCart(Number(remove.dataset.remove)); return; }

      const payOpt = e.target.closest('.payment-option');
      if (payOpt) {
        document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        payOpt.classList.add('selected');
        const cardFields = document.getElementById('card-fields');
        if (cardFields) cardFields.style.display = payOpt.dataset.payment === 'card' ? 'block' : 'none';
        return;
      }

      if (e.target.id === 'btn-logout') { api.logout(); updateAccountView(); showToast('Você saiu da conta'); return; }

      const authTab = e.target.closest('[data-auth-tab]');
      if (authTab) {
        const modal = document.getElementById('auth-modal');
        if (modal) { modal.remove(); showAuthModal(authTab.dataset.authTab); }
        return;
      }
    });

    document.addEventListener('submit', async (e) => {
      if (e.target.id === 'auth-form') {
        e.preventDefault();
        const modal = document.getElementById('auth-modal');
        const tab = modal?.dataset.tab || 'login';
        const errorEl = document.getElementById('auth-error');
        try {
          if (tab === 'login') {
            await api.login(
              document.getElementById('auth-email').value,
              document.getElementById('auth-password').value
            );
          } else {
            await api.register(
              document.getElementById('auth-name').value,
              document.getElementById('auth-email').value,
              document.getElementById('auth-password').value
            );
          }
          modal?.remove();
          updateAccountView();
          showToast('✅ Bem-vindo à SuperEletroLar!');
        } catch (err) {
          if (errorEl) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
        }
      }

      if (e.target.id === 'track-form') {
        e.preventDefault();
        const code = document.getElementById('track-code')?.value;
        try {
          const order = await api.trackOrder(code);
          document.getElementById('track-result').innerHTML = `
            <div class="checkout-panel" style="margin-top:1rem">
              <h3>📦 Pedido ${order.trackingCode}</h3>
              <p>Status: <strong>${order.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}</strong></p>
              <p>Data: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
              <p>Total: ${formatPrice(order.total)}</p>
            </div>`;
        } catch (err) {
          document.getElementById('track-result').innerHTML = `<p class="form-error">${err.message}</p>`;
        }
      }
    });

    document.querySelectorAll('#view-account .btn-primary, #view-account .btn-outline').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.textContent.includes('Entrar')) showAuthModal('login');
        if (btn.textContent.includes('Cadastrar')) showAuthModal('register');
      });
    });
  }

  function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    saveCart(); updateCartBadge(); renderCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart(); updateCartBadge(); renderCart();
    showToast('Item removido');
  }

  /* ── Init ── */
  async function init() {
    const savedTheme = localStorage.getItem('sel-theme');
    if (savedTheme) document.documentElement.dataset.theme = savedTheme;

    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam) currentView = viewParam;

    bindEvents();
    initCarousel();
    initPWA();
    updateCartBadge();

    document.getElementById('app-loading')?.classList.remove('hidden');
    await loadData();
    document.getElementById('app-loading')?.classList.add('hidden');

    if (viewParam) navigateTo(viewParam, false);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
