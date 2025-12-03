# Live Chat Infrastructure Implementation

## Overview
This document describes the complete implementation of the sophisticated live chat infrastructure with real-time WebSocket communication, AI-powered responses using OpenAI, and seamless support panel integration.

## Architecture

### Components

1. **WebSocket Server** (`backend/services/chat/websocket-server.ts`)
   - Real-time bidirectional communication
   - Room-based messaging (user rooms, session rooms)
   - Firebase token authentication
   - Typing indicators and read receipts
   - AI response triggering

2. **AI Orchestrator** (`backend/services/chat/ai-orchestrator.ts`)
   - OpenAI GPT-4o-mini integration
   - Context-aware responses
   - Intent classification and sentiment analysis
   - Auto-escalation to human agents
   - Automatic ticket creation

3. **Enhanced Chat Component** (`src/components/enhanced-live-chat.tsx`)
   - Beautiful floating widget UI
   - Real-time message updates
   - Typing indicators
   - AI processing indicators
   - Minimize/maximize functionality

4. **Chat Service** (`src/services/chatService.ts`)
   - WebSocket connection management
   - Session creation/retrieval
   - Auto-reconnection logic

## Database Schema Updates

### ChatSession Model
- Added `metadata` JSON field for escalation info, AI analysis, etc.

### ChatMessage Model
- Added `isRead` Boolean field for read receipts
- Added `metadata` JSON field for file attachments, AI analysis
- Added index on `senderId`

## API Endpoints

### User Endpoints
- `POST /api/support/chat/sessions/user` - Create chat session for authenticated user
- `GET /api/support/chat/sessions/active` - Get active chat session for user

### Support Team Endpoints (existing)
- `GET /api/support/chat/sessions` - List chat sessions
- `GET /api/support/chat/queue` - Get waiting sessions
- `GET /api/support/chat/sessions/:id` - Get session by ID
- `POST /api/support/chat/sessions/:id/assign` - Assign to agent
- `POST /api/support/chat/sessions/:id/end` - End session
- `POST /api/support/chat/sessions/:id/messages` - Add message

## WebSocket Events

### Client → Server
- `join:session` - Join a chat session
- `message:send` - Send a message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `message:read` - Mark message as read

### Server → Client
- `session:history` - Chat history
- `message:new` - New message received
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `user:joined` - User joined session
- `user:left` - User left session
- `ai:processing` - AI is processing
- `ai:complete` - AI processing complete
- `ai:error` - AI processing error
- `error` - General error

## Environment Variables

Add to `.env`:
```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# WebSocket URL (frontend)
NEXT_PUBLIC_WS_URL=http://localhost:3001
# or in production:
NEXT_PUBLIC_WS_URL=https://api.payvost.com
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install socket.io socket.io-client openai
cd backend && npm install socket.io @types/socket.io
```

### 2. Database Migration
```bash
cd backend
npx prisma migrate dev --name add_chat_enhancements --schema=prisma/schema.prisma
# or
npx prisma db push --schema=prisma/schema.prisma
```

### 3. Configure Environment
Add `OPENAI_API_KEY` to your `.env` file.

### 4. Start Services
```bash
npm run dev
```

## Features

### User Features
- Real-time chat with AI assistant
- Persistent chat history
- Typing indicators
- Connection status
- Beautiful, modern UI
- Minimize/maximize widget

### AI Features
- Context-aware responses
- User account information
- Recent tickets integration
- Intent classification
- Sentiment analysis
- Auto-escalation to human agents
- Automatic ticket creation

### Support Panel Features
- Real-time session monitoring
- Live message updates
- Agent assignment
- Customer context
- Chat analytics

## AI Escalation Logic

The AI automatically escalates to a human agent when:
1. User explicitly requests to speak with a human
2. Negative sentiment detected with complex issues
3. Multiple unresolved tickets exist
4. High-priority keywords detected

On escalation:
- Support ticket is automatically created
- Chat session status changes to WAITING
- Support team is notified
- Context is preserved

## Future Enhancements

1. File attachments support
2. Rich message formatting (markdown, links)
3. Emoji picker
4. Chat analytics dashboard
5. Browser notifications
6. Email notifications for missed chats
7. Multi-language support
8. Chat transcripts export

## Testing

### Manual Testing
1. Open support page as user
2. Start chat session
3. Send messages and verify real-time updates
4. Test AI responses
5. Test escalation flow
6. Test support panel integration

### WebSocket Testing
Use a WebSocket client to test:
```javascript
const socket = io('http://localhost:3001', {
  path: '/socket.io/chat',
  auth: { token: 'your_firebase_token' }
});

socket.on('connect', () => {
  socket.emit('join:session', 'session_id');
});
```

## Troubleshooting

### WebSocket Connection Issues
- Check CORS configuration
- Verify Firebase token
- Check WebSocket path (`/socket.io/chat`)
- Verify server is running on correct port

### AI Not Responding
- Check OpenAI API key
- Verify API key has credits
- Check server logs for errors
- Verify AI orchestrator is initialized

### Database Issues
- Run migrations: `npx prisma migrate dev`
- Check Prisma schema matches database
- Verify database connection

## Notes

- The old `LiveChat` component is kept for backward compatibility
- WebSocket server runs on the same port as the HTTP server
- AI responses are saved with `senderId: 'AI_ASSISTANT'`
- Chat sessions persist across page refreshes
- Support panel still uses polling but can be upgraded to WebSocket

