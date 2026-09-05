# SRS - Search Image System

## 1. Introduction

### 1.1 Purpose
This document specifies the Software Requirements Specification for the Search Image System of the Kinyrak Ingredients application. The search image system allows users to search for food-related images from Wikimedia Commons to use as recipe cover images or references.

### 1.2 Scope
The search image system covers:
- Searching images by keyword query
- Fetching images from Wikimedia Commons API
- Returning image URLs in JSON format
- Fallback image handling

### 1.3 References
- Wikimedia Commons API
- Next.js App Router API routes

## 2. System Overview

### 2.1 Architecture
The search image system is a simple API route that queries the Wikimedia Commons MediaWiki API to find images related to a food query. The system returns image URLs that can be used in the frontend for recipe images or search results.

### 2.2 Actors
- **End User**: Triggers image search
- **System**: Queries Wikimedia Commons and returns results

## 3. Functional Requirements

### 3.1 Image Search

**ID**: SEARCHIMAGE-001  
**Priority**: High

**Description**: The system shall search for images on Wikimedia Commons by keyword.

**Endpoint**: `GET /api/search-image?query={keyword}`

**Query Parameters**:
- `query`: Search keyword (default: "thai food" if not provided)

**Flow**:
1. Extract `query` from URL search params (default: "thai food")
2. Construct Wikimedia Commons API URL:
   ```
   https://commons.wikimedia.org/w/api.php?action=query&generator=search
     &gsrsearch={encoded_query}
     &gsrnamespace=6
     &gsrlimit=4
     &prop=imageinfo
     &iiprop=url
     &format=json
     &origin=*
   ```
3. Parameters explanation:
   - `action=query`: Query the MediaWiki API
   - `generator=search`: Use search to generate pages
   - `gsrsearch={query}`: Search keyword
   - `gsrnamespace=6`: File namespace (images only)
   - `gsrlimit=4`: Return 4 results
   - `prop=imageinfo`: Include image information
   - `iiprop=url`: Include image URL
   - `origin=*`: Allow cross-origin requests
4. Fetch the API URL
5. Parse JSON response
6. Extract image URLs from `data.query.pages`
7. Filter out null/undefined values
8. Return `{ images: string[] }`

**Error Handling**:
- If fetch fails, return `{ error: "Failed to fetch images" }` with status 500

### 3.2 Response Format

**ID**: SEARCHIMAGE-RESPONSE-001  
**Priority**: High

**Description**: The system shall return image URLs in a standardized format.

**Success Response**:
```json
{
  "images": [
    "https://upload.wikimedia.org/...",
    "https://upload.wikimedia.org/...",
    ...
  ]
}
```

**Error Response**:
```json
{
  "error": "Failed to fetch images"
}
```

## 4. Non-Functional Requirements

### 4.1 Performance
- Simple GET request to external API
- Limited to 4 results per query
- Fast response (Wikimedia API is generally fast)

### 4.2 Reliability
- External API dependency (Wikimedia Commons)
- Error handling for network failures
- No caching implemented

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search-image?query={query}` | GET | Search images on Wikimedia Commons |

## 6. Files Structure

```
src/app/api/search-image/route.ts
```

## 7. Dependencies
- `next` - Framework
- Native `fetch` - HTTP client

## 8. Assumptions and Constraints
- Requires internet connectivity to access Wikimedia Commons
- Returns maximum 4 images per query
- Only returns images from Wikimedia Commons (namespace 6)
- No authentication required for Wikimedia API
- Images are returned as public URLs
- No caching of results
- Default query is "thai food" if no query provided

---
*Document Version: 1.0*  
*Date: 2026-09-05*  
*Project: Kinyrak Ingredients*
