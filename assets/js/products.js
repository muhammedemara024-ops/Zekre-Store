var bntt = document.querySelectorAll(".btns button");
var products = [];

(async () => {
  products = await window.fetchProducts();
  display(products);
})();

bntt.forEach((e) => {
  e.addEventListener("click", (el) => {
    bntt.forEach((e) => e.classList.remove("active"));

    el.target.classList.add("active");

    var category = el.target.dataset.category;

    if (category == "all") {
      display(products);
    } else {
      var filterData = products.filter((e) => {
        return e.category === category;
      });
      display(filterData);
    }
  });
});

function display(products) {
  var dataDisplayed = document.querySelector(".prod");
  dataDisplayed.innerHTML = ``;

  products.forEach((product) => {
    const isWished = window.isInWishlist(product.id);
    
    const card = window.renderProductCard(product, {
      context: 'products',
      isWished: isWished,
      onWishlistClick: (product, btn) => {
        const added = window.toggleWishlist(product);
        window.updateWishlistButtonState(btn, added);
      },
      onCartClick: (product) => {
        const cartItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0],
          quantity: 1,
        };
        window.addToCart(cartItem);
      }
    });
    
    dataDisplayed.appendChild(card);
  });
}
