// ==========================================
// CHECKOUT MANAGEMENT SYSTEM - USER-SPECIFIC
// ==========================================

class CheckoutManager {
  constructor() {
    this.cart = this.loadCart();
    this.discountCode = null;
    this.discountPercentage = 0;
    this.shippingCost = 0; // Free shipping
    this.validDiscountCodes = {
      ZEKRA20: 20,
      ZEKRA50: 50,
      SAVE10: 10,
      SAVE20: 20,
      LUXURY15: 15,
    };
    this.currentUser = null;
    this.init();
  }

  init() {
    // Check if user is logged in
    if (!this.checkUserAuth()) {
      return;
    }
    
    this.displayCartItems();
    this.updateSummary();
    this.setupEventListeners();
    this.loadSavedAddress();
  }

  // Check user authentication
  checkUserAuth() {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) {
      alert("Please login to continue with checkout");
      window.location.href = "login.html";
      return false;
    }
    this.currentUser = JSON.parse(userRaw);
    return true;
  }

  // Load cart from localStorage
  loadCart() {
    return getCart();
  }

  // Save cart to localStorage
  saveCart() {
    saveCart(this.cart);
  }

  // Setup event listeners
  setupEventListeners() {
    // Address editing
    const editAddressBtn = document.getElementById("edit-address");
    const addressForm = document.getElementById("address-form");
    const addressDisplay = document.getElementById("address-display");

    if (editAddressBtn) {
      editAddressBtn.addEventListener("click", () => {
        const isHidden = addressForm.classList.contains("hidden");

        if (isHidden) {
          addressDisplay.classList.add("hidden");
          addressForm.classList.remove("hidden");
          editAddressBtn.textContent = "Cancel";
        } else {
          addressForm.classList.add("hidden");
          addressDisplay.classList.remove("hidden");
          editAddressBtn.textContent = "Edit";
        }
      });
    }

    // Address form submission
    if (addressForm) {
      addressForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveAddress();
      });
    }

    // Payment method selection
    const paymentOptions = document.querySelectorAll(".payment-option-compact");
    paymentOptions.forEach((option) => {
      option.addEventListener("click", () => {
        paymentOptions.forEach((opt) => opt.classList.remove("selected"));
        option.classList.add("selected");

        // Show/hide payment details based on selection
        const paymentType = option.getAttribute("data-payment");
        this.showPaymentDetails(paymentType);
      });
    });

    // Card number formatting
    const cardNumberInput = document.getElementById("card-number");
    if (cardNumberInput) {
      cardNumberInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\s/g, "");
        let formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
        e.target.value = formattedValue;
      });
    }

    // Expiry date formatting
    const expiryInput = document.getElementById("card-expiry");
    if (expiryInput) {
      expiryInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length >= 2) {
          value = value.slice(0, 2) + "/" + value.slice(2, 4);
        }
        e.target.value = value;
      });
    }

    // CVV formatting
    const cvvInput = document.getElementById("card-cvv");
    if (cvvInput) {
      cvvInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3);
      });
    }

    // Discount code
    const applyDiscountBtn = document.getElementById("apply-discount");
    if (applyDiscountBtn) {
      applyDiscountBtn.addEventListener("click", () => this.applyDiscount());
    }

    // Place order button
    const placeOrderBtn = document.getElementById("place-order-btn");
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener("click", () => this.placeOrder());
    }

    // Quantity changes in checkout cart
    const checkoutCartItems = document.getElementById("checkout-cart-items");
    if (checkoutCartItems) {
      checkoutCartItems.addEventListener("click", (e) => {
        if (e.target.classList.contains("qty-btn")) {
          const itemId = e.target.getAttribute("data-id");
          const action = e.target.getAttribute("data-action");
          this.updateQuantity(itemId, action);
        }
        if (e.target.classList.contains("remove-item")) {
          const itemId = e.target.getAttribute("data-id");
          this.removeItem(itemId);
        }
      });
    }
  }

  // Show payment details based on selection
  showPaymentDetails(paymentType) {
    const cardDetails = document.getElementById("card-details");
    const paypalDetails = document.getElementById("paypal-details");
    const cashDetails = document.getElementById("cash-details");

    // Hide all
    if (cardDetails) cardDetails.classList.add("hidden");
    if (paypalDetails) paypalDetails.classList.add("hidden");
    if (cashDetails) cashDetails.classList.add("hidden");

    // Show selected
    if (paymentType === "card" && cardDetails) {
      cardDetails.classList.remove("hidden");
    } else if (paymentType === "paypal" && paypalDetails) {
      paypalDetails.classList.remove("hidden");
    } else if (paymentType === "cash" && cashDetails) {
      cashDetails.classList.remove("hidden");
    }
  }

  // Display cart items
  displayCartItems() {
    const container = document.getElementById("checkout-cart-items");
    const itemCount = document.getElementById("item-count");

    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #999;">
          <p>Your cart is empty</p>
          <a href="products.html" style="color: var(--primary-color); text-decoration: underline; margin-top: 1rem; display: inline-block;">Continue Shopping</a>
        </div>
      `;
      if (itemCount) itemCount.textContent = "0 items";
      return;
    }

    const totalItems = this.cart.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    if (itemCount) itemCount.textContent = `${totalItems} ${totalItems === 1 ? "item" : "items"}`;

    container.innerHTML = "";
    this.cart.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "checkout-cart-item";
      itemDiv.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="item-image">
        <div class="item-details">
          <h4 class="item-name">${item.name}</h4>
          <p class="item-price">$${item.price.toFixed(2)}</p>
        </div>
        <div class="item-quantity">
          <button class="qty-btn" data-id="${item.id}" data-action="decrease">−</button>
          <span class="qty-display">${item.quantity}</span>
          <button class="qty-btn" data-id="${item.id}" data-action="increase">+</button>
        </div>
        <div class="item-total">
          <span>$${(item.price * item.quantity).toFixed(2)}</span>
          <button class="remove-item" data-id="${item.id}" title="Remove">×</button>
        </div>
      `;
      container.appendChild(itemDiv);
    });
  }

  // Update quantity
  updateQuantity(itemId, action) {
    const item = this.cart.find((i) => i.id == itemId);
    if (!item) return;

    if (action === "increase") {
      if (item.maxStock && item.quantity >= item.maxStock) {
        this.showNotification("Maximum stock reached", "warning");
        return;
      }
      item.quantity++;
    } else if (action === "decrease") {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        this.removeItem(itemId);
        return;
      }
    }

    this.saveCart();
    this.displayCartItems();
    this.updateSummary();
  }

  // Remove item
  removeItem(itemId) {
    this.cart = this.cart.filter((i) => i.id != itemId);
    this.saveCart();
    this.displayCartItems();
    this.updateSummary();
  }

  // Calculate totals
  calculateTotals() {
    const subtotal = this.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const discountAmount = (subtotal * this.discountPercentage) / 100;
    const total = subtotal - discountAmount + this.shippingCost;

    return { subtotal, discountAmount, total };
  }

  // Update summary
  updateSummary() {
    const { subtotal, discountAmount, total } = this.calculateTotals();

    // Update subtotal
    const subtotalElement = document.getElementById("summary-subtotal");
    if (subtotalElement) {
      subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    }

    // Update discount
    const discountRow = document.getElementById("discount-row");
    const discountAmountElement = document.getElementById("discount-amount");
    const appliedCodeElement = document.getElementById("applied-code");

    if (this.discountPercentage > 0 && discountRow) {
      discountRow.classList.remove("hidden");
      if (discountAmountElement) {
        discountAmountElement.textContent = `-$${discountAmount.toFixed(2)}`;
      }
      if (appliedCodeElement) {
        appliedCodeElement.textContent = `(${this.discountCode})`;
      }
    } else if (discountRow) {
      discountRow.classList.add("hidden");
    }

    // Update total
    const totalElement = document.getElementById("summary-total");
    if (totalElement) {
      totalElement.textContent = `$${total.toFixed(2)}`;
    }
  }

  // Apply discount code
  applyDiscount() {
    const discountInput = document.getElementById("discount-code");
    const discountMessage = document.getElementById("discount-message");

    if (!discountInput || !discountMessage) return;

    const code = discountInput.value.trim().toUpperCase();

    if (!code) {
      this.showDiscountMessage("Please enter a discount code", "error");
      return;
    }

    if (this.validDiscountCodes[code]) {
      this.discountCode = code;
      this.discountPercentage = this.validDiscountCodes[code];
      this.updateSummary();
      this.showDiscountMessage(
        `${this.discountPercentage}% discount applied!`,
        "success",
      );
      discountInput.value = "";
      discountInput.disabled = true;
    } else {
      this.showDiscountMessage("Invalid discount code", "error");
    }
  }

  // Show discount message
  showDiscountMessage(message, type) {
    const discountMessage = document.getElementById("discount-message");
    if (!discountMessage) return;

    discountMessage.textContent = message;
    discountMessage.className = `discount-message ${type}`;
    discountMessage.classList.remove("hidden");

    setTimeout(() => {
      discountMessage.classList.add("hidden");
    }, 4000);
  }

  // Load saved address from user account
  loadSavedAddress() {
    if (!this.currentUser) return;
    
    // Check if user has saved address
    if (this.currentUser.shippingAddress) {
      const address = this.currentUser.shippingAddress;
      this.displayAddress(address);
      this.populateAddressForm(address);
    } else {
      // Pre-fill with user's name, rest empty
      const defaultAddress = {
        name: this.currentUser.name,
        phone: "",
        street: "",
        city: "",
        postal: "",
        governorate: "",
      };
      this.displayAddress(defaultAddress);
      this.populateAddressForm(defaultAddress);
      
      // Show the form automatically for first-time users
      setTimeout(() => {
        const addressDisplay = document.getElementById("address-display");
        const addressForm = document.getElementById("address-form");
        const editBtn = document.getElementById("edit-address");
        
        if (addressDisplay) addressDisplay.classList.add("hidden");
        if (addressForm) addressForm.classList.remove("hidden");
        if (editBtn) editBtn.textContent = "Cancel";
      }, 500);
    }
  }

  // Populate address form
  populateAddressForm(address) {
    const fields = {
      "full-name": address.name,
      phone: address.phone,
      address: address.street,
      city: address.city,
      postal: address.postal,
      governorate: address.governorate,
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element && value) {
        element.value = value;
      }
    });
  }

  // Display address
  displayAddress(address) {
    const displayName = document.getElementById("display-name");
    const displayAddress = document.getElementById("display-address");
    const displayCity = document.getElementById("display-city");
    const displayCountry = document.getElementById("display-country");

    if (displayName) {
      displayName.textContent = address.name || this.currentUser?.name || "Guest";
    }
    if (displayAddress) {
      displayAddress.textContent = address.street || "Please add your address";
    }
    if (displayCity) {
      if (address.city && address.postal) {
        displayCity.textContent = `${address.city}, ${address.postal}`;
      } else {
        displayCity.textContent = "City, Postal Code";
      }
    }
    if (displayCountry) {
      displayCountry.textContent = address.governorate || "Egypt";
    }
  }

  // Save address to user account
  saveAddress() {
    const name = document.getElementById("full-name").value;
    const phone = document.getElementById("phone").value;
    const street = document.getElementById("address").value;
    const city = document.getElementById("city").value;
    const postal = document.getElementById("postal").value;
    const governorate = document.getElementById("governorate").value;

    if (!name || !phone || !street || !city || !postal || !governorate) {
      this.showNotification("Please fill in all address fields", "warning");
      return;
    }

    const address = { name, phone, street, city, postal, governorate };
    
    // Save to current user object
    this.currentUser.shippingAddress = address;
    localStorage.setItem("user", JSON.stringify(this.currentUser));
    
    // Update in users array
    const usersRaw = localStorage.getItem("users");
    if (usersRaw) {
      const users = JSON.parse(usersRaw);
      const userIndex = users.findIndex(u => u.email === this.currentUser.email);
      if (userIndex !== -1) {
        users[userIndex].shippingAddress = address;
        localStorage.setItem("users", JSON.stringify(users));
      }
    }

    this.displayAddress(address);

    // Hide form and show display
    document.getElementById("address-form").classList.add("hidden");
    document.getElementById("address-display").classList.remove("hidden");

    const editBtn = document.getElementById("edit-address");
    editBtn.textContent = "Edit";

    this.showNotification("Address saved successfully!", "success");
  }

  // Generate order PDF
  generateOrderPDF(order) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(156, 129, 107);
    doc.text('ZEKRA PERFUMES', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Order Confirmation', 105, 30, { align: 'center' });

    // Order Details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Order ID: ${order.orderId}`, 20, 45);
    doc.text(`Date: ${new Date(order.date).toLocaleString()}`, 20, 52);
    doc.text(`Status: ${order.status.toUpperCase()}`, 20, 59);

    // Customer Information
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Customer Information', 20, 72);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Name: ${order.user.name}`, 20, 80);
    doc.text(`Email: ${order.user.email}`, 20, 87);

    // Shipping Address
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Shipping Address', 20, 100);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${order.address.street}`, 20, 108);
    doc.text(`${order.address.city}, ${order.address.postal}`, 20, 115);
    doc.text(`${order.address.governorate}, Egypt`, 20, 122);
    doc.text(`Phone: ${order.address.phone}`, 20, 129);

    // Order Items
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Order Items', 20, 145);
    
    let yPos = 155;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    
    // Table headers
    doc.text('Product', 20, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Price', 145, yPos);
    doc.text('Total', 170, yPos);
    
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 7;

    // Items
    order.items.forEach(item => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const itemName = item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name;
      doc.text(itemName, 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`$${item.price.toFixed(2)}`, 145, yPos);
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 170, yPos);
      yPos += 7;
    });

    // Summary
    yPos += 10;
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Subtotal:', 120, yPos);
    doc.text(`$${order.totals.subtotal.toFixed(2)}`, 170, yPos);
    yPos += 7;
    
    if (order.totals.discount > 0) {
      doc.text('Discount:', 120, yPos);
      doc.setTextColor(220, 38, 38);
      doc.text(`-$${order.totals.discount.toFixed(2)}`, 170, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 7;
    }
    
    doc.text('Shipping:', 120, yPos);
    doc.text(order.totals.shipping === 0 ? 'FREE' : `$${order.totals.shipping.toFixed(2)}`, 170, yPos);
    yPos += 7;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', 120, yPos);
    doc.text(`$${order.totals.total.toFixed(2)}`, 170, yPos);

    // Payment Method
    yPos += 15;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Payment Method: ${order.payment.method.toUpperCase()}`, 20, yPos);
    doc.text(`Payment Status: ${order.payment.status.toUpperCase()}`, 20, yPos + 7);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for shopping with Zekra Perfumes!', 105, 280, { align: 'center' });
    doc.text('For support, contact us at support@zekraperfumes.com', 105, 285, { align: 'center' });

    // Save PDF
    doc.save(`Zekra-Order-${order.orderId}.pdf`);
  }

  // Place order
  placeOrder() {
    if (this.cart.length === 0) {
      this.showNotification("Your cart is empty!", "error");
      return;
    }

    // Check if address is saved
    if (!this.currentUser.shippingAddress) {
      this.showNotification("Please add a shipping address", "warning");
      document.getElementById("address-display").classList.add("hidden");
      document.getElementById("address-form").classList.remove("hidden");
      document.getElementById("edit-address").textContent = "Cancel";
      return;
    }

    // Validate payment details
    const selectedPayment = document.querySelector(
      'input[name="payment"]:checked',
    );
    if (!selectedPayment) {
      this.showNotification("Please select a payment method", "warning");
      return;
    }

    const paymentType = selectedPayment.value;

    // Validate card details
    if (paymentType === "card") {
      const cardNumber = document.getElementById("card-number").value;
      const cardName = document.getElementById("card-name").value;
      const cardExpiry = document.getElementById("card-expiry").value;
      const cardCvv = document.getElementById("card-cvv").value;

      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        this.showNotification("Please fill in all card details", "warning");
        return;
      }

      if (cardNumber.replace(/\s/g, "").length < 16) {
        this.showNotification("Please enter a valid card number", "error");
        return;
      }

      if (cardCvv.length < 3) {
        this.showNotification("Please enter a valid CVV", "error");
        return;
      }
    }

    // Validate PayPal details
    if (paymentType === "paypal") {
      const paypalEmail = document.getElementById("paypal-email").value;
      const paypalPassword = document.getElementById("paypal-password").value;

      if (!paypalEmail || !paypalPassword) {
        this.showNotification("Please fill in PayPal details", "warning");
        return;
      }
    }

    // Create order
    const { subtotal, discountAmount, total } = this.calculateTotals();
    
    const order = {
      orderId: "ZP" + Date.now(),
      date: new Date().toISOString(),
      user: {
        name: this.currentUser.name,
        email: this.currentUser.email,
      },
      items: this.cart,
      address: this.currentUser.shippingAddress,
      payment: {
        method: paymentType,
        status: "pending",
      },
      totals: {
        subtotal,
        discount: discountAmount,
        shipping: this.shippingCost,
        total,
      },
      status: "pending",
    };

    // Save order to user's history
    if (!this.currentUser.orders) {
      this.currentUser.orders = [];
    }
    this.currentUser.orders.push(order);
    
    // Update current user in localStorage
    localStorage.setItem("user", JSON.stringify(this.currentUser));
    
    // Update users array - PRESERVE PASSWORD
    const usersRaw = localStorage.getItem("users");
    if (usersRaw) {
      const users = JSON.parse(usersRaw);
      const userIndex = users.findIndex(u => u.email === this.currentUser.email);
      if (userIndex !== -1) {
        // Update the user but preserve their password
        users[userIndex].orders = this.currentUser.orders;
        users[userIndex].shippingAddress = this.currentUser.shippingAddress;
        users[userIndex].items = [];
        users[userIndex].wishlist = this.currentUser.wishlist;
        // Password is already in users[userIndex], we just update other fields
        localStorage.setItem("users", JSON.stringify(users));
      }
    }

    // Generate PDF for the order
    this.generateOrderPDF(order);

    // Clear cart
    this.cart = [];
    this.saveCart();

    // Show success
    this.showNotification(
      `Order placed successfully! Order ID: ${order.orderId}. PDF receipt downloaded!`,
      "success",
    );

    // Redirect after delay
    setTimeout(() => {
      window.location.href = "index.html";
    }, 4000);
  }

  // Show notification
  showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${
        type === "success"
          ? "#5cbb98"
          : type === "error"
            ? "#d94d4d"
            : "#f59e0b"
      };
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease;
      max-width: 300px;
      font-size: 0.9rem;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 4000);
  }
}

// Initialize checkout when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new CheckoutManager();
});

// Add animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
