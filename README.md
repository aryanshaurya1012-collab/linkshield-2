# LinkShield

LinkShield is a high-performance cyber threat intelligence dashboard and phishing-risk simulator. It analyzes URLs locally in the browser, calculates Shannon entropy, detects homographs and suspicious TLDs, identifies spoofing and evasion vectors, stores per-operator forensic scan history, and provides an immersive cyberpunk command center.

## Core Capabilities & Threat Engine

- **Client-Side Auth Vault**: PBKDF2 password derivation (120,000 SHA-256 iterations) with per-user cryptographic salts and session persistence across reloads.
- **Shannon Entropy Engine**: Measures information density and character randomness $H(X)$ to expose Domain Generation Algorithms (DGA).
- **Homograph & Punycode Detection**: Flags internationalized domain name (IDN) homograph attacks and `xn--` spoofing prefixes.
- **Authority & Credential Spoofing**: Identifies deceptive `@` embedded userinfo tricks that obscure genuine destination hostnames.
- **Raw IP Vector Detection**: Flags direct IPv4 and IPv6 hostnames commonly deployed by phishing kits and Command & Control (C2) servers.
- **Brand Target Impersonation**: Detects high-value target brand names (PayPal, Google, Microsoft, Apple, Banking) nested within untrusted subdomains or paths.
- **URL Shortener Detection**: Flags shortened links (bit.ly, tinyurl, etc.) that mask malicious destinations.
- **Multipart Suffix Resolution**: Parses global multi-part ccTLDs (`.ac.in`, `.co.uk`, `.gov.au`, etc.) to prevent false-positive brand flags on trusted institutions.
- **Forensic Threat History**: Local encrypted storage of scans with search filtering, risk-tier sorting, record deletion, and robust RFC-compliant CSV forensics export.

## Tech Stack

- **React 19**
- **React Router 7**
- **Vite 7**
- **Tailwind CSS 3**
- **Lucide React**
- **Web Crypto API & Web Audio API**

## Project Structure

```text
src/
  main.jsx                # Application bootstrap
  App.jsx                 # Router, layout, telemetry ticker, auth gating
  index.css               # Cyberpunk styling, glowing panels, custom scrollbars
  components/
    Auth.jsx              # Operator authentication sequence (login/register)
    Scanner.jsx           # Cyber vector input, live telemetry logs, risk gauge, alert modal
    History.jsx           # Threat intel archive, search filter, forensic CSV export
  utils/
    engine.js             # Risk scoring heuristics, entropy calculations, domain parsing
    engine.test.js        # Node test suite for detection heuristics
    db.js                 # Client-side salted vault & forensic scan storage
```

## Getting Started

```bash
npm install
npm run dev
```

App runs by default on `http://localhost:5173`.

## Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Production build (output in `/dist`)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint checks
- `npm test` - Run automated test suite (`node --test`)
