# 💰 Alkansya.ph — Philippine Bank Rate Comparator

Compare savings and time deposit interest rates across Philippine traditional banks and digital neobanks.

**"If you moved your ₱100,000 from BDO to Maya, you'd earn ₱3,437 more per year."**

## Architecture

```
┌──────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Next.js App     │────▶│  Supabase    │◀────│  Python Scraper │
│  (Vercel)        │     │  (PostgreSQL)│     │  (Railway Cron) │
│                  │     │              │     │  Weekly @ Sun 8AM│
│  SSR + ISR       │     │  REST API    │     │  UTC (4PM PHT)  │
└──────────────────┘     └──────────────┘     └─────────────────┘
```

| Layer    | Tech                 | Cost      |
|----------|----------------------|-----------|
| Frontend | Next.js on Vercel    | Free      |
| Database | Supabase (PostgreSQL)| Free tier |
| Scraper  | Python on Railway    | ~$5/mo    |

---

## Quickstart

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`
3. Copy your project URL and keys from **Settings → API**

### 2. Deploy the Frontend (Vercel)

```bash
# Clone and install
git clone https://github.com/yourusername/alkansya-ph.git
cd alkansya-ph
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Run locally
npm run dev
```

**To deploy on Vercel:**
1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — done!

### 3. Deploy the Scraper (Railway)

```bash
cd scraper

# Configure
cp .env.example .env
# Edit .env with Supabase URL and SERVICE ROLE key (not anon)

# Test locally
pip install -r requirements.txt
python scraper.py --dry-run          # Preview without DB writes
python scraper.py --bank bpi         # Test single bank
python scraper.py                    # Full run
```

**To deploy on Railway:**
1. Create a new project at [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Set root directory to `/` (Railway uses `railway.toml`)
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
5. Railway will auto-detect the cron schedule from `railway.toml`

### 4. Keep debt PDFs locally (optional but recommended)

If the Bureau of the Treasury blocks automated downloads or changes their listing page format, keep debt PDFs in-repo so `/api/debt` can still parse long-term history.

```bash
mkdir -p data/debt-pdfs
```

Put these files in `data/debt-pdfs/` (filename matters for date detection):
- `NG-Debt-web_Feb2026.pdf` (monthly updates)
- `OSDEBT_1993-2025.pdf` (December year-end historical series)
- `Debt-Stock-Annual-1986-2025.pdf` (legacy annual series)

`app/api/debt/route.ts` reads local PDFs from `data/debt-pdfs/*.pdf` and merges them with live data when available.

Optional: add `data/debt-pdfs/debt-history.json` with pre-parsed historical points to avoid relying only on runtime PDF parsing.


---

## Project Structure

```
alkansya-ph/
├── app/
│   ├── globals.css          # Tailwind + custom styles
│   ├── layout.tsx           # Root layout with SEO meta
│   └── page.tsx             # Main page (server component)
├── components/
│   ├── HeroCalculator.tsx   # Opportunity cost calculator
│   └── RateTable.tsx        # Filterable rate comparison table
├── lib/
│   ├── supabase.ts          # Supabase client + data fetching
│   └── utils.ts             # Formatting helpers
├── scraper/
│   ├── scraper.py           # Bank rate scraper
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Scraper env template
├── supabase/
│   └── schema.sql           # Full DB schema + seed data
├── railway.toml             # Railway cron config
├── package.json
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

---

## Banks Covered

### Traditional (8)
BPI, BDO, Metrobank, UnionBank, Security Bank, RCBC, PNB, Landbank

### Digital / Neobanks (6)
Maya Bank, CIMB, Tonik, GoTyme, SeaBank, GCash GSave

---

## Scraper Details

The scraper uses BeautifulSoup to parse public bank rate pages. Each bank has its own parser function that handles their specific HTML structure.

**How it works:**
1. Fetches each bank's public rates page
2. Parses HTML for interest rate data
3. Marks old rates as `is_current = false`
4. Inserts new rates as `is_current = true`
5. Runs weekly on Sundays via Railway cron

**Adding a new bank:**
1. Add a `scrape_newbank()` function in `scraper.py`
2. Register it in the `SCRAPERS` dict
3. Add the bank to the `banks` table in Supabase
4. The frontend picks it up automatically from the `current_rates` view

---

## Extending

- **Custom domain**: Point `alkansya.ph` to Vercel via DNS
- **Alerts**: Add Slack/Discord webhook for scrape failures
- **More banks**: Add Maribank, Uniondigital, etc.
- **Loan rates**: Add `product_type = 'loan'` to the rates table
- **Affiliate links**: Add `referral_url` column to banks table
- **Rate history chart**: Query non-current rates for historical trends

---

## License

MIT
