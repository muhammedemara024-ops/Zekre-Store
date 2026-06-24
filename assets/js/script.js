const slider = document.querySelector(".hero-slider");
const next = document.getElementById("next");
const prev = document.getElementById("prev");

const images = [
  "assets/images/bg.jpg",
  "assets/images/bg2.jpg",
  "assets/images/bg3.jpg",
];

if (slider && next && prev) {
  let index = 0;

  function changeSlide() {
    slider.style.opacity = 0;
    setTimeout(() => {
      slider.style.backgroundImage = `url(${images[index]})`;
      slider.style.opacity = 1;
    }, 300);
  }

  next.addEventListener("click", () => {
    index = (index + 1) % images.length;
    changeSlide();
  });

  prev.addEventListener("click", () => {
    index = (index - 1 + images.length) % images.length;
    changeSlide();
  });

  changeSlide();

  setInterval(() => {
    index = (index + 1) % images.length;
    changeSlide();
  }, 4000);
}

const cartBtn = document.getElementById("cart-btn");
const cartCountEl = document.getElementById("cart-count");
const miniCart = document.getElementById("mini-cart");
const miniCartBody = document.getElementById("mini-cart-body");
const closeMini = document.getElementById("close-mini");
const clearCartBtn = document.getElementById("clear-cart");
const checkoutBtn = document.getElementById("checkout");
const loginLink = document.querySelector(".auth-link");

// Helper to load cart is now in common.js (getCart)
function renderMiniCart() {
  const items = getCart();
  if (!items.length) {
    miniCartBody.innerHTML = '<p class="empty">Your cart is empty.</p>';
    return;
  }
  miniCartBody.innerHTML = "";
  items.forEach((it) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<img src="${it.image}" alt="${it.name}"><div style="flex:1"><strong>${it.name}</strong><div style="color:#666">Qty: ${it.quantity} • $${it.price.toFixed(2)}</div></div><button data-id="${it.id}" class="remove">Remove</button>`;
    miniCartBody.appendChild(div);
  });
}

if (cartBtn) {
  cartBtn.addEventListener("click", () => {
    miniCart.classList.toggle("open");
    miniCart.setAttribute("aria-hidden", !miniCart.classList.contains("open"));
    renderMiniCart();
  });
}
if (closeMini) {
  closeMini.addEventListener("click", () => {
    miniCart.classList.remove("open");
    miniCart.setAttribute("aria-hidden", "true");
  });
}
if (clearCartBtn) {
  clearCartBtn.addEventListener("click", () => {
    saveCart([]);
    renderMiniCart();
  });
}
if (miniCartBody) {
  miniCartBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove")) {
      const id = e.target.getAttribute("data-id");
      let items = getCart();
      items = items.filter((i) => i.id != id);
      saveCart(items);
      renderMiniCart();
    }
  });
}
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    const user = localStorage.getItem("user");
    if (!user) {
      const go = confirm(
        "You must be logged in to checkout. Go to the Login page?",
      );
      if (go) window.location.href = "login.html";
      return;
    }
    // proceed to checkout flow
    window.location.href = "checkout.html";
  });
}

// helper to add product from other parts of site
window.addToCart = function addToCart(product) {
  addItemToCart(product);
  renderMiniCart();
};

// Listen for updates from other scripts (like cart.js)
window.addEventListener("cartUpdated", () => {
  renderMiniCart();
  updateCartCountGlobal();
});

// Auth state: show login link and if user exists replace it with username + logout
function renderAuthState() {
  const raw = localStorage.getItem("user");
  const navActions = document.querySelector(".nav-actions");
  
  // Remove existing auth elements
  const existingAuth = navActions.querySelectorAll(".auth-link, .auth-user");
  existingAuth.forEach(el => el.remove());
  
  if (!raw) {
    // Show login link
    const loginLink = document.createElement("a");
    loginLink.href = "login.html";
    loginLink.className = "icon-btn auth-link";
    loginLink.setAttribute("aria-label", "Login");
    loginLink.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 21v-2a4 4 0 0 0-4-4H8" stroke="currentColor" stroke-width="1.4"
          stroke-linecap="round" stroke-linejoin="round" />
        <path d="M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" stroke-width="1.4"
          stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="auth-text">Login</span>
    `;
    navActions.appendChild(loginLink);
    return;
  }
  
  // User is logged in - show user menu
  const user = JSON.parse(raw);
  const userDiv = document.createElement("div");
  userDiv.className = "auth-user";
  userDiv.style.display = "flex";
  userDiv.style.alignItems = "center";
  userDiv.style.gap = "1rem";
  
  userDiv.innerHTML = `
    <span style="color: var(--primary-color); font-weight: 500; font-size: 0.95rem;">
      ${user.name}
    </span>
    <button id="logout-btn" class="icon-btn" style="background: var(--primary-color); color: white; padding: 0.5rem 1rem; border-radius: 5px; font-size: 0.9rem;">
      Logout
    </button>
  `;
  navActions.appendChild(userDiv);
  
  document.getElementById("logout-btn").addEventListener("click", () => {
    // Clear user-specific data
    localStorage.removeItem("user");
    localStorage.removeItem("wishlist");
    localStorage.removeItem("cart");
    localStorage.removeItem("islogin");
    
    // Reset counts
    updateCartCountGlobal();
    updateWishlistCountGlobal();
    
    // Show success message
    alert("You have been logged out successfully!");
    
    // Redirect to home and re-render
    window.location.href = "index.html";
  });
}

// init
updateCartCountGlobal();
renderAuthState();
renderMiniCart();
