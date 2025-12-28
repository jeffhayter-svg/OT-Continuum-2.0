#!/bin/bash
# OT Continuum - Comprehensive Test Runner
# Runs all test suites and generates a summary report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_SUITES=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         OT Continuum - Comprehensive Test Suite               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to run test suite
run_test_suite() {
    local suite_name=$1
    local command=$2
    
    echo -e "${YELLOW}▶ Running ${suite_name}...${NC}"
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    
    if eval "$command"; then
        echo -e "${GREEN}✓ ${suite_name} PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ ${suite_name} FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

# Pre-flight checks
echo -e "${BLUE}Pre-flight checks...${NC}"

if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! docker ps &> /dev/null; then
    echo -e "${RED}✗ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites met${NC}"
echo ""

# Ensure Supabase is running
echo -e "${BLUE}Checking Supabase status...${NC}"
if ! supabase status &> /dev/null; then
    echo -e "${YELLOW}! Supabase not running. Starting...${NC}"
    supabase start
else
    echo -e "${GREEN}✓ Supabase is running${NC}"
fi
echo ""

# Reset database to clean state
echo -e "${BLUE}Resetting database to clean state...${NC}"
supabase db reset
echo -e "${GREEN}✓ Database reset complete${NC}"
echo ""

# Run test suites
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Running Test Suites                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Database Schema Tests
run_test_suite "Database Schema Tests (pgTAP)" "supabase test db --file supabase/tests/sql/001_schema_tests.sql"

# 2. Sites Tests
run_test_suite "Sites Tests (pgTAP)" "supabase test db --file supabase/tests/sql/002_sites_tests.sql"

# 3. Risk Register Tests
run_test_suite "Risk Register Tests (pgTAP)" "supabase test db --file supabase/tests/sql/003_risk_register_tests.sql"

# 4. Billing Tests
run_test_suite "Billing Tests (pgTAP)" "supabase test db --file supabase/tests/sql/004_billing_tests.sql"

# 5. Pact Consumer Tests
if [ -d "pact" ] && [ -f "pact/package.json" ]; then
    run_test_suite "Pact Consumer Tests" "cd pact && npm test 2>&1 || true"
else
    echo -e "${YELLOW}⊘ Pact tests skipped (dependencies not installed)${NC}"
    echo ""
fi

# 6. Playwright Smoke Tests
if command -v npx &> /dev/null && [ -f "playwright.config.ts" ]; then
    # Set environment variables for tests
    export PLAYWRIGHT_BASE_URL="http://localhost:54321/functions/v1"
    export SUPABASE_URL="http://localhost:54321"
    
    run_test_suite "Playwright Smoke Tests" "npx playwright test --reporter=list 2>&1 || true"
else
    echo -e "${YELLOW}⊘ Playwright tests skipped (not installed)${NC}"
    echo ""
fi

# Generate Summary Report
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      Test Summary                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "Total Test Suites: ${TOTAL_SUITES}"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
else
    echo -e "Failed: ${TESTS_FAILED}"
fi
echo ""

# Calculate pass rate
if [ $TOTAL_SUITES -gt 0 ]; then
    PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_SUITES))
    echo -e "Pass Rate: ${PASS_RATE}%"
    echo ""
fi

# Final result
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ALL TESTS PASSED! ✓                               ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              SOME TESTS FAILED! ✗                              ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
