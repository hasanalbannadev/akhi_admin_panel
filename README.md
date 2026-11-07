# Akhi Lifestyle - Customer Website (Next.js)

আপনার লাইভ `shop_backend` (FastAPI) API এর উপর বানানো কাস্টমার ওয়েবসাইট। Admin panel নেই, শুধু কাস্টমার সাইড।
Stack: Next.js (App Router) + TypeScript + Tailwind CSS v4।

## ১. VS Code এ চালানো
```bash
npm install
cp .env.example .env.local      # তারপর .env.local এ নিজের মান বসান
npm run dev                     # http://localhost:3000
```
Node 20.9+ লাগবে।

## ২. .env.local (সবচেয়ে জরুরি)
| নাম | কাজ |
|---|---|
| `NEXT_PUBLIC_API_URL` | লাইভ Backend, শেষে `/api/v1` (যেমন `https://api.yourdomain.com/api/v1`) |
| `NEXT_PUBLIC_SITE_URL` | এই সাইটের লাইভ ঠিকানা (SEO/sitemap) |
| বাকিগুলো | দোকানের নাম, ফোন, ইমেইল, ঠিকানা, সোশ্যাল, Messenger/WhatsApp |

## ৩. Backend এ যা বদলাতে হবে (খুব জরুরি)
Backend এর `.env` এ:
- `FRONTEND_URL=https://yourdomain.com` (CORS + SSLCommerz পেমেন্টের পর এখানেই ফেরত আসে)
- লোকাল টেস্টে `http://localhost:3000` আগে থেকেই allowed আছে।
- SSLCommerz success/fail redirect যায় `/order/{অর্ডার নম্বর}?paid=1` বা `?paid=0` এ (এই পেজ বানানো আছে)।

## ৪. হোস্ট
- **Vercel**: GitHub এ push -> Import -> Environment Variables এ `.env.example` এর মান বসান -> Deploy।
- **VPS**: `npm run build && npm start` (PM2 + Nginx proxy)।

## ৫. ফোল্ডার ম্যাপ (কোথায় কী এডিট করবেন)
```
src/app/            পেজ (page.tsx), layout, robots, sitemap, manifest
src/components/     ui/ layout/ home/ product/ cart/ checkout/ orders/ account/
src/context/        Auth, Cart, Wishlist, Toast
src/lib/api/        Backend এর প্রতিটা endpoint (catalog, cart, orders, payments, ...)
src/lib/constants.ts  সব বাংলা লেবেল, মেনু, ফিল্টার রেঞ্জ
src/lib/site.ts     দোকানের তথ্য
src/app/globals.css রং/ফন্ট (brand-600 = মূল গোলাপি)
```
- হোম সেকশন বদলাতে: `src/app/page.tsx`
- Footer লিংক: `src/lib/constants.ts`
- প্রোমো ব্যানারের লেখা: `src/components/home/PromoBanner.tsx`

## ৬. যা আছে
হোম (Banner slider, Best seller, New) · ক্যাটাগরি/শপ (ফিল্টার, সর্ট, পেজিনেশন) · প্রোডাক্ট ডিটেইলস (গ্যালারি, রিভিউ, ডেলিভারি, রিলেটেড) · কার্ট (guest ও চলে) · চেকআউট (ঠিকানা, কুপন, COD/SSLCommerz/bKash/Nagad) · অর্ডার ডিটেইলস (ট্র্যাকিং, ইনভয়েস, ক্যান্সেল, রিটার্ন, রি-অর্ডার) · গেস্ট অর্ডার ট্র্যাক · OTP লগইন · প্রোফাইল, ঠিকানা, পছন্দের তালিকা, রিভিউ, রিটার্ন, পেমেন্ট হিস্টরি, নোটিফিকেশন · সার্চ সাজেশন · মোবাইল bottom nav।

## ৭. সীমাবদ্ধতা (Backend এ endpoint নেই বলে)
- **লাইভ চ্যাট**: কাস্টমারের জন্য chat API নেই (Messenger webhook), তাই সাপোর্ট পেজে Messenger/WhatsApp/ফোন লিংক আছে।
- **নোটিফিকেশন**: আলাদা API নেই, অর্ডার ও রিটার্নের অবস্থা থেকে তৈরি হয়।
- **কালার/সাইজ ভ্যারিয়েন্ট, ব্র্যান্ড ফিল্টার, প্রোডাক্ট রেটিং কার্ডে**: Backend এ নেই, তাই বাদ।
- প্রোডাক্টে রিভিউ দেওয়া যায় শুধু ডেলিভারি পাওয়া কাস্টমার (Backend নিয়ম)।

## ৮. SEO
প্রতি পেজে title/description/canonical/Open Graph, পণ্যে Product + Breadcrumb JSON-LD, `sitemap.xml` (পণ্য ও ক্যাটাগরি অটো), `robots.txt`, প্রাইভেট পেজ noindex।
