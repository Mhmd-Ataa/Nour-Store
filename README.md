# Nour Store — متجر إلكتروني كامل (Full Stack) — جاهز للتشغيل الفعلي

مشروع متجر إلكتروني كامل: باك اند (Node.js + Express + PostgreSQL عبر Prisma + دفع حقيقي عبر Paymob) وفرونت اند (React + Vite)، متصلين ببعض عبر REST API، ومُجهّز بإعدادات أمان تصلح للنشر الفعلي.

## البنية

```
nour-store/
├── backend/     → Express API + PostgreSQL (Prisma) + JWT + Paymob + حماية أمان
└── frontend/    → React + Vite + Tailwind
```

## المتطلبات

- Node.js 18 أو أحدث
- Docker (لتشغيل قاعدة بيانات محلية) — أو حساب مجاني في Supabase / Neon / Railway
- حساب Paymob فعّال لو عايزة تفعّلي الدفع بالبطاقة (اختياري، الموقع شغال بالدفع عند الاستلام من غيره)

---

## التشغيل محليًا (تطوير)

### 1) قاعدة البيانات

```bash
cd backend
docker compose up -d
```

### 2) الباك اند

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run seed
npm run dev
```

يشتغل على **http://localhost:4000**. بيانات دخول تجريبية:

| الحساب | البريد الإلكتروني | كلمة المرور |
|---|---|---|
| مالكة المتجر (Admin) | admin@nour.com | admin123 |
| عميلة (Customer) | mariam@example.com | 123456 |

### 3) الفرونت اند

```bash
cd frontend
npm install
npm run dev
```

يشتغل على **http://localhost:5173**.

---

## تفعيل الدفع بالبطاقة (Paymob)

الموقع شغال افتراضيًا بـ"الدفع عند الاستلام" فقط. لو عايزة تقبلي فيزا/ماستركارد فعليًا:

1. اعملي حساب على [Paymob](https://accept.paymob.com/portal2/en/login) (خدمة دفع إلكتروني مصرية معتمدة).
2. من لوحة تحكم Paymob، هاخدي 4 قيم وتحطيهم في `backend/.env`:
   - `PAYMOB_API_KEY` — من إعدادات الحساب
   - `PAYMOB_INTEGRATION_ID_CARD` — من صفحة "Payment Integrations"
   - `PAYMOB_IFRAME_ID` — من صفحة "iframes"
   - `PAYMOB_HMAC_SECRET` — من صفحة "Payment Integrations" → HMAC
3. في نفس اللوحة، سجّلي رابط الـ Webhook بتاعك كـ **"Transaction processed callback"**:
   `https://<دومين-الباك-اند>/api/payments/paymob/callback`
   وده اللي بيأكّد فعليًا إن الطلب اتدفع — الطرف ده لازم يكون متاح للإنترنت (مش localhost) عشان Paymob يقدر يوصله.
4. سجّلي أيضًا رابط رجوع العميل بعد الدفع ("Transaction response callback") ليشير لموقعك:
   `https://<دومين-الفرونت-اند>/`

⚠️ **مهم**: اختبري الدفع كامل على بيئة Paymob التجريبية (Sandbox / test cards) قبل التحويل لحساب حقيقي فعلي. الكود بيتحقق من توقيع HMAC لكل عملية، لكن لازم تتأكدي بنفسك من نجاح التدفق قبل ما تفتحي الموقع للعامة.

---

## النشر الفعلي (Production Deployment)

### الباك اند

اختاري منصة زي **Railway** أو **Render** (بتدعم Node.js + Postgres بسهولة):

1. ارفعي مجلد `backend` كمشروع منفصل.
2. أضيفي قاعدة بيانات PostgreSQL مُدارة من نفس المنصة (أو Supabase/Neon).
3. اضبطي متغيرات البيئة دي على المنصة:
   - `NODE_ENV=production`
   - `DATABASE_URL` (رابط القاعدة الفعلي)
   - `JWT_SECRET` — قيمة عشوائية طويلة، ولّديها بـ:
     ```bash
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
   - `CORS_ORIGIN` — دومين الفرونت اند الفعلي (مثلاً `https://nourstore.com`)
   - بيانات Paymob (لو مفعّلة)
4. أوامر البناء والتشغيل:
   ```
   Build:  npm install && npx prisma migrate deploy
   Start:  npm start
   ```
5. السيرفر برفض يشتغل تلقائيًا لو `JWT_SECRET` أو `CORS_ORIGIN` لسه على القيم الافتراضية غير الآمنة — ده مقصود، مايفوتش حاجة بالغلط.

### الفرونت اند

اختاري **Vercel** أو **Netlify** (الأسهل لمشاريع Vite):

1. ارفعي مجلد `frontend`.
2. Build command: `npm run build` — Output directory: `dist`
3. متغير البيئة: `VITE_API_URL=https://<دومين-الباك-اند>/api`
4. اربطي دومين حقيقي، وهيبقى عندك HTTPS تلقائي من المنصة.

---

## إزاي شغالة الاتصال بينهم؟

الفرونت اند بيبعت طلبات HTTP لعنوان الـ API في `VITE_API_URL`. المصادقة (JWT) بتتخزن في `localStorage` وبتتبعت مع كل طلب محتاج صلاحيات.

## نقاط الـ API

| Method | المسار | الوصف | الصلاحية |
|---|---|---|---|
| POST | /api/auth/register | إنشاء حساب | عام |
| POST | /api/auth/login | تسجيل الدخول | عام |
| GET | /api/auth/me | بيانات المستخدم الحالي | مسجّل دخول |
| GET | /api/products | كل المنتجات | عام |
| POST/PUT/DELETE | /api/products | إدارة المنتجات | أدمن |
| POST | /api/orders | إنشاء طلب (يحجز المخزون فورًا) | مسجّل دخول |
| GET | /api/orders/mine | طلبات المستخدم الحالي | مسجّل دخول |
| GET | /api/orders/all | كل الطلبات | أدمن |
| PATCH | /api/orders/:id/status | تحديث حالة الطلب (الإلغاء يرجّع المخزون) | أدمن |
| GET | /api/users | قائمة العملاء | أدمن |
| POST | /api/payments/paymob/initiate | بدء عملية دفع بالبطاقة | مسجّل دخول |
| GET | /api/payments/paymob/callback | Webhook تأكيد الدفع (Paymob فقط) | HMAC موقّع |

## إجراءات الأمان المفعّلة بالفعل

- تشفير كلمات المرور بـ bcrypt، جلسات JWT صالحة 7 أيام
- `helmet` لضبط رؤوس HTTP الأمنية
- تحديد معدّل الطلبات (Rate limiting) على كل الـ API، وأشد على مسارات تسجيل الدخول لمنع محاولات التخمين
- التحقق من صلاحيات الأدمن على كل مسار حساس (منتجات، طلبات، عملاء)
- المخزون بيتحجز فعليًا داخل معاملة قاعدة بيانات (Transaction) عند إنشاء الطلب، فمفيش بيع كمية أكتر من المتاح حتى مع طلبات متزامنة
- السيرفر بيرفض يشتغل في وضع الإنتاج لو الإعدادات الحساسة (JWT_SECRET, CORS_ORIGIN) لسه على قيمها الافتراضية غير الآمنة
- توقيع HMAC-SHA512 بيتحقق منه على كل استدعاء webhook من Paymob قبل تصديق أي عملية دفع

## حاجات لسه تستاهل اهتمامك بعد الإطلاق

1. **الشحن**: مفيش حساب تكلفة شحن أو تكامل مع شركة شحن — الأسعار المعروضة نهائية بدون شحن حاليًا.
2. **البريد الإلكتروني**: مفيش إرسال إيميلات تأكيد طلب أو استعادة كلمة مرور — يستاهل إضافة خدمة زي Resend أو SendGrid.
3. **النسخ الاحتياطي**: فعّلي نسخ احتياطي دوري تلقائي لقاعدة البيانات من لوحة تحكم مزوّد الاستضافة.
4. **المراقبة**: يفضّل ربط أداة مراقبة أخطاء زي Sentry على الباك اند قبل حركة مرور حقيقية كبيرة.
