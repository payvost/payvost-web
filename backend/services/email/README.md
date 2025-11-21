# Email Service

Batch email sending service for notifications and marketing emails.

## Features

- Single email sending
- Batch email sending (up to 100 emails per batch)
- SMTP configuration via environment variables
- Health check endpoint
- Error handling and reporting

## Endpoints

### `GET /health`
Health check endpoint.

**Response:** `200 OK`

### `POST /single`
Send a single email.

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to Payvost",
  "html": "<h1>Welcome!</h1><p>Thank you for joining.</p>",
  "text": "Welcome! Thank you for joining." // optional
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "messageId": "message-id-here"
}
```

### `POST /batch`
Send multiple emails in a batch.

**Request Body:**
```json
{
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Welcome",
      "html": "<h1>Welcome!</h1>"
    },
    {
      "to": "user2@example.com",
      "subject": "Welcome",
      "html": "<h1>Welcome!</h1>"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "email": "user1@example.com",
      "status": "fulfilled",
      "messageId": "msg-123"
    },
    {
      "email": "user2@example.com",
      "status": "fulfilled",
      "messageId": "msg-124"
    }
  ]
}
```

## Environment Variables

```env
# Port for the email service
EMAIL_SERVICE_PORT=3006

# SMTP Configuration (Mailgun)
MAILGUN_SMTP_HOST=smtp.mailgun.org
MAILGUN_SMTP_PORT=587
MAILGUN_SMTP_LOGIN=your-smtp-login
MAILGUN_SMTP_PASSWORD=your-smtp-password
MAILGUN_FROM_EMAIL=no-reply@payvost.com

# Node environment
NODE_ENV=development
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Deployment

### Railway
```bash
cd backend/services/email
railway init
railway up
```

### Render
Add to `render.yaml`:
```yaml
services:
  - type: web
    name: payvost-email
    env: node
    buildCommand: cd backend/services/email && npm install && npm run build
    startCommand: cd backend/services/email && npm start
    envVars:
      - key: EMAIL_SERVICE_PORT
        value: 3006
      - key: MAILGUN_SMTP_HOST
        value: smtp.mailgun.org
      - key: MAILGUN_SMTP_PORT
        value: 587
```

## Architecture

1. Receives email request (single or batch)
2. Validates required fields
3. Sends emails via SMTP (Mailgun)
4. Returns results with success/failure status
5. Handles errors gracefully

## Dependencies

- **express** - Web server framework
- **nodemailer** - Email sending library
- **cors** - CORS middleware

