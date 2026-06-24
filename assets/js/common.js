/**
 * Common Utility Functions
 * Centralizes duplicate logic for Cart Management
 */

// Key for LocalStorage
const CART_KEY = "cart";

// Load Cart
function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  let items = raw ? JSON.parse(raw) : [];

  // Sanitize paths from legacy bugs (double assets/)
  if (items.length) {
    items = items.map((item) => {
      if (item.image && item.image.startsWith("assets/assets/")) {
        item.image = item.image.replace("assets/assets/", "assets/");
      }
      return item;
    });
  }
  return items;
}

// Save Cart and sync to user account
function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartCountGlobal();
  
  // Save to user account if logged in
  syncCartToUser(items);
}

// Sync cart to user account
function syncCartToUser(items) {
  const userRaw = localStorage.getItem("user");
  if (!userRaw) return;
  
  const user = JSON.parse(userRaw);
  user.items = items;
  localStorage.setItem("user", JSON.stringify(user));
  
  // Update in users array
  const usersRaw = localStorage.getItem("users");
  if (!usersRaw) return;
  
  const users = JSON.parse(usersRaw);
  const userIndex = users.findIndex(u => u.email === user.email);
  if (userIndex !== -1) {
    users[userIndex].items = items;
    localStorage.setItem("users", JSON.stringify(users));
  }
}

// Update Cart Count (Badge)
function updateCartCountGlobal() {
  const cartCountEl = document.getElementById("cart-count");
  if (cartCountEl) {
    const items = getCart();
    const total = items.reduce(
      (sum, item) => sum + (item.quantity || item.qty || 1),
      0,
    );
    cartCountEl.textContent = total;
  }
}

// Add Item to Cart (Shared Logic)
// item: { id, name, price, image, quantity, maxStock }
function addItemToCart(product) {
  const items = getCart();
  const existing = items.find((i) => i.id === product.id);

  if (existing) {
    if (product.maxStock && existing.quantity >= product.maxStock) {
      alert("Max stock reached"); // Simple alert, can be improved
      return;
    }
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    items.push({
      ...product,
      quantity: 1,
    });
  }

  saveCart(items);

  // Dispatch event for other scripts to listen to
  window.dispatchEvent(new Event("cartUpdated"));
}

// Expose globally
window.getCart = getCart;
window.saveCart = saveCart;
window.addItemToCart = addItemToCart;
window.updateCartCountGlobal = updateCartCountGlobal;

// Initialize Count on Load
document.addEventListener("DOMContentLoaded", () => {
  updateCartCountGlobal();
  updateWishlistCountGlobal(); // Init wishlist count
  // Dispatch event to update wishlist UI if needed
  window.dispatchEvent(new Event("wishlistUpdated"));
});

// Listen for wishlist updates
window.addEventListener("wishlistUpdated", updateWishlistCountGlobal);

/* ================================
   Wishlist Management (User-Specific)
   ================================ */

const WISHLIST_KEY = "wishlist";

function getWishlist() {
  const raw = localStorage.getItem(WISHLIST_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveWishlist(items) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  
  // Save to user account if logged in
  syncWishlistToUser(items);
  
  window.dispatchEvent(new Event("wishlistUpdated"));
}

// Sync wishlist to user account
function syncWishlistToUser(items) {
  const userRaw = localStorage.getItem("user");
  if (!userRaw) return;
  
  const user = JSON.parse(userRaw);
  user.wishlist = items;
  localStorage.setItem("user", JSON.stringify(user));
  
  // Update in users array
  const usersRaw = localStorage.getItem("users");
  if (!usersRaw) return;
  
  const users = JSON.parse(usersRaw);
  const userIndex = users.findIndex(u => u.email === user.email);
  if (userIndex !== -1) {
    users[userIndex].wishlist = items;
    localStorage.setItem("users", JSON.stringify(users));
  }
}

function toggleWishlist(product) {
  let items = getWishlist();
  const existingIndex = items.findIndex((i) => i.id == product.id);

  if (existingIndex > -1) {
    // Remove
    items.splice(existingIndex, 1);
  } else {
    // Add
    items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || product.images[0], // Handle different data structures
      description: product.description || "",
    });
  }
  saveWishlist(items);
  return existingIndex === -1; // Returns true if added, false if removed
}

function isInWishlist(id) {
  const items = getWishlist();
  return items.some((i) => i.id == id);
}

function updateWishlistCountGlobal() {
  const badge = document.getElementById("wishlist-count");
  if (!badge) return;
  const items = getWishlist();
  badge.textContent = items.length;
}

// Expose globally
window.getWishlist = getWishlist;
window.saveWishlist = saveWishlist;
window.toggleWishlist = toggleWishlist;
window.isInWishlist = isInWishlist;
window.updateWishlistCountGlobal = updateWishlistCountGlobal;

/* ================================
   Theme Toggle Management
   ================================ */

function initThemeToggle() {
  const checkbox = document.getElementById("themecheckbox");
  const root = document.documentElement;

  if (!checkbox) return;

  // Load saved theme
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    root.classList.add("dark");
    checkbox.checked = true;
  } else {
    root.classList.remove("dark");
    checkbox.checked = false;
  }

  // Toggle theme on click
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  });
}

/* ================================
   Navbar Scroll Management
   ================================ */

function initNavbarScroll() {
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (nav) {
      nav.classList.toggle("scrolled", window.scrollY > 10);
    }
  });
}

// Initialize theme and navbar on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initNavbarScroll();
});

/* ================================
   PRODUCT DATA CACHING
   ================================ */

let productsCache = null;

async function fetchProducts() {
  if (productsCache) {
    return productsCache;
  }

  try {
    const response = await fetch("assets/data/products.json");
    productsCache = await response.json();
    return productsCache;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/* ================================
   DOM UTILITIES
   ================================ */

function safeQuerySelector(selector, parent = document) {
  return parent.querySelector(selector);
}

function safeQuerySelectorAll(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

function createElementWithClass(tag, className) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  return element;
}

/* ================================
   PRODUCT CARD COMPONENT
   ================================ */

/**
 * Render a product card component
 * @param {Object} product - Product object with id, name, price, images
 * @param {Object} options - Configuration options
 * @param {string} options.context - Context: 'products', 'cart', 'wishlist'
 * @param {string} options.wishlistBtnId - Custom ID for wishlist button
 * @param {boolean} options.isWished - Whether product is in wishlist
 * @param {Function} options.onWishlistClick - Custom wishlist click handler
 * @param {Function} options.onCartClick - Custom cart click handler
 * @param {Function} options.onCardClick - Custom card click handler
 * @returns {HTMLElement} - The product card element
 */
function renderProductCard(product, options = {}) {
  const {
    context = 'products',
    wishlistBtnId = `wish-btn-${product.id}`,
    isWished = false,
    onWishlistClick = null,
    onCartClick = null,
    onCardClick = null,
  } = options;

  const col = createElementWithClass('div', 'col-lg-3 col-md-6 mb-4');
  
  const imageUrl = product.images ? product.images[0] : product.image;
  const priceDisplay = product.price ? (typeof product.price === 'number' ? product.price.toFixed(2) : product.price) : '0.00';
  
  // Determine wishlist button state based on context
  let wishlistClass = 'btn-outline-danger';
  let wishlistIcon = 'fa-regular';
  
  if (context === 'wishlist') {
    // In wishlist context, always show as wished (red)
    wishlistClass = 'btn-danger text-white';
    wishlistIcon = 'fa-solid';
  } else if (isWished) {
    wishlistClass = 'btn-danger text-white';
    wishlistIcon = 'fa-solid';
  }

  col.innerHTML = `
    <div class="box p-3 bg-light rounded-4 h-100 shadow-sm" style="cursor: pointer;">
      <div class="cont position-relative overflow-hidden mb-3">
        <figure class="m-0">
          <img src="${imageUrl}" class="w-100 rounded-3" alt="${product.name}" style="height: 250px; object-fit: cover;" />
        </figure>
        <div class="layer d-flex justify-content-evenly align-items-center position-absolute top-0 start-0 w-100 h-100 opacity-0 bg-dark bg-opacity-25 transition-all">
          <button class="btn btn-light btn-sm rounded-circle eye-btn"><i class="fa-solid fa-eye"></i></button>
        </div>
      </div>
      <div class="text-content d-flex justify-content-between align-items-center">
        <div>
          <h3 class="h6 fw-bold mb-1" style="color: #333;">${product.name}</h3>
          <p class="text-muted fw-bold small mb-0">$${priceDisplay}</p>
        </div>
        <div class="d-flex gap-2">
          <button
            id="${wishlistBtnId}"
            class="btn ${wishlistClass} btn-sm rounded-3 wishlist-btn"
            data-product-id="${product.id}">
            <i class="${wishlistIcon} fa-heart"></i>
          </button>
          <button class="btn btn-dark btn-sm rounded-3 px-3 cart-btn" data-product-id="${product.id}">
            <i class="fa-solid fa-cart-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  const box = col.querySelector('.box');
  const eyeBtn = col.querySelector('.eye-btn');
  const wishlistBtn = col.querySelector('.wishlist-btn');
  const cartBtn = col.querySelector('.cart-btn');

  // Card click handler
  if (onCardClick) {
    box.addEventListener('click', onCardClick);
  } else {
    box.addEventListener('click', () => {
      window.location.href = `product-details.html?id=${product.id}`;
    });
  }

  // Eye button handler
  eyeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = `product-details.html?id=${product.id}`;
  });

  // Wishlist button handler
  if (onWishlistClick) {
    wishlistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onWishlistClick(product, wishlistBtn);
    });
  }

  // Cart button handler
  if (onCartClick) {
    cartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onCartClick(product);
    });
  }

  return col;
}

/**
 * Update wishlist button state
 * @param {HTMLElement} btn - The wishlist button element
 * @param {boolean} isWished - Whether product is in wishlist
 */
function updateWishlistButtonState(btn, isWished) {
  if (isWished) {
    btn.classList.remove('btn-outline-danger');
    btn.classList.add('btn-danger', 'text-white');
    btn.querySelector('i').classList.replace('fa-regular', 'fa-solid');
  } else {
    btn.classList.add('btn-outline-danger');
    btn.classList.remove('btn-danger', 'text-white');
    btn.querySelector('i').classList.replace('fa-solid', 'fa-regular');
  }
}

// Expose globally
window.fetchProducts = fetchProducts;
window.renderProductCard = renderProductCard;
window.updateWishlistButtonState = updateWishlistButtonState;
window.safeQuerySelector = safeQuerySelector;
window.safeQuerySelectorAll = safeQuerySelectorAll;
window.createElementWithClass = createElementWithClass;
