// ==========================================
// CART MANAGEMENT SYSTEM
// ==========================================

class ShoppingCart {
  constructor() {
    this.cart = this.loadCart();
    this.products = [];
    this.init();
  }

  // Initialize the cart
  init() {
    this.loadProducts();
    this.setupEventListeners();
    this.updateCartUI();
    // Listen for global updates
    window.addEventListener("cartUpdated", () => {
      this.cart = getCart();
      this.updateCartUI();
    });
  }

  // Load products from JSON
  async loadProducts() {
    try {
      this.products = await window.fetchProducts();
      this.displayProducts();
    } catch (error) {
      console.error("Error loading products:", error);
    }
  }

  // Display Recommended products (Matching products.js UI)
  displayProducts() {
    const productGrid = document.getElementById("product-grid");
    if (!productGrid) return;

    // Cache for event handlers
    window.allProductsCache = this.products;

    // Filter random 4 products
    const recommended = this.products
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);

    productGrid.innerHTML = ""; // Clear existing content

    recommended.forEach((product) => {
      const isWished = window.isInWishlist(product.id);
      
      const card = window.renderProductCard(product, {
        context: 'cart',
        wishlistBtnId: `cart-wish-btn-${product.id}`,
        isWished: isWished,
        onWishlistClick: (product, btn) => {
          const added = window.toggleWishlist(product);
          window.updateWishlistButtonState(btn, added);
        },
        onCartClick: (product) => {
          this.addToCart(product.id);
        }
      });
      
      productGrid.appendChild(card);
    });
  }

  // Stub to handle wishlisting inside cart page if needed
  toggleWish(id, btn) {
    // Basic implementation or alert
    alert(
      "Please visit product details or shop page to manage wishlist fully.",
    );
  }

  // Setup event listeners
  setupEventListeners() {
    const checkoutBtn = document.getElementById("checkout-btn");
    const clearCartBtn = document.getElementById("clear-cart-page");

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => this.checkout());
    }
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", () => this.clearCart());
    }
  }

  // Add item to cart
  addToCart(productId) {
    const product = this.products.find((p) => p.id === productId);
    if (!product) return;

    addItemToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: `${product.images[0]}`,
      quantity: 1,
      maxStock: product.quantity,
    });
  }

  // Remove item from cart
  removeFromCart(productId) {
    let items = getCart();
    // Loose equality
    items = items.filter((i) => i.id != productId);
    saveCart(items);

    // UI Update: Animate removal
    const row = document.getElementById(`cart-item-${productId}`);
    if (row) {
      row.style.transition = "opacity 0.3s, transform 0.3s";
      row.style.opacity = "0";
      row.style.transform = "translateX(20px)";
      setTimeout(() => {
        row.remove();
        this.cart = items; // Update local state
        this.updateCartSummary();
        this.checkEmptyCart();
      }, 300);
    } else {
      this.cart = items;
      this.updateCartUI(); // Fallback
    }
  }

  // Change quantity (delta: +1 or -1)
  changeQuantity(productId, delta) {
    const item = this.cart.find((i) => i.id == productId);
    if (item) {
      const newQty = Number(item.quantity) + delta;
      this.updateQuantity(productId, newQty);
    }
  }

  // Update item quantity (Absolute value)
  updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    let items = getCart();
    const item = items.find((i) => i.id == productId);

    if (item) {
      item.quantity = Number(newQuantity);
      saveCart(items);
      this.cart = items; // Update local state

      // Targeted DOM Update (Ajax-like feel)
      const qtySpan = document.getElementById(`qty-${productId}`);
      if (qtySpan) {
        qtySpan.textContent = item.quantity;
      }
      this.updateCartSummary();
    }
  }

  // Check if empty and show message
  checkEmptyCart() {
    if (this.cart.length === 0) {
      this.updateCartItems(); // Re-renders the empty state message
    }
  }

  // Update cart UI
  updateCartUI() {
    this.updateCartItems();
    this.updateCartSummary();
  }

  // Update cart items display (Initial Render)
  updateCartItems() {
    const container = document.getElementById("cart-items-container");
    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5 bg-white rounded-3 shadow-sm">
            <i class="fa-solid fa-basket-shopping fa-3x text-muted mb-3"></i>
            <h3>Your cart is empty</h3>
            <p class="text-muted">Browse our collection and find your signature scent.</p>
            <a href="products.html" class="btn btn-primary mt-3">Start Shopping</a>
          </div>
      `;
      return;
    }

    container.innerHTML = this.cart
      .map(
        (item) => `
        <div class="card mb-3 border-0 shadow-sm overflow-hidden" id="cart-item-${item.id}">
            <div class="row g-0 align-items-center">
                <div class="col-md-2">
                    <img src="${item.image}" class="img-fluid rounded-start h-100 w-100" style="object-fit: cover; max-height: 120px;" alt="${item.name}">
                </div>
                <div class="col-md-10">
                    <div class="card-body d-flex justify-content-between align-items-center flex-wrap">
                        <div>
                            <h5 class="card-title mb-1">${item.name}</h5>
                            <p class="card-text text-primary fw-bold mb-0">$${item.price.toFixed(2)}</p>
                        </div>

                        <div class="d-flex align-items-center gap-3 mt-3 mt-md-0">
                            <div class="btn-group" role="group">
                                <!-- Use changeQuantity with static delta (+1/-1) so onclick doesn't go stale -->
                                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="cart.changeQuantity('${item.id}', -1)">-</button>
                                <span class="btn btn-outline-secondary btn-sm disabled fw-bold text-dark" style="width:40px; border-color: #6c757d;" id="qty-${item.id}">${item.quantity}</span>
                                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="cart.changeQuantity('${item.id}', 1)">+</button>
                            </div>
                            <button class="btn btn-outline-danger btn-sm rounded-circle" onclick="cart.removeFromCart('${item.id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
      )
      .join("");
  }

  // Update cart summary
  updateCartSummary() {
    const subtotal = this.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const subtotalElement = document.getElementById("subtotal");
    const totalElement = document.getElementById("total-price");

    if (subtotalElement) {
      subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    }
    if (totalElement) {
      totalElement.textContent = `$${subtotal.toFixed(2)}`;
    }
  }

  saveCart() {
    saveCart(this.cart); // Use common.js function
  }

  loadCart() {
    return getCart(); // Use common.js function
  }

  clearCart() {
    saveCart([]);
    this.cart = [];
    this.updateCartUI();
  }

  checkout() {
    if (this.cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    window.location.href = "checkout.html";
  }
}

// Initialize cart
document.addEventListener("DOMContentLoaded", () => {
  window.cart = new ShoppingCart();
});
