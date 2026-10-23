# FORME — Premium Branded Fashion Storefront & Admin Portal

A complete, modern, responsive branded fashion e-commerce web platform built with **React**, **Vite**, and **Supabase**.

**FORME** operates on an **enquiry-based purchasing workflow**:
> **Browse Catalogue → Submit Product Enquiry → Store Team Confirms Size, Availability & Pricing → Manual Shipping Dispatch**
*(Direct checkout and online payments are intentionally omitted to prevent sizing mismatches and stockout cancellations).*

---

## 🌟 Architecture & Features

### 1. Storefront & Public Pages
- **Home (`/`)**: Announcement bar, hero with fashion imagery, horizontal brand ticker, shop by category cards, trending featured pieces, how enquiries work (3-step flow), why choose us, and direct Call/WhatsApp CTA for **Y. Ramesh**.
- **Shop All (`/shop`)**: Complete catalogue with live query parameters, keyword search, brand filter, category filter, sorting (featured, newest, price low/high, name A–Z), load more, and product count.
- **Shop by Brand (`/brands`)**: Directory of recognized fashion labels with search and filtered links.
- **Category Portals**:
  - Men's Fashion (`/men`)
  - Women's Fashion (`/women`)
  - Footwear Collection (`/footwear`)
  - Accessories (`/accessories`)
  - New Arrivals (`/new-arrivals`)
  - Curated Offers (`/offers`)
- **Product Details (`/products/:slug`)**: High-resolution image gallery, thumbnail previews, price with discount percentage calculation, availability badge, size/color variant chips, short and full descriptions, dedicated contact card for Y. Ramesh, and prominent enquiry buttons:
  - **Enquire About This Product** (opens interactive modal)
  - **Call Now** (`tel:6302016103`)
  - **WhatsApp Enquiry** (`https://wa.me/916302016103`) with URL-encoded product details.
- **About Us (`/about`)**: Narrative on the enquiry-first fashion model and personalized service.
- **Contact Us (`/contact`)**: Primary contact card for **Y. Ramesh (6302016103)** with direct dial and WhatsApp links, plus a quick query form.
- **Frequently Asked Questions (`/faq`)**: Interactive accordion addressing 10 common customer questions.
- **Shipping & Returns (`/shipping`)**: Transparent dispatch timelines (1–3 business days) and pre-shipment inspection guidelines.
- **Privacy Policy (`/privacy`)** & **Terms and Conditions (`/terms`)**.
- **404 Not Found (`*`)**: Custom branded fallback page.

### 2. Customer Authentication & Account Portal
- **Customer Sign In (`/login`)** & **Registration (`/register`)** via Supabase Auth.
- **Forgot Password (`/forgot-password`)** & **Reset Password (`/reset-password`)**.
- **Customer Dashboard (`/account`)**: Account overview and recent enquiries list.
- **My Enquiries (`/account/enquiries`)**: Full list with status filters (New, Reviewing, Availability Confirmed, Awaiting Response, Converted to Order, Closed, Cancelled).
- **Enquiry Details (`/account/enquiries/:id`)**: Reference code, requested size/color/quantity, status lifecycle description, and direct contact options.
- **Customer Profile (`/account/profile`)**: Name and phone number management, plus password change.
- **Wishlist (`/account/wishlist`)**: Saved pieces with direct enquiry triggers.

### 3. Product Enquiry Workflow (Primary Purchase Flow)
- **Guest & Authenticated Support**: Visitors can submit enquiries with name, email, and phone without creating an account, or log in to track enquiries under their account.
- **Unique Reference ID**: Generates a reference code (e.g. `ENQ-XXXXXX`) stored in the database.
- **Confirmation Screen**: Displays the reference code, instructions on next steps, and direct Call/WhatsApp links to Y. Ramesh.

### 4. Admin Management Portal (Protected)
- **Separate Admin Login (`/admin/login`)**: Verifies administrative privileges on the database (`profiles.role = 'admin'`). Customer accounts are blocked.
- **Left Sidebar Layout (`/admin`)**: Navigation, live role verification badge, storefront preview shortcut, and secure logout.
- **Overview Dashboard (`/admin`)**: Real database-backed counts for published products, draft products, total brands, new enquiries, reviewing enquiries, and converted orders, plus recent incoming submissions.
- **Product Management (`/admin/products`)**: Add, edit, archive/delete products, toggle publish/draft, set regular & sale prices (with auto discount calculation), configure sizes/colors, manage flags (Featured, New Arrival, Offer), and set image URLs.
- **Brand Management (`/admin/brands`)**: Create and edit brand records, slugs, descriptions, and storefront visibility.
- **Category Management (`/admin/categories`)**: Manage catalogue taxonomy.
- **Inventory & Stock (`/admin/inventory`)**: Rapid inline status update (`Available`, `Check availability`, `Out of stock`) and stock counts.
- **Enquiry Management (`/admin/enquiries`)**: Search and filter enquiries, update status through all 7 lifecycle states, record private internal admin notes (hidden from customers), and open one-click WhatsApp or Phone dialer to reach the customer.
- **Customer Directory (`/admin/customers`)**: View registered customers under strict Row Level Security.
- **Website Content Management (`/admin/content`)**: Configure the top announcement bar, homepage hero headline/subtext, and store contact info.
- **Admin Profile (`/admin/profile`)**: Administrator credential review and password changes.

---

## 📞 Verified Business Contact Information

All customer communication across the website connects to:
- **Contact Person**: Y. Ramesh
- **Phone Number**: `6302016103`
- **Telephone Link**: `tel:6302016103`
- **WhatsApp Link**: `https://wa.me/916302016103`

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested with Vite 6 & Node 20)
- A Supabase project (e.g. `clothing_website`)

### 2. Environment Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set your Supabase URL and public anon key in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   *(Note: Never place service-role keys in `.env` or frontend code)*.

### 3. Database Schema & Migration
1. Open your **Supabase Dashboard → SQL Editor**.
2. Run the base schema from `supabase/schema.sql`.
3. Run the schema extension migration from `supabase/migrations/001_extend_schema.sql` (enables guest enquiries, categories, site settings, and extended product fields).

### 4. Provisioning the Initial Admin Account
1. Register your personal account via the website at `/register`.
2. In the Supabase SQL Editor, promote your verified account to admin:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
   ```
3. Sign in at `/admin/login` to access the Admin Control Center.

### 5. Running the Application
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build
```

---

## 🔒 Security & Data Integrity
- **PostgreSQL Row Level Security (RLS)** is enabled on all tables: `profiles`, `brands`, `categories`, `products`, `product_inquiries`, `inquiry_status_history`, and `site_settings`.
- Guests can submit enquiries via anon RLS policies; authenticated customers can view only their own records.
- Internal admin notes (`admin_notes`) on enquiries are restricted exclusively to verified administrators.
- Admin permissions are enforced on the database through `public.is_admin()`, not via client-side flags.
