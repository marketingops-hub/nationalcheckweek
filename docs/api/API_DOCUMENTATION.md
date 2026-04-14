# 📚 API Documentation

**Last Updated:** March 30, 2026  
**API Version:** 1.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URLs](#base-urls)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [API Endpoints](#api-endpoints)
8. [Code Examples](#code-examples)
9. [Testing](#testing)

---

## Overview

The 2026 Schools API provides programmatic access to the National Check-in Week platform. The API follows RESTful principles and returns JSON responses.

**Key Features:**
- RESTful architecture
- JWT-based authentication
- Consistent error responses
- Edge runtime for low latency
- ISR caching for performance

**OpenAPI Specification:**
- Full OpenAPI 3.0 spec: [`openapi.yaml`](./openapi.yaml)
- Interactive docs: Use [Swagger UI](https://swagger.io/tools/swagger-ui/) or [Redoc](https://redocly.com/)

---

## Authentication

### Admin Endpoints

All `/api/admin/*` endpoints require authentication using a Bearer token in the `Authorization` header.

**Header Format:**
```
Authorization: Bearer <your-jwt-token>
```

**Getting a Token:**

1. **Login via Supabase:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'your-password'
});

const token = data.session?.access_token;
```

2. **Use Token in Requests:**
```typescript
const response = await fetch('/api/admin/homepage-blocks', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Public Endpoints

Public endpoints (e.g., `/api/home-page`, `/api/contact`) do not require authentication.

---

## Base URLs

| Environment | Base URL |
|-------------|----------|
| **Production** | `https://schoolswellbeing.com.au/api` |
| **Development** | `http://localhost:3000/api` |

---

## Response Format

### Success Response

All successful responses return JSON with appropriate HTTP status codes:

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-03-30T18:22:00Z",
    "version": "1.0.0"
  }
}
```

**Common Status Codes:**
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content to return

### Error Response

All error responses follow a consistent format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

**Common Status Codes:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Error Handling

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input data |
| `DUPLICATE_ENTRY` | Resource already exists |
| `SERVER_ERROR` | Internal server error |

### Example Error Response

```json
{
  "error": "Block not found",
  "code": "NOT_FOUND",
  "details": {
    "blockId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Handling Errors in Code

```typescript
try {
  const response = await fetch('/api/admin/homepage-blocks/invalid-id', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error(`Error ${error.code}: ${error.error}`);
    // Handle specific error codes
    if (error.code === 'NOT_FOUND') {
      // Show "not found" message
    }
  }
  
  const data = await response.json();
} catch (err) {
  console.error('Network error:', err);
}
```

---

## Rate Limiting

**Current Status:** Not implemented

**Recommended Limits:**
- Public endpoints: 100 requests/minute per IP
- Admin endpoints: 1000 requests/minute per user
- Upload endpoints: 10 requests/minute per user

**Future Implementation:**
Rate limiting headers will be included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1648656000
```

---

## API Endpoints

### Public Endpoints

#### Get Homepage Data
```
GET /api/home-page
```

Returns all homepage settings including hero, logos, CTA, and footer.

**Response:**
```json
{
  "hero": {
    "event_badge_emoji": "📅",
    "event_badge_date": "25 May 2026",
    "heading_line1": "Student Wellbeing:",
    "heading_line2": "A National Priority.",
    ...
  },
  "logos": [...],
  "cta": {...},
  "footer": {...}
}
```

#### Submit Contact Form
```
POST /api/contact
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "message": "I'd like to learn more about the program."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact form submitted successfully"
}
```

---

### Admin Endpoints - Homepage Blocks

#### List All Blocks
```
GET /api/admin/homepage-blocks
Authorization: Bearer <token>
```

Returns all homepage blocks ordered by `display_order`.

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "block_type": "hero",
    "content": {...},
    "display_order": 1,
    "is_visible": true,
    "created_at": "2026-03-01T00:00:00Z",
    "updated_at": "2026-03-30T18:00:00Z"
  },
  ...
]
```

#### Get Block by ID
```
GET /api/admin/homepage-blocks/{id}
Authorization: Bearer <token>
```

**Parameters:**
- `id` (path, required) - Block UUID

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "block_type": "hero",
  "content": {
    "heading": "Welcome to NCIW",
    "subheading": "Student wellbeing matters",
    ...
  },
  "display_order": 1,
  "is_visible": true
}
```

#### Create Block
```
POST /api/admin/homepage-blocks
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "block_type": "cta",
  "content": {
    "heading": "Join the Movement",
    "description": "Register your school today",
    "buttonText": "Register Now",
    "buttonLink": "/register"
  },
  "display_order": 10,
  "is_visible": true
}
```

**Response:** `201 Created`
```json
{
  "id": "new-uuid",
  "block_type": "cta",
  "content": {...},
  "display_order": 10,
  "is_visible": true,
  "created_at": "2026-03-30T18:22:00Z",
  "updated_at": "2026-03-30T18:22:00Z"
}
```

#### Update Block
```
PATCH /api/admin/homepage-blocks/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": {
    "heading": "Updated Heading"
  },
  "is_visible": false
}
```

**Response:** `200 OK`

#### Delete Block
```
DELETE /api/admin/homepage-blocks/{id}
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

---

### Admin Endpoints - Pages

#### List All Pages
```
GET /api/admin/cms/pages
Authorization: Bearer <token>
```

#### Create Page
```
POST /api/admin/cms/pages
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "About Us",
  "slug": "about",
  "content": "<h1>About Us</h1><p>Content here...</p>",
  "meta_title": "About Us | NCIW",
  "meta_description": "Learn about National Check-in Week",
  "is_published": true
}
```

#### Update Page
```
PATCH /api/admin/cms/pages/{id}
Authorization: Bearer <token>
```

#### Delete Page
```
DELETE /api/admin/cms/pages/{id}
Authorization: Bearer <token>
```

---

### Admin Endpoints - Events

#### List All Events
```
GET /api/admin/events
Authorization: Bearer <token>
```

#### Create Event
```
POST /api/admin/events
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "National Check-in Week 2026",
  "description": "Annual student wellbeing event",
  "start_date": "2026-05-25T00:00:00+10:00",
  "end_date": "2026-05-29T23:59:59+10:00",
  "location": "Australia-wide",
  "is_virtual": true,
  "registration_url": "https://example.com/register",
  "is_published": true
}
```

---

### Admin Endpoints - Ambassadors

#### List All Ambassadors
```
GET /api/admin/ambassadors
Authorization: Bearer <token>
```

#### Create Ambassador
```
POST /api/admin/ambassadors
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Dr. Jane Smith",
  "role": "Educational Psychologist",
  "bio": "Leading expert in student wellbeing...",
  "image_url": "https://example.com/images/jane-smith.jpg",
  "category_id": "uuid",
  "is_active": true,
  "display_order": 1
}
```

---

### Admin Endpoints - Settings

#### Get Global Settings
```
GET /api/admin/homepage-global-settings
Authorization: Bearer <token>
```

**Response:**
```json
{
  "global_colors": {
    "primaryButton": "#29B8E8",
    "primaryButtonText": "#FFFFFF",
    "secondaryButton": "rgba(255,255,255,0.2)",
    "secondaryButtonText": "#FFFFFF",
    "heading": "#0f0e1a",
    "subheading": "#4a4768",
    "ctaBackground": "#0B1D35",
    "ctaText": "#FFFFFF",
    "ctaPrimaryButton": "#29B8E8"
  }
}
```

#### Update Global Settings
```
PATCH /api/admin/homepage-global-settings
Authorization: Bearer <token>
```

---

### Admin Endpoints - File Upload

#### Upload File
```
POST /api/admin/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (required) - File to upload
- `folder` (optional) - Destination folder

**Response:**
```json
{
  "url": "https://storage.example.com/uploads/image.jpg"
}
```

---

## Code Examples

### JavaScript/TypeScript

#### Fetch Homepage Blocks
```typescript
async function getHomepageBlocks(token: string) {
  const response = await fetch('/api/admin/homepage-blocks', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
}
```

#### Create Homepage Block
```typescript
async function createBlock(token: string, blockData: any) {
  const response = await fetch('/api/admin/homepage-blocks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(blockData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
}
```

#### Update Block
```typescript
async function updateBlock(token: string, id: string, updates: any) {
  const response = await fetch(`/api/admin/homepage-blocks/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
}
```

#### Upload File
```typescript
async function uploadFile(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'images');
  
  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const { url } = await response.json();
  return url;
}
```

### Using API Cache (Phase 3)

```typescript
import apiCache, { CacheTTL } from '@/lib/api-cache';

async function getCachedBlocks(token: string) {
  // Check cache first
  const cached = apiCache.get('homepage-blocks');
  if (cached) return cached;
  
  // Fetch from API
  const response = await fetch('/api/admin/homepage-blocks', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  // Cache for 5 minutes
  apiCache.set('homepage-blocks', data, CacheTTL.MEDIUM);
  
  return data;
}
```

### Using Request Batching (Phase 3)

```typescript
import { batchGet } from '@/lib/api-batch';

async function loadDashboardData() {
  // Batch multiple requests
  const [blocks, pages, events] = await batchGet([
    '/api/admin/homepage-blocks',
    '/api/admin/cms/pages',
    '/api/admin/events'
  ]);
  
  return { blocks, pages, events };
}
```

---

## Testing

### Manual Testing with cURL

#### Get Homepage Data (Public)
```bash
curl -X GET https://schoolswellbeing.com.au/api/home-page
```

#### List Blocks (Admin)
```bash
curl -X GET https://schoolswellbeing.com.au/api/admin/homepage-blocks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Block (Admin)
```bash
curl -X POST https://schoolswellbeing.com.au/api/admin/homepage-blocks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "block_type": "cta",
    "content": {"heading": "Test"},
    "display_order": 10,
    "is_visible": true
  }'
```

### Testing with Postman

1. **Import OpenAPI Spec:**
   - Open Postman
   - Import → Upload `openapi.yaml`
   - All endpoints will be auto-generated

2. **Set Environment Variables:**
   - `baseUrl`: `https://schoolswellbeing.com.au/api`
   - `token`: Your JWT token

3. **Test Endpoints:**
   - Select endpoint from collection
   - Add `{{token}}` to Authorization header
   - Send request

### Automated Testing

See [`src/components/admin/forms/__tests__/`](../../src/components/admin/forms/__tests__/) for test examples.

---

## Best Practices

### 1. Always Handle Errors
```typescript
try {
  const data = await fetch('/api/admin/homepage-blocks', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!data.ok) {
    const error = await data.json();
    // Handle error appropriately
    console.error(error);
  }
} catch (err) {
  // Handle network errors
  console.error('Network error:', err);
}
```

### 2. Use Type Safety
```typescript
interface HomepageBlock {
  id: string;
  block_type: string;
  content: Record<string, any>;
  display_order: number;
  is_visible: boolean;
}

const blocks: HomepageBlock[] = await getBlocks(token);
```

### 3. Implement Caching
```typescript
// Use the built-in API cache (Phase 3)
import apiCache from '@/lib/api-cache';

// Cache frequently accessed data
const data = apiCache.get('key') || await fetchData();
```

### 4. Batch Requests
```typescript
// Use request batching (Phase 3)
import { batchGet } from '@/lib/api-batch';

// Instead of 3 separate requests
const results = await batchGet([url1, url2, url3]);
```

### 5. Validate Input
```typescript
// Use Zod or similar for validation
import { z } from 'zod';

const blockSchema = z.object({
  block_type: z.enum(['hero', 'cta', 'welcome']),
  content: z.record(z.any()),
  display_order: z.number().int().positive(),
  is_visible: z.boolean()
});

// Validate before sending
const validated = blockSchema.parse(blockData);
```

---

## Support

**Questions or Issues?**
- Check the [OpenAPI spec](./openapi.yaml) for detailed endpoint information
- Review [code examples](#code-examples) above
- Contact: support@schoolswellbeing.com.au

---

**Last Updated:** March 30, 2026  
**Version:** 1.0.0
