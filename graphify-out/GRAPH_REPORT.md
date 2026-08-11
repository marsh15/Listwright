# Graph Report - .  (2026-07-14)

## Corpus Check
- 72 files · ~94,261 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 410 nodes · 538 edges · 25 communities (19 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Normalization Rules
- API Tests and Routes
- Product Architecture
- Browser State Snapshots
- Frontend Import Workflow
- Web Package Configuration
- API Package Configuration
- Web TypeScript Config
- Workspace Configuration
- Shared Package Configuration
- AI Extraction Pipeline
- Shared TypeScript Config
- End-to-End Test Harness
- API TypeScript Config
- Results Review Interface
- Upload and Consent Interface
- Import Dashboard Views
- Focused Type Checking
- API Build Config
- Next Deployment Config
- Application Icon
- Page Layout Metadata
- Record Comparison View
- Lint Configuration
- Next Generated Types

## God Nodes (most connected - your core abstractions)
1. `Local CSV Preview` - 19 edges
2. `createApp()` - 15 edges
3. `compilerOptions` - 15 edges
4. `normalizeBatchResult()` - 12 edges
5. `compilerOptions` - 11 edges
6. `compilerOptions` - 9 edges
7. `scripts` - 9 edges
8. `scripts` - 8 edges
9. `preprocessRows()` - 7 edges
10. `SourceRow` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Accessible Status Feedback` --semantically_similar_to--> `Evidence Color Rule`  [INFERRED] [semantically similar]
  docs/04_UI_UX_DESIGN_BRIEF.md → DESIGN.md
- `Explicit Import Confirmation` --semantically_similar_to--> `Local Preview Confirmation Boundary`  [INFERRED] [semantically similar]
  docs/01_PRD.md → DESIGN.md
- `Auditable Import Workflow` --semantically_similar_to--> `Traceable Results`  [INFERRED] [semantically similar]
  PRODUCT.md → docs/01_PRD.md
- `buildMappingNotes()` --references--> `CRM_CSV_COLUMNS`  [EXTRACTED]
  apps/api/src/ai/deterministic.ts → packages/shared/src/constants.ts
- `normalizeStatus()` --references--> `ALLOWED_CRM_STATUSES`  [EXTRACTED]
  apps/api/src/ai/deterministic.ts → packages/shared/src/constants.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Three Phase Import Workflow** — _playwright_cli_page_2026_07_09t18_47_56_049z_local_preview, _playwright_cli_page_2026_07_09t18_47_56_049z_confirmed_backend_import, _playwright_cli_page_2026_07_09t18_47_56_049z_reviewable_exports [EXTRACTED 1.00]
- **Auditable Import Trust Pipeline** — docs_01_prd_explicit_import_confirmation, docs_05_backend_schema_deterministicsignals, docs_ai_strategy_no_invention_mapping, docs_05_backend_schema_validation_rules, docs_ai_strategy_row_level_traceability [EXTRACTED 1.00]
- **Reviewer-Fast Single-Screen Experience** — product_reviewer_fast_demo, docs_03_app_flow_single_screen_workflow, docs_04_ui_ux_design_brief_dense_review_tables, docs_03_app_flow_failed_batch_retry [INFERRED 0.85]
- **Source-of-Truth Documentation Set** — docs_01_prd_listwright_product_requirements, docs_02_trd_typescript_workspace, docs_03_app_flow_single_screen_workflow, docs_04_ui_ux_design_brief_evidence_first_interface, docs_05_backend_schema_importjob, docs_06_implementation_plan_phased_delivery [EXTRACTED 1.00]
- **Three-Phase Import Flow** — docs_images_listwright_upload_local_preview, docs_images_listwright_upload_confirmed_backend_import, docs_images_listwright_upload_reviewable_exports [EXTRACTED 1.00]
- **Import Outcome Reporting** — docs_images_listwright_preview_import_progress, docs_images_listwright_preview_workspace_summary, docs_images_listwright_preview_skipped_records [EXTRACTED 1.00]
- **Listwright Import Audit Flow** — docs_images_listwright_results_listwright_test_leads_csv, docs_images_listwright_results_ready_to_review_import, docs_images_listwright_results_workspace_output_summary, docs_images_listwright_results_skipped_records_review [INFERRED 0.85]

## Communities (25 total, 6 thin omitted)

### Community 0 - "Normalization Rules"
Cohesion: 0.05
Nodes (47): extractBatch(), AllowedCrmStatus, AllowedDataSource, allowedSourceOrBlank(), allowedStatusOrBlank(), clamp(), clean(), dedupeMappingNotes() (+39 more)

### Community 1 - "API Tests and Routes"
Cohesion: 0.10
Nodes (36): createApp(), CreateAppOptions, getHealthResponse(), getJob(), paginate(), parseCorsOrigin(), createTestBatches(), makeBatch() (+28 more)

### Community 2 - "Product Architecture"
Cohesion: 0.06
Nodes (40): Evidence Color Rule, Import Workbench, Local Preview Confirmation Boundary, API Service, Web Service, Explicit Import Confirmation, Listwright Product Requirements, Traceable Results (+32 more)

### Community 3 - "Browser State Snapshots"
Cohesion: 0.06
Nodes (32): In Memory Job Lifecycle, Shared Zod AI Output Validation, GrowEasy Importer Empty State Snapshot, Mixed Leads Local Preview Snapshot, Extra Contact Value Preservation, CSV and JSON Import Exports, Five Processed Four Imported One Skipped, Completed Mixed Leads Import Snapshot (+24 more)

### Community 4 - "Frontend Import Workflow"
Cohesion: 0.09
Nodes (17): ImporterStepper(), steps, Sample, UploadDropzone(), ExportsPanel(), formatFileSize(), formatStatus(), ImporterApp() (+9 more)

### Community 5 - "Web Package Configuration"
Cohesion: 0.07
Nodes (28): dependencies, @listwright/shared, lucide-react, next, papaparse, react, react-dom, react-dropzone (+20 more)

### Community 6 - "API Package Configuration"
Cohesion: 0.07
Nodes (27): dependencies, cors, csv-parse, express, @listwright/shared, multer, zod, devDependencies (+19 more)

### Community 7 - "Web TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 8 - "Workspace Configuration"
Cohesion: 0.12
Nodes (16): description, engines, node, name, private, scripts, build, dev (+8 more)

### Community 9 - "Shared Package Configuration"
Cohesion: 0.13
Nodes (15): dependencies, zod, devDependencies, typescript, exports, import, main, name (+7 more)

### Community 10 - "AI Extraction Pipeline"
Cohesion: 0.23
Nodes (12): buildCrm(), buildMappingNotes(), extractDeterministically(), fieldHints, normalizeSource(), normalizeStatus(), pickByHeader(), aiBatchResultSchema (+4 more)

### Community 11 - "Shared TypeScript Config"
Cohesion: 0.15
Nodes (12): compilerOptions, declaration, exactOptionalPropertyTypes, module, moduleResolution, noUncheckedIndexedAccess, outDir, rootDir (+4 more)

### Community 12 - "End-to-End Test Harness"
Cohesion: 0.20
Nodes (7): apiPort, children, collect(), delay(), runCli(), waitForUrl(), webPort

### Community 13 - "API TypeScript Config"
Cohesion: 0.18
Nodes (10): compilerOptions, exactOptionalPropertyTypes, module, moduleResolution, noUncheckedIndexedAccess, outDir, skipLibCheck, strict (+2 more)

### Community 14 - "Results Review Interface"
Cohesion: 0.27
Nodes (10): Batch Processing Summary, CSV Export, JSON Export, Listwright Import Results Dashboard, listwright_test_leads.csv, Nearly Blank Contact Skip Rationale, Ready to Review Import, Skipped Records Review (+2 more)

### Community 15 - "Upload and Consent Interface"
Cohesion: 0.24
Nodes (10): AI Extraction, Confirmed Backend Import, CSV Import Workflow, Explicit Import Confirmation, Import Progress, Listwright CSV Import Interface, Local Preview, Preview First, Process Second (+2 more)

### Community 16 - "Import Dashboard Views"
Cohesion: 0.36
Nodes (8): Batch Processing, CSV Export, Import Progress, JSON Export, Listwright CSV Import Dashboard, Local CSV Preview, Skipped Records, Workspace Summary

### Community 17 - "Focused Type Checking"
Cohesion: 0.50
Nodes (3): exclude, extends, include

### Community 20 - "Application Icon"
Cohesion: 1.00
Nodes (3): CSV Importer Favicon, Document Icon, Structured Data Rows

## Knowledge Gaps
- **208 isolated node(s):** `name`, `version`, `private`, `type`, `main` (+203 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CRM_CSV_COLUMNS` connect `Frontend Import Workflow` to `Normalization Rules`, `API Tests and Routes`, `AI Extraction Pipeline`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `formatCrmCsv()` connect `API Tests and Routes` to `Frontend Import Workflow`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _216 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Normalization Rules` be split into smaller, more focused modules?**
  _Cohesion score 0.054901960784313725 - nodes in this community are weakly interconnected._
- **Should `API Tests and Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.0977891156462585 - nodes in this community are weakly interconnected._
- **Should `Product Architecture` be split into smaller, more focused modules?**
  _Cohesion score 0.05641025641025641 - nodes in this community are weakly interconnected._
- **Should `Browser State Snapshots` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._