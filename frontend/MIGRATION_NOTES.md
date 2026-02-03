# Frontend Migration Notes

The frontend has been set up as a pure UI layer that communicates with the backend API. The following components need to be updated to use the new API client:

## Components to Update

### 1. `src/components/auth/LoginForm.tsx`
- Replace NextAuth `signIn` with `useLogin()` hook
- Use `apiClient.login()` for authentication
- Handle errors from backend API response

### 2. `src/components/auth/SignupForm.tsx`
- Replace direct API call with `useSignup()` hook
- Remove client-side email validation (backend handles it)
- Keep password strength indicator

### 3. `src/components/auth/LogoutButton.tsx`
- Replace NextAuth `signOut` with `useLogout()` hook

### 4. `src/app/app/page.tsx`
- Replace NextAuth `getServerSession` with `useCurrentUser()` hook
- Make it a client component
- Add loading states

### 5. Remove OAuth Button Components
- OAuth flow now handled by backend redirects
- Update `OAuthButtons.tsx` to redirect to backend OAuth endpoints:
  - Google: `http://localhost:4000/api/auth/oauth/google/start`
  - Microsoft: `http://localhost:4000/api/auth/oauth/microsoft/start`

## API Endpoints

All frontend API calls should go through `apiClient`:

```typescript
import { apiClient } from '@/lib/api/client';

// Signup
const response = await apiClient.signup({ email, password, name });

// Login
const response = await apiClient.login({ email, password });

// Logout
await apiClient.logout();

// Get current user
const response = await apiClient.getCurrentUser();

// Verify email
await apiClient.verifyEmail(token);

// Resend verification
await apiClient.resendVerification(email);
```

## React Query Hooks

Use the provided hooks for automatic cache management:

```typescript
import { useLogin, useSignup, useCurrentUser, useLogout } from '@/lib/api/hooks';

// In component
const { mutate: login, isPending, error } = useLogin();
const { data: user, isLoading } = useCurrentUser();
```

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Session Management

- Sessions are now managed via httpOnly cookies set by the backend
- No manual token handling needed on frontend
- Cookies automatically included in API requests via `credentials: 'include'`

## Protected Routes

Create middleware to check auth status:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if user has accessToken cookie
  const token = request.cookies.get('accessToken');

  if (!token && request.nextUrl.pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
