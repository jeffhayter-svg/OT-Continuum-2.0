# OT Continuum Deployment Guide

This guide covers deploying OT Continuum to production using Supabase.

## Prerequisites

- Supabase account (https://supabase.com)
- Supabase project created
- Supabase CLI installed locally
- GitHub repository (for CI/CD)
- Git installed

## Initial Setup

### 1. Create Supabase Project

```bash
# Login to Supabase
supabase login

# Create new project (or use existing)
# Visit: https://app.supabase.com/new
# Note down:
# - Project ID
# - Database Password
# - API URL
# - Anon Key
# - Service Role Key
```

### 2. Link Local Project

```bash
# Link to your Supabase project
supabase link --project-ref <your-project-id>

# When prompted, enter your database password
```

### 3. Configure Environment Variables

Create a `.env.production` file (do not commit):

```bash
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_PASSWORD=your-db-password
```

## Manual Deployment

### Deploy Database Migrations

```bash
# Review migrations to be applied
supabase db diff

# Push migrations to production
supabase db push

# Verify migrations
supabase db execute -c "
  SELECT tablename 
  FROM pg_tables 
  WHERE schemaname = 'public' 
  ORDER BY tablename;
"
```

Expected tables:
- audit_log
- billing_invoices
- billing_plans
- billing_subscriptions
- organization_members
- organizations
- risk_categories
- risk_register
- sites
- users

### Deploy Edge Functions

```bash
# Deploy the server function
supabase functions deploy server --no-verify-jwt

# Verify deployment
supabase functions list

# Test deployed function
curl https://<project-id>.supabase.co/functions/v1/make-server-fb677d93/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Seed Production Data

```bash
# Seed billing plans
supabase db execute -f supabase/seed/001_sample_data.sql

# Verify seed data
supabase db execute -c "SELECT name, price_monthly FROM billing_plans;"
```

### Verify RLS Policies

```bash
# Check RLS is enabled on all tables
supabase db execute -c "
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public';
"
```

All tables should have `rowsecurity = true`.

## CI/CD Deployment (Recommended)

### 1. Configure GitHub Secrets

In your GitHub repository, add these secrets:

**Settings → Secrets and variables → Actions → New repository secret**

```
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_ID
SUPABASE_DB_PASSWORD
SUPABASE_ANON_KEY
```

To get your access token:
```bash
# Generate access token
supabase login
cat ~/.supabase/access-token
```

### 2. Push to Main Branch

```bash
# Commit your changes
git add .
git commit -m "feat: initial deployment"

# Push to main (triggers deployment)
git push origin main
```

The GitHub Actions workflow will:
1. Run all tests (pgTAP, Pact, Playwright)
2. Deploy database migrations
3. Deploy edge functions
4. Run post-deployment smoke tests

### 3. Monitor Deployment

```bash
# View GitHub Actions progress
# Visit: https://github.com/your-org/ot-continuum/actions

# Or check locally
gh run list  # If you have GitHub CLI
```

### 4. Verify Deployment

```bash
# Test health endpoint
curl https://<project-id>.supabase.co/functions/v1/make-server-fb677d93/health

# Test signup (creates first user)
curl -X POST https://<project-id>.supabase.co/functions/v1/make-server-fb677d93/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "full_name": "Admin User"
  }'
```

## Environment-Specific Deployments

### Staging Environment

Create a separate Supabase project for staging:

```bash
# Link to staging project
supabase link --project-ref <staging-project-id>

# Deploy to staging
supabase db push
supabase functions deploy server

# Test against staging
export PLAYWRIGHT_BASE_URL=https://<staging-project-id>.supabase.co/functions/v1
npm run test:playwright
```

### Production Environment

Always deploy to production via CI/CD:

```bash
# Create release branch
git checkout -b release/v1.0.0

# Update version in package.json
npm version 1.0.0

# Commit and push
git commit -am "chore: release v1.0.0"
git push origin release/v1.0.0

# Create PR to main
# After approval and tests pass, merge triggers production deployment
```

## Database Migrations

### Safe Migration Process

1. **Test Locally**
   ```bash
   supabase db reset
   # Verify migrations work
   ```

2. **Test in Staging**
   ```bash
   supabase link --project-ref <staging-project-id>
   supabase db push
   # Verify in staging
   ```

3. **Deploy to Production**
   ```bash
   # Via CI/CD (recommended)
   git push origin main
   
   # Or manually
   supabase link --project-ref <production-project-id>
   supabase db push
   ```

### Rollback Strategy

Supabase doesn't support automatic rollbacks. To rollback:

1. **Create Compensating Migration**
   ```sql
   -- supabase/migrations/sql/YYYYMMDDHHMMSS_rollback_feature.sql
   begin;
   
   -- Reverse the changes from previous migration
   drop table if exists new_table;
   alter table old_table drop column if exists new_column;
   
   commit;
   ```

2. **Apply Rollback**
   ```bash
   supabase db push
   ```

### Handling Data Migrations

For migrations affecting existing data:

```sql
begin;

-- Add new column (nullable first)
alter table sites add column new_field text;

-- Backfill existing data
update sites set new_field = 'default_value' where new_field is null;

-- Make it required (if needed)
alter table sites alter column new_field set not null;

commit;
```

## Edge Function Updates

### Zero-Downtime Deployments

Edge functions deploy with zero downtime:

```bash
# Deploy new version
supabase functions deploy server

# Previous version still serves requests during deployment
# New version takes over after deployment completes (~30 seconds)
```

### Rollback Edge Functions

```bash
# List function versions
supabase functions list --show-versions

# Deploy specific version (if available)
# Note: Supabase may not support version rollback via CLI
# Best practice: Keep previous code in git and redeploy

git checkout <previous-commit>
supabase functions deploy server
git checkout main
```

## Monitoring Production

### View Logs

```bash
# Function logs (last 100 lines)
supabase functions logs server --tail 100

# Stream logs in real-time
supabase functions logs server --follow
```

### Check Database Performance

```bash
# View active connections
supabase db execute -c "
  SELECT count(*), state 
  FROM pg_stat_activity 
  GROUP BY state;
"

# View slow queries (> 1 second)
supabase db execute -c "
  SELECT query, calls, mean_exec_time 
  FROM pg_stat_statements 
  WHERE mean_exec_time > 1000 
  ORDER BY mean_exec_time DESC 
  LIMIT 10;
"
```

### Monitor via Supabase Dashboard

Visit: https://app.supabase.com/project/<project-id>

Check:
- **Database**: Connections, size, performance
- **API**: Request rate, error rate, response times
- **Storage**: Usage metrics
- **Logs**: Error logs, warnings

## Scaling Considerations

### Database Scaling

**Vertical Scaling:**
```bash
# Upgrade plan in Supabase dashboard
# Settings → Billing → Upgrade plan
```

Options:
- Free: 500 MB, 2 GB bandwidth
- Pro: 8 GB, 100 GB bandwidth
- Team: 32 GB, 250 GB bandwidth
- Enterprise: Custom

**Connection Pooling:**
Already enabled by default via Supavisor.

### Function Scaling

Edge functions auto-scale based on traffic:
- Cold start: ~100-300ms
- Warm execution: ~10-50ms
- Automatic horizontal scaling
- No configuration needed

### Caching Strategy

Currently no caching layer. To add:

1. **Application-level caching:**
   ```typescript
   // In edge functions
   import { Redis } from 'npm:@upstash/redis';
   
   const redis = new Redis({
     url: Deno.env.get('REDIS_URL'),
     token: Deno.env.get('REDIS_TOKEN'),
   });
   ```

2. **CDN caching:**
   - Use Cloudflare or similar for static assets
   - Not needed for API routes (dynamic)

## Security Checklist

Before production deployment:

- [ ] RLS enabled on all tables
- [ ] Service role key never exposed to frontend
- [ ] HTTPS enforced (automatic with Supabase)
- [ ] JWT expiry configured (3600s default)
- [ ] Strong database password
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Audit logging enabled
- [ ] Backups configured (automatic with Supabase Pro+)
- [ ] Team members have appropriate access levels

## Backup and Recovery

### Automated Backups

Supabase Pro and above includes:
- Daily automated backups
- 7-day retention (Pro)
- 30-day retention (Team+)
- Point-in-time recovery (Enterprise)

### Manual Backup

```bash
# Dump database
supabase db dump -f backup.sql

# Restore from backup
supabase db execute -f backup.sql
```

### Disaster Recovery Plan

1. **Database failure:**
   - Supabase handles automatic failover
   - Restore from automated backup if needed

2. **Function failure:**
   - Redeploy previous version from git
   - Monitor logs for errors

3. **Data corruption:**
   - Restore from point-in-time backup
   - Apply compensating transactions

## Post-Deployment Checklist

- [ ] Health check endpoint returns 200
- [ ] Can create user account via signup
- [ ] Can create organization
- [ ] Can create site
- [ ] Can create risk entry
- [ ] RLS policies enforced (test with different users)
- [ ] All smoke tests passing
- [ ] Logs show no errors
- [ ] Database migrations applied
- [ ] Seed data present (billing plans)

## Troubleshooting Production Issues

### Function Not Responding

```bash
# Check function status
supabase functions list

# View recent logs
supabase functions logs server --tail 100

# Redeploy function
supabase functions deploy server
```

### Database Connection Issues

```bash
# Check connection count
supabase db execute -c "
  SELECT count(*) FROM pg_stat_activity;
"

# Kill idle connections (if needed)
supabase db execute -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE state = 'idle' 
  AND state_change < NOW() - INTERVAL '10 minutes';
"
```

### RLS Policy Issues

```bash
# Test query as specific user
supabase db execute -c "
  SET ROLE authenticated;
  SET request.jwt.claims.sub = '<user-id>';
  SELECT * FROM sites;
"

# Reset role
supabase db execute -c "RESET ROLE;"
```

### Migration Failures

```bash
# Check migration status
supabase migration list

# View failed migration
supabase db execute -c "
  SELECT * FROM supabase_migrations.schema_migrations 
  ORDER BY version DESC 
  LIMIT 5;
"

# Fix and retry
supabase db push
```

## Performance Optimization

### Database Indexes

Monitor slow queries and add indexes:

```sql
-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.5;

-- Add index if needed
CREATE INDEX idx_table_column ON table_name(column_name);
```

### Query Optimization

```bash
# Analyze query performance
supabase db execute -c "
  EXPLAIN ANALYZE
  SELECT * FROM risk_register 
  WHERE organization_id = '<org-id>' 
  AND status = 'open';
"
```

### Function Optimization

- Minimize cold starts (keep functions warm)
- Reduce response payload size
- Use database indexes
- Implement pagination

## Support and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review error logs
- Check database size
- Monitor API usage
- Review slow queries

**Monthly:**
- Update dependencies
- Review security advisories
- Optimize database indexes
- Clean up old audit logs

**Quarterly:**
- Review and update documentation
- Performance testing
- Disaster recovery drill
- Security audit

### Getting Support

- **Supabase Support**: https://supabase.com/support
- **GitHub Issues**: For bugs and feature requests
- **Community**: https://github.com/supabase/supabase/discussions

---

## Quick Reference Commands

```bash
# Link to production
supabase link --project-ref <project-id>

# Deploy everything
make deploy

# View logs
supabase functions logs server --follow

# Run smoke tests
export PLAYWRIGHT_BASE_URL=https://<project-id>.supabase.co/functions/v1
npm run test:playwright

# Backup database
supabase db dump -f backup-$(date +%Y%m%d).sql

# Check health
curl https://<project-id>.supabase.co/functions/v1/make-server-fb677d93/health
```
