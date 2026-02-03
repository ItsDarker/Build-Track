# BuildTrack - Monorepo

**Construction Workflow Management Platform**

BuildTrack is a full-stack application for managing construction workflows with clarity and accountability. This monorepo contains both the frontend UI and backend API.

## 🏗️ Architecture

```
buildtrack/
├── frontend/          # Next.js 14 App Router (UI only)
├── backend/           # Express + TypeScript API
├── docker-compose.yml # Local development orchestration
└── README.md         # This file
```

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **API Client**: Custom fetch wrapper with cookie-based auth

### Backend
- **Framework**: Express + TypeScript
- **Database**: PostgreSQL (SQLite for local dev)
- **ORM**: Prisma
- **Authentication**: JWT with httpOnly cookies
- **Email**: Nodemailer (console mode + SMTP)
- **Security**: Rate limiting, disposable email blocking, spam detection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional)
- PostgreSQL (for production) or SQLite (for dev)

### Option 1: Docker Compose (Recommended)

```bash
# Start all services (PostgreSQL + Backend + Frontend)
docker-compose up

# Frontend: http://localhost:3000
# Backend: http://localhost:4000
# MailDev UI: http://localhost:1080
# PostgreSQL: localhost:5432
```

### Option 2: Local Development

#### 1. Install Dependencies

```bash
# Root workspace dependencies
npm install

# Install all workspace dependencies
npm install --workspaces
```

#### 2. Set Up Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# For local development, defaults should work

# Generate Prisma client
npm run prisma:generate

# Run migrations (creates database)
npm run prisma:migrate

# Start backend server
npm run dev
```

Backend runs on `http://localhost:4000`

#### 3. Set Up Frontend

```bash
cd frontend

# Copy environment file
cp .env.example .env.local

# Ensure API_URL points to backend
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local

# Start frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

#### 4. Run Both Together

From root directory:

```bash
npm run dev
```

This starts both frontend and backend concurrently.

## 📁 Project Structure

### Backend (`/backend`)

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts           # Environment configuration
│   │   └── prisma.ts        # Prisma client
│   ├── middleware/
│   │   ├── auth.ts          # JWT authentication
│   │   └── rateLimiter.ts   # Rate limiting
│   ├── routes/
│   │   └── auth.routes.ts   # Auth endpoints
│   ├── services/
│   │   ├── authService.ts   # Auth business logic
│   │   └── emailService.ts  # Email sending
│   ├── utils/
│   │   ├── jwt.ts           # JWT utilities
│   │   ├── rateLimit.ts     # Rate limiting logic
│   │   ├── emailValidation.ts # Email validation
│   │   └── validation.ts    # Zod schemas
│   ├── data/
│   │   └── disposable_domains.json # Blocked email domains
│   └── index.ts             # Express server
├── prisma/
│   └── schema.prisma        # Database schema
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── page.tsx         # Home page
│   │   ├── login/           # Login page
│   │   ├── signup/          # Signup page
│   │   ├── verify-email/    # Email verification
│   │   ├── app/             # Protected dashboard
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── auth/            # Auth-specific components
│   │   └── marketing/       # Landing page components
│   └── lib/
│       ├── api/
│       │   ├── client.ts    # API client
│       │   └── hooks.ts     # React Query hooks
│       ├── providers.tsx    # React Query provider
│       └── utils.ts         # Utility functions
├── Dockerfile
├── package.json
└── tsconfig.json
```

## 🔐 Authentication Flow

1. **Signup**
   - Frontend: POST `/api/auth/signup`
   - Backend validates email, creates user, sends verification email
   - Email sent to console (dev) or via SMTP

2. **Email Verification**
   - User clicks link in email with token
   - Frontend: POST `/api/auth/verify-email`
   - Backend verifies token, marks email as verified

3. **Login**
   - Frontend: POST `/api/auth/login`
   - Backend validates credentials, returns JWT tokens as httpOnly cookies
   - Frontend automatically includes cookies in subsequent requests

4. **Protected Routes**
   - Frontend: GET `/api/auth/me`
   - Backend validates JWT from cookie, returns user data
   - Frontend uses React Query to cache user data

5. **Logout**
   - Frontend: POST `/api/auth/logout`
   - Backend clears refresh token from database
   - Cookies cleared on both sides

## 🛡️ Security Features

### Backend
- **Password Hashing**: bcrypt (12 rounds)
- **JWT Tokens**: Access token (15min) + Refresh token (7 days)
- **httpOnly Cookies**: Prevents XSS attacks
- **Rate Limiting**: 5 attempts per 15 minutes (configurable)
- **Disposable Email Blocking**: 500+ domains blocked
- **Spam Domain Detection**: Heuristic-based filtering
- **Token Hashing**: Verification tokens hashed before storage
- **CORS**: Whitelist frontend origin

### Frontend
- **Zod Validation**: Client-side form validation
- **CSRF Protection**: Cookies with SameSite attribute
- **Password Strength**: Real-time feedback
- **Secure Defaults**: Environment-based configuration

## 📧 Email Configuration

### Console Mode (Default)

Emails logged to console during development:

```env
MAIL_MODE=console
```

Look for verification links in backend logs.

### SMTP Mode (MailDev)

For local testing with visual email client:

```bash
# Using Docker Compose (MailDev included)
docker-compose up

# Or install MailDev globally
npm install -g maildev
maildev
```

Update `backend/.env`:

```env
MAIL_MODE=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@buildtrack.local
```

View emails at `http://localhost:1080`

### Production Email

For production, use:
- **SMTP Relay**: Google Workspace, AWS SES, SendGrid
- **Transactional Email Services**: Resend, Postmark

Update `backend/.env` with provider credentials.

## 🗄️ Database

### Development (SQLite)

Default for local development:

```env
DATABASE_URL="file:./dev.db"
```

### Production (PostgreSQL)

Update `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Update `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/buildtrack?schema=public"
```

Run migrations:

```bash
cd backend
npm run prisma:migrate
```

## 🐳 Docker Deployment

### Build Images

```bash
# Build backend
docker build -t buildtrack-backend ./backend

# Build frontend
docker build -t buildtrack-frontend ./frontend
```

### Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ☁️ GCP Deployment

### Architecture

```
┌─────────────────┐      ┌──────────────────┐
│  Cloud Storage  │──┬──▶│   Cloud CDN      │
│  (Frontend)     │  │   │  (Optional)      │
└─────────────────┘  │   └──────────────────┘
                     │          │
                     │          ▼
                     │   ┌──────────────────┐
                     └──▶│   Cloud Run      │
                         │   (Frontend)     │
                         └──────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │   Cloud Run      │
                         │   (Backend)      │
                         └──────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │   Cloud SQL      │
                         │   (PostgreSQL)   │
                         └──────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │  Secret Manager  │
                         │  (Secrets)       │
                         └──────────────────┘
```

### 1. Set Up Google Cloud Project

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Create Cloud SQL PostgreSQL Instance

```bash
# Create instance
gcloud sql instances create buildtrack-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create buildtrack \
  --instance=buildtrack-db

# Create user
gcloud sql users create buildtrack \
  --instance=buildtrack-db \
  --password=SECURE_PASSWORD
```

### 3. Store Secrets in Secret Manager

```bash
# JWT Secret
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-

# JWT Refresh Secret
echo -n "your-refresh-secret" | gcloud secrets create jwt-refresh-secret --data-file=-

# Google OAuth
echo -n "your-google-client-id" | gcloud secrets create google-client-id --data-file=-
echo -n "your-google-client-secret" | gcloud secrets create google-client-secret --data-file=-

# Microsoft OAuth
echo -n "your-microsoft-client-id" | gcloud secrets create microsoft-client-id --data-file=-
echo -n "your-microsoft-client-secret" | gcloud secrets create microsoft-client-secret --data-file=-
```

### 4. Deploy Backend to Cloud Run

```bash
cd backend

# Build and submit to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/buildtrack-backend

# Deploy to Cloud Run
gcloud run deploy buildtrack-backend \
  --image gcr.io/YOUR_PROJECT_ID/buildtrack-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:buildtrack-db \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "PORT=8080" \
  --set-env-vars "DATABASE_URL=postgresql://buildtrack:PASSWORD@/buildtrack?host=/cloudsql/YOUR_PROJECT_ID:us-central1:buildtrack-db" \
  --set-secrets "JWT_SECRET=jwt-secret:latest" \
  --set-secrets "JWT_REFRESH_SECRET=jwt-refresh-secret:latest" \
  --set-secrets "GOOGLE_CLIENT_ID=google-client-id:latest" \
  --set-secrets "GOOGLE_CLIENT_SECRET=google-client-secret:latest" \
  --set-env-vars "FRONTEND_URL=https://your-frontend-url.app" \
  --set-env-vars "COOKIE_DOMAIN=your-domain.com" \
  --set-env-vars "COOKIE_SECURE=true"
```

### 5. Deploy Frontend to Cloud Run

```bash
cd frontend

# Build and submit
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/buildtrack-frontend

# Deploy
gcloud run deploy buildtrack-frontend \
  --image gcr.io/YOUR_PROJECT_ID/buildtrack-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://your-backend-url.run.app"
```

### Alternative: Frontend as Static Export (Cloud Storage + CDN)

If your app supports static export:

```bash
cd frontend

# Build static export
npm run build
npm run export

# Deploy to Cloud Storage
gsutil -m rsync -r -d out gs://your-bucket-name

# Set up Cloud CDN (via Console)
# https://cloud.google.com/cdn/docs/setting-up-cdn-with-bucket
```

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `file:./dev.db` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Optional |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth client ID | Optional |
| `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth client secret | Optional |
| `MAIL_MODE` | Email mode (`console` or `smtp`) | `console` |
| `COOKIE_DOMAIN` | Cookie domain | `localhost` |
| `COOKIE_SECURE` | Use secure cookies | `false` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000` |

## 🧪 Testing

### Backend

```bash
cd backend

# Run TypeScript compiler check
npm run build

# View database in Prisma Studio
npm run prisma:studio
```

### Frontend

```bash
cd frontend

# Build for production
npm run build

# Test production build
npm run start
```

## 📊 Monitoring & Logging

### Cloud Run Logging

```bash
# View backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=buildtrack-backend" --limit 50

# View frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=buildtrack-frontend" --limit 50
```

### Local Logging

- Backend: Console logs with structured format
- Frontend: Browser console + Next.js dev server logs

## 🔐 Security Checklist for Production

- [ ] Generate strong JWT secrets (`openssl rand -base64 32`)
- [ ] Use Secret Manager for all credentials
- [ ] Enable HTTPS (Cloud Run provides this automatically)
- [ ] Set `COOKIE_SECURE=true` in production
- [ ] Configure proper CORS origins
- [ ] Set up Cloud SQL with private IP
- [ ] Enable Cloud Armor for DDoS protection
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy for Cloud SQL
- [ ] Review and update rate limits
- [ ] Enable audit logging
- [ ] Set up proper IAM roles

## 📝 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new account |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout and clear session |
| POST | `/api/auth/verify-email` | Verify email with token |
| POST | `/api/auth/resend-verification` | Resend verification email |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user (protected) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## 🤝 Contributing

This is an MVP. Future enhancements planned:

- OAuth implementation (Google, Microsoft)
- Password reset flow
- Projects dashboard (`FEATURE_PROJECTS`)
- Task management (`FEATURE_TASKS`)
- Audit history (`FEATURE_AUDIT`)
- Role-based access control
- Two-factor authentication

## 📄 License

Open source - MIT License

## 🆘 Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Reset database: `rm backend/dev.db && cd backend && npm run prisma:migrate`
- Clear Docker: `docker-compose down -v`

---

**Built for construction workflow management** 🏗️
