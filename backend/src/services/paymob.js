const crypto = require("crypto");

const PAYMOB_BASE = "https://accept.paymob.com/api";

async function getAuthToken() {
  const res = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) throw new Error("تعذر الاتصال ببوابة الدفع (مصادقة)");
  return data.token;
}

async function registerOrder(authToken, { amountCents, merchantOrderId, items }) {
  const res = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      merchant_order_id: String(merchantOrderId),
      items: items.map((i) => ({
        name: String(i.name).slice(0, 60),
        amount_cents: i.price * 100,
        quantity: i.qty,
      })),
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error("تعذر إنشاء الطلب في بوابة الدفع");
  return data; // data.id = Paymob's own order id, used later to match the webhook
}

async function getPaymentKey(authToken, { amountCents, paymobOrderId, billingData }) {
  const res = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: paymobOrderId,
      billing_data: billingData,
      currency: "EGP",
      integration_id: Number(process.env.PAYMOB_INTEGRATION_ID_CARD),
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) throw new Error("تعذر تجهيز مفتاح الدفع");
  return data.token;
}

function buildIframeUrl(paymentToken) {
  return `${PAYMOB_BASE}/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
}

// Verifies the HMAC Paymob attaches to transaction callbacks (query string).
// Field order is fixed by Paymob — do not reorder.
// Docs: https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac
const HMAC_FIELDS = [
  "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction", "id",
  "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
  "is_voided", "order", "owner", "pending", "source_data.pan", "source_data.sub_type", "source_data.type", "success",
];

function verifyHmac(data) {
  if (!process.env.PAYMOB_HMAC_SECRET || !data.hmac) return false;

  const concatenated = HMAC_FIELDS
    .map((k) => String(data[k] ?? ""))
    .join("");
  const computed = crypto.createHmac("sha512", process.env.PAYMOB_HMAC_SECRET).update(concatenated).digest("hex");

  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(String(query.hmac), "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { getAuthToken, registerOrder, getPaymentKey, buildIframeUrl, verifyHmac };
