# School Lunch App

A full-stack school lunch ordering platform for parents, teachers, and administrators. Parents can browse menus, place orders, set up recurring weekly orders, and pay securely online. Admins get a dashboard with real-time metrics and CSV exports.

## Production Deployment and Scaling

For AWS architecture, sizing, migration steps, and launch checklist for 12 schools and 1000+ accounts, see:

- [docs/production-scale-aws-plan.md](docs/production-scale-aws-plan.md)

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
- **Prisma ORM** with PostgreSQL for production
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

For local environment setup, copy values from `.env.example` into your `.env.local`.

## Environment Variables

Create a `.env.local` file with the following:

```
DATABASE_URL="postgresql://username:password@your-rds-endpoint.amazonaws.com:5432/schoollunch"
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
RESEND_API_KEY=your_resend_key
FROM_EMAIL="School Lunch <noreply@yourdomain.com>"
REDIS_URL=redis://localhost:6379
```

Production note: `FROM_EMAIL` is required and `REDIS_URL` should point to managed Redis (not localhost).

## Production Readiness Additions

- Health check endpoint: `/api/health`
- Docker standalone production build: `Dockerfile`
- App Runner deployment workflow: `.github/workflows/deploy.yml`
- App Runner deployment guide: `deploy/README.md`
- Production planning guide: `docs/production-scale-aws-plan.md`

## AWS Production Path

The repo is aligned to deploy on AWS with:

- App Runner for compute
- RDS PostgreSQL for the application database
- ECR for container images
- SSM Parameter Store for environment secrets

Manual AWS provisioning steps are documented in `deploy/README.md`.


## Database Schema

Key models: `User`, `Child`, `Teacher`, `School`, `MenuItem`, `Order`, `RecurringOrderRule`, `TeacherOrder`
