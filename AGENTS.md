# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Next.js routes; `/dashboard` is the authenticated vault view, while `(auth)` contains login and register pages.
- `components/` stores reusable UI (buttons, toggles) and layout shells.
- `contexts/` provides React context for preferences and authenticated session state.
- `lib/` contains server/client utilities: JSON persistence (`db.ts`), auth helpers, validators, and browser crypto helpers.
- `locales/` keeps the bilingual copy; `data/db.json` is the JSON datastore—treat it as application state, not hand-edited source.

## Build, Test, and Development Commands
- `npm install` – install all dependencies (run once after cloning or dependency changes).
- `npm run dev` – start the Next.js dev server at `http://localhost:3000`; hot reload is enabled.
- `npm run build` – create an optimized production bundle; run before deployment.
- `npm run lint` – execute ESLint with the Next.js config to catch style and type issues early.

## Coding Style & Naming Conventions
- TypeScript is required; keep `strict` mode happy and resolve ESLint warnings.
- Use 2-space indentation, camelCase for functions/variables, PascalCase for React components, and kebab-case for file names inside `components/`.
- Reuse existing Tailwind utility patterns; prefer semantic class groupings over ad-hoc inline styles.
- Store translatable text exclusively in `locales/*.json`; reference via the preferences context `t` helper.

## Testing Guidelines
- No automated suite exists yet; prioritize adding Playwright or React Testing Library for critical flows.
- Name future test files `*.test.ts(x)` alongside the module under test.
- Use realistic credentials and assert encryption flows by mocking the Web Crypto API when testing client logic.

## Commit & Pull Request Guidelines
- Craft concise, present-tense commit messages (e.g., `Add mobile drawer for preferences`) and group related changes together.
- For pull requests, include: summary of changes, testing notes (`npm run lint`, manual scenarios), and screenshots/GIFs for UI updates.
- Link to tracking issues and flag migrations (e.g., JSON schema adjustments) so reviewers can verify data compatibility.

## Security & Configuration Tips
- Never commit real credentials; `data/db.json` should contain test data only.
- Hashing and encryption rely on user passwords—avoid logging secrets or ciphertexts in development tools.
- Use environment variables for future production secrets (e.g., salting strategy), and restrict file permissions on `data/`.
