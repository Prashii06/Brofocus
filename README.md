# BroFocus

BroFocus is an AI-powered productivity platform designed to help users manage tasks, focus sessions, Google Workspace context, and scheduling from a single dashboard. It combines a React + Vite frontend with an Express + TypeScript backend, an AI assistant layer, and Google OAuth integrations for Gmail and Calendar.

## Product Highlights

- Dashboard overview for productivity metrics and daily flow
- Kanban task management with status tracking
- AI assistant and public landing-page chatbot
- Schedule planner with time blocks and smart planning
- Google Workspace integration for Gmail and Calendar
- Engagement workflows for morning kickoffs and evening wraps
- Analytics and progress tracking
- Profile and settings experience
- Contact form support via SMTP

## Tech Stack

Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Query
- Zustand
- Recharts

Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL / Supabase-ready schema
- Google Gemini API integration
- Google OAuth 2.0
- JWT auth + refresh tokens
- AES-based encrypted token storage

## Repository Structure

```text
BroFocus/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── .env.example (add locally if needed)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── index.html
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL database
- Google Cloud project with OAuth credentials
- Gemini API key
- SMTP credentials for contact mail delivery

## Environment Setup

Create environment files locally for both apps.

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@host:5432/brofocus"
DIRECT_URL="postgresql://user:password@host:5432/brofocus"
PORT=3001
FRONTEND_URL="http://localhost:5173"
JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/v1/integrations/callback"
GEMINI_API_KEY="your_gemini_key"
ADMIN_EMAILS="admin@example.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="BroFocus <your_email@gmail.com>"
ENCRYPTION_KEY="32-byte-key-here"
NODE_ENV="development"
```

### Frontend (.env)

```env
VITE_API_URL="http://localhost:3001/api/v1"
```

## Install & Run

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Initialize Prisma

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### 3. Start the apps

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Production Build Verification

This project currently builds successfully in the workspace:

```bash
cd backend && npm run build
cd frontend && npm run build
```

The latest check passed successfully in this workspace.

## Notes on Current Status

BroFocus is now closer to a working MVP, with:
- stable backend build
- working frontend build
- real Google OAuth / token persistence flow
- per-provider integration tracking
- profile avatar persistence
- live analytics and schedule integration data contracts aligned

However, it is not yet a fully production-hardened product and still has a few remaining operational concerns.

## Known Remaining Issues

- No automated test suite yet
- No deployment configuration or production startup documentation for Docker / PM2 / Vercel / Render
- Some large frontend bundles may benefit from code-splitting
- OAuth environment settings are still sensitive and must be kept consistent across frontend/backend domains
- Chat history is still runtime-memory based rather than fully persisted in a database
- Notification volume can still be noisy without a stronger dedupe / priority system
- The app is functionally working but still needs a final polish pass on UX consistency across all screens

## License

This project is for internal product development and is not yet released as a public OSS package.
