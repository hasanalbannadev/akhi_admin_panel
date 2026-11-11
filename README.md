<div align="center">

# Akhi Lifestyle — Admin Panel

**Back-office for running the Akhi Lifestyle online shop: orders, products, payments, couriers, returns, chat, accounts and reports.**

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2023-F7DF1E?logo=javascript&logoColor=black)
![CSS](https://img.shields.io/badge/CSS-Plain-1572B6?logo=css3&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![WebSocket](https://img.shields.io/badge/Live_chat-WebSocket-010101?logo=socketdotio&logoColor=white)
![PM2](https://img.shields.io/badge/Process-PM2-2B037A?logo=pm2&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)
![Built with Claude](https://img.shields.io/badge/Built_with-Claude-D97757?logo=anthropic&logoColor=white)

</div>

---

## Overview

This is the **admin panel** for the Akhi Lifestyle shop. It is a Next.js app that talks to the shop's FastAPI backend. It is fully responsive, so the same panel works on desktop, tablet and phone. The customer storefront lives in a separate repository.

```
Customer website  ──►  Backend API (FastAPI + PostgreSQL)  ◄──  Admin panel (this repo)
```

## Features

### Daily operations
- **Dashboard**: today's orders, net revenue (after refunds), pending payments, cancel and return requests, low-stock list
- **Orders**: search, filters, bulk status change and delete, manual orders, cancel-request approval, printable invoice, CSV export
- **Order Tracking**: the full journey of an order in one line, from order to courier, delivery, return and refund
- **Couriers**: send to Steadfast or Pathao, live status sync, courier balance
- **Payments**: verify or reject bKash, Nagad and bank payments by TrxID
- **Returns**: approve, schedule courier pickup, mark received, refund by bKash with an adjustable amount

### Catalog
- **Products**: multiple images, colours with their own images, price, cost, stock, **Product code (SKU)**
- **Categories**: categories and subcategories with images and menu order
- **Inventory**: stock in and out with a reason, and a full stock history
- **Offers, Coupons and Banners**: percentage offers, coupon codes with limits and expiry, hero and promo banners

### Customer communication
- **Customer Chat**: real-time chat with website customers over WebSocket, including images
- **Chat & Messages**: Messenger inbox
- **SMS**: send messages, delivery log, test SMS
- **Reviews**: read, reply and remove, photos included
- **Notifications**: new orders, payments, cancel and return requests

### Money and reports
- **Company Accounts** *(owner only)*: the business's own income and expense book. Income from delivered and paid orders is added automatically, partial refunds are accounted for, and manual income and expenses can be added, edited and filtered by period and category
- **Accounts** *(owner only)*: order-based ledger with credits and debits
- **Reports**: sales, profit, best sellers and best customers, excluding cancelled and returned orders

### Order numbers and product codes
- **Invoice no.**: each order can carry the shop's own invoice number. The admin panel always shows both the shop's number and the site's automatic order number. Customers see the shop's number when it is set, otherwise the automatic one
- **Product code**: shown in the product list, inventory and order items, and searchable

### Administration
- **Delivery Zones**: area-based delivery charges and free-delivery thresholds
- **Payment Accounts**: the bKash, Nagad and bank numbers shown to customers
- **Settings**: payment methods on or off, minimum order, social links, password change, cleanup of unused images
- **Staff** *(owner only)*: staff accounts

## Roles

| Role | Access |
|---|---|
| **Owner** | Everything, including Staff, Accounts and Company Accounts |
| **Staff** | Everything except the Staff page, Accounts, Company Accounts, sales, profit and top-customer reports. Settings are view-only. The backend enforces this |

## Tech stack

| Area | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React 18, plain CSS |
| Language | JavaScript (JSX) |
| Real-time | WebSocket, with polling fallback |
| Backend | FastAPI, PostgreSQL (separate repository) |
| Hosting | Linux server, Nginx, PM2 |
| CI/CD | GitHub Actions over SSH |

## Getting started

Requires **Node.js 20 or newer** and a running backend.

```bash
git clone https://github.com/hasanalbannadev/akhi_admin_panel.git
cd akhi_admin_panel
npm install
cp .env.local.example .env.local     # then set BACKEND_URL
npm run dev                          # http://localhost:3000
```

Sign in with the owner `ADMIN_USERNAME` and `ADMIN_PASSWORD` from the backend `.env`, or with a staff account.

| Script | Purpose |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build on port 3000 |

## Configuration

| Variable | Description |
|---|---|
| `BACKEND_URL` | Address of the FastAPI backend, without a trailing slash. On the server it is `http://127.0.0.1:<backend port>`. Next.js forwards `/api/*` and `/uploads/*` to it, so CORS needs no setup |
| `NEXT_PUBLIC_WS_URL` | Optional WebSocket address for instant chat. By default it is derived from the admin domain |

Set `BACKEND_URL` **before** `npm run build`, because the rewrite is fixed at build time.

For real-time chat, the backend's Nginx config must forward WebSocket upgrades (`Upgrade` and `Connection` headers). Without it, chat falls back to polling and nothing breaks.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`:

1. **Build**: installs dependencies and builds the app as a check
2. **Deploy**: connects to the server over SSH, pulls the latest code, writes `BACKEND_URL` into `.env.local`, builds, and restarts the `akhi-admin` process in PM2

It can also be started manually from the **Actions** tab with **Run workflow**.

Add these repository secrets under **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `SERVER_HOST` | Server IP address |
| `SERVER_USER` | SSH user |
| `SERVER_PASSWORD` | SSH password |

> Never commit `.env.local`. Keep the real value on the server only, and keep the admin panel behind HTTPS.

## Project structure

Every section keeps its list, forms and API calls in **one file**. The comment at the top of each file lists the endpoints it uses.

```
src/
├─ app/
│  ├─ (admin)/<route>/page.jsx   Thin wrappers that render a section
│  ├─ login/                     Sign-in page
│  └─ globals.css                Colours and styles (--pink, --navy)
├─ sections/                     One file per admin section
├─ components/
│  ├─ Shell.jsx                  Sidebar and top bar
│  ├─ ui.jsx                     Modal, table, uploader and other shared UI
│  ├─ InvoiceModal.jsx           Invoice view and print
│  └─ ManualOrderModal.jsx       Create an order by hand
└─ lib/
   ├─ api.js                     API client
   ├─ auth.jsx                   Sign-in state
   ├─ realtime.js                Live updates and chat connection
   └─ invoicePdf.js              Invoice PDF
```

### Where to change things

| To change | Edit |
|---|---|
| A section's screen or logic | `src/sections/<Name>Section.jsx` |
| Sidebar menu items | `NAV` in `src/components/Shell.jsx` |
| Colours | top of `src/app/globals.css` |
| Backend address | `BACKEND_URL` in `.env.local` |

## Notes

- The sign-in token is stored in the browser and expires after 12 hours.
- Chat replies on Messenger need `META_PAGE_TOKEN` in the backend `.env`. Sending to Steadfast or Pathao needs their API keys there too.
- The Invoice no. and Product code features need the matching backend version.

## Built with

Created and directed by Hasan Albanna (Flutter developer). The code was written with Claude (Anthropic).

## License

All rights reserved. This is a private commercial project and may not be copied or reused without permission.
