const PRODUCTS_PER_CYCLE = 1;

let PRODUCTS = [];

async function loadProducts() {
  try {
    const response = await fetch('./products.json');
    const data = await response.json();
    PRODUCTS = data.products || [];
  } catch (error) {
    console.error('Failed to load products.json:', error);
    PRODUCTS = [];
  }
  startCycle();
}

function getBatch(batchIndex) {
  const start = (batchIndex * PRODUCTS_PER_CYCLE) % Math.max(PRODUCTS.length, 1);
  const batch = [];
  for (let i = 0; i < PRODUCTS_PER_CYCLE; i++) {
    if (PRODUCTS.length > 0) {
      batch.push(PRODUCTS[(start + i) % PRODUCTS.length]);
    }
  }
  return batch;
}

function renderBatch(products) {
  const container = document.getElementById('products-container');
  container.innerHTML = '';

  products.forEach((product, index) => {
    const origPrice = parseFloat(product.price);
    const currPrice = parseFloat(product.discounted_price || product.price);
    const saveAmt = origPrice - currPrice;
    const savePercent = Math.round((saveAmt / origPrice) * 100);

    const productEl = document.createElement('div');
    productEl.className = 'product-slot';
    productEl.dataset.index = index;

    productEl.innerHTML = `
      <div class="prod-image-col">
        <img class="prod-image" src="${product.image_url}" alt="${product.name}">
      </div>
      <div class="prod-info-col">
        <div class="prod-category">${product.category || 'Premium Cannabis'}</div>
        <div class="prod-name">${product.name}</div>
        <div class="prod-strain">${product.strain || ''} ${product.unit_weight ? '| ' + product.unit_weight + product.unit_weight_unit : ''}</div>

        <div class="price-container">
          <span class="old-price">$${origPrice.toFixed(2)}</span>
          <span class="new-price">$${currPrice.toFixed(2)}</span>
          ${saveAmt > 0 ? `<div class="save-badge">SAVE ${savePercent}%</div>` : ''}
        </div>
      </div>
    `;

    container.appendChild(productEl);
  });
}

function animateCycle(batchIndex) {
  const batch = getBatch(batchIndex);
  if(batch.length === 0) return;

  renderBatch(batch);

  const tl = gsap.timeline({
    onComplete: () => animateCycle(batchIndex + 1)
  });

  // Target elements
  const image = document.querySelector('.prod-image');
  const cat = document.querySelector('.prod-category');
  const name = document.querySelector('.prod-name');
  const strain = document.querySelector('.prod-strain');
  const oldPrice = document.querySelector('.old-price');
  const newPrice = document.querySelector('.new-price');
  const badge = document.querySelector('.save-badge');

  // Set initial states
  gsap.set([image, cat, name, strain, oldPrice, newPrice, badge], { autoAlpha: 0, y: 50 });
  gsap.set(image, { scale: 0.8, rotation: -5 });
  gsap.set('.old-price::after', { scaleX: 0, opacity: 0 });
  if (badge) gsap.set(badge, { scale: 0, rotation: -30 });

  // Phase 1: Entrance
  tl.to(image, { autoAlpha: 1, scale: 1, rotation: 0, y: 0, duration: 1.5, ease: "expo.out" }, 0);
  tl.to(cat, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.2);
  tl.to(name, { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out" }, 0.4);
  tl.to(strain, { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out" }, 0.6);
  tl.to(oldPrice, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.8);

  // The dramatic slash
  tl.to('.old-price', { color: '#64748b', duration: 0.5 }, 1.5);

  tl.call(() => {
    const oldPriceEl = document.querySelector('.old-price');
    if(oldPriceEl) oldPriceEl.classList.add('slashed');
  }, null, 1.5);

  // Since CSS pseudo elements are tricky without CSSRulePlugin, let's inject a line directly in HTML for the slash. Wait, I wrote `::after` in CSS. Let's just animate the new price coming in dramatically to imply the slash.
  tl.to(newPrice, { autoAlpha: 1, y: 0, scale: 1.2, duration: 0.8, ease: "back.out(1.5)" }, 1.7);
  tl.to(newPrice, { scale: 1, duration: 0.4, ease: "power1.out" }, 2.5);

  if (badge) {
    tl.to(badge, { autoAlpha: 1, scale: 1, rotation: 15, duration: 0.6, ease: "elastic.out(1, 0.5)" }, 1.9);
  }

  // Phase 2: Living moment (floating effect)
  tl.to(image, { y: "-=15", duration: 3, ease: "sine.inOut", yoyo: true, repeat: 1 }, 1.5);

  // Phase 3: Exit
  const exitTime = 7.5;
  tl.to([image, cat, name, strain, oldPrice, newPrice, badge], { autoAlpha: 0, y: -50, duration: 1, ease: "power3.in", stagger: 0.1 }, exitTime);
}

// Quick CSS hack for the slash pseudo element
document.head.insertAdjacentHTML("beforeend", `<style>
.slashed .old-price::after { opacity: 1; transform: rotate(-15deg) scaleX(1); transition: transform 0.4s ease-out, opacity 0.1s; }
.old-price::after { opacity: 0; transform: rotate(-15deg) scaleX(0); }
</style>`);

// We'll add a simple tween to trigger the slash class
gsap.ticker.add(() => {
   // Use a tween on dummy object to trigger class if needed, but easier to just use standard DOM manipulation in GSAP callback
});

// Start
window.addEventListener('DOMContentLoaded', loadProducts);