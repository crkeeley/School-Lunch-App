# AWS Deployment Status

This file maps the attached AWS deployment instructions to the current repository state.

## Step 1 — SQLite to PostgreSQL

### Implemented
- Prisma datasource switched to `postgresql` in `prisma/schema.prisma`.
- `DATABASE_URL` examples updated to PostgreSQL format in `.env.example` and `README.md`.
- Prisma migration metadata provider updated to PostgreSQL in `prisma/migrations/migration_lock.toml`.
- PostgreSQL-compatible baseline migration SQL generated in `prisma/migrations/20260315215749_init/migration.sql`.
- Added `npm run db:migrate:deploy` script for production deployment.

### Manual follow-up still required
- Provision the actual RDS PostgreSQL instance.
- Run `npm run db:migrate:deploy` against RDS.
- Migrate any existing local SQLite data if it must be preserved.

## Step 2 — Dockerize the App

### Implemented
- Production Dockerfile exists in `Dockerfile`.
- Next.js standalone output is enabled in `next.config.ts`.
- `.dockerignore` exists and excludes `.env*`, `node_modules`, and `.next`.
- Docker build runs Prisma generate before build.

### Manual follow-up still required
- Build and run the image locally with your real `.env.local`.
- Push the image to ECR.

## Step 3 — AWS Infrastructure Setup

### Implemented
- App Runner-oriented deployment docs in `deploy/README.md` and `deploy/apprunner-deployment.md`.
- GitHub Actions deployment workflow scaffold in `.github/workflows/deploy.yml`.
- Health check endpoint available at `/api/health`.

### Manual follow-up still required
- Provision RDS PostgreSQL.
- Create the ECR repository.
- Create the App Runner service.
- Attach custom domain and Route 53 DNS records.
- Configure scaling, networking, and database security groups.

## Step 4 — Health Check Endpoint

### Implemented
- `app/api/health/route.ts` exists and checks database connectivity with Prisma.

## Step 5 — Environment Variables / SSM

### Implemented
- `.env.example` lists required runtime variables.
- Deployment docs list SSM parameters to create.

### Manual follow-up still required
- Create the SecureString parameters in SSM Parameter Store.
- Reference them inside App Runner configuration.

## Step 6 — Stripe Webhook

### Implemented
- Existing Stripe webhook handler remains at `app/api/payment/webhook/route.ts`.
- Compatible alias route created at `app/api/webhooks/stripe/route.ts` to match deployment instructions.
- Webhook handler uses `STRIPE_WEBHOOK_SECRET` and includes retry-safe processing.

### Manual follow-up still required
- Register the production webhook URL in Stripe.
- Store the production webhook secret in SSM.
- Validate live-mode payment and webhook events end-to-end.

## Step 7 — CI/CD

### Implemented
- `.github/workflows/deploy.yml` added for ECR build/push and App Runner deployment trigger.

### Manual follow-up still required
- Add GitHub repository secrets:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `ECR_URI`
  - `APP_RUNNER_SERVICE_ARN`

## Current Readiness Summary

Repository-implemented now:
- PostgreSQL-ready Prisma config and migration baseline
- Dockerized production build
- App Runner deployment scaffolding
- Health checks
- Stripe webhook compatibility route

Still manual in AWS:
- RDS
- ECR
- App Runner
- Route 53
- SSM Parameter Store
- Stripe production webhook registration