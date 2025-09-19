# 🧪 Complete Testing Guide - Multi-Tenant SaaS Notes Application

## 📋 Quick Verification Checklist

Before we start detailed testing, here's what you should verify works:

- [ ] ✅ App runs on http://localhost:3001
- [ ] ✅ PostgreSQL database connected
- [ ] ✅ All 4 test accounts work
- [ ] ✅ Tenant isolation (Acme vs Globex)
- [ ] ✅ Role-based permissions (Admin vs Member)
- [ ] ✅ Subscription limits (Free vs Pro)
- [ ] ✅ Notes CRUD operations
- [ ] ✅ Real-time upgrades
- [ ] ✅ Security (JWT, unauthorized access blocked)

## 🚀 Pre-Testing Setup

### 1. **Ensure App is Running**
```bash
# Make sure the app is running
npm run dev

# Should show:
# ▲ Next.js 15.5.3 (Turbopack)
# - Local: http://localhost:3001
# ✓ Ready in ~800ms
```

### 2. **Quick API Health Check**
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Expected: {"status":"ok"}
```

### 3. **Run Automated Tests**
```bash
# Run all API tests
./scripts/test-api.sh

# Should show all tests passing ✅
```

---

## 🔐 **PHASE 1: Authentication Testing**

### Test Account Details
| Email | Password | Role | Tenant | Subscription |
|-------|----------|------|--------|--------------|
| admin@acme.test | password | Admin | Acme Corp | Pro |
| user@acme.test | password | Member | Acme Corp | Pro |
| admin@globex.test | password | Admin | Globex Corp | Free |
| user@globex.test | password | Member | Globex Corp | Free |

### 1.1 **Frontend Login Testing**

**Visit:** http://localhost:3001

**Expected:** Should redirect to login page automatically

**Test Each Account:**
1. **Login with admin@acme.test / password**
   - ✅ Should redirect to dashboard
   - ✅ Should show "Welcome, admin@acme.test (admin) - Acme Corp (pro)"
   - ✅ Should show "Upgrade to Pro" button is NOT visible (already pro)

2. **Logout and Login with user@acme.test / password**
   - ✅ Should redirect to dashboard
   - ✅ Should show "Welcome, user@acme.test (member) - Acme Corp (pro)"
   - ✅ Should NOT show "Upgrade to Pro" button (not admin)

3. **Logout and Login with admin@globex.test / password**
   - ✅ Should redirect to dashboard
   - ✅ Should show "Welcome, admin@globex.test (admin) - Globex Corporation (free)"
   - ✅ Should show "Upgrade to Pro" button (free plan + admin)

4. **Logout and Login with user@globex.test / password**
   - ✅ Should redirect to dashboard
   - ✅ Should show "Welcome, user@globex.test (member) - Globex Corporation (free)"
   - ✅ Should NOT show "Upgrade to Pro" button (not admin)

### 1.2 **API Authentication Testing**

**Test Invalid Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "wrong@email.com", "password": "wrongpassword"}'

# Expected: {"error": "Invalid credentials"}
```

**Test Valid Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.test", "password": "password"}'

# Expected: JSON with user info and JWT token
```

---

## 🏢 **PHASE 2: Multi-Tenant Isolation Testing**

### 2.1 **Data Isolation Verification**

**Login as Acme Admin (admin@acme.test)**
1. Create a note titled "ACME SECRET NOTE"
2. Navigate around, check notes list
3. Remember the note count

**Login as Globex Admin (admin@globex.test)**
1. Check notes list - should NOT see "ACME SECRET NOTE"
2. Create a note titled "GLOBEX CONFIDENTIAL"
3. Verify only Globex notes are visible

**Login back as Acme Admin**
1. Should still see "ACME SECRET NOTE"
2. Should NOT see "GLOBEX CONFIDENTIAL"

✅ **PASS:** Each tenant only sees their own data

### 2.2 **API-Level Isolation Testing**

**Get tokens for both tenants:**
```bash
# Get Acme token
ACME_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.test", "password": "password"}' | jq -r '.token')

# Get Globex token  
GLOBEX_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@globex.test", "password": "password"}' | jq -r '.token')
```

**Test tenant isolation:**
```bash
# Acme notes
curl -H "Authorization: Bearer $ACME_TOKEN" http://localhost:3001/api/notes

# Globex notes  
curl -H "Authorization: Bearer $GLOBEX_TOKEN" http://localhost:3001/api/notes

# Should return completely different sets of notes
```

---

## 👥 **PHASE 3: Role-Based Access Control Testing**

### 3.1 **Admin vs Member Permissions**

**Admin Capabilities (admin@acme.test or admin@globex.test):**
- ✅ Can create, read, update, delete notes
- ✅ Can upgrade tenant subscription
- ✅ Sees "Upgrade to Pro" button (if free plan)

**Member Capabilities (user@acme.test or user@globex.test):**
- ✅ Can create, read, update, delete notes  
- ❌ Cannot upgrade tenant subscription
- ❌ Does NOT see "Upgrade to Pro" button

### 3.2 **Subscription Upgrade Testing**

**Test 1: Member tries to upgrade (should fail)**
```bash
# Login as member
MEMBER_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@globex.test", "password": "password"}' | jq -r '.token')

# Try to upgrade (should fail)
curl -X POST http://localhost:3001/api/tenants/globex/upgrade \
  -H "Authorization: Bearer $MEMBER_TOKEN"

# Expected: {"error": "Only admins can upgrade subscriptions"}
```

**Test 2: Admin upgrades successfully**
```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@globex.test", "password": "password"}' | jq -r '.token')

# Upgrade tenant
curl -X POST http://localhost:3001/api/tenants/globex/upgrade \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: {"message": "Subscription upgraded successfully", ...}
```

---

## 💳 **PHASE 4: Subscription Limits Testing**

### 4.1 **Free Plan Limits (3 notes max)**

**Reset Globex to Free Plan:**
1. If Globex was upgraded to Pro in previous tests, you may need to manually reset it
2. Or use a fresh database: `npm run db:seed`

**Test Free Plan Limits:**
1. **Login as admin@globex.test** (should be free plan)
2. **Create Note 1:** Title: "Free Note 1", Content: "Test content 1"
3. **Create Note 2:** Title: "Free Note 2", Content: "Test content 2"  
4. **Create Note 3:** Title: "Free Note 3", Content: "Test content 3"
5. **Try Create Note 4:** Should show error "Free plan is limited to 3 notes. Upgrade to Pro for unlimited notes."

**Frontend Testing:**
- ✅ Notes counter should show "Your Notes (3/3)"
- ✅ "Create Note" button should be disabled or hidden
- ✅ Red warning message should appear about reaching limit
- ✅ "Upgrade to Pro" button should be prominent

### 4.2 **Pro Plan Unlimited**

**Test Pro Plan (Acme or upgraded Globex):**
1. **Login as admin@acme.test** (Pro plan)
2. **Create 5+ notes** - should all work without limits
3. **Notes counter** should show "Your Notes (X)" without "/3" limit
4. **No warning messages** about limits

---

## 📝 **PHASE 5: Notes CRUD Operations Testing**

### 5.1 **Create Notes**

**Frontend Testing:**
1. Click "Create Note" button
2. Fill in Title: "Test Note Title"
3. Fill in Content: "This is test content for the note"
4. Click "Create Note"
5. ✅ Should appear in notes list immediately
6. ✅ Should show your email as creator
7. ✅ Should show creation date

**API Testing:**
```bash
curl -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "API Test Note", "content": "Created via API"}'

# Expected: Note object with id, timestamps, user info
```

### 5.2 **Read Notes**

**Frontend Testing:**
1. ✅ Notes list shows all tenant notes
2. ✅ Shows title, content, creator email, date
3. ✅ Most recent notes appear first
4. ✅ No notes from other tenants visible

**API Testing:**
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/notes

# Expected: Array of notes for current tenant only
```

### 5.3 **Update Notes**

**Note:** Current version supports update via API only (frontend update UI not implemented)

**API Testing:**
```bash
# First get a note ID from the list
NOTE_ID="your-note-id-here"

curl -X PUT http://localhost:3001/api/notes/$NOTE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Updated Title", "content": "Updated content"}'

# Expected: Updated note object
```

### 5.4 **Delete Notes**

**Frontend Testing:**
1. Find a note in the list
2. Click red "Delete" button
3. ✅ Note should disappear immediately
4. ✅ Notes count should decrease

**API Testing:**
```bash
curl -X DELETE http://localhost:3001/api/notes/$NOTE_ID \
  -H "Authorization: Bearer $TOKEN"

# Expected: {"message": "Note deleted successfully"}
```

---

## 🔒 **PHASE 6: Security Testing**

### 6.1 **Unauthorized Access**

**Test without token:**
```bash
# Should all return 401 Unauthorized
curl http://localhost:3001/api/notes
curl -X POST http://localhost:3001/api/notes -d '{}'
curl -X DELETE http://localhost:3001/api/notes/fake-id
```

**Test with invalid token:**
```bash
curl -H "Authorization: Bearer invalid-token" http://localhost:3001/api/notes

# Expected: {"error": "Unauthorized"}
```

### 6.2 **Cross-Tenant Access Attempts**

**Try to access another tenant's note:**
```bash
# Get note ID from Acme tenant
# Try to access it with Globex token
curl -H "Authorization: Bearer $GLOBEX_TOKEN" \
  http://localhost:3001/api/notes/$ACME_NOTE_ID

# Expected: {"error": "Note not found"} (due to tenant isolation)
```

### 6.3 **Cross-Tenant Upgrade Attempts**

```bash
# Acme admin tries to upgrade Globex
curl -X POST http://localhost:3001/api/tenants/globex/upgrade \
  -H "Authorization: Bearer $ACME_TOKEN"

# Expected: {"error": "You can only upgrade your own tenant"}
```

---

## 🌐 **PHASE 7: Frontend UI/UX Testing**

### 7.1 **Login Page**
- ✅ Shows test accounts clearly
- ✅ Form validation works
- ✅ Error messages for wrong credentials
- ✅ Redirects to dashboard on success
- ✅ Responsive design on mobile/desktop

### 7.2 **Dashboard Page**
- ✅ Shows user info (email, role, tenant, subscription)
- ✅ Notes counter with appropriate limits
- ✅ Create note form appears/disappears
- ✅ Notes list with proper formatting
- ✅ Delete buttons work
- ✅ Logout button works

### 7.3 **Responsive Design**
- ✅ Works on desktop (1200px+)
- ✅ Works on tablet (768px-1199px)
- ✅ Works on mobile (320px-767px)
- ✅ All buttons clickable
- ✅ Text readable at all sizes

---

## 🚀 **PHASE 8: Performance & Production Readiness**

### 8.1 **API Performance**
```bash
# Test response times
time curl http://localhost:3001/api/health
time curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/notes

# Should be under 500ms for most requests
```

### 8.2 **Database Performance**
- ✅ PostgreSQL connection working
- ✅ Queries return quickly
- ✅ No connection errors in logs

### 8.3 **Build & Production**
```bash
# Test production build
npm run build

# Expected: Successful build with no errors
# Check .next/static folder created
```

---

## 📊 **Final Verification Report**

After completing all tests, fill this out:

### ✅ **Core Functionality**
- [ ] Multi-tenancy with strict isolation
- [ ] JWT authentication with all test accounts
- [ ] Role-based access control (Admin vs Member)
- [ ] Subscription limits (Free: 3 notes, Pro: unlimited)
- [ ] Notes CRUD operations
- [ ] Real-time subscription upgrades

### ✅ **Security**
- [ ] Unauthorized access blocked
- [ ] Cross-tenant access prevented
- [ ] JWT tokens working properly
- [ ] Password hashing secure

### ✅ **Frontend**
- [ ] Login/logout functionality
- [ ] Dashboard with user info
- [ ] Notes management interface
- [ ] Responsive design
- [ ] Upgrade buttons for appropriate users

### ✅ **API Endpoints**
- [ ] GET /api/health
- [ ] POST /api/auth/login
- [ ] POST /api/auth/logout
- [ ] GET /api/notes
- [ ] POST /api/notes
- [ ] GET /api/notes/:id
- [ ] PUT /api/notes/:id
- [ ] DELETE /api/notes/:id
- [ ] POST /api/tenants/:slug/upgrade

### ✅ **Production Ready**
- [ ] PostgreSQL database connected
- [ ] Environment variables configured
- [ ] No console errors
- [ ] Build successful
- [ ] Deployment ready

---

## 🎯 **Quick Test Commands**

**Complete Test Suite:**
```bash
# 1. Health check
curl http://localhost:3001/api/health

# 2. Run all API tests
./scripts/test-api.sh

# 3. Test frontend
open http://localhost:3001

# 4. Test build
npm run build
```

**Expected Results:**
- ✅ Health returns `{"status":"ok"}`
- ✅ All API tests pass
- ✅ Frontend loads and works
- ✅ Build completes successfully

---

## 🐛 **Common Issues & Solutions**

### Issue: Port 3000 in use
**Solution:** ✅ App automatically uses port 3001

### Issue: Database connection fails
**Solution:** Check PostgreSQL URL in .env file

### Issue: JWT errors
**Solution:** Check JWT_SECRET length (needs 32+ characters)

### Issue: Next.js params errors
**Solution:** ✅ Fixed - all routes now await params

### Issue: CORS errors
**Solution:** ✅ Already configured in next.config.ts

---

## 🎉 **Success Criteria**

**Your app is PERFECT if:**
- ✅ All automated tests pass
- ✅ All manual tests pass
- ✅ No console errors
- ✅ Secure tenant isolation
- ✅ Role permissions work
- ✅ Subscription limits enforced
- ✅ Beautiful, responsive UI
- ✅ Production-ready code

**Ready for deployment!** 🚀 