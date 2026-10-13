document.addEventListener("DOMContentLoaded", function () { // التأكد من وجود معلومات المنتج if (typeof product === "undefined") { console.error("لم يتم العثور على معلومات المنتج في product.js"); return; }
// معلومات المتجر setText("store-name", product.storeName); setText("footer-store-name", product.storeName);
// المعلومات الأساسية للمنتج setText("product-badge", product.badge); setText("product-title", product.title); setText("product-subtitle", product.subtitle); setText("product-description", product.description);
// السعر const formattedPrice = formatPrice(product.price);
setText("product-price", ${formattedPrice} ${product.currency}); setText("order-product-price", ${formattedPrice} ${product.currency});
// عناوين الأقسام setText("gallery-title", product.galleryTitle); setText("benefits-title", product.benefitsTitle); setText("order-title", product.orderTitle);
// عنوان الصفحة document.title = ${product.name} — ${product.title};
// وصف الصفحة لمحركات البحث const descriptionMeta = document.querySelector( 'meta[name="description"]' );
if (descriptionMeta) { descriptionMeta.setAttribute( "content", product.description ); }
// الصورة الرئيسية const mainImage = document.getElementById("main-product-image");
if (mainImage && product.images.length > 0) { mainImage.src = product.images[0].src; mainImage.alt = product.images[0].alt; }
// معرض الصور const gallery = document.getElementById("product-gallery");
if (gallery) { gallery.replaceChildren();
product.images.forEach(function (imageData) {
  const image = document.createElement("img");

  image.src = imageData.src;
  image.alt = imageData.alt;
  image.loading = "lazy";

  gallery.appendChild(image);
});
}
// مميزات المنتج const benefitsContainer = document.getElementById("product-benefits");
if (benefitsContainer) { benefitsContainer.replaceChildren();
product.benefits.forEach(function (benefit) {
  const article = document.createElement("article");

  const title = document.createElement("b");
  title.textContent = benefit.title;

  const description = document.createElement("p");
  description.textContent = benefit.description;

  article.appendChild(title);
  article.appendChild(description);

  benefitsContainer.appendChild(article);
});
}
// السنة الحالية في أسفل الصفحة setText("current-year", new Date().getFullYear());
// تنسيق السعر function formatPrice(price) { return new Intl.NumberFormat("fr-DZ").format(price); }
// وضع النص بأمان داخل العنصر function setText(elementId, value) { const element = document.getElementById(elementId);
if (element && value !== undefined && value !== null) {
  element.textContent = value;
}
} });
