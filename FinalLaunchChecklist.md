# Final Launch Checklist - DebtStrategist.AI v1.0

This checklist is designed for manual verification before the final launch.

## 1. Environment Variables (.env)
- [ ] `DATABASE_URL` is set to a valid PostgreSQL connection string (e.g., Neon, Supabase).
- [ ] `GEMINI_API_KEY` is set to a valid Google Gemini API key.
- [ ] `GOOGLE_CLIENT_ID` is set to a valid Google OAuth Client ID.
- [ ] `GOOGLE_CLIENT_SECRET` is set to a valid Google OAuth Client Secret.
- [ ] `SESSION_SECRET` is set to a strong, random string (at least 32 characters).
- [ ] `APP_URL` is set to the correct application URL (e.g., `http://localhost:3000` for local dev).

## 2. Database Synchronization
- [ ] Run `npx drizzle-kit push` to ensure the PostgreSQL schema is fully synchronized.
- [ ] Verify that all tables (`users`, `financialProfiles`, `loans`, `expenses`, `households`, `householdMembers`, `chatHistory`, `goals`, `sinkingFunds`, `legacyVault`) exist in the database.

## 3. Authentication Flow
- [ ] Click "SECURE LOGIN WITH GOOGLE" on the landing page.
- [ ] Verify that the Google OAuth popup opens correctly.
- [ ] Complete the login process and verify that you are redirected to the dashboard.
- [ ] Verify that the "LOGOUT" button works and redirects back to the landing page.

## 4. Onboarding & Data Sanitization
- [ ] Enter a new loan with an impossible interest rate (e.g., 500%). Verify that the `dataSanitizer` provides a gentle correction.
- [ ] Enter a negative amount for income or EMI. Verify that the `dataSanitizer` corrects it to a positive value.
- [ ] Complete the onboarding flow and verify that the data is saved correctly.

## 5. Dashboard & AI Features
- [ ] Verify that the "Freedom Clock" is ticking and calculating interest accurately.
- [ ] Interact with the AI Concierge. Verify that it provides context-aware messages based on the active tab.
- [ ] Check the "Strategy Visualizer" on different screen sizes (mobile, tablet, desktop) to ensure it is responsive.
- [ ] Verify that the "Portfolio Drift Monitor" correctly identifies drift and provides actionable nudges.

## 6. PWA & Offline Support
- [ ] Open the application in Chrome and verify that the "Install App" prompt appears (if applicable).
- [ ] Disconnect from the internet and verify that the application still loads basic UI elements and cached data.

## 7. The "One-Command" Launch Script
Run the following command to start the application from scratch:

```bash
npm install && npx drizzle-kit push && npm run dev
```

If all checks pass, DebtStrategist.AI is ready for launch!
