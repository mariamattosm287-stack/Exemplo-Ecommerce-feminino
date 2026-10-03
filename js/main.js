/* ========================================
   ESSENCE E-COMMERCE — JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAnnouncementBar();
  initNavbar();
  initHeroSlider();
  initCart();
  initMobileMenu();
  initSearchOverlay();
  initScrollAnimations();
  initProductPage();
});

/* ========================================
   ANNOUNCEMENT BAR
   ======================================== */
function initAnnouncementBar() {
  const announcements = [
    'EASY RETURNS AND EXCHANGES',
    'FREE SHIPPING ON ORDERS OVER $75',
    'NEW ARRIVALS JUST DROPPED ✨',
    'USE CODE ESSENCE20 FOR 20% OFF'
  ];
  let currentIndex = 0;
  const textEl = document.getElementById('announcement-text');
  if (!textEl) return;

  const prevBtn = document.querySelector('.announcement-bar__nav--prev');
  const nextBtn = document.querySelector('.announcement-bar__nav--next');

  function showAnnouncement(index) {
    textEl.style.opacity = '0';
    textEl.style.transform = 'translateY(8px)';
    setTimeout(() => {
      currentIndex = (index + announcements.length) % announcements.length;
      textEl.textContent = announcements[currentIndex];
      textEl.style.opacity = '1';
      textEl.style.transform = 'translateY(0)';
    }, 200);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => showAnnouncement(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => showAnnouncement(currentIndex + 1));

  // Auto-rotate
  setInterval(() => showAnnouncement(currentIndex + 1), 5000);

  // Apply transition
  textEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
}

/* ========================================
   NAVBAR
   ======================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

/* ========================================
   HERO SLIDER
   ======================================== */
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero__slide');
  const dots = document.querySelectorAll('.hero__dot');
  const prevBtn = document.querySelector('.hero__nav-btn--prev');
  const nextBtn = document.querySelector('.hero__nav-btn--next');

  if (slides.length === 0) return;

  let currentSlide = 0;
  let slideInterval;

  function goToSlide(index) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide]?.classList.remove('active');
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide]?.classList.add('active');
  }

  function startAutoplay() {
    slideInterval = setInterval(() => goToSlide(currentSlide + 1), 6000);
  }

  function resetAutoplay() {
    clearInterval(slideInterval);
    startAutoplay();
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goToSlide(currentSlide - 1);
      resetAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToSlide(currentSlide + 1);
      resetAutoplay();
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      goToSlide(parseInt(dot.dataset.slide));
      resetAutoplay();
    });
  });

  startAutoplay();
}

/* ========================================
   CART
   ======================================== */
let cart = [];

function initCart() {
  const cartBtn = document.getElementById('cart-btn');
  const cartClose = document.getElementById('cart-close');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartSidebar = document.getElementById('cart-sidebar');

  if (cartBtn) {
    cartBtn.addEventListener('click', () => openCart());
  }

  if (cartClose) {
    cartClose.addEventListener('click', () => closeCart());
  }

  if (cartOverlay) {
    cartOverlay.addEventListener('click', () => closeCart());
  }

  // Load cart from localStorage
  const saved = localStorage.getItem('essence_cart');
  if (saved) {
    cart = JSON.parse(saved);
    updateCartUI();
  }
}

function openCart() {
  document.getElementById('cart-overlay')?.classList.add('open');
  document.getElementById('cart-sidebar')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.getElementById('cart-sidebar')?.classList.remove('open');
  document.body.style.overflow = '';
}

function addToCart(name, price, image) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, image, qty: 1 });
  }
  saveCart();
  updateCartUI();
  openCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('essence_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const cartCount = document.getElementById('cart-count');
  const cartBody = document.getElementById('cart-body');
  const cartSubtotal = document.getElementById('cart-subtotal');

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (cartCount) cartCount.textContent = totalItems;

  if (cartBody) {
    if (cart.length === 0) {
      cartBody.innerHTML = '<div class="cart-sidebar__empty"><p>Your cart is empty</p></div>';
    } else {
      cartBody.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
          <div class="cart-item__image">
            <img src="${item.image}" alt="${item.name}">
          </div>
          <div>
            <div class="cart-item__name">${item.name}</div>
            <div class="cart-item__variant">Size: M · Qty: ${item.qty}</div>
            <div class="cart-item__price">$${(item.price * item.qty).toFixed(2)}</div>
            <button onclick="removeFromCart(${index})" style="font-size:11px;color:#999;margin-top:4px;text-decoration:underline;cursor:pointer;background:none;border:none;">Remove</button>
          </div>
        </div>
      `).join('');
    }
  }

  if (cartSubtotal) {
    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  }
}

/* ========================================
   PRODUCTS CAROUSEL
   ======================================== */
function scrollProducts(direction) {
  const track = document.getElementById('products-track');
  if (!track) return;
  const cardWidth = track.querySelector('.product-card')?.offsetWidth || 280;
  track.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' });
}

/* ========================================
   MOBILE MENU
   ======================================== */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const close = document.getElementById('mobile-close');
  const menu = document.getElementById('mobile-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (close && menu) {
    close.addEventListener('click', () => {
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
}

/* ========================================
   SEARCH OVERLAY
   ======================================== */
function initSearchOverlay() {
  const searchBtn = document.getElementById('search-btn');
  const searchClose = document.getElementById('search-close');
  const searchOverlay = document.getElementById('search-overlay');

  if (searchBtn && searchOverlay) {
    searchBtn.addEventListener('click', () => {
      searchOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      const input = searchOverlay.querySelector('input');
      if (input) setTimeout(() => input.focus(), 300);
    });
  }

  if (searchClose && searchOverlay) {
    searchClose.addEventListener('click', () => {
      searchOverlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  if (searchOverlay) {
    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) {
        searchOverlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // ESC key closes search
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchOverlay?.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

/* ========================================
   SCROLL ANIMATIONS
   ======================================== */
function initScrollAnimations() {
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  fadeEls.forEach(el => observer.observe(el));
}

/* ========================================
   PRODUCT DETAIL PAGE
   ======================================== */
function initProductPage() {
  // This runs on the product page
  // Size and color selectors are handled via inline onclick
}

function changeMainImage(thumbEl, src) {
  const mainImg = document.getElementById('main-product-image');
  if (!mainImg) return;

  // Remove active from all thumbnails
  document.querySelectorAll('.product-detail__thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');

  // Fade transition
  mainImg.style.opacity = '0';
  setTimeout(() => {
    mainImg.src = src;
    mainImg.style.opacity = '1';
  }, 200);
  mainImg.style.transition = 'opacity 0.3s ease';
}

function selectColor(el, colorName) {
  document.querySelectorAll('.product-detail__color-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  const nameEl = document.getElementById('selected-color-name');
  if (nameEl) nameEl.textContent = colorName;
}

function selectSize(el) {
  document.querySelectorAll('.product-detail__size-btn').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

function changeQty(delta) {
  const qtyEl = document.getElementById('qty-value');
  if (!qtyEl) return;
  let qty = parseInt(qtyEl.textContent) + delta;
  if (qty < 1) qty = 1;
  if (qty > 10) qty = 10;
  qtyEl.textContent = qty;
}
