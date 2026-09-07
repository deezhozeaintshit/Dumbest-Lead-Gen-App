# B2B Lead Ingestion & Enrichment Pipeline Engine

> A high-throughput, resilient B2B lead ingestion, deduplication, enrichment, and intelligence platform built on Node.js, TypeScript, Express, SQLite (Prisma ORM), and React.

---

## Executive Overview

This application is an enterprise-grade B2B lead generation, ingestion, and contact enrichment system designed to run out of the box with zero external billing setup while providing seamless adapters for paid commercial providers.

It solves the four fundamental challenges of B2B data operations:
1. **Multi-Source Ingestion & Discovery**: Seamlessly ingest from live public enterprise sources (SEC EDGAR Corporate Registry, OpenStreetMap Commercial Directories), file uploads (CSV batch staging), and commercial data networks (Google Places New API, Apollo.io, Hunter.io).
2. **Deterministic Deduplication Hierarchy**: Multi-attribute deduplication engine matching on `domain` (primary), `phone_number` (normalized 10-digit), and `business_name + zip_code` (fuzzy suffix-stripped) to prevent duplicate records and fragmented contact silos.
3. **Automated Verification & Enrichment**: Deep contact discovery, multi-step email verification (RFC 5322 regex checks, disposable domain blocklists, live DNS MX socket validation, AbstractAPI, and ZeroBounce), and algorithmic 0–100 lead quality grading.
4. **Immediate Exportability & Interoperability**: Direct streaming CSV export utility and full REST API authenticated via signed JWT tokens.

---

## Key Value Propositions & Buyer Highlights

| Feature | Technical Implementation | Commercial Value |
| :--- | :--- | :--- |
| **Zero-Cost Operation** | Built-in live SEC EDGAR & OpenStreetMap adapters; native DNS MX lookup | The application can discover, ingest, and verify thousands of leads without incurring recurring API subscription costs. |
| **Resilience & Rate Limiting** | `bottleneck` token-bucket rate limiters + exponential backoff with jitter and `Retry-After` compliance | Never gets IP-banned or rate-limited by upstream providers. Background tasks run safely. |
| **44 Industry Taxonomies** | 44 top-level enterprise sectors and 440+ targeted sub-niches mapped out of the box | Ready for targeted sales campaigns across software, biotech, legal, finance, manufacturing, construction, and hospitality. |
| **Local SQLite Persistence** | Zero-setup Prisma ORM storing data locally in `prisma/dev.db` | High-speed local data persistence, no cloud database costs, trivial backup and migration to PostgreSQL/Turso. |
| **Full White-Label UI** | Responsive React + Tailwind dashboard with live pipeline metrics, lead drawer, and one-click CSV export | Ready for immediate deployment, agency client delivery, or reselling as a micro-SaaS. |

---

## System Architecture

```
                                  +-----------------------------+
                                  |  Web Dashboard (React / TS) |
                                  +--------------+--------------+
                                                 | (JWT Bearer / REST)
                                                 v
+-----------------------------------------------------------------------------------------------+
| Express.js Server (Port 3000)                                                                 |
|                                                                                               |
|  [ Auth Service ]             [ Ingestion Job Engine ]             [ CSV Streaming Exporter ]  |
|   - bcrypt + JWT               - Async background processing        - Memory-safe streaming   |
|   - Role-based access          - Status tracking & logging          - Sanitized field mapping |
|                                                                                               |
|  [ Provider Adapter Matrix ]                                                                  |
|   ├── sec_edgar       (Public EDGAR corporate registry filings & financial indicators)       |
|   ├── osm_commercial  (OpenStreetMap Overpass API for localized commercial entities)         |
|   ├── google_places   (Google Places New API for verified addresses, phones, and ratings)    |
|   ├── b2b_contacts    (Apollo.io / Hunter.io domain search & corporate email discovery)       |
|   └── csv_import      (Bulk manual batch staging & multi-record import)                       |
|                                                                                               |
|  [ Resilience Layer ]                                                                         |
|   - Bottleneck token-bucket concurrency management per provider                              |
|   - Exponential backoff retry handler (HTTP 429 / 5xx / timeout recovery)                    |
|                                                                                               |
|  [ Deduplication Engine ]                                                                     |
|   1. Domain Normalization (strips http/https, www, trailing paths)                            |
|   2. Phone Normalization (extracts 10-digit standardized identifier)                          |
|   3. Fuzzy Business Name & Zip matching (strips Inc, LLC, Corp, Ltd suffixes)                 |
|                                                                                               |
|  [ Enrichment & Scoring Pipeline ]                                                            |
|   - Multi-tier Email Validation (RFC 5322 regex -> Disposable domain filter -> DNS MX verify) |
|   - Multi-Attribute Lead Scorer (0-100 score, letter grade A+-D, transparency breakdown)     |
+-----------------------------------------------+-----------------------------------------------+
                                                |
                                                v
                                  +-----------------------------+
                                  | SQLite Database (Prisma ORM)|
                                  |  - Leads & Contacts         |
                                  |  - Ingestion Job Logs       |
                                  |  - Users & Credentials      |
                                  +-----------------------------+
```

---

## Quick Start & Installation

### Prerequisites
- Node.js 18.x or 20.x LTS
- npm or bun

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd <repository-name>
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(All commercial provider keys in `.env` are optional. If left blank, the app runs smoothly using the public data feeds).*

### 3. Initialize the SQLite Database
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
The application will boot at `http://localhost:3000`.

### 5. Production Build & Start
```bash
npm run build
npm start
```

---

## Default Admin Credentials

When the database is first initialized, a secure default administrator user is automatically provisioned:

- **Email**: `admin@pipeline.io`
- **Password**: `password123`
- **Role**: `ADMIN`

*(You can update this password or add new users at any time via the API or dashboard settings).*

---

## Provider Configuration & Capabilities

| Provider ID | Provider Name | Setup Requirement | Default Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| `sec_edgar` | **SEC EDGAR Corporate Registry** | None (Public) | **Active & Ready** | Ingests verified corporate filings, CIK numbers, state of incorporation, and SEC company records. |
| `osm_commercial` | **OpenStreetMap Commercial** | None (Public) | **Active & Ready** | Queries localized commercial facilities, physical business addresses, phone numbers, and categories. |
| `csv_import` | **Dataset Importer** | None | **Active & Ready** | Bulk ingestion for staging user-provided lead CSVs with automated deduplication and column mapping. |
| `google_places` | **Google Places (New) API** | `GOOGLE_PLACES_API_KEY` | Optional | Queries verified local businesses, ratings, user reviews, international phone numbers, and websites. |
| `b2b_contacts` | **Apollo & Hunter Contact Search** | `APOLLO_API_KEY` or `HUNTER_API_KEY` | Optional | Discovers verified corporate email patterns, decision-maker names, executive titles, and LinkedIn profiles. |

---

## Email Validation Pipeline

The application features a 4-stage email verification cascade:

1. **RFC 5322 Syntax Check**: Rejects malformed addresses, illegal characters, and invalid top-level domains.
2. **Disposable & Temporary Domain Filter**: Evaluates against a local blocklist of 100+ temporary inbox providers (Mailinator, GuerrillaMail, 10MinuteMail, TempMail).
3. **Live DNS MX Record Lookup**: Actively queries root nameservers via Node.js's native `dns.promises.resolveMx` to verify that the target domain has active, configured mail exchange servers capable of receiving messages.
4. **Third-Party API Integration (Optional)**: If `ABSTRACT_API_KEY` or `ZEROBOUNCE_API_KEY` are provided, automated SMTP mailbox pinging and spam-trap detection are performed.

---

## Lead Quality Scoring Algorithm (0–100)

Every ingested lead is evaluated across 5 distinct objective categories:

* **Industry Value (Max 25 pts)**: High-growth SaaS, Tech, Healthcare, and Finance receive top weight.
* **Company Size (Max 25 pts)**: Scales with employee count (50–500+ employees receiving maximum points).
* **Decision-Maker Seniority (Max 25 pts)**: Identified contacts with titles containing *Founder, CEO, CTO, VP, Director, or Head of* receive full executive bonuses.
* **Contact Completeness (Max 15 pts)**: Evaluates presence of active domain, direct phone number, and physical postal address.
* **Email Deliverability (Max 10 pts)**: Verified MX records add points; disposable or invalid addresses deduct up to 20 points.

### Letter Grade Mapping:
- **A+ (90–100)**: Prime enterprise target with verified decision-maker contact and MX-validated email.
- **A (75–89)**: High-quality sales-qualified lead.
- **B (55–74)**: Viable prospect with actionable firmographic data.
- **C (35–54)**: Standard contact with partial data completeness.
- **D (<35)**: Low-scoring prospect requiring further enrichment.

---

## REST API Documentation

All administrative endpoints accept JSON and require an `Authorization: Bearer <JWT_TOKEN>` header.

### Authentication
- `POST /api/auth/login` - Authenticate user, returns signed JWT token.
- `POST /api/auth/register` - Register a new operator (requires admin token or first setup).
- `GET /api/auth/me` - Retrieve current user profile and role.

### Providers & Ingestion
- `GET /api/providers` - List all providers, connectivity statuses, and API key states.
- `POST /api/providers/:id/test` - Test live connectivity and latency for a specific provider.
- `POST /api/ingest` - Launch an asynchronous background ingestion job.
- `POST /api/ingest/csv` - Upload and stage a CSV file for pipeline ingestion.
- `GET /api/jobs` - List ingestion jobs and real-time execution progress.
- `GET /api/jobs/:id` - Fetch detailed execution metrics and error logs for a job.

### Leads & Enrichment
- `GET /api/leads` - Filter, search, and paginate ingested leads (supports search, industry, rating, date range).
- `GET /api/leads/:id` - Retrieve complete lead details, associated contacts, and score breakdown.
- `POST /api/leads/:id/enrich` - Trigger on-demand re-enrichment and contact discovery.
- `POST /api/leads/:id/validate-email` - Perform live DNS MX and deliverability check on lead email.
- `DELETE /api/leads/:id` - Remove lead and associated contacts.

### Export
- `GET /api/export/csv` - Stream complete or filtered lead list as a sanitized CSV file.

---

## Deployment Options

For comprehensive guides on deploying this application, refer to the documentation package in `/docs`:
- **[Oracle Cloud Always Free Deployment Guide](docs/ORACLE_CLOUD_DEPLOYMENT.md)** - Run 24/7 on an Always Free 4-core, 24GB RAM Linux VPS with zero hosting fees.
- **[Fly.io Deployment Guide](docs/FLY_IO_DEPLOYMENT.md)** - Deploy as a lightweight container with persistent SQLite volume.
- **[Commercial Value & Buyer Pitch](docs/BUYER_PITCH_AND_VALUATION.md)** - Key selling points, addressable markets, and monetization models for selling this software.

---

## License & Intellectual Property
All code in this repository is production-ready, unencumbered by proprietary lock-ins, and fully ready for commercial resale, agency client white-labeling, or SaaS deployment.
