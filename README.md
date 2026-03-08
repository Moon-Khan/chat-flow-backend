# Chat Flow Backend

Express + MongoDB backend for the Chat Flow app, including JWT auth, chat/stories APIs, uploads, and Socket.IO real-time messaging.

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Socket.IO
- Multer (file uploads)
- MailerSend (email verification in production)

## Prerequisites

- Node.js 18+ (recommended)
- npm
- MongoDB instance

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in the backend root:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chat-flow
JWT_SECRET=your_jwt_secret
JWT_EXPIRES=7d
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
MAILERSEND_API_KEY=your_mailersend_api_key
EMAIL_FROM=no-reply@example.com
EMAIL_FROM_NAME=ChatFlow Support
```

3. Start development server:

```bash
npm run dev
```

Server runs on `http://localhost:5000` by default.

## Available Scripts

- `npm run dev` - Start server with nodemon

## Base URLs

- Health check: `GET /`
- Static uploads: `/uploads/*`
- API prefix: `/api`

## API Route Summary

### Users (`/api/users`)

- `POST /register`
- `POST /login`
- `POST /verify-email`
- `POST /resend-code`
- `GET /` (auth required)
- `PUT /profile` (auth required)
- `DELETE /delete-account` (auth required)

### Messages (`/api/messages`)

- `GET /conversations` (auth required)
- `GET /room/:room` (auth required)
- `GET /chat/:chatId` (auth required)
- `GET /private/:userId` (auth required)
- `POST /groups` (auth required)
- `POST /groups/:chatId/leave` (auth required)
- `PATCH /conversations/pin` (auth required)
- `DELETE /conversations` (auth required)
- `POST /upload` (auth required, multipart `files[]`, up to 10 files)
- `POST /:messageId/delete` (auth required)

### Stories (`/api/stories`)

- `POST /` (auth required, multipart `files[]`, up to 10 files)
- `GET /` (auth required)
- `POST /:id/view` (auth required)
- `DELETE /:id` (auth required)

## Socket.IO

Socket server is mounted on the same backend URL and expects auth token in `socket.auth.token`.

Main events in `src/sockets/socketHandler.js`:

- Client emits: `join_room`, `send_message`, `delete_message`
- Server emits: `online_users` and message/delete updates

## Notes

- CORS is controlled by `FRONTEND_ORIGIN` (falls back to `*` if not set).
- In non-production mode, email sending is skipped by design in `src/utils/mailer.js`.
