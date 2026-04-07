# AWS App Runner Deployment Notes

This folder contains starter deployment artifacts and guidance for AWS App Runner.

## Files

- `ecs-task-definition.json`: legacy ECS starter kept for reference.
- `apprunner-deployment.md`: App Runner deployment checklist and required AWS resources.

## Before deploying

1. Replace all placeholder values such as `<account-id>`, `<region>`, and example domains.
2. Push the app image to ECR.
3. Create SSM Parameter Store entries for runtime secrets.
4. Provision RDS PostgreSQL and apply Prisma migrations.
5. Configure App Runner health checks to `/api/health`.
6. Set `FROM_EMAIL` and `REDIS_URL` in runtime configuration.

## Recommended AWS services

1. App Runner for the web application.
2. RDS PostgreSQL for production data.
3. ECR for application container images.
4. SSM Parameter Store for secure configuration.
5. CloudWatch for logs and alarms.
6. ElastiCache Redis for distributed rate limiting.

