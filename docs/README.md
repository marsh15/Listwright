# Listwright Documentation Pack

This folder contains the six source-of-truth documents for building the Listwright as a no-login, reviewer-friendly internship submission.

## Live Demo

- [Web app](https://listwright-web.vercel.app/)
- [API](https://listwright-api.onrender.com)

## Screenshots

![Upload screen](./images/listwright-upload.png)

![Local CSV preview](./images/listwright-preview.png)

![Import results](./images/listwright-results.png)

## Documents

1. [PRD](./01_PRD.md)
2. [TRD](./02_TRD.md)
3. [App Flow](./03_APP_FLOW.md)
4. [UI/UX Design Brief](./04_UI_UX_DESIGN_BRIEF.md)
5. [Backend Schema](./05_BACKEND_SCHEMA.md)
6. [Implementation Plan](./06_IMPLEMENTATION_PLAN.md)

## Locked Scope

Build a CSV importer that previews locally, imports only after user confirmation, uses deterministic pre-processing plus OpenAI Structured Outputs, validates every AI result with shared Zod schemas, shows traceable results and warnings, supports retries and exports, and remains intentionally simple for review.

Do not add auth, Postgres, Prisma, full import history, admin views, billing, teams, dashboards, or other SaaS features.
