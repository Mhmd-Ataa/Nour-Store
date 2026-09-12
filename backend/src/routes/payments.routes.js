const router = require("express").Router();
const prisma = require("../prisma");
const { auth } = require("../middleware/auth");
const paymob = require("../services/paymob");

// POST /api/payments/paymob/initiate  body: { orderId }
// Starts a real Paymob card-payment session for an order that was already
// created (via POST /api/orders with paymentMethod:"card") and returns the
// hosted iframe URL the browser should be redirected to.
router.post("/paymob/initiate", auth, async (req, res) => {
  try {
    if (!process.env.PAYMOB_API_KEY) {
      return res.status(503).json({ message: "الدفع بالبطاقة غير مفعّل على هذا الخادم بعد" });
    }
    const orderId = Number(req.body.orderId);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        message: "معرّف الطلب غير صحيح",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });
    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }
    if (order.paid) {
      return res.status(400).json({ message: "تم دفع هذا الطلب بالفعل" });
    }
    if (order.status !== "بانتظار الدفع") {
  return res.status(400).json({
    message: "هذا الطلب غير متاح للدفع حاليًا",
  });
}

    const authToken = await paymob.getAuthToken();
    const paymobOrder = await paymob.registerOrder(authToken, {
      amountCents: order.total * 100,
      merchantOrderId: order.id,
      items: order.items,
    });

    const [firstName, ...rest] = (order.user.name || "عميلة نور").trim().split(/\s+/);
    const paymentToken = await paymob.getPaymentKey(authToken, {
      amountCents: order.total * 100,
      paymobOrderId: paymobOrder.id,
      billingData: {
        first_name: firstName || "عميلة",
        last_name: rest.join(" ") || "نور",
        email: order.user.email,
        phone_number: "NA",
        apartment: "NA",
        floor: "NA",
        street: "NA",
        building: "NA",
        city: "NA",
        country: "EG",
        state: "NA",
      },
    });

    // Store Paymob's order id so the webhook below can match the callback
    // back to this local order.
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: String(paymobOrder.id) },
    });

    res.json({ iframeUrl: paymob.buildIframeUrl(paymentToken) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "حدث خطأ أثناء تجهيز عملية الدفع" });
  }
});

// GET /api/payments/paymob/callback
// Server-to-server webhook — configure this exact URL in the Paymob
// dashboard under your integration's "Transaction processed callback".
// This is the ONLY source of truth for whether an order was actually paid;
// the browser redirect back to the frontend must never be trusted on its own.
router.post("/paymob/callback", async (req, res) => {  try {
if (!paymob.verifyHmac(req.body)) {
        console.warn("Paymob webhook: invalid HMAC signature, ignoring request.");
      return res.status(401).json({ message: "توقيع غير صالح" });
    }

const paymobOrderId = String(req.body.order || "");
   const isSuccess = req.body.success === true || req.body.success === "true";
const isPending = req.body.pending === true || req.body.pending === "true";
const isVoided = req.body.is_voided === true || req.body.is_voided === "true";
const isRefunded = req.body.is_refunded === true || req.body.is_refunded === "true";

if (isVoided || isRefunded) {
  return res.status(400).json({
    message: "عملية الدفع غير صالحة",
  });
}

const callbackAmount = Number(req.body.amount_cents);
if (!Number.isInteger(callbackAmount) || callbackAmount <= 0) {
  return res.status(400).json({
    message: "قيمة الدفع غير صحيحة",
  });
}
if (String(req.body.currency || "") !== "EGP") {
    return res.status(400).json({
    message: "عملة الدفع غير صحيحة",
  });
}
const callbackIntegrationId = Number(req.body.integration_id);
if (
  !Number.isInteger(callbackIntegrationId) ||
  callbackIntegrationId !== Number(process.env.PAYMOB_INTEGRATION_ID_CARD)
) {
  return res.status(400).json({
    message: "عملية الدفع غير صالحة",
  });
}
    const order = await prisma.order.findFirst({
      where: { paymentRef: paymobOrderId },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ message: "الطلب غير موجود" });
    if (callbackAmount !== order.total * 100) {
  console.warn("Paymob webhook: amount mismatch.");
  return res.status(400).json({
    message: "قيمة الدفع لا تطابق قيمة الطلب",
  });
}

    if (isSuccess && !isPending && !order.paid) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paid: true, status: "قيد المعالجة" },
      });
} else if (
  !isSuccess &&
  !isPending &&
  !order.paid &&
  order.status === "بانتظار الدفع"
) {      // Payment definitively failed — release the stock we reserved at checkout.
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty } },
          });
        }
        await tx.order.update({ where: { id: order.id }, data: { status: "ملغي" } });
      });
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

module.exports = router;
