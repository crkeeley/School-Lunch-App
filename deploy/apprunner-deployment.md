# App Runner Deployment Checklist

## Infrastructure

1. Create an RDS PostgreSQL 15 instance.
2. Lock database inbound access to the App Runner VPC connector/security path only.
3. Create a private ECR repository named `school-lunch-app`.
4. Create SSM parameters for:
   - `/schoollunch/prod/DATABASE_URL`
   - `/schoollunch/prod/NEXTAUTH_SECRET`
   - `/schoollunch/prod/NEXTAUTH_URL`
   - `/schoollunch/prod/STRIPE_SECRET_KEY`
   - `/schoollunch/prod/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `/schoollunch/prod/STRIPE_WEBHOOK_SECRET`
   - `/schoollunch/prod/RESEND_API_KEY`
   - `/schoollunch/prod/FROM_EMAIL`
   - `/schoollunch/prod/REDIS_URL`

## Application

1. Build and push the Docker image to ECR.
2. Create an App Runner service from the ECR image.
3. Set runtime to port `3000`.
4. Configure health check path to `/api/health`.
5. Set compute to `1 vCPU / 2 GB` with autoscaling min `1`, max `5`.
6. Ensure App Runner runtime variables map all required SSM parameters.

## Database Migration

1. Set `DATABASE_URL` to the RDS PostgreSQL connection string.
2. Run `npm run db:migrate:deploy` against the RDS instance.

## Stripe

1. Register production webhook at `/api/webhooks/stripe`.
2. Store the webhook secret in SSM.
3. Verify `payment_intent.succeeded` and `payment_intent.payment_failed` events are received.

## Runtime Notes

1. `FROM_EMAIL` is required and must be set in production.
2. `REDIS_URL` should point to a managed Redis instance for distributed rate limiting.
