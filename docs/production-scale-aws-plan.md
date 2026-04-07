# Production Scale + AWS Plan

This plan is for launching the School Lunch App for 12 schools with 1000+ accounts and room to grow.

## 1) Target Capacity and SLOs

Assumptions for sizing:
- 1000-3000 accounts over 12 schools in first phases
- 10-20% daily active users
- Order spikes around cutoff windows (before school lunch deadlines)
- Peak burst target: 50-150 requests/sec during short windows

Initial service objectives (SLOs):
- API p95 latency under 400 ms for non-reporting endpoints
- Checkout/payment endpoints p95 under 700 ms
- Monthly uptime target: 99.9%
- Data durability via automated backups and tested restore

## 2) Required Application Changes Before Scale

### A. Database: SQLite to PostgreSQL (mandatory)

Why:
- SQLite is single-node and not suitable for multi-tenant, concurrent production usage at this level.

Actions:
1. Update `prisma/schema.prisma` datasource provider to `postgresql`.
2. Provision production RDS PostgreSQL.
3. Run Prisma migrations against staging then production.
4. Migrate existing data (if needed) using export/import script.

### B. Multi-school tenancy hardening

Why:
- Prevent data leakage and enforce strict school boundaries.

Actions:
1. Ensure each domain model is school-scoped directly or through relation.
2. Enforce school filtering server-side in every API route.
3. Add integration tests that verify cross-school isolation fails closed.

### C. Indexing for high-frequency queries

Add/verify indexes for frequent filters and joins:
- `orders(parentId, deliveryDate)`
- `orders(teacherId, deliveryDate)`
- `orders(status, deliveryDate)`
- `menu_items(schoolId, isAvailable, category)`
- `children(parentId)`
- `teachers(schoolId, isActive)`
- `recurring_order_rules(parentId, isActive)`

### D. Reliability and security controls

Add these before launch:
1. Rate limiting for auth, register, order, payment APIs.
2. Idempotency in payment and webhook processing.
3. Async queue for non-critical tasks (emails, report generation).
4. Centralized structured logging with request IDs.
5. Alerting for 5xx spikes, slow DB queries, and queue backlog.

## 3) Recommended AWS Architecture

Core stack:
1. Compute: ECS Fargate for Next.js containerized app.
2. Load balancing: Application Load Balancer (ALB).
3. Database: RDS PostgreSQL (Multi-AZ).
4. Cache and throttling: ElastiCache Redis.
5. Queue: SQS (email/report background jobs).
6. Static assets: S3 + CloudFront.
7. Secrets: AWS Secrets Manager.
8. TLS and DNS: ACM + Route 53.
9. Edge security: AWS WAF on ALB/CloudFront.
10. Observability: CloudWatch logs/metrics/alarms.

## 4) Initial Infrastructure Specifications

These are conservative starting points with autoscaling.

### Web app (ECS Fargate)
- Desired tasks: 2 (minimum for HA)
- Task size: 1 vCPU, 2 GB RAM
- Autoscale to 6-10 tasks based on:
  - CPU > 60%
  - ALB target response time
  - request count per target

### RDS PostgreSQL
- Instance class: `db.t4g.medium` (start)
- Multi-AZ: enabled
- Storage: 100 GB gp3 with autoscaling
- Backups: 7-14 days minimum
- Performance Insights: enabled

### Redis
- ElastiCache `cache.t4g.small` (start)

### Worker service
- ECS Fargate worker for SQS processing
- Start with 1 task, scale on queue depth

## 5) Expected Monthly Cost Range (rough)

Costs vary by region/traffic; use AWS Pricing Calculator for final numbers.

Estimated baseline for production (single region):
1. ECS Fargate (2-4 avg tasks): $80-$300
2. ALB: $25-$80
3. RDS PostgreSQL Multi-AZ: $180-$450
4. Redis: $20-$70
5. CloudFront + S3: $10-$60
6. CloudWatch + logs: $20-$100
7. NAT/data transfer/misc: $40-$200

Approximate total: $375-$1260/month initially.

## 6) Deployment Pipeline (Recommended)

### Environments
1. Dev
2. Staging
3. Production

### CI/CD flow
1. Build and test on PR.
2. Build container image and push to ECR on merge.
3. Deploy automatically to staging.
4. Smoke tests (auth, order create, payment intent create, webhook simulation).
5. Manual approval gate to production deploy.

## 7) Migration Plan (Phased)

### Phase 1: Readiness (1-2 weeks)
1. Switch Prisma to PostgreSQL for local/staging.
2. Add missing indexes.
3. Add rate limiting and idempotency keys.
4. Add structured logs and health endpoints.

### Phase 2: AWS staging (1 week)
1. Provision VPC, ECS, ALB, RDS, Redis, SQS, Secrets Manager.
2. Deploy app and worker.
3. Configure Stripe webhook to staging URL.
4. Run load tests and tune autoscaling.

### Phase 3: Production launch (1 week)
1. Provision production stack with Multi-AZ DB.
2. Run DB migrations.
3. Set Route 53 and ACM TLS certs.
4. Set Stripe production keys and webhook secret.
5. Rollout with small school cohort first, then full rollout.

## 8) Terraform Resource Checklist

Create modules/resources for:
1. `aws_vpc`, subnets (public/private), route tables, IGW, NAT.
2. `aws_ecs_cluster`, task definitions, ECS services (web + worker).
3. `aws_lb`, listeners, target groups, security groups.
4. `aws_ecr_repository` for app images.
5. `aws_db_instance` (or Aurora), subnet group, parameter group.
6. `aws_elasticache_replication_group`.
7. `aws_sqs_queue` (+ DLQ).
8. `aws_cloudfront_distribution` + `aws_s3_bucket` for static assets.
9. `aws_route53_record`, `aws_acm_certificate`.
10. `aws_wafv2_web_acl` and association.
11. `aws_secretsmanager_secret` and secret versions.
12. CloudWatch dashboards and alarms.

## 9) Operational Guardrails

Set these from day one:
1. Database connection pooling (Prisma + PgBouncer strategy if needed later).
2. Timeouts and retries with circuit breaker style on external APIs.
3. Dead letter queues for failed async tasks.
4. Runbook for payment webhook delay/failure.
5. Weekly restore drill for database backups.

## 10) Load Testing Targets

Before full rollout, validate:
1. Login surge test (200 concurrent users).
2. Order placement burst (50-100 RPS for 5-10 min).
3. Payment intent + webhook processing under load.
4. Reporting endpoints against realistic data volume.

Pass criteria:
- Error rate under 1% at target load
- p95 latency within SLOs
- No DB saturation or connection exhaustion

## 11) Launch Checklist

1. Production secrets stored in Secrets Manager.
2. Stripe in live mode with production webhook endpoint.
3. WAF rules active.
4. RDS Multi-AZ and backups verified.
5. Autoscaling policies active and tested.
6. On-call alert channel configured.
7. Rollback strategy documented.

## 12) Next Immediate Steps for This Repo

1. Migrate Prisma datasource from SQLite to PostgreSQL.
2. Add tenant-scoping validation tests for school isolation.
3. Add Redis-backed rate limiter middleware for sensitive APIs.
4. Add basic SQS worker for emails.
5. Add Dockerfile + ECS deployment manifests/Terraform.
