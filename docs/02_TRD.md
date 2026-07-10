# 02 TRD: Listwright

## Frontend

- Framework: Next.js with App Router.
- Language: TypeScript.
- Styling: CSS Modules or a small global CSS system; avoid heavy UI frameworks unless needed.
- Runtime: Browser client for CSV preview and job polling.
- Primary route: `/`.
- Frontend responsibility:
  - File selection and drag/drop.
  - Local CSV preview only.
  - Confirm Import action.
  - Job polling and progress display.
  - Results tables, skipped records, mapping notes, warnings, before/after expansion.
  - CSV/JSON export links.

## Backend

- Runtime: Node.js.
- Framework: Express with TypeScript.
- API style: REST.
- Job model: In-memory async jobs.
- Upload handling: Multipart CSV upload.
- AI integration: OpenAI Structured Outputs.
- Backend responsibility:
  - CSV parsing for actual import.
  - Row limit enforcement.
  - Deterministic pre-processing.
  - Batch creation and progress tracking.
  - OpenAI structured extraction.
  - Final normalization.
  - Shared Zod validation.
  - Skip rules.
  - Confidence and warning handling.
  - Retry failed batches.
  - CSV/JSON export formatting.

## Database

No database in this version.

Jobs and results are stored in memory. They reset on server restart. Production would use Postgres for import/job records and Redis or a queue system for background job state.

## Auth

No authentication.

The app is intentionally no-login for a reviewer-friendly internship submission.

## Hosting

Recommended:

- Frontend: Vercel.
- Backend: Render or Railway.
- Backend deployment constraint: use one backend instance because jobs are in memory.

Alternatives:

- Frontend and backend can run locally through Docker Compose.
- Backend can be deployed anywhere with persistent environment variables and Node support.

## Third-Party APIs

- OpenAI API:
  - Purpose: Structured semantic extraction and mapping of messy CSV rows into CRM fields.
  - Required env var: `OPENAI_API_KEY`.
  - Safety constraint: LLM output is untrusted and must be validated by shared Zod schemas.

## Key Libraries

- `next`: frontend app framework.
- `react`: frontend UI.
- `typescript`: shared type safety.
- `express`: backend API.
- `multer`: multipart CSV upload.
- `csv-parse`: backend CSV parsing.
- `papaparse`: local browser CSV preview parsing.
- `zod`: shared validation contracts.
- `openai`: OpenAI API client.
- `nanoid` or `crypto.randomUUID`: job IDs and batch IDs.
- `cors`: frontend/backend local development.
- `tsx`: backend dev runner.

## Folder Structure

```text
.
├── apps
│   ├── api
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   ├── routes
│   │   │   ├── jobs
│   │   │   ├── parsing
│   │   │   ├── ai
│   │   │   ├── validation
│   │   │   └── exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web
│       ├── src
│       │   ├── app
│       │   ├── components
│       │   └── lib
│       ├── public
│       │   └── samples
│       ├── package.json
│       └── tsconfig.json
├── packages
│   └── shared
│       ├── src
│       │   ├── schemas.ts
│       │   ├── constants.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── docs
├── samples
├── Dockerfile.api
├── Dockerfile.web
├── docker-compose.yml
├── package.json
└── README.md
```

## Environment Variables

### Backend

- `OPENAI_API_KEY`
- `PORT`
- `CORS_ORIGIN`
- `IMPORT_ROW_LIMIT`
- `OPENAI_MODEL`

### Frontend

- `NEXT_PUBLIC_API_BASE_URL`

## API Endpoints

- `GET /health`
- `POST /api/imports`
- `GET /api/imports/:jobId`
- `GET /api/imports/:jobId/records?page=1&limit=100`
- `GET /api/imports/:jobId/skipped?page=1&limit=100`
- `POST /api/imports/:jobId/retry`
- `GET /api/imports/:jobId/export.csv`
- `GET /api/imports/:jobId/export.json`

## Job Statuses

- `queued`
- `processing`
- `completed`
- `partial_failed`
- `failed`

## Structured Output Shape

The OpenAI structured output schema should stay manageable:

- `records`
- `skippedRecords`
- `mappingNotes`

Mapping notes are batch-level or globally aggregated. They are not required for every row.

## Final CRM CSV Columns

The CSV export must contain exactly these columns in this order:

```csv
created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description
```

## Technical Constraints

- Frontend local preview must not trigger backend or AI calls.
- Backend is the source of truth for imported results.
- Backend must treat all AI output as untrusted.
- Shared Zod schemas must validate API contracts and final CRM records.
- Skip only records missing both email and mobile.
- First email/mobile becomes primary.
- Extra emails/mobiles go into `crm_note`.
- `crm_status` and `data_source` must be allowed values or blank.
- `created_at` must be parseable by `new Date(created_at)` or blank.
- CSV fields must be CSV-safe with no unintended line breaks.
- `IMPORT_ROW_LIMIT` defaults to `1000`.
- One backend instance is required for deployed demo correctness because jobs are in memory.
