# Environment Setup Guide

## 🏠 Local Development

Your current setup is working! The app runs on **http://localhost:3001**

### Current Configuration:
```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-jwt-secret-local-only-change-for-production"
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="dev-nextauth-secret-local-only"
```

### Quick Start:
```bash
npm run dev
# Visit http://localhost:3001
```

## 🚀 Production Deployment

### For Vercel Deployment:

1. **Set Environment Variables in Vercel Dashboard:**
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   JWT_SECRET=your-super-secure-random-string-min-32-chars
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=another-super-secure-random-string
   ```

2. **Generate Secure Secrets:**
   ```bash
   # Generate JWT_SECRET
   openssl rand -base64 32
   
   # Generate NEXTAUTH_SECRET  
   openssl rand -base64 32
   ```

3. **Database Setup (PostgreSQL recommended):**
   ```bash
   # Example with Supabase, PlanetScale, or Neon
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

### For Docker Deployment:

1. **Create .env.production:**
   ```bash
   cp .env.production.example .env.production
   # Edit with your values
   ```

2. **Run with Docker:**
   ```bash
   docker-compose up -d
   ```

## 🔧 Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `postgresql://...` |
| `JWT_SECRET` | Secret for signing JWT tokens | 32+ character random string |
| `NEXTAUTH_URL` | Your app's base URL | `https://myapp.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth.js secret | 32+ character random string |
| `NODE_ENV` | Runtime environment | `development` or `production` |

## 🛡️ Security Best Practices

### ⚠️ IMPORTANT: Change These for Production!

1. **Never use default secrets in production**
2. **Use strong random strings (32+ characters)**
3. **Use PostgreSQL in production, not SQLite**
4. **Enable HTTPS in production**
5. **Set secure cookies in production**

### Generate Secure Secrets:
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

## 🌍 Different Deployment Platforms

### Vercel (Recommended)
```bash
# 1. Connect GitHub repo
# 2. Add environment variables in dashboard
# 3. Deploy automatically
```

### Railway
```bash
railway login
railway link
railway add postgresql
railway deploy
```

### DigitalOcean App Platform
```bash
# Use .env.production.example as template
# Add variables in DO dashboard
```

### Heroku
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32)
git push heroku main
```

## 🧪 Testing Your Environment

### Test Local Setup:
```bash
# 1. Start the server
npm run dev

# 2. Run API tests
./scripts/test-api.sh

# 3. Visit frontend
open http://localhost:3001
```

### Test Production Setup:
```bash
# 1. Test health endpoint
curl https://your-domain.com/api/health

# 2. Test login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.test", "password": "password"}'
```

## 🐛 Common Issues & Solutions

### Port 3000 in use?
✅ **Fixed!** App now uses port 3001 automatically

### Database connection fails?
```bash
# Check your DATABASE_URL format
# PostgreSQL: postgresql://user:pass@host:5432/db
# SQLite: file:./dev.db
```

### JWT errors?
```bash
# Ensure JWT_SECRET is at least 32 characters
# Check for special characters in secrets
```

### CORS errors?
✅ **Already configured** in `next.config.ts`

### Cookie issues?
- Check NEXTAUTH_URL matches your domain
- Ensure HTTPS in production
- Verify cookie settings in browser

## 📋 Environment Checklist

### Before Deploying to Production:

- [ ] Generated secure JWT_SECRET (32+ chars)
- [ ] Generated secure NEXTAUTH_SECRET (32+ chars)  
- [ ] Set correct NEXTAUTH_URL (your domain)
- [ ] Configured PostgreSQL DATABASE_URL
- [ ] Tested all API endpoints
- [ ] Verified frontend login/logout
- [ ] Tested tenant isolation
- [ ] Confirmed subscription limits work
- [ ] Checked upgrade functionality

### Security Verification:
- [ ] No default secrets in production
- [ ] HTTPS enabled
- [ ] Secure cookie settings
- [ ] Database access restricted
- [ ] Environment variables not exposed

## 🎯 Quick Commands

```bash
# Start development
npm run dev

# Test APIs
./scripts/test-api.sh

# Build for production
npm run build

# Start production server
npm start

# Database commands
npx prisma db push
npx prisma generate
npm run db:seed

# Docker commands
docker build -t notes-app .
docker-compose up -d
```

---

**Your app is ready to deploy! 🚀** 