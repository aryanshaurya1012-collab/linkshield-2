# LinkShield

LinkShield is a Vite + React phishing-risk simulator that analyzes URLs locally in the browser, stores per-user scan history, and provides a cyber-themed dashboard for scanning and review.

## Features

- Client-side login/register flow with salted password hashing (PBKDF2 via Web Crypto).
- URL risk scoring engine based on:
  - Shannon entropy,
  - homograph/punycode detection,
  - risky TLD checks,
  - phishing keyword signals.
- Per-user scan history stored in localStorage.
- CSV export of scan history.
- Route protection for authenticated scanner/history views.

## Tech Stack

- React 19
- React Router
- Vite 7
- Tailwind CSS
- Framer Motion
- Lucide React icons

## Project Structure

```text
src/
  main.jsx                # React bootstrap
  App.jsx                 # Router, layout, auth gating, top-level state
  index.css               # Tailwind layers + global styles/animations
  components/
    Auth.jsx              # Login/register UI and validation
    Scanner.jsx           # URL scan flow, logs, threat UI
    History.jsx           # Scan archive + CSV export
  utils/
    engine.js             # Risk scoring and URL/domain analysis logic
    db.js                 # localStorage persistence and auth/session helpers
```

## Getting Started

```bash
npm install
npm run dev
```

App runs by default on `http://localhost:5173`.

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm test` - run Node test suite (`node --test`)

## Security and Limitations

- This is a client-side demo app and not production-grade security.
- Password verifiers use PBKDF2 + per-user random salt and are kept only in memory for the active runtime (legacy localStorage credential data is cleared on load).
- Session metadata and scan history are still stored client-side.
- There is no server-side identity verification, secure cookie/session backend, or remote threat intelligence API.
- Detection is heuristic-based and can produce false positives/false negatives.
