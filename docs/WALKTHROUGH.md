# Complete Walkthrough & Feature Guide

This guide provides a functional walkthrough of the **B2B Lead Ingestion & Enrichment Pipeline Engine**, explaining every screen, background workflow, and administrative capability.

---

## 1. Authentication & Role-Based Access

The application features full JWT authentication backed by bcrypt-hashed passwords.

- **Login Screen**: Enter administrator credentials (default: `admin@pipeline.io` / `password123`).
- **Session Handling**: Authentication state persists across browser reloads via client-side JWT storage and server-side verification middleware.
- **Operator Access**: Administrators can register additional operators with granular access roles.

---

## 2. Ingestion Studio (Lead Discovery)

The **Ingestion Studio** tab is the primary command center for launching lead acquisition campaigns.

### Step 1: Select Target Sector & Niche
- Choose from **44 primary commercial categories** (Software, Healthcare, Legal, FinTech, Construction, Hospitality, Manufacturing, etc.).
- Drill down into one of **440+ specialized sub-niches** (e.g., *DevOps & Cloud Infrastructure*, *Ambulatory Surgical Centers*, *Commercial Litigation Firms*).
- Specify geographic filters: **City**, **State**, and **Zip Code**.

### Step 2: Select Provider Adapter
- **SEC EDGAR Corporate Registry**: Queries public corporate registrations and filings (instant, free, zero keys needed).
- **OpenStreetMap Commercial**: Discovers localized physical commercial enterprises, phone numbers, and coordinates (instant, free, zero keys needed).
- **Google Places (New) API**: Queries verified Google Maps listings with star ratings, user reviews, and direct web links (requires `GOOGLE_PLACES_API_KEY`).
- **Apollo & Hunter Contact Search**: Targets executive decision-maker email patterns and names (requires `APOLLO_API_KEY` or `HUNTER_API_KEY`).
- **CSV Import**: Upload custom external datasets for automated cleansing and deduplication.

### Step 3: Configure Target Batch Size & Auto-Enrichment
- Set target acquisition count (e.g., 25, 50, 100+ leads).
- Toggle **Auto-Enrich Leads** to automatically trigger email deliverability checks and executive scoring upon ingestion.
- Click **Launch Ingestion Job**. The API immediately issues a background Job ID and streams real-time status updates without blocking the browser.

---

## 3. Lead Intelligence & Data Management

The **Leads** table displays all cleansed and persisted business profiles with rich firmographic metadata.

### Real-time Search & Multi-Filter Bar
- **Global Search**: Filter instantly across business names, domains, contact names, and email addresses.
- **Industry & Quality Grade Filters**: Filter by letter grade (`A+`, `A`, `B`, `C`, `D`) or specific industry sectors.
- **Email Status Indicator**: Visual badges denoting deliverability status:
  - 🟢 **VERIFIED**: Valid syntax and active DNS MX servers confirmed.
  - 🟡 **UNKNOWN**: Standard mailbox awaiting live MX validation.
  - 🔴 **INVALID / DISPOSABLE**: Flagged by RFC 5322 validation or disposable inbox filter.

### Slide-Over Lead Detail Drawer
Clicking any lead opens a comprehensive inspection panel:
1. **Company Overview**: Legal business name, website, direct phone number, employee headcount, and physical postal address.
2. **Quality Score Breakdown**: Full mathematical breakdown showing points earned across Industry, Company Size, Executive Seniority, Completeness, and Email Hygiene.
3. **Associated Decision-Makers**: List of executive contacts, job titles, and direct contact emails.
4. **Action Bar**:
   - **Validate Email**: Runs on-demand live DNS MX verification on the spot.
   - **Enrich Lead**: Re-queries providers to backfill missing firmographic data points.
   - **Delete Lead**: Purges lead and associated contacts from the database.

---

## 4. Deduplication & Data Hygiene Engine

When incoming leads are ingested from multiple sources, they pass through a 3-tier deterministic deduplication cascade:

```
[ Incoming Lead Data ]
         │
         ▼
  1. Domain Match? ─────────────────► (YES) ──► Merge & Enrich Existing Record
         │ (NO)
         ▼
  2. Phone Match? ──────────────────► (YES) ──► Merge & Enrich Existing Record
     (Normalized 10 digits)
         │ (NO)
         ▼
  3. Fuzzy Name + Zip Match? ───────► (YES) ──► Merge & Enrich Existing Record
     (Suffixes stripped: Inc, LLC, Corp)
         │ (NO)
         ▼
[ Create New Verified Lead Record ]
```

- **Conflict Resolution**: When matching an existing record, newer non-null fields automatically backfill empty fields (e.g., adding an executive contact to an existing business profile) without overwriting existing verified data.

---

## 5. Exporting & CRM Integration

### One-Click Streaming CSV Export
- Click **Export CSV** in the top navigation or leads table.
- The server streams sanitized, RFC 4180-compliant CSV files directly to the browser.
- Large datasets stream memory-safely without exhausting server RAM.
- Output fields include: `Lead ID`, `Business Name`, `Domain`, `Phone`, `Industry`, `Employees`, `Street`, `City`, `State`, `Zip`, `Quality Score`, `Grade`, `Primary Contact Name`, `Title`, `Email`, and `Email Status`.
