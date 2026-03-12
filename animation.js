// ====================================================
// QUALITY ROOTS — PROMO ANIMATION
// Products per cycle: 1 (dramatic solo spotlight)
// ====================================================

const PRODUCTS_PER_CYCLE = 1;

let PRODUCTS = [];
let cycleRunning = false;

// ---- Product Loading ----

async function loadProducts() {
  try {
    const response = await fetch('./products.json', { cache: 'no-store' });
    const data = await response.json();
    PRODUCTS = data.products || [];
  } catch (err) {
    console.error('Failed to load products.json:', err);
    PRODUCTS = [];
  }

  if (PRODUCTS.length === 0) {
    console.warn('No products found in products.json');
    return;
  }

  startCycle(0);
}

// ---- Batch Helpers ----

function getBatch(batchIndex) {
  const start = (batchIndex * PRODUCTS_PER_CYCLE) % PRODUCTS.length;
  const batch = [];
  for (let i = 0; i < PRODUCTS_PER_CYCLE; i++) {
    batch.push(PRODUCTS[(start + i) % PRODUCTS.length]);
  }
  return batch;
}

// ---- DOM Rendering ----

function renderBatch(products) {
  const container = document.getElementById('products-container');
  container.innerHTML = '';

  products.forEach(function(product, index) {
    const origPrice = parseFloat(product.price) || 0;
    const currPrice = parseFloat(product.discounted_price) || origPrice;
    const saveAmt = origPrice - currPrice;
    const savePercent = origPrice > 0 ? Math.round((saveAmt / origPrice) * 100) : 0;

    const slot = document.createElement('div');
    slot.className = 'product-slot';
    slot.setAttribute('data-index', index);

    // Build image element
    const imageCol = document.createElement('div');
    imageCol.className = 'prod-image-col';

    const img = document.createElement('img');
    img.className = 'prod-image';
    img.src = product.image_url || '';
    img.alt = product.name || 'Product';
    imageCol.appendChild(img);

    // Build info column
    const infoCol = document.createElement('div');
    infoCol.className = 'prod-info-col';

    const catEl = document.createElement('div');
    catEl.className = 'prod-category';
    catEl.textContent = product.category || 'Premium Cannabis';

    const nameEl = document.createElement('div');
    nameEl.className = 'prod-name';
    nameEl.textContent = product.name || '';

    const strainEl = document.createElement('div');
    strainEl.className = 'prod-strain';
    var strainText = product.strain || '';
    if (product.unit_weight && product.unit_weight_unit) {
      strainText += (strainText ? ' | ' : '') + product.unit_weight + product.unit_weight_unit;
    }
    strainEl.textContent = strainText;

    const priceContainer = document.createElement('div');
    priceContainer.className = 'price-container';

    const oldPriceEl = document.createElement('span');
    oldPriceEl.className = 'old-price';
    oldPriceEl.textContent = '$' + origPrice.toFixed(2);

    const newPriceEl = document.createElement('span');
    newPriceEl.className = 'new-price';
    newPriceEl.textContent = '$' + currPrice.toFixed(2);

    priceContainer.appendChild(oldPriceEl);
    priceContainer.appendChild(newPriceEl);

    if (saveAmt > 0) {
      const badge = document.createElement('div');
      badge.className = 'save-badge';
      badge.textContent = 'SAVE ' + savePercent + '%';
      priceContainer.appendChild(badge);
    }

    infoCol.appendChild(catEl);
    infoCol.appendChild(nameEl);
    infoCol.appendChild(strainEl);
    infoCol.appendChild(priceContainer);

    slot.appendChild(imageCol);
    slot.appendChild(infoCol);
    container.appendChild(slot);
  });
}

// ---- Animation Cycle ----

function startCycle(batchIndex) {
  var batch = getBatch(batchIndex);
  renderBatch(batch);
  animateCycle(batchIndex);
}

function animateCycle(batchIndex) {
  var img = document.querySelector('.prod-image');
  var cat = document.querySelector('.prod-category');
  var nameEl = document.querySelector('.prod-name');
  var strain = document.querySelector('.prod-strain');
  var oldPrice = document.querySelector('.old-price');
  var newPrice = document.querySelector('.new-price');
  var badge = document.querySelector('.save-badge');

  // Guard — elements must exist
  if (!img || !nameEl) {
    console.warn('Product elements not found, skipping cycle');
    return;
  }

  // Set initial hidden states
  var allEls = [img, cat, nameEl, strain, oldPrice, newPrice];
  if (badge) allEls.push(badge);

  gsap.set(allEls, { autoAlpha: 0, y: 60 });
  gsap.set(img, { scale: 0.75, rotation: -8 });
  gsap.set(newPrice, { scale: 0.5 });
  if (badge) gsap.set(badge, { scale: 0, rotation: -30 });

  var tl = gsap.timeline({
    onComplete: function() {
      startCycle(batchIndex + 1);
    }
  });

  // ---- PHASE 1: ENTRANCE (0 – 3s) ----
  tl.to(img, { autoAlpha: 1, scale: 1, rotation: 0, y: 0, duration: 1.4, ease: 'expo.out' }, 0);
  tl.to(cat, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.3);
  tl.to(nameEl, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.5);
  tl.to(strain, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.7);

  // Old price slides in
  tl.to(oldPrice, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 1.0);

  // Slash effect — add CSS class to trigger the ::after line
  tl.call(function() {
    var el = document.querySelector('.old-price');
    if (el) el.classList.add('slashed');
  }, null, 1.8);

  // New price bursts in
  tl.to(newPrice, { autoAlpha: 1, y: 0, scale: 1.2, duration: 0.6, ease: 'back.out(1.7)' }, 2.0);
  tl.to(newPrice, { scale: 1, duration: 0.3, ease: 'power2.out' }, 2.6);

  // Badge pops
  if (badge) {
    tl.to(badge, { autoAlpha: 1, scale: 1, rotation: 12, duration: 0.7, ease: 'elastic.out(1, 0.5)' }, 2.2);
  }

  // ---- PHASE 2: LIVING MOMENT (3s – 7s) ----
  // Gentle float on the image
  tl.to(img, { y: -18, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 2.5);

  // Pulse the new price glow
  tl.to(newPrice, { textShadow: '0 0 40px rgba(34,197,94,0.9)', duration: 1, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 3.0);

  // ---- PHASE 3: EXIT (7.5s – 9s) ----
  var exitStart = 7.5;
  var exitTargets = [badge, newPrice, oldPrice, strain, nameEl, cat, img].filter(Boolean);
  tl.to(exitTargets, {
    autoAlpha: 0,
    y: -60,
    duration: 0.9,
    ease: 'power3.in',
    stagger: 0.08
  }, exitStart);
}

// ---- Boot ----
window.addEventListener('DOMContentLoaded', loadProducts);
