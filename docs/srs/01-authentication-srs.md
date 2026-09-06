# SRS - Authentication System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Authentication System of the Kinyrak Ingredients application. The authentication system manages user registration, login, logout, password recovery, and account management.

### 1.2 Scope
The authentication system covers:
- User registration (email/password, OAuth via Supabase)
- User login and session management
- User logout
- Password reset (forgot password)
- Password change (reset password)
- Email verification (check-email)
- Account deletion
- Profile management (username, avatar)
- JWT-based authentication
- Role-based access control (USER, STORE, ADMIN)

### 1.3 References
- Supabase Auth SDK (`@supabase/ssr`, `@supabase/supabase-js`)
- `jose` library for JWT handling
- Next.js App Router

## 2. System Overview

### 2.1 Architecture
The authentication system uses Supabase as the identity provider with JWT tokens for session management. The frontend (Next.js) communicates with Supabase Auth for user credential management and uses the `x-user-id` header pattern for backend route authentication.

### 2.2 Actors
- **Unauthenticated User**: Can register, login, request password reset
- **Authenticated User (USER)**: Can manage profile, create recipes, review, favorite
- **Authenticated User (STORE)**: Can create store posts, manage store content
- **Authenticated User (ADMIN)**: Full system access (role-based)

## 3. Functional Requirements

### 3.1 User Registration

**ID**: AUTH-REG-001  
**Priority**: High

**Description**: The system shall allow new users to register with their email and password.

**Preconditions**:
- User is on the registration page
- User has a valid email address

**Flow**:
1. User navigates to `/auth/register`
2. User submits registration form with email and password
3. System validates input using `auth.schema.ts` (Zod validation)
4. System calls Supabase Auth `signUp` with email and password
5. System triggers verification email
6. System creates user record in the database
7. System redirects user to check-email page

**Postconditions**:
- New user account is created
- Verification email is sent
- User is redirected to `/auth/check-email`

### 3.2 User Login

**ID**: AUTH-LOGIN-001  
**Priority**: High

**Description**: The system shall allow registered users to log in with email and password.

**Preconditions**:
- User has a registered account
- User has verified their email

**Flow**:
1. User navigates to `/auth/login`
2. User submits login form with email and password
3. System validates input
4. System calls Supabase Auth `signInWithPassword`
5. System receives JWT access token and refresh token
6. System stores session via Supabase cookies
7. System redirects user to the main page (`/`)

**Postconditions**:
- User session is established
- JWT tokens are stored securely
- User is redirected to the home page

### 3.3 User Logout

**ID**: AUTH-LOGOUT-001  
**Priority**: High

**Description**: The system shall allow authenticated users to log out.

**Preconditions**:
- User is authenticated

**Flow**:
1. User triggers logout action
2. System calls Supabase Auth `signOut`
3. System clears session cookies
4. System redirects user to login page

**Postconditions**:
- User session is terminated
- All auth tokens are cleared

### 3.4 Password Recovery (Forgot Password)

**ID**: AUTH-FORGOT-001  
**Priority**: High

**Description**: The system shall allow users to reset their password via email.

**Flow**:
1. User navigates to `/auth/forgotpassword`
2. User submits their email address
3. System sends password reset link to the email
4. User clicks the reset link and navigates to `/auth/resetpassword`
5. User enters new password
6. System validates and updates password via Supabase Auth

### 3.5 Email Verification Check

**ID**: AUTH-CHECK-EMAIL-001  
**Priority**: Medium

**Description**: The system shall display a page prompting users to check their email for verification.

**Flow**:
1. After registration, user is redirected to `/auth/check-email`
2. System displays instructions to check email inbox
3. User can request a new verification email if needed

### 3.6 Account Deletion

**ID**: AUTH-DELETE-001  
**Priority**: Medium

**Description**: The system shall allow users to delete their account.

**Preconditions**:
- User is authenticated

**Flow**:
1. User initiates account deletion
2. System verifies user identity
3. System calls Supabase Auth to delete the user account
4. All user-related data is cascade-deleted from the database (via Prisma `onDelete: Cascade`)
5. User is logged out

**Postconditions**:
- User account and all associated data are permanently deleted
- Session is terminated

### 3.7 Profile Management

**ID**: AUTH-PROFILE-001  
**Priority**: High

**Description**: The system shall allow users to view and update their profile information.

**Functionalities**:
- View profile (username, email, avatar URL, role, createdAt)
- Update username
- Update avatar (via Supabase Storage)
- Update avatar via API (`PUT /api/users/me/avatar`)

**Cache**: Profile data is cached for 30 seconds (`TTL_PROFILE = 30_000`)

### 3.8 JWT Authentication

**ID**: AUTH-JWT-001  
**Priority**: High

**Description**: The system shall use JWT tokens for authenticating API requests.

**Flow**:
1. On login, Supabase returns access token and refresh token
2. Tokens are stored in cookies via Supabase SSR
3. API routes extract user ID from `x-user-id` header or Supabase session
4. `getAuthUserId()` function resolves the current user's ID
5. Backend validates ownership for protected resources

### 3.9 Role-Based Access Control

**ID**: AUTH-ROLE-001  
**Priority**: Medium

**Description**: The system shall enforce role-based access control.

**Roles**:
- **USER**: Standard user, can create recipes, review, favorite, search
- **STORE**: Can create store posts, manage store listings
- **ADMIN**: Full administrative access

**Implementation**:
- Role is stored in `User.role` field (default: "USER")
- Role is checked via `x-user-role` header in API routes
- Store visibility rules differ from regular users

## 4. Non-Functional Requirements

### 4.1 Security
- Passwords are hashed by Supabase Auth
- JWT tokens are stored in secure HTTP-only cookies
- Account deletion permanently removes all user data
- Email verification is required before account activation

### 4.2 Performance
- Profile data is cached for 30 seconds to reduce database load
- Authentication operations should complete within 2 seconds

### 4.3 Reliability
- Supabase Auth handles authentication infrastructure
- System gracefully handles auth failures with appropriate error messages

### 4.4 Compatibility
- Works with Supabase OAuth providers
- Compatible with Next.js App Router architecture

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/me` | GET | Get current authenticated user |
| `/api/auth/logout` | POST | Logout user |
| `/api/auth/delete-account` | DELETE | Delete user account |
| `/api/users/me` | GET | Get user profile |
| `/api/users/me/avatar` | PUT | Update user avatar |

## 6. Data Models

### 6.1 User Model (Prisma)
```prisma
model User {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  username   String?  @unique
  email      String   @unique
  avatarUrl  String?
  role       String   @default("USER")
  createdAt  DateTime @default(now())
  recipes    Recipe[]
  reviews    Review[]
  favorites  Favorite[]
  searchHistories SearchHistory[]
  reviewLikes ReviewLike[]
  storePosts StorePost[]
}
```

## 7. Files Structure

```
src/app/(auth)/
  ├── login/
  │   ├── page.tsx
  │   └── actions.tsx
  ├── register/
  │   ├── page.tsx
  │   └── actions.ts
  ├── forgotpassword/page.tsx
  ├── resetpassword/page.tsx
  ├── check-email/page.tsx
  ├── callback/route.ts
  ├── layout.tsx
  └── (auth-layout)
src/app/api/auth/
  ├── me/route.ts
  ├── logout/route.ts
  └── delete-account/route.ts
src/app/api/users/me/
  ├── route.ts
  └── avatar/route.ts
src/lib/
  ├── auth-jwt.ts
  ├── auth-user.ts
  ├── profile.ts
  └── validations/auth.schema.ts
src/context/AuthContext.tsx
```

## 8. Validation Schemas

### 8.1 Auth Schema (`src/lib/validations/auth.schema.ts`)
- Email validation (format, required)
- Password validation (minimum length)
- Username validation (unique, length constraints)

## 9. Dependencies
- `@supabase/ssr` - Supabase SSR integration
- `@supabase/supabase-js` - Supabase client
- `jose` - JWT token handling
- `next` - Next.js framework

## 10. Assumptions and Constraints
- Supabase is the identity provider
- Email verification is required for full account access
- User roles are managed server-side
- Avatar uploads go to Supabase Storage
- The system uses server-side rendering with Next.js App Router

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
