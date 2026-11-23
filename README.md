# LinkShield Enterprise Threat Intelligence & URL Forensic Platform

LinkShield is an enterprise-grade cybersecurity platform that performs real-time forensic inspection of URLs, domain infrastructure, SSL/TLS certificates, and security headers to protect users against sophisticated phishing, credential harvesting, malware delivery, and domain generation algorithms (DGA).

## System Architecture & Capabilities

- **Real-Time Network Probes**: Live DNS resolution (A, AAAA, MX, NS, TXT), live TLS/SSL handshake analysis (issuer, expiry, cipher, protocol), and HTTP security header audits (HSTS, CSP, X-Frame-Options).
- **Persistent SQLite Database**: Built with Node 24 native `node:sqlite` (`linkshield.db`), providing persistent relational storage for user accounts, historical audit trails, and global Indicators of Compromise (IOCs).
- **Google & Apple Single Sign-On (SSO)**: One-click authentication with Google and Apple accounts, plus salted PBKDF2 SHA-256 email credentials.
- **Deep Forensic Inspector**: Multi-tab live URL breakdown:
  - **Threat Heuristics**: Shannon entropy calculation $H(X)$, IDN homograph / punycode detection, brand target impersonation heuristics, and risky TLD classification.
  - **Live DNS & Host**: IPv4, IPv6, MX mail routing, authoritative nameservers, and SPF records.
  - **SSL/TLS Certificates**: Live CA issuer verification, validity period, expiration warnings, and cipher strength.
  - **Security Headers**: HSTS enforcement, Content Security Policy, and clickjacking protection.
- **SOC Executive Dashboard**: High-level telemetry, clean vs threat ratio, Shannon entropy tracking, and quick-inspect launcher.
- **Forensic Audit Archive**: Searchable historical scan log with detail inspection drawers, single-entry deletion, purge capability, and RFC-compliant CSV & JSON forensic export.
- **Threat Intelligence Feed**: Dedicated IOC feed tracking trending phishing infrastructure, high-risk TLD abuse rates, and targeted enterprise brand watchlists.
- **Modern Enterprise Aesthetics**: Professional dark slate interface inspired by industry-standard SOC tooling (Cloudflare, CrowdStrike, Linear), eliminating distracting neon/arcade effects.

## Tech Stack

- **Frontend**: React 19, React Router 7, Vite 7, Tailwind CSS 3, Lucide React
- **Backend / API**: Node.js 24 native SQLite (`node:sqlite`), DNS (`node:dns/promises`), TLS (`node:tls`), Vite Middleware API Plugin
- **Cryptography**: PBKDF2 with SHA-256, Shannon Entropy Mathematics, Web Crypto

## Project Structure

```text
linkshield/
├── server/
│   ├── db.js                 # Native SQLite database schema & IOC seeding
│   ├── inspector.js          # Real-time DNS, TLS handshake, & HTTP probe engine
│   └── apiPlugin.js          # Vite fullstack API middleware router (/api/*)
├── src/
│   ├── components/
│   │   └── Navbar.jsx        # Enterprise top navigation & status indicator
│   ├── pages/
│   │   ├── Dashboard.jsx     # Executive SOC telemetry & threat breakdown
│   │   ├── Scanner.jsx       # Flagship live forensic URL inspector
│   │   ├── History.jsx       # SQLite forensic audit archive & CSV export
│   │   ├── ThreatIntel.jsx   # Live Indicators of Compromise (IOC) database
│   │   └── Auth.jsx          # Google, Apple, and enterprise email authentication
│   ├── utils/
│   │   ├── api.js            # Client-side API client for SQLite endpoints
│   │   ├── engine.js         # Shannon entropy, homographs, & heuristic rules
│   │   └── engine.test.js    # Automated unit tests for heuristic algorithms
│   ├── App.jsx               # Client router, global state, & route guard
│   └── index.css             # Enterprise dark theme & Tailwind layers
├── linkshield.db             # Local persistent SQLite database
└── vite.config.js            # Vite configuration with embedded API plugin
```

## Getting Started

```bash
npm install
npm run dev
```

The application runs locally on `http://localhost:5173` with both the frontend and fullstack SQLite API server active in a single process.

## Available Scripts

- `npm run dev` - Launch development server with full real-time API and SQLite database
- `npm run build` - Compile production distribution
- `npm run lint` - Run ESLint verification
- `npm test` - Execute automated Node test suite (`node --test`)
