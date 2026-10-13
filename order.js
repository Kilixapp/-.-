/*
  KILIX ORDER MANAGEMENT
  Sends orders to Google Forms,
  which stores responses in Google Sheets.
*/

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("orderForm");
  const wilayaSelect = document.querySelector(
    'select[name="wilaya"]'
  );
  const deliverySelect = document.getElementById("delivery-type");
  const submitButton = document.getElementById("submit-order");

  if (!form || !wilayaSelect || !deliverySelect || !submitButton) {
    console.error("تعذر العثور على عناصر نموذج الطلب.");
    return;
  }

  if (
    typeof product === "undefined" ||
    typeof deliveryPrices === "undefined"
  ) {
    console.error("معلومات المنتج أو أسعار التوصيل غير متوفرة.");
    return;
  }

  const googleFormURL =
    "https://docs.google.com/forms/d/e/" +
    "1FAIpQLSeBjUcls_s7iJeTaVsdM8ahuABwrrKQxIEtbQIuT_ngL0XU1g/formResponse";

  const fields = {
    name: "entry.253285280",
    phone: "entry.938009579",
    wilaya: "entry.1539719048",
    delivery: "entry.1352303678",
    address: "entry.1856014100",
    product: "entry.434708821",
    quantity: "entry.581831521"
  };

  function formatPrice(amount) {
    return (
      new Intl.NumberFormat("fr-DZ").format(amount) +
      " " +
      product.currency
    );
  }

  function getShippingPrice() {
    const wilaya = wilayaSelect.value;
    const deliveryType = deliverySelect.value;
    const prices = deliveryPrices[wilaya];

    if (!prices || prices[deliveryType] === undefined) {
      return null;
    }

    return Number(prices[deliveryType]);
  }

  function updateTotal() {
    const shippingPrice = getShippingPrice();

    if (shippingPrice === null) {
      submitButton.textContent = "اختَر الولاية والتوصيل";
      return;
    }

    const total = Number(product.price) + shippingPrice;

    submitButton.textContent =
      "تأكيد الطلب — " + formatPrice(total);

    submitButton.dataset.productPrice = String(product.price);
    submitButton.dataset.shippingPrice = String(shippingPrice);
    submitButton.dataset.totalPrice = String(total);
  }

  wilayaSelect.addEventListener("change", updateTotal);
  deliverySelect.addEventListener("change", updateTotal);

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const shippingPrice = getShippingPrice();

    if (shippingPrice === null) {
      alert("اختَر الولاية ونوع التوصيل أولًا.");
      return;
    }

    const name = form.querySelector('[name="name"]');
    const phone = form.querySelector('[name="phone"]');
    const address = form.querySelector('[name="address"]');
    const quantityInput = form.querySelector('[name="quantity"]');

    if (!name || !phone || !address) {
      alert("تعذر العثور على بعض حقول الطلب.");
      return;
    }

    const quantity = quantityInput
      ? Math.max(1, Number(quantityInput.value) || 1)
      : 1;

    const wilayaText =
      wilayaSelect.options[wilayaSelect.selectedIndex].text;

    const deliveryValue = deliverySelect.value.toLowerCase();

    let deliveryText;

    if (
      deliveryValue.includes("home") ||
      deliveryValue.includes("domicile")
    ) {
      deliveryText = "domicile";
    } else {
      deliveryText = "bureau";
    }

    const googleForm = document.createElement("form");

    googleForm.method = "POST";
    googleForm.action = googleFormURL;
    googleForm.target = "kilix-google-form-frame";
    googleForm.style.display = "none";

    const orderData = {
      [fields.name]: name.value.trim(),
      [fields.phone]: phone.value.trim(),
      [fields.wilaya]: wilayaText,
      [fields.delivery]: deliveryText,
      [fields.address]: address.value.trim(),
      [fields.product]: product.name || product.title || "Produit Kilix",
      [fields.quantity]: String(quantity)
    };

    Object.entries(orderData).forEach(function ([key, value]) {
      const input = document.createElement("input");

      input.type = "hidden";
      input.name = key;
      input.value = value;

      googleForm.appendChild(input);
    });

    let iframe = document.getElementById("kilix-google-form-frame");

    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "kilix-google-form-frame";
      iframe.name = "kilix-google-form-frame";
      iframe.style.display = "none";

      document.body.appendChild(iframe);
    }

    document.body.appendChild(googleForm);

    submitButton.disabled = true;
    submitButton.textContent = "جاري إرسال الطلب...";

    googleForm.submit();

    setTimeout(function () {
      googleForm.remove();

      submitButton.disabled = false;
      updateTotal();

      alert(
        "تم إرسال الطلب لمحاولة تسجيله. " +
        "يرجى التأكد من ظهوره في Google Sheets."
      );
    }, 2000);
  });

  updateTotal();
});
