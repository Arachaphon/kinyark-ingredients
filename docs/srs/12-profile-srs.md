# SRS - Profile System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Profile System of the Kinyrak Ingredients application. The profile system manages user profile information including username, avatar, and public profile details.

### 1.2 Scope
The profile system covers:
- Viewing user profiles
- Updating username
- Updating avatar (via Supabase Storage)
- Avatar URL upload via API
- Profile caching for performance
- Profile data selection control

### 1.3 References
- Supabase Auth for user management
- Supabase Storage for avatar images
- Prisma ORM with PostgreSQL
- Next.js App Router API routes

## 2. System Overview

### 2.1 Architecture
The profile system uses a caching layer (30-second TTL) to reduce database load. Profile data is fetched from PostgreSQL, and avatar updates go through Supabase Storage. The `getProfile` and `updateProfile` functions encapsulate the core logic, with different select options for different use cases.

### 2.2 Actors
- **Authenticated User**: Can view and update their own profile
- **System**: Provides profile data to other components

## 3. Functional Requirements

### 3.1 Get Profile

**ID**: PROFILE-GET-001  
**Priority**: High

**Description**: The system shall allow users to view their profile information.

**Preconditions**:
- User is authenticated (via header `x-user-id` or Supabase session)

**Flow**:
1. Try to get `userId` from request headers (`x-user-id`)
2. If not found, authenticate via Supabase session
3. If no userId, return `{ user: null, error: 'Unauthorized', status: 401 }`
4. Check cache (`user:profile:${userId}`) for 30 seconds (non-test only)
5. If cached, return cached profile
6. Otherwise, query `prisma.user.findUnique({ where: { id: userId }, select })`
7. If not found, return `{ user: null, error: 'Not found', status: 404 }`
8. Cache the result with 30-second TTL
9. Return `{ user, error: null, status: 200 }`

**Select Options**:
- `AUTH_PROFILE_SELECT`: `{ id, username, email, avatarUrl, role }`
- `FULL_PROFILE_SELECT`: `{ id, username, email, avatarUrl, role, createdAt }`
- Custom select can be passed for specific fields

**Cache Behavior**:
- Cache key: `user:profile:${userId}`
- TTL: 30,000ms (30 seconds)
- Cache is skipped in test environment (`process.env.NODE_ENV !== 'test'`)
- Cache is not used if no profile data found

### 3.2 Update Profile

**ID**: PROFILE-UPDATE-001  
**Priority**: High

**Description**: The system shall allow users to update their profile information.

**Preconditions**:
- User is authenticated
- User ID is known

**Flow**:
1. Accept `ProfileUpdateData`: `{ username?: string, avatarUrl?: string | null }`
2. Call `prisma.user.update({ where: { id: userId }, data, select })`
3. Invalidate cache (`cache.del(`user:profile:${userId}`)`)
4. Return `{ user, error: null, status: 200 }`
5. On error, return `{ user: null, error: 'Internal Server Error', status: 500 }`

**Updateable Fields**:
- `username`: String, optional, must be unique
- `avatarUrl`: String | null, optional

### 3.3 Update Avatar via API

**ID**: PROFILE-AVATAR-001  
**Priority**: High

**Description**: The system shall allow users to upload/change their avatar.

**Endpoint**: `PUT /api/users/me/avatar`

**Flow**:
1. User sends avatar update request
2. System validates and processes the new avatar URL
3. System updates `avatarUrl` field in database
4. Cache is invalidated
5. Returns updated user profile

**Storage**: Avatars are stored via Supabase Storage. The `avatarUrl` field stores the public URL.

### 3.4 Profile Select Options

**ID**: PROFILE-SELECT-001  
**Priority**: Medium

**Description**: The system shall provide predefined profile select options for consistency.

**Predefined Selects**:
```typescript
AUTH_PROFILE_SELECT = {
  id: true, username: true, email: true, avatarUrl: true, role: true,
} satisfies Prisma.UserSelect;

FULL_PROFILE_SELECT = {
  id: true, username: true, email: true, avatarUrl: true,
  role: true, createdAt: true,
} satisfies Prisma.UserSelect;
```

**Usage**:
- `AUTH_PROFILE_SELECT`: For authentication-related contexts (minimal fields)
- `FULL_PROFILE_SELECT`: For display contexts (includes `createdAt`)
- Custom select can be passed for other use cases

## 4. Non-Functional Requirements

### 4.1 Performance
- 30-second profile cache reduces database queries
- Cache is skipped in test environment for consistency
- Profile operations are fast (single DB query)

### 4.2 Security
- Avatar URLs are stored as strings in the database
- Profile updates are restricted to authenticated users
- Avatar storage goes through Supabase Storage (secure)

### 4.3 Data Integrity
- Username uniqueness is enforced by Prisma (`@unique`)
- Profile update cache invalidation ensures consistency
- Cache errors are handled gracefully

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/me` | GET | Get user profile |
| `/api/users/me/avatar` | PUT | Update user avatar |

## 6. Data Models

### 6.1 User Model (Relevant Fields)
```prisma
model User {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  username   String?  @unique
  email      String   @unique
  avatarUrl  String?
  role       String   @default("USER")
  createdAt  DateTime @default(now())
}
```

## 7. Files Structure

```
src/app/api/users/me/
  ├── route.ts          (GET profile)
  └── avatar/route.ts   (PUT avatar)
src/lib/profile.ts      (getProfile, updateProfile functions)
src/app/(main)/profile/
  └── page.tsx          (Profile page component)
```

## 8. Cache Strategy
- Profile cache: `user:profile:${userId}`
- TTL: 30,000ms (30 seconds)
- Cache is skipped in test environment
- Cache is invalidated on profile update

## 9. Dependencies
- `@prisma/client` - Database ORM
- `src/lib/cache.ts` - Cache management
- `src/lib/supabase/server.ts` - Supabase SSR
- `next` - Framework
- `headers()` from Next.js - Request headers

## 10. Assumptions and Constraints
- User must be authenticated to view/update profile
- Profile cache is disabled in test mode
- Username must be unique
- Avatar URL is managed via Supabase Storage
- Profile data is returned with configurable field selection
- Cache errors are logged but don't crash the application

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
