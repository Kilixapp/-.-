/*
ORDER MANAGEMENT
حساب سعر المنتج والتوصيل.

يعتمد على:
product.js
delivery.js

إرسال الطلبات إلى الخادم سنضيفه بعد إعداد الاتصال الآمن. */
document.addEventListener("DOMContentLoaded", function () { const form = document.getElementById("orderForm"); const wilayaSelect = document.querySelector('select[name="wilaya"]'); const deliverySelect = document.getElementById("delivery-type"); const submitButton = document.getElementById("submit-order");
if (!form || !wilayaSelect || !deliverySelect || !submitButton) { console.error("تعذر العثور على عناصر نموذج الطلب."); return; }
if (typeof product === "undefined" || typeof deliveryPrices === "undefined") { console.error("معلومات المنتج أو أسعار التوصيل غير متوفرة."); return; }
// تنسيق السعر بالدينار الجزائري. function formatPrice(amount) { return new Intl.NumberFormat("fr-DZ").format(amount) + " " + product.currency; }
// الحصول على سعر التوصيل. function getShippingPrice() { const wilaya = wilayaSelect.value; const deliveryType = deliverySelect.value; const prices = deliveryPrices[wilaya];
if (!prices || prices[deliveryType] === undefined) {
  return null;
}

return prices[deliveryType];
}
// حساب وعرض المجموع. function updateTotal() { const shippingPrice = getShippingPrice();
if (shippingPrice === null) {
  submitButton.textContent = "اختَر الولاية لحساب السعر";
  return;
}

const total = Number(product.price) + shippingPrice;

submitButton.textContent =
  "تأكيد الطلب — " + formatPrice(total);

submitButton.dataset.productPrice = String(product.price);
submitButton.dataset.shippingPrice = String(shippingPrice);
submitButton.dataset.totalPrice = String(total);
}
// تحديث السعر عند تغيير الاختيارات. wilayaSelect.addEventListener("change", updateTotal); deliverySelect.addEventListener("change", updateTotal);
// لا نرسل الطلب قبل إعداد الخادم الآمن. form.addEventListener("submit", function (event) { event.preventDefault();
if (!form.reportValidity()) {
  return;
}

const shippingPrice = getShippingPrice();

if (shippingPrice === null) {
  alert("اختَر الولاية أولًا للتأكد من سعر التوصيل.");
  return;
}

alert(
  "تم تجهيز حساب الطلب، لكن استقبال الطلبات لم يُربط بعد. " +
  "سنكمل إعداد نظام الإرسال الآمن في الخطوة القادمة."
);
});
// عرض الحالة الأولية. updateTotal(); });
