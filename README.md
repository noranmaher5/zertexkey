
# ⚡ ZetrexKeys — Digital E-Commerce Platform

A production-ready full-stack e-commerce platform for selling digital products (game codes, gift cards, eBooks). Built with React, Node.js, MongoDB, and Stripe.

---

## 🗂️ Project Structure :::

```
zetrexkeys/
├── backend/
│   ├── config/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js       ← atomic code fulfillment
│   │   ├── paymentController.js     ← Stripe integration
│   │   ├── discountController.js       
│   │   ├── notificationController.js     
│   │   ├── codeController.js
│   │   └── adminController.js
│   │   └── paypalController.js

│   ├── middleware/
│   │   └── auth.js                  ← JWT + role-based guards
│   │   └── upload.js                  
│   ├── models/
│   │   ├── cart.js
│   │   ├── discountcode.js
│   │   ├── log.js
│   │   ├── notification.js
│   │   ├── settings.js
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── DigitalCode.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── userRoutes.js
│   │   ├── nootificationRoutes.js
│   │   ├── discountRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── codeRoutes.js
│   │   └── adminRoutes.js
│   ├── services/
│   │   └── emailService.js          ← Nodemailer templates
│   ├── utils/
│   │   └── seeder.js                ← Sample data seeder
│   │   └── googleverify.js                ←
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   └── ProductCard.js
    │   │   │   └── notificationBell.js
    │   │   │   └── ProductCard.js
    │   │   └── layout/
    │   │       ├── Navbar.js
    │   │       └── Footer.js
    │   ├── context/
    │   │   ├── AuthContext.js
    │   │   └── CartContext.js
    │   ├── pages/
    │   │   ├── HomePage.js
    │   │   ├── ProductsPage.js
    │   │   ├── ProductDetail.js
    │   │   ├── CartPage.js
    │   │   ├── CheckoutPage.js      ← Stripe Elements
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── ProfilePage.js
    │   │   ├── OrdersPage.js
    │   │   ├── OrderDetailPage.js
    │   │   ├── NotFoundPage.js
    │   │   └── admin/
    │   │       ├── AdminDashboard.js
    │   │       ├── AdminProducts.js
    │   │       ├── AdminOrders.js
    │   │       ├── AdminUsers.js
    │   │       └── AdminCodes.js    ← Bulk code upload
    │   ├── services/
    │   │   └── api.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── package.json
    ├── tailwind.config.js
    └── .env.example
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- Stripe account (test keys)
- Gmail account (for emails, optional)

---

### Step 1 — Clone & Install

```bash
# Clone the repo
git clone https://github.com/yourname/digivault.git
cd digivault

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2 — Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=5000

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digivault

# JWT — make this long and random
JWT_SECRET=your_super_long_random_secret_key_here_abc123xyz789

# Email (Gmail with App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM=DigiVault <noreply@digivault.com>

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Generate.

---

### Step 3 — Configure Frontend Environment

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

### Step 4 — Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- **8 sample products** with 20 codes each
- **Owner account**: `admin@digivault.com` / `Admin@123456`
- **User account**: `user@digivault.com` / `User@123456`

---

### Step 5 — Run the App

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm start
# → http://localhost:3000
```

---



## 🎛️ Role System

| Role | Permissions |
|------|-------------|
| **user** | Browse, purchase, view own orders |
| **editor** | + Add/edit products |
| **admin** | + Delete products, view all orders, manage codes |
| **manager** | + Change user roles, deactivate users |
| **co-owner** | Full access except ownership transfer |
| **owner** | Complete access  |
| **hidden** | completely hidden from the UI (complete access) |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Protected |
| PUT | `/api/auth/update-profile` | Protected |
| PUT | `/api/auth/update-password` | Protected |

### Products
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/products` | Public |
| GET | `/api/products/:id` | Public |
| POST | `/api/products` | Editor+ |
| PUT | `/api/products/:id` | Editor+ |
| DELETE | `/api/products/:id` | Admin+ |
| POST | `/api/products/:id/reviews` | Protected |

### Orders
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/orders/my` | Protected |
| GET | `/api/orders/:id` | Protected (own) |
| GET | `/api/orders` | Admin+ |
| PUT | `/api/orders/:id/status` | Admin+ |

### Digital Codes
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/codes/bulk` | Admin+ |
| GET | `/api/codes/product/:id` | Admin+ |
| GET | `/api/codes/stats` | Admin+ |
| DELETE | `/api/codes/:id` | Admin+ |

### Payments
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/payments/config` | Public |
| POST | `/api/payments/create-payment-intent` | Protected |
| POST | `/api/payments/confirm/:orderId` | Protected |
| POST | `/api/payments/webhook` | Stripe (raw) |

### Admin
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin/dashboard` | Admin+ |
| GET | `/api/admin/users` | Admin+ |
| PUT | `/api/admin/users/:id/role` | Manager+ |
| PUT | `/api/admin/users/:id/toggle-status` | Manager+ |

---

## ☁️ Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build

# Install Vercel CLI
npm i -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard:
- `REACT_APP_API_URL` → your Render backend URL
- `REACT_APP_STRIPE_PUBLISHABLE_KEY`

### Backend → Render

1. Push code to GitHub
2. Create new **Web Service** on Render
3. Set **Root Directory** to `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `node server.js`
6. Add all `.env` variables in Render's Environment tab

### Database → MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create database user
3. Whitelist IP: `0.0.0.0/0` (all)
4. Get connection string → paste in `MONGODB_URI`

### Stripe Webhook (Production)

```bash
# Install Stripe CLI
stripe listen --forward-to https://your-backend.onrender.com/api/payments/webhook
# Copy webhook signing secret → STRIPE_WEBHOOK_SECRET
```

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT authentication with expiry
- ✅ Role-based access control
- ✅ Rate limiting (200 req/15min per IP)
- ✅ MongoDB injection sanitization
- ✅ HTTP security headers (Helmet)
- ✅ CORS protection
- ✅ Atomic code fulfillment (MongoDB transactions — no double-spending)
- ✅ Stripe webhook signature verification

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Tailwind CSS |
| UI Fonts | Syne (display), DM Sans (body) |
| State | React Context (Auth + Cart) |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) |
| Payments | Stripe Payment Intents |
| Email | Nodemailer |
| Security | Helmet, express-rate-limit, mongo-sanitize |
| Deploy | Vercel (FE), Render (BE), MongoDB Atlas (DB) |

---

## 📧 Support

For questions, open a GitHub issue or contact the developer.

**zetrexkeys** — Built with ❤️ for instant digital delivery.
=======
# zetrexkeys
>>>>>>> e0ae3a431369c99586a2d747a2e8ab8ceb32063b
