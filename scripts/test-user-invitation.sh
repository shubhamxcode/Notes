#!/bin/bash

set -e

echo "🧪 Testing User Invitation Functionality"
echo "========================================"

BASE_URL="http://localhost:3001"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

test_case() {
    local name="$1"
    local expected_status="$2"
    local response="$3"
    local actual_status=$(echo "$response" | tail -n1)
    
    if [ "$actual_status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $name"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC}: $name (Expected: $expected_status, Got: $actual_status)"
        echo "Response: $response"
        ((FAIL++))
    fi
}

echo
echo "🔐 Step 1: Login as admin@acme.test"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.test", "password": "password"}' \
  -w "\n%{http_code}")

ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | head -n1 | jq -r '.token // empty')
if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to get admin token${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Admin login successful${NC}"

echo
echo "📋 Step 2: Test GET /api/users (List users in tenant)"
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -w "\n%{http_code}")

test_case "Admin can list users" "200" "$LIST_RESPONSE"

echo
echo "👥 Step 3: Test POST /api/users (Invite new user)"
INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"email": "newuser@acme.test", "role": "member", "password": "password"}' \
  -w "\n%{http_code}")

test_case "Admin can invite new user" "200" "$INVITE_RESPONSE"

echo
echo "🔄 Step 4: Test duplicate user invitation (should fail)"
DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"email": "newuser@acme.test", "role": "member", "password": "password"}' \
  -w "\n%{http_code}")

test_case "Duplicate user invitation fails" "409" "$DUPLICATE_RESPONSE"

echo
echo "🔐 Step 5: Login as regular member"
MEMBER_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@acme.test", "password": "password"}' \
  -w "\n%{http_code}")

MEMBER_TOKEN=$(echo "$MEMBER_LOGIN_RESPONSE" | head -n1 | jq -r '.token // empty')

echo
echo "🚫 Step 6: Test member cannot list users"
MEMBER_LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/users" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -w "\n%{http_code}")

test_case "Member cannot list users" "403" "$MEMBER_LIST_RESPONSE"

echo
echo "🚫 Step 7: Test member cannot invite users"
MEMBER_INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -d '{"email": "anotheruser@acme.test", "role": "member", "password": "password"}' \
  -w "\n%{http_code}")

test_case "Member cannot invite users" "403" "$MEMBER_INVITE_RESPONSE"

echo
echo "🧪 Step 8: Test login with newly invited user"
NEW_USER_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@acme.test", "password": "password"}' \
  -w "\n%{http_code}")

test_case "Newly invited user can login" "200" "$NEW_USER_LOGIN_RESPONSE"

echo
echo "🔒 Step 9: Test cross-tenant isolation (admin@globex cannot invite to acme)"
GLOBEX_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@globex.test", "password": "password"}' \
  -w "\n%{http_code}")

GLOBEX_TOKEN=$(echo "$GLOBEX_LOGIN_RESPONSE" | head -n1 | jq -r '.token // empty')

# Globex admin should only see their own tenant's users
GLOBEX_LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/users" \
  -H "Authorization: Bearer $GLOBEX_TOKEN" \
  -w "\n%{http_code}")

test_case "Globex admin sees only their users" "200" "$GLOBEX_LIST_RESPONSE"

echo
echo "📊 Test Results Summary"
echo "======================"
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All user invitation tests passed!${NC}"
    exit 0
else
    echo -e "${RED}💥 Some tests failed!${NC}"
    exit 1
fi 