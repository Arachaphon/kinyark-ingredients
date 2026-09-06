# SRS - Post/Community Feed System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Post/Community Feed System of the Kinyrak Ingredients application. The post system displays a community feed where users can browse recipes (both user-created and AI-generated) in a social media-style layout with favorite toggling, rating display, and tab-based filtering.

### 1.2 Scope
The post/community feed system covers:
- Community feed page displaying recipes in a card layout
- Tab-based filtering (All, User posts, AI posts)
- Pagination with infinite scroll-like behavior
- Favorite heart toggle with optimistic UI
- Star rating display
- Store post display (with store branding, price, contact info)
- AI author branding (with provider logo and badge)
- Ingredient tag display
- Synchronization between favorites and post feed

### 1.3 References
- `useSWR` for data fetching
- Next.js App Router pages
- Optimistic UI pattern
- `getAiAuthor` utility for AI branding

## 2. System Overview

### 2.1 Architecture
The post system is a client-side rendered page (`"use client"`) that uses SWR for data fetching. It calls the `/api/recipes` API endpoint with pagination and `authorType` filtering. The page displays recipes in card format, distinguishing between user posts, AI-generated posts, and store posts. Favorite toggles use optimistic UI with API fallback.

### 2.2 Actors
- **End User**: Browses the community feed, favorites recipes, views ratings
- **System**: Provides recipe data, handles favorite toggles
- **AI Providers**: Displayed as authors for AI-generated recipes

## 3. Functional Requirements

### 3.1 Community Feed Display

**ID**: POST-FEED-001  
**Priority**: High

**Description**: The system shall display a community feed of recipes.

**Preconditions**:
- User is on the `/post` page
- User may or may not be authenticated

**Flow**:
1. Page loads and initializes SWR fetcher
2. SWR fetches from `/api/recipes?page=1&limit=10`
3. If `activeTab !== "all"`, adds `&authorType={activeTab}` parameter
4. `revalidateOnFocus: false`, `dedupingInterval: 10000`
5. Data is displayed as recipe cards in a vertical list
6. Each card shows:
   - Recipe image (cover or first image)
   - Recipe name (bold, large text)
   - Ingredient tags (first 5 ingredients)
   - Author info (username, avatar)
   - Rating stars with numerical value
   - Favorite heart button with count
   - "View Recipe" link

**Page Size**: `PAGE_SIZE = 10` recipes per page

### 3.2 Tab-Based Filtering

**ID**: POST-TAB-001  
**Priority**: High

**Description**: The system shall allow filtering the feed by author type.

**Tabs**:
- **All (ทั้งหมด)**: Shows all recipes (public + protected + own private)
- **User Posts (โพสต์จากผู้ใช้งาน)**: Shows only user-created recipes (`authorType=user`, excludes AI)
- **AI Posts (สร้างโดย AI)**: Shows only AI-generated recipes (`authorType=ai`)

**Flow**:
1. User clicks a tab button
2. `activeTab` state is updated
3. `page` is reset to 1
4. SWR fetches new data with updated `authorType` query parameter
5. Recipe cards are re-rendered with filtered data

**Implementation**:
- `authorType` maps to `recipeListQuerySchema.authorType`
- `user` → `aiProvider: null` (only human-created recipes)
- `ai` → `aiProvider: { not: null }` (all AI-generated recipes)
- `all` → no author filter

### 3.3 Favorite Heart Toggle

**ID**: POST-FAVORITE-001  
**Priority**: High

**Description**: The system shall implement optimistic favorite toggle with API fallback.

**Flow**:
1. User clicks the heart icon on a recipe card
2. **Optimistic UI**: `flipFavorite()` is called immediately (no waiting for API)
3. Heart changes color (filled/red for favorited, gray/outline for unfavorited)
4. Count is incremented/decremented immediately
5. API call is sent to `POST /api/favorites` with `{ recipeId }`
6. If API succeeds: state is confirmed
7. If API fails: `flipFavorite()` is called again to revert (rollback)
8. If network error: state is reverted

**Synchronization**:
- On page load, system fetches `/api/favorites` to sync initial heart state
- `favoritedIds` is a `Set<string>` of recipe IDs that are favorited
- This ensures `/post` and `/favorites` views always agree

**Button Component**: `FavoriteHeartButton`
```typescript
{
  recipeId: string,
  favoriteCount: number,
  initialIsFavorite?: boolean,
}
```

### 3.4 Rating Display

**ID**: POST-RATING-001  
**Priority**: Medium

**Description**: The system shall display recipe ratings as stars with numerical value.

**Flow**:
1. `renderStars(rating)` function creates 5 SVG star icons
2. Stars filled if `star <= Math.round(rating)`
3. Star color: `#F1C40F` (gold) if filled, `#71B254` (green) if outlined
4. Numerical rating displayed next to stars (e.g., "4.5")
5. Rating comes from `post.rating` (API response)
6. `Math.round(post.rating)` for star display
7. `post.rating.toFixed(1)` for text display

**Star Colors**:
- Filled: Gold (`#F1C40F`)
- Outlined: Green (`#71B254`)

### 3.5 Store Post Display

**ID**: POST-STORE-001  
**Priority**: Medium

**Description**: The system shall display store posts differently from regular recipes.

**Detection**:
- `const storePost = post.storePosts && post.storePosts.length > 0 ? post.storePosts[0] : null`
- `const isStoreSet = Boolean(storePost)`

**Store Card Layout**:
- Green border (`border-[#71B254]`)
- Store badge: "ร้าน {storeName}" (green background)
- Recipe name displayed as "เซ็ท {recipeName}"
- Ingredients displayed as tags
- Selling price: "฿ {sellingPrice} .-"
- Contact info displayed
- Store image with fixed dimensions (380×350)
- "View Set Food" button linking to `/recipe/{post.id}`

**Store Data**:
- `storeName`, `sellingPrice`, `setIngredients`, `contactInfo`
- `storePost.images[0].imageUrl` for cover image
- `storePost.user` for author info

### 3.6 AI Author Branding

**ID**: POST-AI-001  
**Priority**: Medium

**Description**: The system shall display AI provider branding for AI-generated recipes.

**Flow**:
1. `getAiAuthor(post.aiProvider)` returns AI author info
2. If AI author exists:
   - Display provider logo (circular)
   - Display provider name
   - Display "AI Recipe" badge (`bg-[#E8F0FE]`, blue text)
3. If no AI author (regular user recipe):
   - Display user avatar
   - Display username
   - No AI badge

**AI Author Data**: Comes from `src/lib/ai-author.ts` which maps provider names to logos and display names

### 3.7 Pagination

**ID**: POST-PAGINATION-001  
**Priority**: Medium

**Description**: The system shall support pagination with navigation buttons.

**Flow**:
1. SWR fetches `page` of results with `PAGE_SIZE = 10`
2. `totalPages` is calculated from `data.meta.totalPages`
3. If `totalPages > 1`, pagination buttons appear:
   - "ย้อนกลับ" (Back) button: `page - 1`, disabled if page 1
   - Page indicator: "หน้า {page} จาก {totalPages}"
   - "ถัดไป" (Next) button: `page + 1`, disabled if last page
4. Clicking buttons calls `fetchPosts(targetPage)` which sets `page` state
5. Page scrolls to top on navigation

### 3.8 Loading and Error States

**ID**: POST-LOADING-001  
**Priority**: Medium

**Description**: The system shall display appropriate loading and error states.

**Loading State**:
- Spinner animation (`w-12 h-12 border-4 border-[#71B254] border-t-transparent rounded-full animate-spin`)
- Text: "กำลังโหลดโพสต์..."

**Error State**:
- White box with red border
- Text: "เกิดข้อผิดพลาดในการโหลดโพสต์"
- "ลองอีกครั้ง" (Try again) button

**Empty State**:
- Different messages per tab:
  - AI tab: "ยังไม่มีสูตรอาหารที่สร้างโดย AI ในหมวดหมู่นี้"
  - User tab: "ยังไม่มีโพสต์สูตรอาหารจากผู้ใช้งานในหมดหมู่นี้"
  - All tab: "ยังไม่มีโพสต์สูตรอาหารในตอนนี้"

## 4. Non-Functional Requirements

### 4.1 Performance
- SWR with `dedupingInterval: 10000` prevents duplicate requests
- `revalidateOnFocus: false` prevents unnecessary refetches
- Pagination loads only 10 recipes at a time
- Client-side rendering (React Server Components for data fetching)
- `priority={index === 0}` for above-the-fold images

### 4.2 User Experience
- Optimistic UI provides instant feedback for favorite toggles
- Smooth animations (`animate-fade-in`)
- Responsive design (mobile-first with `md:` breakpoints)
- Thai font (`Anuphan`) for Thai text rendering

### 4.3 Data Consistency
- Favorites list fetched on load to sync with post feed
- Optimistic UI reverts on API failure
- `favoritedIds` Set ensures consistency

## 5. API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recipes` | GET | List recipes with pagination and filtering |
| `/api/favorites` | GET | Get user's favorites for initial sync |
| `/api/favorites` | POST | Toggle favorite |

## 6. Key Data Structures

### 6.1 RecipeListResponse Type
```typescript
type RecipeListResponse = {
  data: RecipeCard[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
```

### 6.2 RecipeCard Type
```typescript
type RecipeCard = {
  id: string;
  recipeName: string;
  recipeIngredients: Array<{ ingredient: { name: string } }>;
  rating: number;
  favoriteCount: number;
  images: Array<{ imageUrl: string }>;
  user: { username: string; avatarUrl: string };
  storePosts?: Array<StorePostData>;
  aiProvider?: string | null;
};
```

## 7. Files Structure

```
src/app/(main)/post/page.tsx        (Main post/community feed page)
src/lib/ai-author.ts                (AI author branding data)
src/lib/recipes.ts                  (Recipe types)
src/types/recipes.ts                (RecipeListResponse type)
```

## 8. Dependencies
- `swr` - Data fetching library
- `next/image` - Image optimization
- `react` - UI framework
- `next/font/google` - Thai font (Anuphan)
- `@/lib/ai-author` - AI author branding
- `@/lib/recipes` - Recipe types
- `next` - Framework

## 9. UI Design Specifications

### 9.1 Color Scheme
- Background: `#F5EFD7` (warm cream)
- Primary: `#71B254` (green)
- Accent: `#F1C40F` (gold for stars)
- Text: `#5A9240` (dark green for tags)
- Card background: `white`

### 9.2 Typography
- Thai font: `Anuphan` (weights 300-700)
- Subsets: `["thai", "latin"]`
- Display: `swap`

### 9.3 Card Layout
- Vertical flex layout with 8-unit gap
- Image takes 350-380px width on desktop
- Responsive: stack vertically on mobile
- Rounded corners, shadow, border

## 10. Assumptions and Constraints
- Feed is client-side rendered (React client component)
- Pagination is page-based (not infinite scroll)
- 10 recipes per page is fixed
- Favorite state is synced from `/api/favorites` on load
- Store posts are identified by `storePosts` array
- AI author data comes from `ai-author.ts` configuration
- Optimistic UI requires API to be responsive (timeouts on failure)
- The system uses `useSWR` for data fetching, not React Query

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
