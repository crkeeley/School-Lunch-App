# School Lunch App

A full-stack school lunch ordering platform for parents, teachers, and administrators. Parents can browse menus, place orders, set up recurring weekly orders, and pay securely online. Admins get a dashboard with real-time metrics and CSV exports.

## Features

### For Parents
- Monthly calendar view showing available school days
- Add menu items to cart and checkout with Stripe
- Set up recurring orders on specific weekdays (auto-ordering)
- Order history and delivery tracking
- Email confirmations via Resend

### For Admins
- Dashboard with total orders, revenue, and class-level metrics
- Orders grouped by teacher/classroom
- CSV export for orders and reports
- Manage menu items, teachers, and school settings

### For Teachers
- View and place orders for their classroom

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Prisma ORM** with SQLite
- **NextAuth.js** — authentication with JWT sessions and role-based access (Parent / Admin)
- **Stripe** — payment processing and webhook handling
- **Resend** + React Email — transactional email
- **Zustand** — cart state (persisted to localStorage)
- **React Hook Form** + **Zod** — form validation
- **Tailwind CSS 4**

## Getting Started

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
RESEND_API_KEY=your_resend_key
```

## Database Schema

Key models: `User`, `Child`, `Teacher`, `School`, `MenuItem`, `Order`, `RecurringOrderRule`, `TeacherOrder`
