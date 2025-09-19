# Multi-Tenant SaaS Notes Application

A complete multi-tenant SaaS Notes application built with Next.js, featuring JWT authentication, role-based access control, and subscription-based feature gating.

## 🌟 Features

### Multi-Tenancy
- **Shared Schema with TenantId**: Uses a single database with tenant isolation through tenantId columns
- **Strict Data Isolation**: Users can only access data from their own tenant
- **Two Demo Tenants**: Acme Corp and Globex Corporation

### Authentication & Authorization
- **JWT-based Authentication** with secure cookie storage
- **Role-based Access Control**:
  - **Admin**: Can invite users and upgrade tenant subscriptions
  - **Member**: Can create, view, edit, and delete notes

### Subscription Feature Gating
- **Free Plan**: Limited to 3 notes per tenant
- **Pro Plan**: Unlimited notes
- **Real-time Upgrade**: Instant feature unlocking after subscription upgrade

### Notes Management (CRUD)
- Create notes with title and content
- List all notes within tenant boundary
- Update existing notes
- Delete notes
- Automatic timestamps and user attribution

## 🏗️ Architecture

### Multi-Tenancy Approach: Shared Schema with TenantId

This application implements the "Shared Schema with TenantId" approach for multi-tenancy:

**Advantages:**
- **Cost Effective**: Single database for all tenants
- **Simple Maintenance**: One schema to maintain and backup
- **Easy Scaling**: Horizontal scaling without complex routing
- **Shared Resources**: Efficient resource utilization

**Implementation:**
- Every data table includes a `tenantId` column
- All database queries are automatically filtered by tenantId
- Strict enforcement at the API level prevents cross-tenant data access
- JWT tokens include tenant information for request context

**Data Model:**
```
Tenant (1) → Many (Users)
Tenant (1) → Many (Notes)
User (1) → Many (Notes)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and Install**
```bash
git clone <repository-url>
cd multi-tenant-saas-notes
npm install
```

2. **Environment Setup**
```bash
# .env file is already configured with PostgreSQL
# DATABASE_URL points to Neon PostgreSQL database
# All environment variables are set up
```

3. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Create database and tables  
npx prisma db push

# Seed with test data
npm run db:seed
```

4. **Start Development Server**
```bash
npm run dev
```

Visit `http://localhost:3001` and you'll be redirected to the login page.

### 🧪 **Verify Everything Works**

```bash
# Run comprehensive tests
./scripts/test-api.sh

# Check detailed testing guide
# See TESTING-GUIDE.md for complete verification
```

## 👥 Test Accounts

All test accounts use the password: `password`

### Acme Corp Tenant
- **Admin**: `admin@acme.test` - Can upgrade subscription and manage notes
- **Member**: `user@acme.test` - Can manage notes only

### Globex Corporation Tenant  
- **Admin**: `admin@globex.test` - Can upgrade subscription and manage notes
- **Member**: `user@globex.test` - Can manage notes only

## 🔗 API Documentation

### Authentication

#### POST /api/auth/login
Login with email and password
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.test", "password": "password"}'
```

#### POST /api/auth/logout  
Logout and clear authentication cookie
```bash
curl -X POST http://localhost:3000/api/auth/logout
```

### Notes Management

#### GET /api/notes
List all notes for the authenticated user's tenant
```bash
curl -X GET http://localhost:3000/api/notes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### POST /api/notes
Create a new note (subject to subscription limits)
```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title": "My Note", "content": "Note content here"}'
```

#### GET /api/notes/:id
Get a specific note (must belong to user's tenant)
```bash
curl -X GET http://localhost:3000/api/notes/NOTE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### PUT /api/notes/:id  
Update a specific note
```bash
curl -X PUT http://localhost:3000/api/notes/NOTE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title": "Updated Title", "content": "Updated content"}'
```

#### DELETE /api/notes/:id
Delete a specific note  
```bash
curl -X DELETE http://localhost:3000/api/notes/NOTE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### User Management (Admin Only)

#### GET /api/users
List all users in the admin's tenant
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### POST /api/users
Invite/create a new user in the admin's tenant
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"email": "newuser@acme.test", "role": "member", "password": "password"}'
```

#### PUT /api/users/:id
Update a user's role (Admin only)
```bash
curl -X PUT http://localhost:3000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"role": "admin"}'
```

#### DELETE /api/users/:id
Delete a user from the tenant (Admin only)
```bash
curl -X DELETE http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Tenant Management

#### POST /api/tenants/:slug/upgrade
Upgrade tenant subscription (Admin only)
```bash
curl -X POST http://localhost:3000/api/tenants/acme/upgrade \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Health Check

#### GET /api/health
System health check
```bash
curl -X GET http://localhost:3000/api/health
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Prepare for Production**
```bash
# Update environment variables for production
# Create .env.production with secure values
```

2. **Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to connect your GitHub repository
```

3. **Configure Environment Variables in Vercel**
- `DATABASE_URL`: Your production database URL (PostgreSQL recommended)
- `JWT_SECRET`: Strong random secret for JWT signing
- `NEXTAUTH_URL`: Your production domain
- `NEXTAUTH_SECRET`: Strong random secret for NextAuth

4. **Database Migration**
```bash
# For production, use PostgreSQL
# Update your DATABASE_URL to point to PostgreSQL
# Run migrations
npx prisma db push

# Seed production data
npm run db:seed
```

### Manual Deployment

The application is a standard Next.js app and can be deployed to any platform supporting Node.js:
- Vercel (recommended)
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🧪 Testing

### Manual Testing Checklist

#### Authentication Tests
- [ ] Login with all 4 test accounts
- [ ] Verify JWT token generation
- [ ] Test logout functionality  
- [ ] Verify unauthorized access protection

#### Tenant Isolation Tests
- [ ] Login as Acme user, verify only Acme notes visible
- [ ] Login as Globex user, verify only Globex notes visible
- [ ] Attempt cross-tenant note access (should fail)
- [ ] Verify tenant information in user context

#### Role Enforcement Tests
- [ ] Admin can access upgrade functionality
- [ ] Member cannot access upgrade functionality
- [ ] Both roles can manage notes equally

#### Subscription Limits Tests
- [ ] Free tenant: Create 3 notes successfully
- [ ] Free tenant: 4th note creation blocked
- [ ] Free tenant: Admin upgrade to Pro
- [ ] Pro tenant: Unlimited note creation

#### CRUD Functionality Tests
- [ ] Create note with title and content
- [ ] List all tenant notes
- [ ] Update existing note
- [ ] Delete note
- [ ] Verify timestamps and user attribution

#### Frontend Integration Tests
- [ ] Login page redirects to dashboard
- [ ] Dashboard shows user and tenant info
- [ ] Create note form validation
- [ ] Upgrade button appears for free admin users
- [ ] Logout returns to login page

### API Testing

Use the provided curl commands or tools like Postman to test all endpoints systematically.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── notes/          # Notes CRUD endpoints
│   │   ├── tenants/        # Tenant management
│   │   └── health/         # Health check
│   ├── dashboard/          # Main dashboard page
│   ├── login/              # Login page
│   └── layout.tsx          # Root layout with providers
├── contexts/
│   └── AuthContext.tsx     # Authentication state management
├── lib/
│   ├── auth.ts            # JWT utilities
│   └── db.ts              # Database connection
└── types/
    └── index.ts           # TypeScript type definitions

prisma/
├── schema.prisma          # Database schema
└── seed.ts               # Database seeding script
```

## 🔧 Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes  
- **Database**: SQLite (development), PostgreSQL (production recommended)
- **ORM**: Prisma
- **Authentication**: JWT with jose library
- **Password Hashing**: bcryptjs
- **Deployment**: Vercel-ready

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: HS256 algorithm with secure secret
- **HTTP-only Cookies**: Prevent XSS attacks
- **Tenant Isolation**: Strict database-level isolation
- **Input Validation**: Request validation and sanitization
- **CORS Configuration**: Controlled cross-origin requests

## 📈 Scalability Considerations

- **Database**: Ready for PostgreSQL migration for production
- **Caching**: Can add Redis for session management
- **CDN**: Static assets served via Vercel Edge Network
- **Monitoring**: Can integrate with services like Sentry
- **Logging**: Structured logging for production debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly using the testing checklist
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for modern SaaS applications**
