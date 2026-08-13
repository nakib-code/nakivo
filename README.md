# Nakibo 🛍️

> A modern, full-stack e-commerce platform built for a fast, secure, and seamless online shopping experience.

**Nakibo** is a production-focused e-commerce web application designed with a modern UI, scalable architecture, secure authentication, product management, shopping cart, flash sales, order management, and online payment capabilities.

The project was originally developed under the name **Bagddash** and is now presented as **Nakibo**.

---

## ✨ Features

### 🛒 Customer Experience

* Browse products with a clean and responsive interface
* Product search and category-based discovery
* Detailed product pages
* Product ratings
* Shopping cart management
* Quantity management with stock validation
* Flash sale pricing and countdown
* Wishlist-ready architecture
* Responsive design for mobile, tablet, and desktop
* Secure checkout flow
* Order placement and order tracking

### ⚡ Flash Sale

* Create and manage flash sales
* Automatic sale start and end time validation
* Dynamic discounted pricing
* Original price comparison
* Discount percentage calculation
* Real-time countdown timer
* Automatic sale expiration
* Stock-aware cart functionality

### 👨‍💼 Admin Dashboard

* Admin authentication
* Product management
* Create products
* Update products
* Delete products
* Featured product management
* Flash sale management
* Order management
* Order status updates
* Product statistics
* Search and filtering

### 💳 Payment

* Cash on Delivery
* Stripe payment integration
* Payment status tracking
* Secure checkout workflow

### 🔐 Authentication & Authorization

* User authentication
* Secure session handling
* Role-based access control
* Customer and admin permissions
* Protected dashboard routes
* Protected API routes

---

## 🧰 Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide React
* Zustand
* Sonner

### Backend

* Next.js API Routes
* Node.js
* MongoDB
* Mongoose

### Authentication

* Custom authentication
* Secure session management
* Role-based authorization

### Payment

* Stripe

### Database

* MongoDB
* Mongoose ODM

### Deployment

* Vercel

---

## 🏗️ Project Architecture

```text
Nakibo/
│
├── app/
│   ├── (public)/
│   │   ├── products/
│   │   └── ...
│   │
│   ├── (dashboard)/
│   │   └── admin/
│   │       ├── products/
│   │       ├── orders/
│   │       └── ...
│   │
│   └── api/
│       ├── auth/
│       ├── products/
│       ├── orders/
│       └── payments/
│
├── components/
│   ├── products/
│   ├── ui/
│   └── ...
│
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   └── ...
│
├── models/
│   ├── Product.ts
│   ├── Order.ts
│   ├── User.ts
│   └── ...
│
├── store/
│   └── useCartStore.ts
│
├── types/
│   └── index.ts
│
├── public/
│   └── ...
│
└── README.md
```

---

## 🚀 Getting Started

Follow the steps below to run Nakibo locally.

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

### 2. Navigate to the project

```bash
cd nakibo
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file in the project root.

```env
MONGODB_URI=your_mongodb_connection_string

NEXTAUTH_SECRET=your_auth_secret

STRIPE_SECRET_KEY=your_stripe_secret_key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Never commit `.env.local` or expose secret keys in the repository.

### 5. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 📦 Available Scripts

```bash
npm run dev
```

Runs the development server.

```bash
npm run build
```

Creates an optimized production build.

```bash
npm run start
```

Starts the production server.

```bash
npm run lint
```

Runs the project's linting checks.

---

## 🛍️ Core Product Model

Products support essential e-commerce information such as:

```text
Product
├── title
├── description
├── price
├── category
├── stock
├── images
├── ratings
├── soldCount
├── isFeatured
├── isFlashSale
├── flashSalePrice
├── flashSaleStart
└── flashSaleEnd
```

This structure allows Nakibo to support both regular products and time-based promotional campaigns.

---

## ⚡ Flash Sale System

Nakibo includes a dynamic flash sale system.

A product is considered active during a flash sale only when:

```text
Current Time >= Sale Start
        AND
Current Time <= Sale End
        AND
Flash Sale Price < Regular Price
```

When the sale is active:

* Customers see the discounted price.
* The original price is displayed separately.
* Discount percentage is calculated automatically.
* A countdown timer displays the remaining time.
* Cart pricing uses the active sale price.

Once the sale expires, the regular product price is automatically used.

---

## 🛒 Cart System

The shopping cart is powered by **Zustand** with persistent storage.

Cart functionality includes:

* Add product
* Remove product
* Increase quantity
* Decrease quantity
* Stock validation
* Automatic total calculation
* Persistent cart state
* Flash sale price support

Example cart item:

```ts
{
  _id: "product-id",
  title: "Premium Sneakers",
  price: 79.99,
  regularPrice: 99.99,
  isFlashSale: true,
  image: "/product.jpg",
  stock: 20,
  quantity: 2
}
```

---

## 📋 Order Management

Customers can place orders using their selected payment method.

Administrators can manage order status through the dashboard.

Supported statuses:

```text
Pending
Processing
Delivered
Cancelled
```

Order information includes:

* Customer
* Products
* Quantity
* Product price
* Shipping address
* Phone number
* Payment method
* Payment status
* Order status
* Total price

---

## 🔐 Security

Nakibo follows several security-focused practices:

* Protected admin routes
* Server-side authorization
* Role-based access control
* Environment variable protection
* Server-side database operations
* Stock validation
* Payment verification
* Input validation
* Secure API access

---

## 📱 Responsive Design

Nakibo is designed to provide a consistent experience across:

* 📱 Mobile devices
* 📲 Tablets
* 💻 Laptops
* 🖥️ Desktop screens

The interface uses responsive layouts and reusable UI components to maintain consistency throughout the application.

---

## 🎨 Design Philosophy

Nakibo focuses on:

* Minimal and modern UI
* Clear product presentation
* Strong visual hierarchy
* Smooth interactions
* Responsive layouts
* Accessible interface patterns
* Consistent spacing and typography
* Conversion-focused shopping experience

---

## 🌐 Live Demo

**Live Website:**
`https://nakivo.vercel.app/`

**GitHub Repository:**
`https://github.com/nakib-code/nakivo`

> Replace the links above with your actual deployment and repository URLs.

---

## 📸 Screenshots

Add project screenshots here to showcase the main interfaces.

Recommended screenshots:

```text
1. Homepage
2. Product Listing
3. Product Details
4. Flash Sale Section
5. Shopping Cart
6. Checkout
7. Admin Dashboard
8. Product Management
9. Order Management
```

---

## 🔮 Future Improvements

Planned improvements may include:

* Wishlist system
* Product reviews
* Advanced product filtering
* Coupon and discount system
* Inventory analytics
* Sales analytics
* Email notifications
* Advanced search
* Recommendation system
* Customer dashboard
* More payment gateways

---

## 👨‍💻 Developer

**Nakibul Islam**

Full-Stack Developer

Focused on building modern, scalable, and production-ready web applications using modern JavaScript technologies.

### Tech Focus

```text
Next.js
React
TypeScript
Node.js
Express.js
MongoDB
PostgreSQL
Prisma
Tailwind CSS
REST APIs
```

---

## 📄 License

This project is created for educational, portfolio, and demonstration purposes.

---

## ⭐ Support

If you find this project useful or interesting, consider giving the repository a ⭐ on GitHub.

---

**Nakibo — Modern Shopping, Simplified.**
