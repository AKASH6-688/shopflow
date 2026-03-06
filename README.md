# ShopFlow — E-Commerce Management Tool & Plugin

Full-stack e-commerce management platform built with **Next.js 14**, **Prisma**, and **PostgreSQL**. Works standalone or as an embeddable chat plugin for Shopify, WooCommerce, Wix, and custom stores.

## Features

- **Dashboard** — Revenue, orders, customers, and profit/loss at a glance
- **Inventory Management** — Stock tracking with low-stock alerts and movement history
- **Product Catalog** — Products with benefits, cost/price tracking, and win scoring
- **Order Management** — Full lifecycle from placement to delivery with automated actions
- **Customer Tracking** — Blacklist system for non-receivers, repeat order notifications
- **Winning Products** — AI-scored product rankings based on sales, margin, and trends
- **Profit & Loss** — Charts for 15 days, 1 month, 1 year, 2 years, 5 years
- **AI Chat Support** — GPT-powered customer support with product knowledge
- **Seller Chat Override** — View AI conversations and manually respond
- **WhatsApp / Email / Call** — Automated order confirmation, tracking, and thank-you messages
- **Platform Integrations** — Shopify, WooCommerce, Wix, and Custom REST APIs
- **Embeddable Plugin** — `<script>` tag that adds a chat widget to any storefront

## Prerequisites

- **Node.js 18+** — https://nodejs.org
- **PostgreSQL** — running instance (local or cloud like Supabase/Neon)
- **Twilio** account (for WhatsApp & calls) — optional
- **OpenAI** API key (for AI chat) — optional

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Key variables:
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32+ char string for session signing |
| `OPENAI_API_KEY` | OpenAI key for AI chat |
| `TWILIO_ACCOUNT_SID` | Twilio SID for WhatsApp/calls |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `SMTP_USER` / `SMTP_PASS` | Gmail or SMTP credentials for email |

### 3. Set up the database

```bash
npx prisma db push
```

### 4. (Optional) Seed demo data

```bash
npx tsx prisma/seed.ts
```

Demo login: `demo@shopflow.com` / `demo1234`

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Plugin / Embed Usage

Add this to any storefront HTML to enable the AI chat widget:

```html
<script src="https://your-shopflow-domain.com/embed.js" data-token="YOUR_PLUGIN_TOKEN"></script>
```

The plugin token is found in **Dashboard → Settings → Plugin Embed Code**.

## Project Structure

```
src/
  app/
    page.tsx              # Landing page
    login/                # Auth pages
    register/
    dashboard/
      page.tsx            # Main dashboard
      inventory/          # Inventory management
      products/           # Product catalog
      orders/             # Order management
      customers/          # Customer tracking
      analytics/          # P&L graphs
      winning-products/   # Product scoring
      conversations/      # AI chat viewer
      messaging/          # WhatsApp/Email logs
      settings/           # Store & integration settings
    api/
      auth/               # NextAuth + registration
      products/           # CRUD
      orders/             # CRUD + status automation
      inventory/          # Stock movements
      customers/          # Search + blacklist
      analytics/          # Charts, P&L, winning products
      chat/               # AI conversations
      messaging/          # Send WhatsApp/Email
      calling/            # Twilio call webhooks
      integrations/       # Sync, webhooks, settings
      plugin/             # Public plugin chat endpoint
  components/             # Shared UI components
  lib/                    # Core libraries
    prisma.ts             # Database client
    auth.ts               # NextAuth config
    whatsapp.ts           # Twilio WhatsApp
    email.ts              # Nodemailer
    calling.ts            # Twilio Voice
    ai-chat.ts            # OpenAI integration
    analytics.ts          # Data aggregation
    integrations/         # Platform adapters
  types/                  # TypeScript interfaces
prisma/
  schema.prisma           # Database schema (15 models)
  seed.ts                 # Demo data seeder
public/
  embed.js                # Embeddable chat widget
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (JWT) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| AI | OpenAI GPT-4o-mini |
| Messaging | Twilio (WhatsApp + Voice) |
| Email | Nodemailer (SMTP) |
| Platforms | Shopify, WooCommerce, Wix, Custom |

## License

MIT
