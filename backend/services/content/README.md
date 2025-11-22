# Content Management Service

Content management service for blog posts, press releases, documentation, and knowledge base articles.

## Features

- ✅ CRUD operations for all content types
- ✅ Version history and restoration
- ✅ Slug generation and uniqueness
- ✅ SEO metadata management
- ✅ Publishing workflow (Draft → Review → Published)
- ✅ Content scheduling
- ✅ Category and tag management
- ✅ Media attachments
- ✅ Access control (author, co-author, editor)

## Database Schema

The service uses the following Prisma models:
- `Content` - Main content storage
- `ContentVersion` - Version history
- `ContentComment` - Comments (future)
- `ContentMedia` - Media attachments

## API Endpoints

### List Content
```
GET /api/content
Query Parameters:
  - contentType: BLOG | PRESS_RELEASE | DOCUMENTATION | KNOWLEDGE_BASE
  - status: DRAFT | REVIEW | PUBLISHED | ARCHIVED
  - authorId: Filter by author
  - category: Filter by category
  - search: Search in title, excerpt, content
  - limit: Number of results (default: 50)
  - offset: Pagination offset (default: 0)
```

### Get Content Statistics
```
GET /api/content/stats
Query Parameters:
  - authorId: Optional, filter by author (defaults to current user)
```

### Get Content by ID
```
GET /api/content/:id
```

### Get Content by Slug (Public)
```
GET /api/content/slug/:slug
No authentication required (for public content)
```

### Create Content
```
POST /api/content
Body:
{
  "title": "Content Title",
  "contentType": "BLOG",
  "content": "<p>HTML content</p>",
  "excerpt": "Brief description",
  "category": "Technology",
  "tags": ["tag1", "tag2"],
  "metaTitle": "SEO Title",
  "metaDescription": "SEO Description",
  "status": "DRAFT"
}
```

### Update Content
```
PATCH /api/content/:id
Body: (any fields to update)
```

### Publish Content
```
POST /api/content/:id/publish
```

### Unpublish Content
```
POST /api/content/:id/unpublish
```

### Delete Content
```
DELETE /api/content/:id
```

### Get Version History
```
GET /api/content/:id/versions
```

### Restore Version
```
POST /api/content/:id/restore/:version
```

## Content Types

- `BLOG` - Blog posts and articles
- `PRESS_RELEASE` - Press releases
- `DOCUMENTATION` - Technical documentation
- `KNOWLEDGE_BASE` - Help articles and FAQs

## Content Status

- `DRAFT` - Work in progress
- `REVIEW` - Awaiting review
- `PUBLISHED` - Live on site
- `ARCHIVED` - Archived content
- `SCHEDULED` - Scheduled for future publication

## Permissions

- **Author**: Can create, edit, publish, and delete their own content
- **Co-Author**: Can edit content they're assigned to
- **Editor/Admin**: Can edit all content

## Slug Generation

Slugs are automatically generated from titles:
- Lowercase
- Special characters removed
- Spaces replaced with hyphens
- Unique slugs ensured (appends number if needed)

Example: "How to Send Money" → "how-to-send-money"

## Version History

Every time content is updated, a new version is created:
- Version number increments automatically
- Previous versions are preserved
- Can restore to any previous version
- Version history includes author and timestamp

## Integration

The service is registered in the API Gateway at `/api/content`.

All endpoints require Firebase authentication except:
- `GET /api/content/slug/:slug` (for public content)

## Error Handling

- `400` - Validation error or invalid data
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Content not found
- `500` - Internal server error

## Example Usage

```typescript
// Create a blog post
const response = await fetch('/api/content', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Getting Started with Payvost',
    contentType: 'BLOG',
    content: '<p>Welcome to Payvost...</p>',
    excerpt: 'Learn how to get started',
    category: 'Getting Started',
    tags: ['tutorial', 'beginner'],
    status: 'DRAFT',
  }),
});

// Publish content
await fetch(`/api/content/${contentId}/publish`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
});
```

