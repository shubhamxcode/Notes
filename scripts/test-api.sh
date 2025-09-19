#!/bin/bash

BASE_URL="http://localhost:3001"

echo ""
echo "1. Testing Health Endpoint..."
curl -s -X GET "$BASE_URL/api/health" | jq '.'

echo ""
echo "2. Testing Login (Acme Admin)..."
ACME_ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.test", "password": "password"}')

echo "$ACME_ADMIN_RESPONSE" | jq '.'

ACME_ADMIN_TOKEN=$(echo "$ACME_ADMIN_RESPONSE" | jq -r '.token')

echo ""
echo "3. Testing Login (Globex Member)..."
GLOBEX_USER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@globex.test", "password": "password"}')

echo "$GLOBEX_USER_RESPONSE" | jq '.'

GLOBEX_USER_TOKEN=$(echo "$GLOBEX_USER_RESPONSE" | jq -r '.token')

echo ""
echo "4. Testing Note Creation (Acme Admin)..."
ACME_NOTE=$(curl -s -X POST "$BASE_URL/api/notes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACME_ADMIN_TOKEN" \
  -d '{"title": "Acme Test Note", "content": "This is a test note for Acme Corp"}')

echo "$ACME_NOTE" | jq '.'

echo ""
echo "5. Testing Note Creation (Globex Member)..."
GLOBEX_NOTE=$(curl -s -X POST "$BASE_URL/api/notes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GLOBEX_USER_TOKEN" \
  -d '{"title": "Globex Test Note", "content": "This is a test note for Globex Corporation"}')

echo "$GLOBEX_NOTE" | jq '.'

echo ""
echo "6. Testing Notes List (Acme Admin - should only see Acme notes)..."
curl -s -X GET "$BASE_URL/api/notes" \
  -H "Authorization: Bearer $ACME_ADMIN_TOKEN" | jq '.'

echo ""
echo "7. Testing Notes List (Globex Member - should only see Globex notes)..."
curl -s -X GET "$BASE_URL/api/notes" \
  -H "Authorization: Bearer $GLOBEX_USER_TOKEN" | jq '.'

echo ""
echo "8. Testing Note Update (Acme Admin)..."
ACME_NOTE_ID=$(echo "$ACME_NOTE" | jq -r '.note.id')
curl -s -X PUT "$BASE_URL/api/notes/$ACME_NOTE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACME_ADMIN_TOKEN" \
  -d '{"title": "Updated Acme Note", "content": "This note has been updated"}' | jq '.'

echo ""
echo "9. Testing Tenant Info (Globex Admin)..."
curl -s -X GET "$BASE_URL/api/tenants/globex" \
  -H "Authorization: Bearer $GLOBEX_USER_TOKEN" | jq '.'

echo ""
echo "10. Testing Tenant Upgrade (Acme Admin)..."
curl -s -X POST "$BASE_URL/api/tenants/acme/upgrade" \
  -H "Authorization: Bearer $ACME_ADMIN_TOKEN" | jq '.'

echo ""
echo "11. Testing Subscription Update (Globex Admin - set to Pro)..."
GLOBEX_ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@globex.test", "password": "password"}' | jq -r '.token')

curl -s -X PUT "$BASE_URL/api/tenants/globex" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GLOBEX_ADMIN_TOKEN" \
  -d '{"subscription": "pro"}' | jq '.'

echo ""
echo "12. Testing Unauthorized Access..."
curl -s -X GET "$BASE_URL/api/notes" | jq '.'

echo ""
echo "✅ API Tests Completed!"
echo ""
echo "🔍 Manual Testing Checklist:"
echo "- Login with different accounts at $BASE_URL/login"
echo "- Verify tenant isolation (Acme vs Globex notes)"
echo "- Test subscription limits (create 4+ notes on free plan)"
echo "- Test admin upgrade functionality"
echo "- Verify role permissions"
echo "- Verify role permissions" 