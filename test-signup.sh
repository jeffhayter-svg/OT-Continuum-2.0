#!/bin/bash

# Test script for public signup endpoint
# Usage: ./test-signup.sh [project-id] [anon-key]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running locally or against production
if [ -z "$1" ]; then
  echo -e "${YELLOW}Testing LOCAL environment${NC}"
  BASE_URL="http://localhost:54321"
  ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
else
  echo -e "${YELLOW}Testing PRODUCTION environment${NC}"
  PROJECT_ID=$1
  ANON_KEY=$2
  
  if [ -z "$ANON_KEY" ]; then
    echo -e "${RED}Error: Anon key required for production testing${NC}"
    echo "Usage: ./test-signup.sh <project-id> <anon-key>"
    exit 1
  fi
  
  BASE_URL="https://${PROJECT_ID}.supabase.co"
fi

SIGNUP_URL="${BASE_URL}/functions/v1/signals/auth/signup"

# Generate random email for testing
RANDOM_EMAIL="test-$(date +%s)@example.com"

echo -e "\n${YELLOW}=== Testing Signup Endpoint ===${NC}"
echo "URL: ${SIGNUP_URL}"
echo "Email: ${RANDOM_EMAIL}"
echo ""

# Test 1: Signup without Authorization header (should succeed)
echo -e "${YELLOW}Test 1: POST /auth/signup (PUBLIC - no Authorization header)${NC}"
echo "Expected: 201 Created"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${SIGNUP_URL}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -d "{
    \"email\": \"${RANDOM_EMAIL}\",
    \"password\": \"SecurePassword123\",
    \"full_name\": \"Test User\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: ${HTTP_CODE}"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✅ Test 1 PASSED: Signup succeeded${NC}"
else
  echo -e "${RED}❌ Test 1 FAILED: Expected 201, got ${HTTP_CODE}${NC}"
  exit 1
fi

echo ""

# Test 2: Duplicate signup (should fail with 409)
echo -e "${YELLOW}Test 2: Duplicate signup (should fail)${NC}"
echo "Expected: 409 Conflict"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${SIGNUP_URL}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -d "{
    \"email\": \"${RANDOM_EMAIL}\",
    \"password\": \"SecurePassword123\",
    \"full_name\": \"Test User\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: ${HTTP_CODE}"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "409" ]; then
  echo -e "${GREEN}✅ Test 2 PASSED: Duplicate signup rejected${NC}"
else
  echo -e "${RED}❌ Test 2 FAILED: Expected 409, got ${HTTP_CODE}${NC}"
fi

echo ""

# Test 3: Invalid request (missing fields)
echo -e "${YELLOW}Test 3: Invalid request (missing password)${NC}"
echo "Expected: 400 Bad Request"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${SIGNUP_URL}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -d "{
    \"email\": \"test@example.com\",
    \"full_name\": \"Test User\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: ${HTTP_CODE}"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ Test 3 PASSED: Validation error returned${NC}"
else
  echo -e "${RED}❌ Test 3 FAILED: Expected 400, got ${HTTP_CODE}${NC}"
fi

echo ""
echo -e "${GREEN}=== All tests completed ===${NC}"
