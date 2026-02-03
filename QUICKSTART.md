# BuildTrack Monorepo - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Root Dependencies

```bash
npm install
```

This installs concurrently for running both services.

### Step 2: Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file (already exists)
# Edit if needed, defaults should work for local dev

# Generate Prisma client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate
```

### Step 3: Set Up Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# .env.local already created with correct API URL
```

### Step 4: Start Everything

**Option A: Run both together (recommended)**

```bash
# From root directory
cd ..
npm run dev
```

**Option B: Run separately**

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Step 5: Test the Application

1. Open http://localhost:3000
2. Click "Get Started"
3. Fill signup form:
   - Email: `test@example.com`
   - Password: `TestPassword123`
4. Check backend terminal for verification email (console mode)
5. Copy verification URL from logs
6. Paste in browser to verify
7. Go back to http://localhost:3000/login
8. Login with your credentials
9. You should see the protected `/app` dashboard!

## 🐳 Using Docker Compose (Alternative)

```bash
# Start all services (PostgreSQL + Backend + Frontend + MailDev)
docker-compose up

# Access:
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
# MailDev: http://localhost:1080
# PostgreSQL: localhost:5432
```

## 📧 Email Verification

### Console Mode (Default)
Look for this in backend logs:

```
================================================================================
📧 VERIFICATION EMAIL (Console Mode)
================================================================================
🔗 Verification URL: http://localhost:3000/verify-email?token=...
================================================================================
```

Copy the URL and paste in browser.

### Using MailDev

If using Docker Compose, emails appear at http://localhost:1080

## 🧪 Test API Directly

```bash
# Health check
curl http://localhost:4000/health

# Signup
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123"}' \
  -c cookies.txt

# Get current user (with cookies)
curl http://localhost:4000/api/auth/me -b cookies.txt
```

## 📊 View Database

```bash
cd backend
npm run prisma:studio
```

Opens at http://localhost:5555

## 🔧 Configuration

### Backend (.env)
```env
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="development-secret"
FRONTEND_URL="http://localhost:3000"
MAIL_MODE="console"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## 🐛 Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
cd backend
npm run prisma:generate
```

### "Port 3000 already in use"
```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### "Database locked" error
```bash
cd backend
rm dev.db
npm run prisma:migrate
```

### Frontend components not working
The frontend components still reference NextAuth and need to be updated. See `frontend/MIGRATION_NOTES.md` for details.

## 📝 Available Scripts

### Root
- `npm run dev` - Run both frontend and backend
- `npm run build` - Build both
- `npm run lint` - Lint both

### Backend
- `npm run dev` - Start dev server with hot reload
- `npm run build` - Compile TypeScript
- `npm run start` - Run production build
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint

## 🎯 Next Steps

1. ✅ Services running locally
2. ⏭️ Update frontend components (see MIGRATION_NOTES.md)
3. ⏭️ Test complete auth flow
4. ⏭️ Add OAuth providers (optional)
5. ⏭️ Deploy to GCP (see README.md)

## 🆘 Need Help?

1. Check logs: `docker-compose logs -f` or terminal output
2. Reset database: `rm backend/dev.db && cd backend && npm run prisma:migrate`
3. Clear node_modules: `rm -rf node_modules backend/node_modules frontend/node_modules && npm install`
4. Check environment files exist: `backend/.env` and `frontend/.env.local`

---

**You're all set! Start building features.** 🎉
