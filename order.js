/*
  KILIX ORDER MANAGEMENT
  Sends order data to Google Forms.
  Google Forms stores responses in Google Sheets.
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

  // Google Forms response endpoint
  const googleFormURL =
    "https://docs.google.com/forms/d/e/" +
    "1FAIpQLSeBjUcls_s7iJeTaVsdM8ahuABwrrKQxIEtbQIuT_ngL0XU1g/formResponse";

  // Google Forms field IDs
  const fields = {
    name: "entry.253285280",
    phone: "entry.938009579",
    wilaya: "entry.1539719048",
    delivery: "entry.1352303678",
    address: "entry.1856014100",
    product: "entry.434708821",
    quantity: "entry.581831521"
  };

  let isSubmitting = false;

  function formatPrice(amount) {
    return (
      new Intl.NumberFormat("fr-DZ").format(amount) +
      " " +
      (product.currency || "DA")
    );
  }

  // Calculate delivery price
  function getShippingPrice() {
    const wilaya = wilayaSelect.value;
    const deliveryType = deliverySelect.value;
    const prices = deliveryPrices[wilaya];

    if (
      !prices ||
      prices[deliveryType] === undefined ||
      !Number.isFinite(Number(prices[deliveryType]))
    ) {
      return null;
    }

    return Number(prices[deliveryType]);
  }

  // Update total price
  function updateTotal() {
    const shippingPrice = getShippingPrice();

    if (shippingPrice === null) {
      submitButton.textContent = "اختَر الولاية والتوصيل";
      return;
    }

    const total =
      Number(product.price) + shippingPrice;

    submitButton.textContent =
      "تأكيد الطلب — " + formatPrice(total);

    submitButton.dataset.productPrice =
      String(product.price);

    submitButton.dataset.shippingPrice =
      String(shippingPrice);

    submitButton.dataset.totalPrice =
      String(total);
  }

  wilayaSelect.addEventListener("change", updateTotal);
  deliverySelect.addEventListener("change", updateTotal);

  // Convert the website delivery selection
  // to the exact Google Forms option text.
  function getDeliveryText() {
    const value = String(deliverySelect.value)
      .trim()
      .toLowerCase();

    const selectedOption =
      deliverySelect.options[deliverySelect.selectedIndex];

    const label = selectedOption
      ? selectedOption.text.trim().toLowerCase()
      : "";

    const deliveryValue = value + " " + label;

    if (
      deliveryValue.includes("domicile") ||
      deliveryValue.includes("home") ||
      deliveryValue.includes("منزل")
    ) {
      return "À domicile";
    }

    if (
      deliveryValue.includes("bureau") ||
      deliveryValue.includes("office") ||
      deliveryValue.includes("مكتب")
    ) {
      return "Au bureau";
    }

    return null;
  }

  // Submit order
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!form.reportValidity()) {
      return;
    }

    const nameInput =
      form.querySelector('[name="name"]');

    const phoneInput =
      form.querySelector('[name="phone"]');

    const addressInput =
      form.querySelector('[name="address"]');

    const quantityInput =
      form.querySelector('[name="quantity"]');

    if (!nameInput || !phoneInput || !addressInput) {
      alert("تعذر العثور على بعض حقول الطلب.");
      console.error("Missing order form inputs.");
      return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();

    if (!name || !phone || !address) {
      alert("يرجى ملء جميع المعلومات المطلوبة.");
      return;
    }

    const shippingPrice = getShippingPrice();

    if (shippingPrice === null) {
      alert("اختَر الولاية ونوع التوصيل بشكل صحيح.");
      return;
    }

    const deliveryText = getDeliveryText();

    if (!deliveryText) {
      alert("تعذر تحديد طريقة التوصيل.");
      console.error(
        "Unsupported delivery value:",
        deliverySelect.value
      );
      return;
    }

    const quantity = quantityInput
      ? Math.max(
          1,
          parseInt(quantityInput.value, 10) || 1
        )
      : 1;

    const selectedWilaya =
      wilayaSelect.options[wilayaSelect.selectedIndex];

    const wilayaText = selectedWilaya
      ? selectedWilaya.text.trim()
      : wilayaSelect.value;

    // Prepare order information
    const orderData = {
      [fields.name]: name,
      [fields.phone]: phone,
      [fields.wilaya]: wilayaText,
      [fields.delivery]: deliveryText,
      [fields.address]: address,
      [fields.product]:
        product.name ||
        product.title ||
        "Produit Kilix",
      [fields.quantity]: String(quantity)
    };

    // Create a hidden iframe for submission
    let iframe = document.getElementById(
      "kilix-google-form-frame"
    );

    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "kilix-google-form-frame";
      iframe.name = "kilix-google-form-frame";
      iframe.style.display = "none";

      document.body.appendChild(iframe);
    }

    // Create the submission form
    const googleForm = document.createElement("form");

    googleForm.method = "POST";
    googleForm.action = googleFormURL;
    googleForm.target = iframe.name;
    googleForm.acceptCharset = "UTF-8";
    googleForm.style.display = "none";

    Object.entries(orderData).forEach(function ([key, value]) {
      const input = document.createElement("input");

      input.type = "hidden";
      input.name = key;
      input.value = value;

      googleForm.appendChild(input);
    });

    document.body.appendChild(googleForm);

    // Lock the button while submitting
    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "جاري إرسال الطلب...";

    try {
      googleForm.submit();
    } catch (error) {
      console.error("Order submission error:", error);

      googleForm.remove();

      isSubmitting = false;
      submitButton.disabled = false;

      updateTotal();

      alert("تعذر إرسال الطلب. حاول مرة أخرى.");
      return;
    }

    // Clean up after the submission attempt.
    // This delay does NOT confirm that Google accepted the order.
    setTimeout(function () {
      googleForm.remove();

      isSubmitting = false;
      submitButton.disabled = false;

      updateTotal();

      alert(
        "تمت محاولة إرسال الطلب. " +
        "تحقق من Google Sheets للتأكد من تسجيله."
      );
    }, 3000);
  });

  // Initial total
  updateTotal();
});
