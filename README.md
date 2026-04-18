# DebtStrategist.AI

DebtStrategist.AI is a production-ready financial engine designed to help users calculate their "Freedom Date" and provide actionable debt repayment strategies.

## Project Overview

- **Frontend:** React + Vite + TypeScript + Zustand + Framer Motion
- **Backend:** Node.js + Express + TypeScript + Drizzle ORM + Supabase (PostgreSQL)
- **Features:** Google OAuth, AI-driven insights, real-time feedback, developer debug panel.

## Setup Instructions

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set up environment variables:**
    Create a `.env` file based on `.env.example` and fill in the required values.
3.  **Run the development server:**
    ```bash
    npm run dev
    ```

## Environment Variables

- `DATABASE_URL`: Supabase PostgreSQL URL
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- `SESSION_SECRET`: Secret for session cookies
- `GEMINI_API_KEY`: API key for Gemini AI
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: 'development' or 'production'

## Project Structure

- `/src/server`: Backend logic (controllers, routes, services, middleware, config)
- `/src/client`: Frontend logic (components, pages, hooks, store)
- `/src/shared`: Shared types and Zod schemas
- `/scripts`: Utility scripts
