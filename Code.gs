/**
Landing Page — Secure Order Backend

المهام:
استقبال الطلبات من الموقع.
تسجيل الطلبات في Google Sheets.
إرسال إشعار إلى Telegram.

يجب تخزين معلومات Telegram السرية في Script Properties. */
const SHEET_NAME = "Orders";
function doGet() { return jsonResponse({ status: "ok", message: "Order endpoint is running." }); }
function doPost(e) { try { if (!e || !e.postData || !e.postData.contents) { throw new Error("لم يتم استلام بيانات الطلب."); }
const data = JSON.parse(e.postData.contents);

// التحقق من المعلومات الأساسية
if (
  !data.customerName ||
  !data.phone ||
  !data.wilaya ||
  !data.productName
) {
  throw new Error("بعض المعلومات الأساسية للطلب ناقصة.");
}

const productPrice = Number(data.productPrice);
const deliveryPrice = Number(data.deliveryPrice);
const quantity = Number(data.quantity || 1);

if (
  !Number.isFinite(productPrice) ||
  !Number.isFinite(deliveryPrice) ||
  !Number.isInteger(quantity) ||
  productPrice <= 0 ||
  deliveryPrice < 0 ||
  quantity < 1 ||
  quantity > 100
) {
  throw new Error("بيانات السعر أو الكمية غير صالحة.");
}

const productsTotal = productPrice * quantity;
const totalPrice = productsTotal + deliveryPrice;

// إنشاء رقم طلب
const orderId = Utilities.getUuid();

const order = {
  date: new Date(),
  orderId: orderId,
  customerName: String(data.customerName).trim(),
  phone: String(data.phone).trim(),
  wilaya: String(data.wilaya).trim(),
  commune: String(data.commune || "").trim(),
  address: String(data.address || "").trim(),
  deliveryMethod: String(data.deliveryMethod || "home"),
  quantity: quantity,
  productName: String(data.productName).trim(),
  productPrice: productPrice,
  productsTotal: productsTotal,
  deliveryPrice: deliveryPrice,
  totalPrice: totalPrice
};

// تسجيل الطلب في جدول البيانات
saveOrder(order);

// إرسال الإشعار إلى Telegram
sendTelegramNotification(order);

return jsonResponse({
  status: "success",
  orderId: orderId
});
} catch (error) { console.error(error);
return jsonResponse({
  status: "error",
  message: "تعذر معالجة الطلب. يرجى المحاولة لاحقًا."
});
} }
function saveOrder(order) { const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
if (!spreadsheet) { throw new Error("لم يتم ربط المشروع بجدول بيانات."); }
let sheet = spreadsheet.getSheetByName(SHEET_NAME);
if (!sheet) { sheet = spreadsheet.insertSheet(SHEET_NAME);
sheet.appendRow([
  "التاريخ",
  "رقم الطلب",
  "اسم الزبون",
  "الهاتف",
  "الولاية",
  "البلدية",
  "العنوان",
  "طريقة التوصيل",
  "اسم المنتج",
  "الكمية",
  "سعر المنتج",
  "مجموع المنتجات",
  "سعر التوصيل",
  "المجموع الكلي"
]);

sheet.setFrozenRows(1);
}
sheet.appendRow([ order.date, order.orderId, safeCell(order.customerName), safeCell(order.phone), safeCell(order.wilaya), safeCell(order.commune), safeCell(order.address), safeCell(order.deliveryMethod), safeCell(order.productName), order.quantity, order.productPrice, order.productsTotal, order.deliveryPrice, order.totalPrice ]); }
function sendTelegramNotification(order) { const properties = PropertiesService.getScriptProperties();
const botToken = properties.getProperty("TELEGRAM_BOT_TOKEN"); const chatId = properties.getProperty("TELEGRAM_CHAT_ID");
if (!botToken || !chatId) { throw new Error("إعدادات Telegram غير مكتملة."); }
const message = [ "🛍️ طلب جديد", "", "🧾 رقم الطلب: " + order.orderId, "📦 المنتج: " + order.productName, "👤 الاسم: " + order.customerName, "📞 الهاتف: " + order.phone, "📍 الولاية: " + order.wilaya, "🏘️ البلدية: " + (order.commune || "غير محددة"), "🏠 العنوان: " + (order.address || "غير محدد"), "🚚 التوصيل: " + order.deliveryMethod, "🔢 الكمية: " + order.quantity, "💰 سعر المنتج: " + order.productPrice + " دج", "📦 مجموع المنتجات: " + order.productsTotal + " دج", "🚚 سعر التوصيل: " + order.deliveryPrice + " دج", "💵 المجموع الكلي: " + order.totalPrice + " دج" ].join("\n");
const response = UrlFetchApp.fetch( "https://api.telegram.org/bot" + botToken + "/sendMessage", { method: "post", contentType: "application/json", payload: JSON.stringify({ chat_id: chatId, text: message }), muteHttpExceptions: true } );
const statusCode = response.getResponseCode();
if (statusCode < 200 || statusCode >= 300) { throw new Error("فشل إرسال إشعار Telegram."); } }
/**
منع إدخال نصوص تبدأ بعلامات الصيغ داخل Google Sheets. */ function safeCell(value) { const text = String(value == null ? "" : value);
return /^[=+-@]/.test(text) ? "'" + text : text; }
function jsonResponse(data) { return ContentService .createTextOutput(JSON.stringify(data)) .setMimeType(ContentService.MimeType.JSON); }
