/*
إعدادات استقبال الطلبات
======================================================
يستقبل الطلبات القادمة من الموقع.
يتحقق من المعلومات الأساسية.
يرسل تفاصيل الطلب إلى Telegram.
لا يحفظ الطلبات في Google Sheets.
مهم: ضع TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID في إعدادات Script Properties، ولا تضعهما هنا. */
/* ==================================================
اختبار عمل الخدمة ================================================== */
function doGet() { return jsonResponse({ status: "ok", message: "Kilix order service is running." }); }
/* ================================================== 2. استقبال الطلب من الموقع ================================================== */
function doPost(e) { try {
if (!e || !e.postData || !e.postData.contents) {
  return jsonResponse({
    status: "error",
    message: "No order data received."
  });
}

const order = JSON.parse(e.postData.contents);

// التحقق من المعلومات الأساسية
const requiredFields = [
  "customerName",
  "phone",
  "wilaya",
  "productName"
];

for (const field of requiredFields) {
  if (
    !order[field] ||
    String(order[field]).trim() === ""
  ) {
    return jsonResponse({
      status: "error",
      message: "Missing required information."
    });
  }
}

// قراءة إعدادات Telegram بأمان
const properties = PropertiesService.getScriptProperties();

const botToken = properties.getProperty(
  "TELEGRAM_BOT_TOKEN"
);

const chatId = properties.getProperty(
  "TELEGRAM_CHAT_ID"
);

if (!botToken || !chatId) {
  throw new Error(
    "Telegram settings are not configured."
  );
}

// تجهيز تفاصيل الطلب
const customerName = safeText(order.customerName);
const phone = safeText(order.phone);
const wilaya = safeText(order.wilaya);
const productName = safeText(order.productName);

const deliveryType = safeText(
  order.deliveryType || order.delivery_type || "غير محدد"
);

const address = safeText(
  order.address || "غير محدد"
);

const productPrice = validNumber(
  order.productPrice,
  "productPrice"
);

const deliveryPrice = validNumber(
  order.deliveryPrice,
  "deliveryPrice"
);

const quantity = validNumber(
  order.quantity || 1,
  "quantity"
);

const totalPrice = validNumber(
  order.totalPrice,
  "totalPrice"
);

const orderId = Utilities.getUuid()
  .split("-")[0]
  .toUpperCase();

const message =
  "🛍️ طلب جديد — Kilix\n\n" +
  "🆔 رقم الطلب: " + orderId + "\n\n" +
  "👤 اسم الزبون: " + customerName + "\n" +
  "📞 الهاتف: " + phone + "\n" +
  "📍 الولاية: " + wilaya + "\n" +
  "🏠 العنوان: " + address + "\n\n" +
  "📦 المنتج: " + productName + "\n" +
  "🔢 الكمية: " + quantity + "\n" +
  "💰 سعر المنتج: " + productPrice + " دج\n" +
  "🚚 التوصيل: " + deliveryPrice + " دج\n" +
  "🛵 طريقة التوصيل: " + deliveryType + "\n\n" +
  "💵 الإجمالي: " + totalPrice + " دج";

// إرسال الطلب إلى Telegram
const telegramResponse = UrlFetchApp.fetch(
  "https://api.telegram.org/bot" +
    botToken +
    "/sendMessage",
  {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: chatId,
      text: message
    }),
    muteHttpExceptions: true
  }
);

const responseCode = telegramResponse.getResponseCode();

const responseText = telegramResponse.getContentText();

if (responseCode < 200 || responseCode >= 300) {
  throw new Error(
    "Telegram request failed: " + responseText
  );
}

const telegramResult = JSON.parse(responseText);

if (!telegramResult.ok) {
  throw new Error("Telegram did not accept the message.");
}

return jsonResponse({
  status: "success",
  message: "Order sent successfully.",
  orderId: orderId
});
} catch (error) {
// تسجيل الخطأ في سجل التنفيذ، دون كشف أسرار Telegram للزبون
console.error(error);

return jsonResponse({
  status: "error",
  message: "Could not process the order."
});
} }
/* ================================================== 3. التحقق من الأرقام ================================================== */
function validNumber(value, fieldName) { const number = Number(value);
if (!Number.isFinite(number) || number < 0) { throw new Error("Invalid numeric field: " + fieldName); }
return number; }
/* ================================================== 4. تنظيف النصوص ================================================== */
function safeText(value) { return String(value) .replace(/[\u0000-\u001F\u007F]/g, " ") .trim() .slice(0, 500); }
/* ================================================== 5. إرجاع JSON ================================================== */
function jsonResponse(data) { return ContentService .createTextOutput(JSON.stringify(data)) .setMimeType(ContentService.MimeType.JSON); }
