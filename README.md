# Password Vault App

## Overview
This Next.js application lets users register, authenticate, and securely store platform credentials. Each entry is encrypted client-side with the account password, ensuring users can read only their own vault. The interface offers light/dark themes and Turkish/English localization that respect browser preferences while persisting user overrides in `localStorage`.

## Key Features
- Email/password signup and login with bcrypt-hashed credentials stored in `data/db.json`.
- Encrypted credential storage using the logged-in user's password-derived key.
- Responsive dashboard with mobile slide-in navigation, confirmation prompts, and copy-to-clipboard tooling.
- Theme and language toggles with automatic preference detection and persistent overrides.

## Tech Stack
- **Framework**: Next.js 14 (App Router, React 18, TypeScript).
- **Styling**: Tailwind CSS with dark mode classes.
- **State & Context**: Custom React contexts for authentication, preferences, and vault data.
- **Validation & Utilities**: Zod for schema validation, `uuid` for identifiers.
- **Testing**: Vitest unit and integration tests under `tests/`.

## Project Structure
- `app/`: Route handlers, layouts, and page-level components.
- `components/`: Reusable UI elements (forms, drawers, tables).
- `contexts/`: React context providers for auth, preferences, and secure storage.
- `lib/`: Encryption helpers, language utilities, and server actions.
- `data/db.json`: JSON persistence layer for users and credential entries.
- `locales/`: English (`en`) and Turkish (`tr`) translations.

## Getting Started
1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env.local` if you need custom secrets (default configuration works out of the box).
3. Run the development server: `npm run dev` and open `http://localhost:3000`.
4. Build for production with `npm run build`; start with `npm run start`.

## Testing
- Execute the full Vitest suite with `npm run test`. Tests cover encryption utilities, auth flows, and UI behaviors; add scenarios alongside existing specs in `tests/`.

## Data & Maintenance
- The JSON datastore lives in `data/db.json`. Keep the file committed for demo data but avoid storing real secrets.
- Ensure `.env.local` remains untracked (see `.gitignore`).
- Before pushing changes, run `npm run lint` and `npm run test` to catch regressions early.

