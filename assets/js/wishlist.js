document.addEventListener("DOMContentLoaded", () => {
  // Fix: Target the correct container ID from wishlist.html
  const section = document.getElementById("wishlist-grid");
  if (!section) return;

  renderWishlist();

  window.addEventListener("wishlistUpdated", renderWishlist);
});

function renderWishlist() {
  const section = document.getElementById("wishlist-grid");
  const items = window.getWishlist();

  section.innerHTML = "";

  // Ensure the container has the row class for the grid system
  section.className = "row";

  if (items.length === 0) {
    section.innerHTML = `
          <div class="empty-wishlist col-12" style="text-align: center; padding: 50px;">
            <div class="image-wrapper" style="margin-bottom: 20px;">
               <i class="fa-regular fa-heart" style="font-size: 60px; color: #ccc;"></i>
            </div>
            <h2>Your wishlist is empty</h2>
            <p>Start saving your favorite items now!</p>
            <a href="products.html" class="btn btn-dark mt-3">Go Shopping</a>
          </div>
        `;
    return;
  }

  items.forEach((item) => {
    // In wishlist, item is always "wished", so heart is solid red
    const card = window.renderProductCard(item, {
      context: 'wishlist',
      onWishlistClick: (product, btn) => {
        // Remove from wishlist
        window.toggleWishlist(product);
        renderWishlist();
      },
      onCartClick: (product) => {
        window.addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        });
        alert("Added to cart!");
      }
    });
    
    section.appendChild(card);
  });
}
