# pgTAP Installation Guide

Complete guide for installing and running pgTAP tests for the OT Continuum platform.

---

## Quick Start

```bash
# 1. Install pgTAP (platform-specific, see below)

# 2. Enable pgTAP extension in your database
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS pgtap;"

# 3. Run tests
cd supabase/tests/sql
chmod +x run_pgtap.sh
./run_pgtap.sh
```

---

## Installation by Platform

### macOS

#### Option 1: Homebrew (Recommended)

```bash
# Install pgTAP via Homebrew
brew install pgtap

# Verify installation
psql $DATABASE_URL -c "SELECT * FROM pg_available_extensions WHERE name = 'pgtap';"
```

#### Option 2: From Source

```bash
# Install build dependencies
brew install postgresql

# Clone and build pgTAP
git clone https://github.com/theory/pgtap.git
cd pgtap
make
make install

# Verify
psql $DATABASE_URL -c "CREATE EXTENSION pgtap;"
```

---

### Ubuntu / Debian

#### Option 1: APT Package (Recommended)

```bash
# Install pgTAP package
sudo apt-get update
sudo apt-get install postgresql-pgtap

# Verify installation
psql $DATABASE_URL -c "SELECT * FROM pg_available_extensions WHERE name = 'pgtap';"
```

#### Option 2: From Source

```bash
# Install build dependencies
sudo apt-get update
sudo apt-get install -y \
  postgresql-server-dev-14 \
  build-essential \
  git

# Clone and build pgTAP
git clone https://github.com/theory/pgtap.git
cd pgtap
make
sudo make install

# Verify
psql $DATABASE_URL -c "CREATE EXTENSION pgtap;"
```

**Note**: Replace `postgresql-server-dev-14` with your PostgreSQL version (e.g., `postgresql-server-dev-15` for PostgreSQL 15).

---

### Red Hat / CentOS / Fedora

```bash
# Install build dependencies
sudo yum install -y postgresql-devel gcc make git

# Clone and build pgTAP
git clone https://github.com/theory/pgtap.git
cd pgtap
make
sudo make install

# Verify
psql $DATABASE_URL -c "CREATE EXTENSION pgtap;"
```

---

### Windows

#### Option 1: WSL (Recommended)

Use Windows Subsystem for Linux and follow Ubuntu instructions above.

#### Option 2: Native Windows

```powershell
# Install PostgreSQL (includes pg_config)
# Download from: https://www.postgresql.org/download/windows/

# Download pgTAP source
git clone https://github.com/theory/pgtap.git
cd pgtap

# Build using MSVC or MinGW (advanced)
# See: https://pgtap.org/documentation.html#installation

# Alternatively, use Docker (see Docker section below)
```

---

### Docker / Supabase Local

#### Supabase CLI (Recommended)

```bash
# Start Supabase local environment
supabase start

# Get database URL
supabase status

# Install pgTAP in Supabase database
export DATABASE_URL='postgresql://postgres:postgres@localhost:54322/postgres'
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS pgtap;"

# Run tests
cd supabase/tests/sql
./run_pgtap.sh
```

#### Docker Container

```bash
# Run PostgreSQL with pgTAP
docker run -d \
  --name postgres-pgtap \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  supabase/postgres:15.1.0.147

# Install pgTAP
docker exec postgres-pgtap psql -U postgres -c "CREATE EXTENSION pgtap;"

# Run tests
export DATABASE_URL='postgresql://postgres:password@localhost:5432/postgres'
cd supabase/tests/sql
./run_pgtap.sh
```

---

## Enabling pgTAP in Database

After installing pgTAP on your system, enable it in your database:

### Local Development

```bash
# Set your database URL
export DATABASE_URL='postgresql://postgres:password@localhost:5432/postgres'

# Enable pgTAP extension
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS pgtap;"

# Verify installation
psql $DATABASE_URL -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'pgtap';"
```

### Supabase Project

```sql
-- In Supabase SQL Editor, run:
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Verify
SELECT extname, extversion FROM pg_extension WHERE extname = 'pgtap';
```

**Note**: Supabase Cloud projects may not support pgTAP. Use Supabase CLI for local development and testing.

---

## Running Tests

### Using Test Runner Script

```bash
# Navigate to test directory
cd supabase/tests/sql

# Make runner executable
chmod +x run_pgtap.sh

# Run all tests
./run_pgtap.sh

# Or specify database URL
./run_pgtap.sh 'postgresql://postgres:password@localhost:5432/postgres'
```

### Run Individual Test

```bash
# Set database URL
export DATABASE_URL='postgresql://postgres:password@localhost:5432/postgres'

# Run single test file
psql $DATABASE_URL -f 01_sites_policies.sql

# Or run specific test with output
psql $DATABASE_URL -f 02_risk_register_policies.sql -a
```

### Run with pg_prove (Advanced)

```bash
# Install pg_prove (comes with TAP::Parser::SourceHandler::pgTAP)
cpan TAP::Parser::SourceHandler::pgTAP

# Or use Homebrew on macOS
brew install tap-parser-sourcehandler-pgtap

# Run tests with pg_prove
pg_prove -d $DATABASE_URL supabase/tests/sql/*.sql

# Run with verbose output
pg_prove -v -d $DATABASE_URL supabase/tests/sql/*.sql
```

---

## CI/CD Installation

### GitHub Actions

Add to `.github/workflows/ci.yml`:

```yaml
name: Database Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-db:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: supabase/postgres:15.1.0.147
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Start Supabase
        run: supabase start
      
      - name: Run migrations
        run: supabase db push
      
      - name: Install pgTAP
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-pgtap
      
      - name: Enable pgTAP in database
        run: |
          export DATABASE_URL='postgresql://postgres:postgres@localhost:54322/postgres'
          psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS pgtap;"
      
      - name: Run pgTAP tests
        run: |
          export DATABASE_URL='postgresql://postgres:postgres@localhost:54322/postgres'
          chmod +x supabase/tests/sql/run_pgtap.sh
          ./supabase/tests/sql/run_pgtap.sh
```

### GitLab CI

Add to `.gitlab-ci.yml`:

```yaml
test:db:
  image: supabase/postgres:15.1.0.147
  services:
    - postgres:15
  variables:
    POSTGRES_DB: postgres
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/postgres
  before_script:
    - apt-get update
    - apt-get install -y postgresql-pgtap
    - psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS pgtap;"
  script:
    - cd supabase/tests/sql
    - chmod +x run_pgtap.sh
    - ./run_pgtap.sh
```

### CircleCI

Add to `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  test-db:
    docker:
      - image: supabase/postgres:15.1.0.147
        environment:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
    steps:
      - checkout
      
      - run:
          name: Install pgTAP
          command: |
            apt-get update
            apt-get install -y postgresql-pgtap
      
      - run:
          name: Enable pgTAP
          command: |
            psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS pgtap;"
      
      - run:
          name: Run tests
          command: |
            export DATABASE_URL='postgresql://postgres:postgres@localhost:5432/postgres'
            cd supabase/tests/sql
            chmod +x run_pgtap.sh
            ./run_pgtap.sh

workflows:
  version: 2
  test:
    jobs:
      - test-db
```

---

## Verification

### Verify pgTAP Installation

```bash
# Check if pgTAP extension is available
psql $DATABASE_URL -c "SELECT * FROM pg_available_extensions WHERE name = 'pgtap';"

# Check if pgTAP is enabled
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'pgtap';"

# Test pgTAP functions
psql $DATABASE_URL -c "SELECT plan(1); SELECT is(1, 1, 'One equals one'); SELECT * FROM finish();"
```

### Expected Output

```
 plan 
------
 
(1 row)

 is 
----
 
(1 row)

 finish 
--------
 
(1 row)
```

---

## Troubleshooting

### Error: "extension pgtap does not exist"

**Cause**: pgTAP not installed on system or not in PostgreSQL extension path

**Solution**:
```bash
# Find PostgreSQL config
pg_config --sharedir

# Clone and install pgTAP
git clone https://github.com/theory/pgtap.git
cd pgtap
make
sudo make install

# Retry
psql $DATABASE_URL -c "CREATE EXTENSION pgtap;"
```

### Error: "permission denied to create extension"

**Cause**: Current database user doesn't have superuser privileges

**Solution**:
```bash
# Use postgres superuser
psql -U postgres $DATABASE_URL -c "CREATE EXTENSION pgtap;"

# Or grant privileges
psql -U postgres $DATABASE_URL -c "ALTER USER your_user WITH SUPERUSER;"
```

### Error: "could not open extension control file"

**Cause**: pgTAP files not in correct location

**Solution**:
```bash
# Find extension directory
pg_config --sharedir

# Verify pgtap.control exists
ls $(pg_config --sharedir)/extension/pgtap.control

# If missing, reinstall pgTAP
cd pgtap
sudo make install
```

### Error: "pg_config not found"

**Cause**: PostgreSQL development tools not installed

**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-server-dev-14

# macOS
brew install postgresql

# Verify
which pg_config
```

### Tests Fail with "insufficient_privilege"

**Cause**: Running tests without proper database permissions

**Solution**:
```bash
# Use service role key for Supabase
export DATABASE_URL='postgresql://postgres:your-service-role-key@...'

# Or use postgres superuser
export DATABASE_URL='postgresql://postgres:password@localhost:5432/postgres'
```

---

## Best Practices

### Local Development

1. **Always use Supabase CLI** for consistent environment
2. **Run migrations before tests** to ensure schema is up-to-date
3. **Use transactions** in tests (BEGIN/ROLLBACK) to avoid polluting data
4. **Set DATABASE_URL** in your shell profile for convenience

```bash
# Add to ~/.bashrc or ~/.zshrc
export DATABASE_URL='postgresql://postgres:postgres@localhost:54322/postgres'
```

### CI/CD

1. **Install pgTAP in CI container** before running tests
2. **Use service containers** for PostgreSQL (GitHub Actions, GitLab CI)
3. **Run tests in isolation** (fresh database for each run)
4. **Cache dependencies** to speed up CI runs

### Writing Tests

1. **Use descriptive test names** that explain what's being tested
2. **Test one thing per test** for clarity
3. **Use setup/teardown** (BEGIN/ROLLBACK) for test isolation
4. **Test both positive and negative cases** (success and failure scenarios)

---

## Resources

- **pgTAP Documentation**: https://pgtap.org/
- **pgTAP GitHub**: https://github.com/theory/pgtap
- **PostgreSQL Extensions**: https://www.postgresql.org/docs/current/external-extensions.html
- **Supabase Local Development**: https://supabase.com/docs/guides/cli/local-development
- **TAP Protocol**: https://testanything.org/

---

## Summary

**Installation**: Install pgTAP via package manager or from source  
**Enable**: Run `CREATE EXTENSION pgtap;` in your database  
**Run**: Use `./run_pgtap.sh` script to execute all tests  
**CI/CD**: Install pgTAP in CI pipeline before running tests  

**Test Count**: 53 tests across 3 files  
**Coverage**: Tenant isolation, site scoping, MS2 risk requirements, billing integrity  

---

**Status**: ✅ Ready for local development and CI/CD integration
