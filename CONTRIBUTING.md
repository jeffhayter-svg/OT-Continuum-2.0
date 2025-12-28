# Contributing to OT Continuum

Thank you for your interest in contributing to OT Continuum! This document provides guidelines and instructions for contributing.

## Development Workflow

### 1. Setup Development Environment

```bash
# Fork and clone repository
git clone https://github.com/your-username/ot-continuum.git
cd ot-continuum

# Install dependencies
make install

# Start Supabase
make start

# Apply migrations
make reset

# Seed data
make seed
```

### 2. Create Feature Branch

```bash
# Create branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Write code following project conventions
- Add tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

### 4. Test Your Changes

```bash
# Run all tests
make test

# Or run specific test suites
make test-db        # Database tests
make test-pact      # Contract tests
make test-playwright # E2E tests
```

### 5. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat(sites): add site archival functionality"
git commit -m "fix(auth): resolve token expiration bug"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(risks): add risk scoring edge cases"
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions or changes
- `refactor`: Code refactoring
- `style`: Code style changes (formatting, etc.)
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements

### 6. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create PR on GitHub
# Target branch: develop (or main for hotfixes)
```

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define interfaces for all data structures
- Avoid `any` type unless absolutely necessary

```typescript
// Good
interface Site {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'archived';
}

// Bad
const site: any = { ... };
```

### SQL

- Use lowercase for SQL keywords
- Indent nested queries
- Add comments for complex logic
- Always use parameterized queries (prevent SQL injection)

```sql
-- Good
create table sites (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    -- Status must be one of three values
    status text not null default 'active' 
        check (status in ('active', 'inactive', 'archived'))
);

-- Bad
CREATE TABLE Sites (id UUID, name TEXT, status TEXT);
```

### API Design

- Follow REST conventions
- Use proper HTTP methods
- Return appropriate status codes
- Include error details in responses

```typescript
// Good
return c.json({ data: sites }, 200);
return c.json({ 
  error: 'Not Found', 
  message: 'Site not found' 
}, 404);

// Bad
return c.json({ sites: sites });
return c.json({ error: 'not found' }, 200);
```

## Testing Requirements

### Database Tests (pgTAP)

All database changes must include tests:

```sql
-- Test table exists
SELECT has_table('new_table', 'new_table should exist');

-- Test constraint
SELECT col_not_null('sites', 'name', 'site name should not be null');

-- Test RLS policy
SELECT has_policy('sites', 'sites should have RLS enabled');
```

### Contract Tests (Pact)

New API endpoints must have Pact tests:

```typescript
// Consumer test
it('creates a site', async () => {
  await provider
    .given('organization exists')
    .uponReceiving('a request to create a site')
    .withRequest({
      method: 'POST',
      path: `/organizations/${orgId}/sites`,
      body: { name: 'New Site' }
    })
    .willRespondWith({
      status: 201,
      body: { id: uuid(), name: like('New Site') }
    })
    .executeTest(async (mockServer) => {
      // Test implementation
    });
});
```

### E2E Tests (Playwright)

Critical user flows should have smoke tests:

```typescript
test('user can create organization', async ({ request }) => {
  const response = await request.post(`${API_BASE}/organizations`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: 'Test Org', slug: 'test-org' }
  });
  
  expect(response.status()).toBe(201);
});
```

## Database Migrations

### Creating Migrations

```bash
# Make schema changes in your local database using Studio
# Generate migration file
make migrate
# Enter migration name when prompted

# Or create manually
touch supabase/migrations/sql/$(date +%Y%m%d%H%M%S)_add_feature.sql
```

### Migration Guidelines

1. **Idempotent**: Migrations should be safe to run multiple times
2. **Reversible**: Include comments on how to reverse
3. **Tested**: Add pgTAP tests for schema changes
4. **Documented**: Explain why the change is needed

```sql
-- Good migration
begin;

-- Add new column for site coordinates
alter table sites
add column if not exists coordinates point;

-- Add index for geospatial queries
create index if not exists idx_sites_coordinates 
on sites using gist(coordinates);

-- To reverse: DROP COLUMN coordinates; DROP INDEX idx_sites_coordinates;

commit;
```

## Pull Request Process

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows project conventions
- [ ] All tests pass locally (`make test`)
- [ ] New functionality has tests
- [ ] Documentation updated (README, ARCHITECTURE, etc.)
- [ ] Migrations are tested
- [ ] No sensitive data in commits
- [ ] Commits follow Conventional Commits
- [ ] PR description explains what/why

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran

## Checklist
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No console errors
- [ ] Migrations tested

## Screenshots (if applicable)
Add screenshots here
```

### Code Review Process

1. PR is automatically assigned to reviewers
2. CI/CD runs all tests
3. Reviewers provide feedback
4. Address feedback and push changes
5. Once approved and tests pass, merge to develop
6. Delete feature branch

## Database Schema Changes

### Adding Tables

1. Create migration file
2. Add table with RLS enabled
3. Create RLS policies
4. Add indexes
5. Add pgTAP tests
6. Update ARCHITECTURE.md

### Modifying Tables

1. Use `ALTER TABLE` not `DROP/CREATE`
2. Handle existing data
3. Test with production-like data volumes
4. Consider downtime requirements

### RLS Policies

All new tables must have RLS:

```sql
-- Enable RLS
alter table new_table enable row level security;

-- Add policy
create policy "Users can view their data"
on new_table for select
using (
  organization_id in (
    select get_user_organizations(auth.uid())
  )
);
```

## Edge Functions

### Adding New Routes

1. Create route file in `supabase/functions/server/routes/`
2. Register route in `index.tsx`
3. Add authentication if needed
4. Add error handling
5. Update OpenAPI spec
6. Add Pact tests

### Error Handling

Always use try-catch and return proper errors:

```typescript
try {
  // Route logic
} catch (error) {
  console.error('Route error:', error);
  return c.json({
    error: 'Internal Server Error',
    message: error instanceof Error ? error.message : 'Unknown error'
  }, 500);
}
```

## OpenAPI Specification

When adding/modifying endpoints:

1. Update `api/openapi/ot-continuum.yaml`
2. Regenerate types: `make types`
3. Verify spec is valid: `redocly lint api/openapi/ot-continuum.yaml`

## Documentation

### What to Document

- New features and how to use them
- API changes and migration guides
- Configuration options
- Troubleshooting steps
- Architecture decisions

### Where to Document

- **README.md**: Getting started, quick reference
- **ARCHITECTURE.md**: System design, data models
- **CONTRIBUTING.md**: This file
- **Code comments**: Complex logic, edge cases
- **OpenAPI spec**: API endpoints and schemas

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Security**: Email security@otcontinuum.com (do not open public issue)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
