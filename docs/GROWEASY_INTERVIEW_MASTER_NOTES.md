# GrowEasy Interview Master Notes

> **Project naming note.** The interview target is GrowEasy, but the application in this repository is named **Listwright**. In an interview, say “My GrowEasy submission/project is Listwright,” then use Listwright when naming the product. This document is grounded in the repository as inspected on 14 July 2026. Paths and line references refer to the source tree, not generated `dist/` or `.next/` output.

> **Verified baseline.** `npm run typecheck`, `npm run lint`, and `npm run test` pass. The test run contains 14 passing backend tests. That does not prove the optional live OpenAI path, HTTP multipart routing, browser components, concurrency, deployment, or AI mapping quality; the testing section explains those gaps honestly.

## 1. What This Project Is

Listwright is an auditable CSV-cleaning workbench for messy CRM lead data. Its user is a technical reviewer or CRM operator who has spreadsheets with inconsistent headings, mixed contact values, invalid status names, duplicates, and incomplete rows. The browser first parses a selected file locally so the user can inspect it without uploading it. Only after the user presses **Confirm import** does the original file go to the Express API. The server parses it again, extracts deterministic evidence, processes five-row batches through either OpenAI Structured Outputs or a credential-free deterministic mapper, normalizes every result, validates it with shared Zod schemas, and stores the job in memory. The user then reviews imported records, skipped rows, warnings, mapping notes, source-to-output comparisons, and CSV/JSON exports.

The most important technical idea is not “the app calls AI.” It is the **trust boundary**: probabilistic AI proposes a mapping, while deterministic backend code owns validity. `apps/api/src/ai/openai.ts` constrains the provider response; `apps/api/src/validation/normalize.ts` applies business rules; `packages/shared/src/schemas.ts` validates the final domain objects; and `apps/api/src/exports/format.ts` controls exactly what is exportable. This is a stronger interview story than an unconstrained LLM wrapper.

### 30-second answer

“My GrowEasy project is Listwright, an auditable AI-assisted importer for messy CRM lead CSVs. A Next.js client previews the file locally and uploads it only after explicit confirmation. An Express API parses and preprocesses rows, sends five-row batches through OpenAI structured output or a deterministic fallback, then normalizes and validates every result using shared Zod contracts. The UI polls progress and lets users inspect imported rows, skipped rows, mapping evidence, and before/after data before exporting CSV or JSON. I deliberately used in-memory jobs for a fast demo, so persistence, authentication, and a durable queue are the next production steps.”

### 2-minute answer

“The problem is that lead spreadsheets rarely match a CRM schema. Headers vary, phone and email values are mixed together, dates are inconsistent, and invalid values can silently damage CRM data. Listwright separates review, extraction, and trust. In `apps/web/src/components/ImporterApp.tsx`, PapaParse creates a browser-only preview. Confirming the import creates `FormData` and posts the original CSV to `POST /api/imports`. In `apps/api/src/app.ts`, Multer bounds the upload at 5 MB, `csv-parse` reads at most 1,000 rows, and preprocessing detects emails, phones, date hints, duplicates, enum hints, and extra contacts.

“The processor divides the input into batches of five. `extractBatch` uses an OpenAI JSON Schema request when an API key exists and falls back to deterministic header matching when it does not. Both paths feed `normalizeBatchResult`, which enforces primary-contact rules, enum allowlists, date handling, skip rules, confidence bounds, and shared Zod validation. A module-level `Map` stores job state. The API returns HTTP 202 immediately, the frontend polls every 900 milliseconds, and separate endpoints paginate imported and skipped rows. Failed batches do not stop later batches and can be retried. The current design is ideal for a reviewer demo but not multi-user production because jobs disappear on restart, anyone with a job ID can access it, and `queueMicrotask` is not a durable queue.”

### Deep technical answer

The repository is an npm-workspace monorepo. `packages/shared` defines canonical CRM columns, job statuses, Zod schemas, and TypeScript types. `apps/api` is a Node/Express service divided into transport (`app.ts`), parsing, preprocessing, AI adaptation, normalization, job orchestration, in-memory storage, and export formatting. `apps/web` is a Next.js App Router application whose only route renders a large client component. The architecture deliberately has two validations around AI: OpenAI output is constrained to JSON Schema and parsed with a private Zod schema in `openai.ts`; after that, domain normalization and the public shared schemas enforce final rules. This is defense in depth, although structured shape does not guarantee factual correctness.

The asynchronous job is cooperative, process-local JavaScript. `startJobProcessing` schedules `processBatches` with `queueMicrotask`; batches then run sequentially in a `for...of` loop with `await`. This lets the POST handler return before processing finishes, but it does not provide persistence, worker isolation, parallelism, leases, or crash recovery. `updateCounts` derives overall status from mutable batch state. A failed batch records a retryable error and later batches continue. The retry endpoint resets failed batches to `queued` and schedules those batches again. Because there is no atomic claim or idempotent commit, concurrent retry requests can process the same batch and append duplicate records.

### Business and product value

Listwright reduces manual spreadsheet cleanup while preserving reviewability. The local-preview boundary prevents accidental upload before consent. Deterministic evidence makes the AI prompt more grounded. Skipped reasons and original rows prevent silent data loss. A strict CRM CSV serves downstream import, while the richer JSON export serves audit and debugging. For an internship project, this demonstrates client/server design, TypeScript, React state, REST, file handling, runtime validation, asynchronous workflows, AI safety, testing, deployment, and honest trade-off analysis.

### How to discuss AI-assisted development honestly

Say: “I used AI to accelerate implementation and iteration. I take ownership by reading the generated code, tracing each data boundary, running the checks, reproducing behavior, and identifying weaknesses I can explain and fix. I can show where the provider output is constrained, where the backend rejects invalid results, why retry is not currently idempotent, and how I would migrate the Map to durable storage.” Do not claim that typing every line manually is the definition of ownership. Ownership means you can explain, test, debug, change, and defend the system.

## 2. GrowEasy Interview Process and Strategy

### Round 1: CodeChef JavaScript Test

Expect two kinds of pressure: language-output questions and short algorithmic problems. Output questions test whether you can mentally execute scope, hoisting, closures, coercion, object references, `this`, promises, microtasks, and timers. Coding problems test input parsing, loops, arrays, strings, maps/sets, boundary cases, and complexity. Practice in plain Node.js because browser APIs and React will not help in a CodeChef runner.

Use a disciplined method. First write the types and scope of each variable. For async questions, split work into synchronous stack, microtask queue, and timer/task queue. For object questions, draw references rather than imagining copies. For coding problems, state the brute-force method, derive a better data structure, test empty/single/duplicate cases, and estimate time and space complexity. Section 5 teaches the language; section 23 supplies practice.

### Round 2: 15-minute screening

This round rewards clarity more than exhaustive detail. Prepare a 30-second self-introduction, the 30-second Listwright pitch, one challenge, one learning example, why GrowEasy, availability, and one thoughtful question. Keep answers structured: context, action, evidence, reflection. Do not spend ten minutes listing libraries.

A natural answer is: “I am a JavaScript/full-stack learner who built Listwright as a GrowEasy-focused project. I used AI to move faster, then worked backward through the repository until I could trace the upload, async job, AI boundary, validation, retry, and export flow myself. The project strengthened my React, TypeScript, Express, API, and debugging skills. I am looking for an internship where I can learn from reviews, ship small improvements, and become reliable with production engineering practices.”

### Round 3: 1-hour technical interview

The interviewer can move from your pitch into any boundary: why Next.js, why separate API, what happens after a button click, how multipart differs from JSON, why HTTP 202 is used, how state changes, what Zod adds beyond TypeScript, how the event loop schedules the job, what happens on restart, whether retry is safe, how to secure job access, and how to persist or scale the design. Use the actual file path in answers. If you do not know, reason from the code instead of bluffing.

Prepare three traces until you can draw them from memory:

1. File selection → PapaParse → preview state → confirmation → multipart POST.
2. CSV buffer → rows → deterministic signals → batch extraction → normalization → Map state.
3. Polling → terminal status → paginated results → CSV/JSON export.

Your strongest interview posture is precise honesty: “Implemented,” “not implemented,” “tested,” and “recommended” are different categories. For example, the project has a retry action, but no automatic backoff; it has asynchronous in-process processing, but no durable worker; it has TypeScript response types, but the browser does not runtime-parse API responses.

## 3. Repository Map and File Reading Order

| Order | File/Folder | Layer | Purpose | Concepts Needed | Interview Risk |
| ----- | ----------- | ----- | ------- | --------------- | -------------- |
| 1 | `README.md` | Product/operations | Demo flow, architecture, setup, API, trade-offs | Client/server basics | Low; verify claims against code |
| 2 | `package.json` | Workspace | npm workspaces and root scripts | npm, scripts, monorepos | Medium |
| 3 | `packages/shared/src/constants.ts` | Domain contract | CRM columns, enum allowlists, job states, row cap | arrays, `as const`, union types | High |
| 4 | `packages/shared/src/schemas.ts` | Runtime contract | Zod schemas and inferred API/domain types | TypeScript vs runtime validation | Very high |
| 5 | `apps/api/src/types.ts` | Backend domain | Source rows, signals, batches, jobs, AI adapter shapes | type aliases, composition | High |
| 6 | `apps/api/src/app.ts` | HTTP/API | Middleware, all routes, upload policy, pagination, errors | Express, HTTP, multipart, middleware | Very high |
| 7 | `apps/api/src/parsing/csv.ts` | Parsing | CSV bytes to bounded clean row objects | buffers, object iteration, exceptions | Medium |
| 8 | `apps/api/src/parsing/preprocess.ts` | Deterministic analysis | Contacts, dates, duplicates, hints, five-row chunks | regex, Set, map/filter/flatMap | Very high |
| 9 | `apps/api/src/ai/deterministic.ts` | Extraction fallback | Header-based mapping and notes | functions, records, heuristics | High |
| 10 | `apps/api/src/ai/openai.ts` | AI adapter | JSON Schema request, prompt, timeout, fallback, validation | fetch, async, LLM boundaries | Very high |
| 11 | `apps/api/src/validation/normalize.ts` | Domain enforcement | Final contacts, enums, dates, skips, Zod validation | Map/Set, normalization, safe parsing | Very high |
| 12 | `apps/api/src/jobs/processor.ts` | Orchestration | Batch creation, scheduling, sequential processing, partial failure | event loop, promises, mutation | Very high |
| 13 | `apps/api/src/jobs/store.ts` | State | In-memory Map, summaries, derived counts/status | Map, reduce, state machines | Very high |
| 14 | `apps/api/src/exports/format.ts` | Output | Exact CSV and audit JSON | CSV escaping, data contracts | High |
| 15 | `apps/web/src/lib/api.ts` | Frontend transport | Base URL, fetch wrapper, export URLs | fetch, generics, errors | High |
| 16 | `apps/web/src/components/ImporterApp.tsx` | Frontend workflow | Local parse, state, polling, results, tabs, pagination | React hooks, events, effects | Very high |
| 17 | `apps/web/src/components/importer/UploadDropzone.tsx` | UI component | Drag/drop, file picker, sample actions | props, callbacks, accessibility | Medium |
| 18 | `apps/web/src/components/importer/ImporterStepper.tsx` | UI component | Derived visual progress | map, conditional rendering | Low |
| 19 | `apps/web/src/app/layout.tsx`, `page.tsx` | Next.js entry | Metadata, root layout, route, client boundary | App Router, server/client components | Medium |
| 20 | `apps/web/src/app/globals.css` | Presentation | Tokens, responsive layout, focus, tables, reduced motion | CSS cascade, media queries | Medium |
| 21 | `apps/api/src/app.test.ts` | Testing | 14 backend behavior tests and fixtures | Node test runner, assertions | High |
| 22 | `scripts/e2e-sample-flow.mjs` | E2E harness | Build, launch two services, automate sample flow | child processes, browser testing | High |
| 23 | `.env.example`, Dockerfiles, `docker-compose.yml` | Runtime/deployment | Configuration and two-container deployment | env vars, Docker stages, CORS | High |
| 24 | `docs/01_PRD.md`–`docs/AI_STRATEGY.md` | Design intent | Requirements, flow, schema, AI strategy | Product/technical design | Medium; code is authoritative |
| 25 | `samples/`, `apps/web/public/samples/` | Fixtures | Messy demonstration inputs | CSV quoting and edge cases | Medium |

Start with the shared constants and schemas because `CRM_CSV_COLUMNS` is the cross-system bridge. It defines the AI object keys, deterministic mapping targets, final Zod record, export order, UI export description, and tests. Next trace a source row through API modules. Read the UI only after you know what its API responses mean. End with tests and deployment to distinguish behavior from claims.

Generated folders (`node_modules`, `.next`, `dist`), build-info files, `.DS_Store`, and browser snapshots are not source-of-truth business logic. The lockfile matters for reproducibility but is not a good first learning file. Existing planning documents are intent; if a document conflicts with source, use source. Example: `docs/02_TRD.md` mentions an OpenAI client library, but `apps/api/src/ai/openai.ts` actually uses native `fetch` and `apps/api/package.json` has no `openai` dependency.

## 4. Prerequisites From Zero

### Web application, frontend, and backend

A web application is software accessed through a browser that responds to user actions and often communicates with a server. The **frontend** is code responsible for what the user sees and interacts with. Here that is the Next.js/React code in `apps/web`. The **backend** is trusted server code that accepts requests, applies rules, communicates with external services, and returns responses. Here that is Express code in `apps/api`. “Trusted” does not mean bug-free; it means the browser cannot be trusted to enforce security or business rules because a caller can bypass it and call the API directly.

### API and HTTP

An API is a defined interface between programs. The Listwright API is a set of HTTP routes in `apps/api/src/app.ts`. HTTP is a request/response protocol. A request has a method, URL, headers, and sometimes a body. A response has a status code, headers, and body. `POST /api/imports` uses a multipart body containing a file and returns status 202 with JSON. `GET /api/imports/:jobId` uses a path parameter. The records endpoint additionally uses query parameters such as `?page=1&limit=100`.

Headers describe metadata. `Content-Type` tells the receiver how to interpret a body. `Authorization` carries the OpenAI bearer token in the server-to-provider request. `Content-Disposition` tells the browser that an export should be downloaded with a filename. Cookies are small values browsers attach to matching requests; this project uses none. A body carries the main payload. Path parameters identify a resource, while query parameters modify how a resource is read.

Important status codes in this codebase are 202 Accepted, 400 Bad Request, 404 Not Found, 415 Unsupported Media Type, and 500 Internal Server Error. 202 is important: the server accepted the import but has not finished it. The client must poll. A perfect REST design is less important than consistent semantics.

### JSON, CSV, and multipart

JSON represents objects, arrays, strings, numbers, booleans, and null in text. It is the main API response format. CSV represents rows and columns but has tricky quoting: a comma or quote inside a value must be escaped. `quoteCsv` doubles internal quotes and encloses relevant cells in quotes. Multipart form data divides one HTTP body into named parts and is appropriate for binary/file upload; `FormData` creates it in the browser and Multer parses it on the server.

### JavaScript, TypeScript, Node.js, and npm

JavaScript is the language executed in browsers and Node.js. Node.js supplies a server runtime, filesystem/process APIs, and the event loop. TypeScript adds compile-time types, but those types disappear after compilation. Therefore `apiFetch<ImportJobResponse>` helps the editor but does not prove that server JSON has that shape. Zod supplies runtime checks.

npm is the package manager and script runner. The root `package.json` declares workspaces for `apps/*` and `packages/*`; each workspace owns scripts and dependencies. Running `npm run test` at the root forwards the command to workspaces that provide it. `package-lock.json` pins resolved dependency trees for reproducible installation.

### Frameworks, React, components, props, and state

A framework supplies conventions and infrastructure. Next.js supplies routing, build tooling, rendering boundaries, metadata, and deployment behavior. Express supplies an ordered middleware/route pipeline. React describes UI as components. A component is a function that returns JSX. **Props** are inputs from a parent; `UploadDropzone` receives `onFile`, samples, and the row limit. **State** is component-owned data that can change; `ImporterApp` holds preview, job, result pages, selected tab, expansion, busy, and error state.

Rendering is React calculating UI from current props/state. Calling a setter schedules a new render; mutating a plain variable does not. Conditional rendering chooses elements based on state. Event handlers respond to user or browser events. Controlled inputs usually bind an input’s value to state; this project mainly delegates the file input to `react-dropzone`, so it is not a typical text-field controlled form.

### Routing and backend routes

Frontend routing maps browser URLs to pages. The App Router file `apps/web/src/app/page.tsx` maps `/` to `Home`. Backend routing maps method/path combinations to handlers. Express evaluates middleware and routes in registration order. The final 404 middleware runs only if no previous route produced a response; the final error middleware runs when an error is passed/thrown through Express.

### Database and ORM

A database persists data beyond one process. An ORM maps application objects to database tables/records and generates queries. **No database or ORM is implemented in this codebase.** `jobsById` is a `Map` in server memory. It is fast and simple, but all jobs vanish on restart and separate API instances do not share state. Postgres/Prisma/Redis references belong only to recommended future architecture.

### Authentication and authorization

Authentication answers “Who are you?” Authorization answers “May you perform this action?” Neither is implemented. A random job UUID makes guessing difficult but is not authorization. Production routes would authenticate a user, store an `ownerId` with every job, and check ownership before status, records, retry, and export actions.

### Middleware, validation, normalization, and error handling

Middleware is code that runs during request processing. CORS, JSON parsing, security-header middleware, and Multer are examples. Validation decides whether input conforms to rules. Normalization converts multiple representations into one canonical representation. Sanitization removes or neutralizes unsafe/unwanted text. Error handling converts expected failures into understandable responses and prevents sensitive internals from leaking.

The project validates extension, upload count/size, row cap, provider shape, domain fields, and enums. It normalizes phone digits, dates, status/source spellings, newlines, and contact precedence. It still lacks MIME/content sniffing, request schemas for query parameters, CSV-formula protection, authentication, rate limits, and production error classification.

### Deployment

Deployment places built software in a runtime environment. The web and API are separate processes and Docker images. Environment variables provide deployment-specific values. `NEXT_PUBLIC_` values are exposed to browser bundles, so secrets must never use that prefix. `OPENAI_API_KEY` belongs only on the backend. The Next config rejects insecure/local API URLs during a Vercel build. Docker Compose wires the two containers locally, but `depends_on` controls start order, not readiness.

## 5. JavaScript Mastery for CodeChef Round

### Variables, scope, and hoisting

`var` is function-scoped and may be redeclared. `let` and `const` are block-scoped. `const` prevents rebinding, not mutation: `const rows = []; rows.push(x)` is legal. The project uses `const` by default and `let` when a binding changes, such as `let response` in `apiFetch`.

Hoisting means declarations are registered before execution. Function declarations can be called before their source line. A `var` binding exists from the start of its function with value `undefined`. A `let`/`const` binding exists but cannot be accessed before initialization; that period is the temporal dead zone.

```js
console.log(a); // undefined
var a = 3;
// console.log(b); // ReferenceError: temporal dead zone
let b = 4;
```

Interview answer: “All declarations are processed before execution, but initialization differs. `var` initializes to `undefined`; `let` and `const` remain inaccessible until their declaration executes. I prefer `const`, then `let`, and avoid `var` because block scope and the TDZ reveal mistakes earlier.”

### Data types, references, truthiness, and coercion

Primitive values are string, number, boolean, null, undefined, symbol, and bigint. Objects, arrays, and functions are reference values. Assigning an object copies the reference, so both variables can observe mutation. `===` compares without coercion; `==` applies conversion rules and creates traps such as `0 == false` being true. Prefer `===`.

Falsy values are `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, and `NaN`. Empty arrays and objects are truthy. The code often uses `value || ""`, which treats every falsy value as missing, and `value ?? ""`, which treats only null/undefined as missing. That distinction matters for valid zero values.

```js
console.log([] == false); // true because loose equality coerces both sides
console.log([] === false); // false
console.log(null == undefined); // true
console.log(null === undefined); // false
```

### Functions and callbacks

A function declaration is hoisted with its body. A function expression assigns a function value to a variable. Arrow functions are concise and capture lexical `this`; they are not constructors. Parameters name inputs; arguments are supplied values. Defaults apply when an argument is `undefined`. Rest gathers remaining arguments; spread expands an iterable or object.

Functions are first-class values: they can be stored, passed, and returned. A higher-order function receives or returns a function. `map`, `filter`, event handlers, the extractor argument of `processBatches`, and the predicate passed to `waitFor` are examples. A callback is a function another function calls later or during its operation.

```js
function declaration(x) { return x * 2; }
const expression = function (x) { return x * 2; };
const arrow = (x = 1) => x * 2;
const sum = (...numbers) => numbers.reduce((a, b) => a + b, 0);
```

### Closures

A closure is a function plus access to the lexical environment where it was created. Closures exist because inner functions may outlive the outer call yet still need its variables. React handlers close over render state; `loadResults` closes over `job`, `recordsPageNumber`, and `skippedPageNumber`. `pick` in `buildCrm` closes over `raw`.

Classic trap:

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
// 3, 3, 3: one function-scoped binding
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j), 0);
// 0, 1, 2: a new block binding per iteration
```

Interview answer: “A closure lets a function retain lexical variables after the outer function has finished. It powers callbacks, private state, and React handlers. The common loop problem is sharing one `var` binding; `let` creates a per-iteration binding.”

### `this`, call, apply, and bind

`this` is determined by how a regular function is called. `obj.method()` sets `this` to `obj`; a detached call loses that receiver. `call` invokes with an explicit receiver and individual arguments; `apply` uses an argument array; `bind` returns a new permanently bound function. Arrow functions do not create their own `this`; they capture it lexically. Listwright mostly avoids complex `this` by using modules and functions.

```js
const user = { name: "A", show() { return this.name; } };
const detached = user.show;
console.log(user.show()); // A
console.log(detached.call({ name: "B" })); // B
const arrowHolder = { name: "A", show: () => this?.name };
// Arrow does not receive arrowHolder as this.
```

### Arrays and objects

`map` transforms each element and returns a new array. `filter` keeps matches. `reduce` combines values. `forEach` runs effects and returns `undefined`. `find` returns the first match. `some` asks whether any match; `every` asks whether all match. The repository uses these everywhere: `preprocessRows` maps raw rows; `updateCounts` filters and reduces batches; `normalizeBatchResult` finds the provider record for each row.

Spread and destructuring are shallow. `{...obj}` copies the top object but nested references remain shared. `structuredClone` can deep-clone supported data, while JSON stringify/parse loses types and fails on cycles. Immutability makes state changes easier to reason about, but backend job processing intentionally mutates in-memory objects. That mutation is simple in one process but makes concurrent correctness harder.

```js
const original = { nested: { count: 1 } };
const copy = { ...original };
copy.nested.count = 2;
console.log(original.nested.count); // 2
```

`Object.keys`, `values`, and `entries` expose own enumerable properties. `parseCsvBuffer` uses `Object.entries`; preprocessing joins `Object.values`; `Object.fromEntries` builds OpenAI schema properties and sanitized rows.

### Asynchronous JavaScript and the event loop

JavaScript executes one call stack per thread. Host runtimes perform timers, networking, and I/O outside that stack, then enqueue callbacks. Promise reactions and `queueMicrotask` use the microtask queue. Timers use a task/macrotask queue. After the current stack ends, microtasks drain before the next timer task.

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
queueMicrotask(() => console.log("D"));
console.log("E");
// A, E, C, D, B
```

A Promise represents eventual fulfillment or rejection. `async` functions always return a Promise. `await` pauses that async function, not the whole process. In `processBatches`, each `await extractor(...)` makes batches sequential. In `Promise.all`, independent promises can progress concurrently and the returned promise rejects on the first rejection.

`startJobProcessing` uses `queueMicrotask` so the route can finish setting up and return 202. Do not call it a background worker. CPU-heavy work in that microtask would still block the Node event loop. Network `fetch` yields while waiting, but orchestration, parsing, and normalization run in the API process.

### Error handling

`throw` stops normal execution and transfers control to the nearest compatible catch. `try/catch` catches synchronous throws and rejected promises that are awaited inside the try. A rejected Promise that is neither awaited nor returned can become an unhandled rejection. The `void` operator in `void processBatches(...)` intentionally ignores the returned Promise, but `processBatches` catches batch-level failures internally.

```js
async function f() {
  try {
    await Promise.reject(new Error("bad"));
  } catch (error) {
    console.log(error.message);
  }
}
```

The API distinguishes parsing errors (400), Multer errors (400), unknown request errors (500), and batch errors stored in job state. It does not yet classify provider 429/5xx/timeouts differently.

### Modules

ES modules use `import`/`export`; CommonJS uses `require`/`module.exports`. All packages declare `"type": "module"`, so source uses ESM. Under NodeNext compilation, TypeScript source imports local modules with `.js` extensions because emitted JavaScript files have `.js` paths. `packages/shared/src/index.ts` re-exports constants and schemas, allowing `import {...} from "@listwright/shared"`.

A named export must be imported by name. A default export may be renamed by the importer. The project uses both: `ImporterApp` is named; `RootLayout` and `Home` are default; `Papa` is a default library import.

### React-related JavaScript

React event handlers are function values passed as props such as `onClick={() => void confirmImport()}`. A state setter schedules a render. State updates are not immediate mutable assignment. `useMemo` caches a derived value between renders when dependencies are unchanged; `useCallback` caches a function identity. Neither should be added automatically—use them when identity or expensive recomputation matters.

`useEffect` synchronizes the component with external systems. The polling effect installs an interval and returns cleanup that clears it. Dependencies matter because an effect closes over values from its render. In this project the polling effect depends on the whole `job`, so each polled job update recreates the interval. It works, but depending on `job?.id` and terminal state or using a timeout loop/AbortController could be more controlled.

## 6. Architecture Overview

```text
User
  |
  v
Next.js / React browser UI
  |-- File + PapaParse --------------------> local PreviewState (no API yet)
  |
  `-- Confirm import: multipart POST
          |
          v
Express API -> Multer limits -> csv-parse -> deterministic preprocessing
                                              |
                                              v
                                      five-row ImportBatch[]
                                              |
                         +--------------------+--------------------+
                         |                                         |
                 OpenAI JSON Schema                       deterministic mapper
                 (when key exists)                       (when key is absent)
                         +--------------------+--------------------+
                                              |
                                              v
                             normalization + shared Zod validation
                                              |
                                              v
                               process-local Map<string, ImportJob>
                                  ^         ^          ^
                                  |         |          |
                             polling   pagination   retry/export
                                  `--------- React UI -----------'
```

The frontend layer owns interaction and display, but not import correctness. The backend/API layer owns upload bounds, parsing, business rules, provider calls, job state, and exports. The “database” layer is absent; the Map is volatile application memory. The authentication layer is absent. The UI layer uses a custom global CSS system plus Lucide icons, Sonner notifications, and semantic HTML. Deployment runs Next and Express separately.

This architecture makes sense for an internship demo because it isolates responsibilities without introducing database/account setup. A shared package prevents contract vocabulary from drifting. Small batches isolate provider failures. Polling is easy to understand. Alternatives include a Next.js-only full-stack app with route handlers, a single Express-rendered app, a database-backed worker system, or server-sent events instead of polling. The current choice optimizes demonstrability; production would optimize durability, ownership, observability, and concurrency.

### Main flow, step by step

1. Next renders `/`; the page’s server component returns the client `ImporterApp`.
2. A file is dropped or selected. `parseFile` validates the extension and asks PapaParse to parse locally.
3. PapaParse’s callback sanitizes values and writes `PreviewState`. This is browser memory only.
4. `confirmImport` builds `FormData` and calls `apiFetch` with `POST /api/imports`.
5. Multer parses one in-memory file with a 5 MB cap. The handler checks that the filename ends in `.csv`.
6. `parseCsvBuffer` converts bytes to row objects and applies the server row limit.
7. `preprocessRows` normalizes cells and derives deterministic signals; `chunkRows` creates arrays of five rows.
8. `createBatches` wraps chunks in batch state. The route creates and stores an `ImportJob`, schedules processing, and returns 202.
9. `processBatches` marks each batch processing, awaits extraction, normalizes/validates results, appends them, and derives counts/status. A failure is recorded and later batches continue.
10. The frontend polls the job summary every 900 ms and separately fetches imported/skipped pages.
11. Terminal state enables exports. CSV includes only canonical CRM fields; JSON includes review metadata.

### What changes at production scale

Persist the job before acknowledging it. Store import, batch, result, skip, note, and error records in Postgres. Publish batch IDs to a durable queue. Workers atomically lease batches and commit idempotently. Add authenticated ownership checks. Store files only if needed, with encryption and deletion/retention rules. Add rate and size quotas, provider concurrency limits, retry/backoff, dead-letter handling, structured logs, traces, metrics, audit logs, and evaluation datasets. Use adaptive polling or server push. None of these are implemented today.

## 7. Frontend Deep Dive

### Entry and routing

`apps/web/src/app/layout.tsx` defines metadata, favicon, global CSS, language, and the Sonner `Toaster`. `apps/web/src/app/page.tsx` is the only route and renders `ImporterApp`. App Router files are server components by default. `ImporterApp.tsx` begins with `"use client"` because it needs browser `File`, PapaParse, hooks, refs, effects, and click/keyboard handlers.

### `ImporterApp`: owned state and derived state

`preview` stores the selected `File`, name, columns, locally parsed rows, and parser notes. `job` stores the latest server summary. `recordsPage` and `skippedPage` hold paginated result payloads. Page-number state drives result fetching. `activeTab` controls the visible tab panel, `expanded` selects one before/after comparison, `busy` prevents duplicate UI actions, and `error` drives the alert. `tabRefs` supports roving focus for accessible keyboard tabs.

Derived values should not become duplicate state. `progress` derives from processed/total rows with `useMemo`; terminal state, export readiness, current step, and success rate derive directly each render. This avoids synchronization bugs.

### Local preview

`parseFile` is a `useCallback`. It checks only the filename extension on the client, then calls `Papa.parse` with `header: true` and greedy empty-line skipping. Completion sanitizes each cell, uses parser fields as columns, stores at most three parser messages, and shows a toast. The full parsed row array stays in browser state, while `PreviewTable` renders at most 80 rows. The server independently parses the original `File`; the frontend preview is not trusted.

Potential failures include malformed CSV, an extension that lies about content, an empty file that still creates preview state, a very large file consuming browser memory, PapaParse differences from `csv-parse`, and no explicit preview parsing/busy state. The product document says Confirm should be disabled until valid input, but current `parseFile` stores a preview even when rows may be empty or parser notes exist. That is a code/document gap.

### Confirmation and API calls

`confirmImport` clears result state, resets pagination, appends the file under multipart field `file`, posts it, immediately fetches the new job summary, and updates UI. It does not manually set `Content-Type`; that is correct because the browser must add the multipart boundary. `apiFetch` turns network failures and non-2xx JSON errors into `Error` objects.

The generic `apiFetch<T>` is compile-time only. A malicious or buggy API could return the wrong shape and the frontend would trust it. A production improvement is `apiFetch(path, Schema)` and `schema.parse(await response.json())`, reusing shared response schemas.

### Polling and result loading

The first effect installs a 900 ms interval while the job is nonterminal. Each tick fetches the job summary. Cleanup clears the interval. Because requests can take longer than 900 ms, interval callbacks can overlap; responses can arrive out of order. There is no AbortController on unmount/job change. A recursive `setTimeout` after each completed request, request generation ID, or AbortController would avoid overlap/stale writes.

The second effect fetches both imported and skipped pages using two sequential awaits when records exist or status is terminal. `Promise.all` could reduce latency. A failure of either loses both state updates in that execution. Separate loading/error states would provide better feedback. Fetching result pages throughout processing is intentional so partial results appear.

### Results and accessibility

The UI includes progressbar ARIA attributes, an `aria-live` progress panel, semantic tables, status text in addition to color, keyboard-operable controls, and a manual tab pattern with ArrowLeft/Right, Home, End, roving `tabIndex`, `aria-controls`, and tabpanels. The CSS includes visible focus and reduced-motion handling. `UploadDropzone` uses react-dropzone’s input props and keeps the explicit button from triggering the root click twice with `stopPropagation`.

The largest maintainability concern is that `ImporterApp.tsx` is about 606 lines and mixes orchestration with rendering. Extract a `useImportJob` hook, polling hook, `ProgressPanel`, `ResultsTabs`, and table modules. Keep state near the component that needs it, but centralize the workflow state machine.

### Important frontend components

#### Function/Component: `ImporterApp`

File: `apps/web/src/components/ImporterApp.tsx`

1. **What it does:** Owns the complete single-page workflow.
2. **Why it exists:** Coordinates local preview, server import, progress, review, and export.
3. **Inputs:** None; it reads public configuration through `api.ts` and user events.
4. **Outputs:** JSX and HTTP side effects.
5. **Internal logic:** Nine state groups, derived progress, parsing, confirmation, retry, keyboard tabs, two effects.
6. **Dependencies:** shared types/constants, PapaParse, React, Sonner, child components, `apiFetch`.
7. **Failure cases:** overlapping polling, stale results, malformed preview, large memory use, backend/network failures.
8. **Security:** preserves the consent boundary, but client checks are UX only and confirmed PII leaves the browser.
9. **Interview explanation:** “It is the workflow container; child components render focused pieces while this component coordinates state and effects.”
10. **Improvement:** Extract state machine/hooks and runtime-parse responses.

#### Function/Component: `UploadDropzone`

File: `apps/web/src/components/importer/UploadDropzone.tsx`

It receives callbacks rather than owning the selected file, which makes the parent the source of truth. `useDropzone` restricts chooser/drop acceptance to CSV and one file, exposes active/reject visual state, and returns props that must be spread onto the root/input. It also renders sample loaders and consent copy. The server must still validate because request callers can bypass this component.

#### Function/Component: `ImporterStepper`

File: `apps/web/src/components/importer/ImporterStepper.tsx`

It maps four static steps to complete/current/upcoming state. `currentStep` is derived in the parent. The component chooses a checkmark, step icon, or empty circle and includes an accessible nav label. It is a presentational component with one prop and no internal state.

#### Function: `apiFetch<T>`

File: `apps/web/src/lib/api.ts`

It joins a configured base URL with a path, translates network errors to a user-oriented message, parses server error JSON when possible, and returns JSON. It assumes successful responses are JSON and has no timeout, cancellation, retry, credentials policy, or runtime schema parsing.

## 8. Backend/API Deep Dive

### Server entrypoint and middleware order

`apps/api/src/index.ts` reads `PORT`, calls `createApp`, and starts listening. Keeping `createApp` separate improves testing. Within `createApp`, Express hides `X-Powered-By`, installs custom `nosniff`, no-referrer, and no-store headers, configures in-memory Multer, clamps the row limit, adds CORS and JSON parsing, then registers routes, 404, and error middleware.

Middleware order matters. Multer is route-specific on the import POST. The 404 handler must follow routes. The four-argument error handler must follow normal handlers. The app lacks Helmet’s wider header set, request IDs, logs, rate limiting, compression, auth, and request-timeout middleware.

### Function/Component: `createApp`

File: `apps/api/src/app.ts`

1. **What it does:** Constructs the Express application and all routes.
2. **Why it exists:** Separates app configuration from `listen`, enabling test/runtime reuse.
3. **Inputs:** Optional row limit; otherwise environment configuration.
4. **Outputs:** Express application.
5. **Internal logic:** Headers, upload limits, CORS, routes, job creation, pagination, retry, exports, errors.
6. **Dependencies:** Express, CORS, Multer, shared defaults/schema, parser, processor, store, formatters.
7. **Failure cases:** invalid config falls back; parse errors become 400; unknown errors become 500.
8. **Security:** useful bounds and headers, but no identity, authorization, rate limits, MIME verification, ownership, or formula protection.
9. **Interview explanation:** “It is the composition root for the HTTP layer.”
10. **Improvement:** Split routers/controllers, add validated request schemas and centralized typed errors.

### Request lifecycle for `POST /api/imports`

Multer buffers one file. Missing file returns 400. A non-`.csv` original name returns 415. The handler parses and preprocesses inside `try/catch`, creates batches and an initial `ImportJob`, sanitizes the filename, inserts it into `jobsById`, schedules processing, and returns 202. If `rows.length >= rowLimit`, it adds a warning that the cap applied. That condition can also be true for a file containing exactly the limit, so it may report truncation even when there were no extra rows; because parsing slices before returning, the handler cannot know the original count. A parser that reads one extra row or returns truncation metadata would fix this.

The extension check is not content validation. A renamed binary or malformed text reaches `csv-parse`, which likely throws, but production should inspect MIME/signature/content and consider CSV parser resource limits.

### Function: `parseCsvBuffer`

File: `apps/api/src/parsing/csv.ts`

It parses a `Buffer` synchronously, uses the header row as keys, tolerates unequal column counts, preserves empty lines for later analysis, rejects no-data input, slices to the limit, removes blank headings, converts values to strings, removes line breaks, and trims. Synchronous whole-file parsing is acceptable under 5 MB/1,000 rows but blocks the event loop during parsing. Streaming is a future scale improvement.

### Function: `preprocessRows`

File: `apps/api/src/parsing/preprocess.ts`

It normalizes each row, computes a lowercase JSON signature for exact duplicate detection, assigns human CSV row numbers beginning at 2, and attaches `DeterministicSignals`. Regex and allowlist logic detects email-like text, phone candidates, parseable date hints, likely status/source strings, possible country codes, empty rows, extra contacts, and warnings. This is “grounding”: the later mapper receives evidence derived by predictable rules.

Risks include approximate regexes, locale-sensitive date parsing, a ten-digit phone assumption, exact-only duplicate detection, false positives from all-cell text, and country-code inference by removing the last ten digits. These heuristics are review aids, not international contact validation.

### Function: `extractDeterministically`

File: `apps/api/src/ai/deterministic.ts`

This fallback maps fields by header substrings, then uses detected signals for contacts, dates, statuses, and sources. It skips rows without email/mobile and assigns heuristic confidence. It also creates batch mapping notes from detected header-to-target relationships. It makes the demo work without a credential and provides predictable baseline behavior. First-match substring logic can collide—`country` may match `country code`, “lead” can match unrelated headings, and ambiguous combined columns are not semantically understood.

### Function: `extractBatch`

File: `apps/api/src/ai/openai.ts`

1. **What it does:** Chooses deterministic fallback or sends a structured Chat Completions request.
2. **Why it exists:** Hides provider selection behind one batch-extractor contract.
3. **Inputs:** `SourceRow[]` and batch ID.
4. **Outputs:** `Promise<AiBatchResult>`.
5. **Logic:** Checks key, builds prompt/body, applies 45-second abort timeout, checks HTTP status, extracts message content, JSON-parses it, and Zod-validates it.
6. **Dependencies:** native `fetch`, Zod, allowlists/columns, deterministic fallback.
7. **Failures:** network, timeout, 401, 429, 5xx, empty choice/content, invalid JSON, schema mismatch.
8. **Security:** API key is server-only; raw confirmed lead PII is sent to the provider; error body may enter job/UI and needs redaction.
9. **Interview explanation:** “The LLM is an adapter, not the source of truth. JSON Schema constrains shape, private Zod checks the provider boundary, and downstream normalization owns domain validity.”
10. **Improvement:** Provider abstraction, Responses API evaluation/migration plan, typed error classification, bounded retry/backoff, usage metrics, refusal/finish handling, and AI evals.

The current request uses `response_format: {type: "json_schema", ... strict: true}`. Structured output improves shape adherence but only supports a subset of JSON Schema and does not prove that values are grounded. The backend correctly revalidates. Do not claim the `temperature: 0.1` setting makes output deterministic. For current platform terminology, use OpenAI's official [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs); for interview explanations, always describe what this repository actually sends in `openai.ts` rather than assuming a newer API migration is already implemented.

### Function: `normalizeBatchResult`

File: `apps/api/src/validation/normalize.ts`

It indexes source rows by row number, normalizes/deduplicates mapping notes, honors valid provider skip results, then processes every remaining source row. It chooses provider record by row number, normalizes the CRM object, skips missing-contact rows, safe-parses the final CRM schema, and builds validated imported/skipped objects with UUIDs, warnings, confidence, and mapping references.

This is the domain gate. `normalizeCrm` prioritizes deterministic detected contacts over AI strings, reduces a phone to the last ten digits, appends extra contacts to `crm_note`, blanks unparseable dates/unknown enums, and cleans all strings. `clamp` bounds confidence. `dedupeMappingNotes` uses a composite key. Risks include O(rows × result.records) lookup because of repeated `find` (small for batches of five), missing validation that every AI row number is unique/in-batch, arbitrary mapping note IDs, and international phone assumptions.

### Function: `processBatches`

File: `apps/api/src/jobs/processor.ts`

It marks the job processing, loops sequentially, increments attempts, clears the batch error, awaits extraction, normalizes, appends results/notes, marks completion, or catches and records failure. It updates derived counts before, during, and after each batch. Dependency injection of `extractor` makes timeout/failure tests easy.

Sequential execution prevents provider bursts and simplifies mutable state, but a maximum 1,000-row import can create 200 provider calls. There is no concurrency pool, automatic retry, cancellation, idempotency, durable handoff, or crash recovery. Because a retry appends outputs, atomic batch claims and unique batch-result commits are necessary before concurrency.

### Function: `updateCounts`

File: `apps/api/src/jobs/store.ts`

It derives completed/failed batches, processed rows, imported/skipped totals, timestamp, and overall status. Failed batches count as processed because they were attempted. `partial_failed` means at least one batch completed and at least one failed after all are terminal. Its implicit mutable state machine is compact but should become explicit/transactional in durable storage.

## 9. Database and Data Flow Deep Dive

**No database exists in this codebase.** There are no tables, collections, ORM models, migrations, indexes, constraints, transactions, or SQL/NoSQL queries. `apps/api/src/jobs/store.ts` exports `jobsById = new Map<string, ImportJob>()`. It lasts only for the current Node process.

The in-memory model still has entity-like structures:

| Structure | Important fields | Relationship |
|---|---|---|
| `ImportJob` | UUID, status/timestamps, filename, cap/counts, errors | Owns batches, imported/skipped records, notes |
| `ImportBatch` | UUID, index, status, row range, attempts/error | Belongs to one job; owns source rows |
| `SourceRow` | CSV row number, raw object, deterministic signals | Input to a batch |
| `ImportedRecord` | UUID, row number, original row, CRM object, confidence/warnings/note IDs | Successful normalized output |
| `SkippedRecord` | UUID, row number, original row, reason/warnings | Rejected output |
| `MappingNote` | ID, scope, batch ID, source/target, explanation/confidence | Evidence associated with mappings |
| `JobError` | optional batch ID, message, retryable, timestamp | Failure history |

Creation happens when the POST route constructs a job and inserts it into the Map. Reads happen through `getJob`, summaries, pagination, and exports. Updates happen through direct mutation during processing and retry. Deletion is not implemented; jobs accumulate until restart. There is no TTL or memory cleanup.

Frontend preview rows map to the original uploaded file, not directly to server row objects. The server reparses and numbers rows from 2 because line 1 is the header. A provider result identifies the source by `rowNumber`; normalization rejoins it to `SourceRow`. The final CRM object has exactly 15 fields. CSV drops review metadata; JSON retains it.

### Production relational model

A reasonable Postgres design would use `users`, `import_jobs`, `import_batches`, `imported_records`, `skipped_records`, `mapping_notes`, and `job_errors`. Use UUID primary keys; foreign keys with deliberate deletion rules; unique `(job_id, row_number)` for one final outcome per row; unique `(job_id, batch_index)`; checks for confidence 0–1 and enum statuses; indexes on `(owner_id, created_at desc)`, `(job_id, status)`, and result pagination keys. Use transactions to claim a batch and commit its outputs/status atomically. JSONB can retain raw rows and CRM payloads initially, but indexed/searchable fields may deserve columns. A durable queue must carry IDs, not entire unbounded PII objects.

## 10. Authentication and Authorization Deep Dive

Authentication and authorization are **not implemented in this codebase**. There are no signup, login, logout, password, JWT, session, cookie, protected route, current-user endpoint, role, or ownership checks. All users reach `/`. Anyone who knows a job ID can read progress/results, retry, or export it. UUID entropy reduces guessing but is not an access-control policy.

To add cookie-session auth: create a user table with securely hashed passwords or use an identity provider; on login verify credentials; create an opaque random session stored server-side; send only a `Secure`, `HttpOnly`, `SameSite` cookie; authenticate requests in middleware; attach `userId`; store `ownerId` on jobs; make `getJob` query by both ID and owner; and apply the check to status, records, skipped, retry, CSV, and JSON. Add CSRF protection depending on SameSite/cross-site requirements.

A JWT is a signed token containing claims. Signature verification detects tampering but does not encrypt claims. Revocation, rotation, expiry, audience/issuer checks, and secure storage matter. Browser tokens are generally safer in HttpOnly cookies than JavaScript-readable localStorage because XSS can read localStorage. A server-side session is an opaque ID referring to server-held state; it simplifies revocation at the cost of a session store.

Interview answers:

- **Authentication:** “Proving identity, for example by verifying a session cookie and loading a user.”
- **Authorization:** “Checking that the authenticated user is allowed to access this specific job or action.”
- **Protect a route:** “Authenticate in middleware, validate the resource ID, query by resource and owner, reject with 401 when unauthenticated and 403/404 when unauthorized, and repeat this on every subresource/export.”
- **Common mistakes:** weak password hashing, long-lived tokens, localStorage exposure, missing ownership on one export route, accepting unverified JWT algorithms/claims, secrets in frontend code, no CSRF plan for cookies, and logging credentials/PII.

## 11. API Design and Request Lifecycle

| Method and path | Purpose | Auth | Input | Success | Main errors |
|---|---|---|---|---|---|
| `GET /health` | Liveness identity | None | None | 200 `{status:"ok", service:"listwright-api"}` | Generic 500 only |
| `POST /api/imports` | Create async import | None | multipart `file` | 202 `{jobId,status,rowLimit}` | 400 missing/parse/size, 415 extension |
| `GET /api/imports/:jobId` | Job summary/progress | None | path ID | 200 `{job}` | 404 missing/reset |
| `GET /api/imports/:jobId/records` | Paginated imported rows | None | `page`, `limit` | 200 job + pagination + records | 404 |
| `GET /api/imports/:jobId/skipped` | Paginated skipped rows | None | `page`, `limit` | 200 job + pagination + records | 404 |
| `POST /api/imports/:jobId/retry` | Requeue failed batches | None | path ID | 200 no-op or 202 scheduled | 404; race not detected |
| `GET /api/imports/:jobId/export.csv` | Strict CRM download | None | path ID | 200 CSV attachment | 404 |
| `GET /api/imports/:jobId/export.json` | Audit download | None | path ID | 200 JSON attachment | 404 |

REST models resources. GET should read without changing state; POST can create or trigger non-idempotent actions. The import POST is non-idempotent: repeating it creates a new job. Retry is action-oriented rather than a pure resource update, a pragmatic design. GET/export should be safe, although downloads expose sensitive data without auth. Pagination clamps page to at least 1 and limit to 1–200; it does not reject decimals explicitly and reports `totalPages = 1` even for zero records. That UI-friendly convention should be documented.

Stateless HTTP means each request contains enough context; it does not mean the server holds no state. This API holds job state but carries job ID per request. Idempotency means repeating an operation has the same intended effect. GET is intended idempotent; retry is not concurrency-safe. Filtering and sorting are not implemented.

### Detailed invalid-input flow

If the multipart field is missing, the route returns 400. If the file name does not end with `.csv`, it returns 415. Multer size/count failures go to error middleware and become 400. Parser failure/no rows is caught and becomes 400 with its message. Once a job exists, individual provider/normalization errors do not fail the HTTP request; they become batch/job state visible through polling. That distinction—request failure versus asynchronous job failure—is important.

## 12. File-by-File Code Walkthrough

### `package.json`

Defines a private npm-workspace root named `listwright`, requires Node 20+, and forwards dev/build/test/typecheck/lint to workspaces. The E2E script is root-only. If workspace scripts or names are wrong, local orchestration and Docker builds fail. Interview question: why a monorepo? Answer: shared contracts and one install/script surface, with separate deployable apps.

### `packages/shared/src/constants.ts`

Defines 15 canonical export columns, allowed CRM statuses/sources, job/batch states, and 1,000-row default. `as const` preserves literal element types. It is the highest-impact file because changes ripple through schemas, prompt schema, deterministic mapping, normalization, exports, tests, and UI copy.

### `packages/shared/src/schemas.ts`

Defines executable Zod contracts. `CsvSafeStringSchema` transforms newlines/whitespace. `CrmRecordSchema` enforces all fields and enums. Imported/skipped/note/job/page/export schemas compose smaller schemas. `z.infer` generates TypeScript types from runtime definitions, avoiding separate handwritten public types. Weakness: the frontend imports inferred types but does not call the response schemas.

### `apps/api/src/types.ts`

Defines internal types not meant as public API schemas: deterministic evidence, source rows, mutable batches/jobs, and more permissive AI-shaped records. The AI shapes are intentionally optional/loose because normalization must defend against incomplete proposals. If these types are mistaken for runtime validation, invalid JSON can still enter at runtime.

### `apps/api/src/app.ts`

The transport composition root. Imports formatters, processor, store, parsing, shared defaults, and Express middleware. Exports `createApp` plus helpers tested directly. It contains every endpoint, so growth will make it a maintenance hotspot. Split router/controller/service boundaries when features increase, but do not create layers with no behavior merely for pattern names.

### `apps/api/src/parsing/csv.ts`

Small deterministic boundary from bytes to strings. It deliberately does not perform CRM mapping. Its `relax_column_count` favors review over hard rejection. If wrong, downstream row shapes and traceability break.

### `apps/api/src/parsing/preprocess.ts`

Produces evidence without an LLM. `preprocessRows` owns duplicate scope per file; `chunkRows` is generic; private helpers clean phones, reject date-like phones, and deduplicate values. If wrong, both fallback and AI prompts receive misleading signals.

### `apps/api/src/ai/deterministic.ts`

Defines header aliases in `fieldHints`, creates CRM proposals, and records mapping evidence. It imports canonical lists from shared. If a target field is added, update `fieldHints`, `buildCrm`, structured schema, normalization, shared schema, UI/export/tests.

### `apps/api/src/ai/openai.ts`

Contains both JSON Schema and a Zod mirror. Duplication is required across provider schema and runtime validation but creates drift risk. It uses native `fetch`, not the OpenAI SDK. The system message establishes no-invention, ambiguity, allowlist, skip, and mapping-note rules. The user message sends `{batchId, rows}` including raw lead data and deterministic signals.

### `apps/api/src/validation/normalize.ts`

The most important correctness file. It translates provider-shaped results into validated domain objects. Final accepted records can have blank name/company/etc.; only both contact methods missing causes a forced skip, and Zod enforces structural/enumerated/date rules. Be able to explain why validation occurs after normalization.

### `apps/api/src/jobs/processor.ts`

Creates batches and orchestrates their lifecycle. `queueMicrotask` separates response setup from processing; `void` explicitly discards the Promise. The injectable extractor enables deterministic tests. If wrong, counts, retries, duplicates, or job terminal states break.

### `apps/api/src/jobs/store.ts`

Exports global mutable process state and derivation functions. `summarizeJob` deliberately excludes source rows, full records, and batches from status responses. `updateCounts` is a state reducer implemented through mutation/scans. Production must replace direct access with a repository/transaction boundary.

### `apps/api/src/exports/format.ts`

`formatCrmCsv` guarantees exact column order and `buildJsonExport` retains audit data. `quoteCsv` handles commas/quotes/newlines but not spreadsheet formula injection. If wrong, downstream CRM imports can shift columns or execute formulas on open.

### `apps/web/src/app/layout.tsx` and `page.tsx`

Layout defines global document concerns. Page is a tiny composition boundary. Do not claim server-side data fetching; the workflow is client-side after initial rendering.

### `apps/web/src/components/ImporterApp.tsx`

This is both application controller and view collection. Read in four passes: state/derived values; event callbacks; effects; rendered child functions. If it is wrong, the entire visible workflow breaks. Its size is the main frontend maintainability issue.

### `apps/web/src/components/importer/*`

These are focused reusable UI pieces. Their callback props demonstrate inversion of control: they report actions upward without knowing import state or API details.

### `apps/web/src/lib/api.ts`

Centralizes origin and common fetch error behavior. `exportUrl` returns direct links because downloads do not need JSON parsing. After auth, direct cross-origin links must include a compatible cookie/token design.

### `apps/web/src/app/globals.css`

Defines design tokens, component classes, responsive breakpoints at 980/640 px, reduced motion, sticky/scrollable tables, visible focus, and status colors. The UI avoids a heavy component framework. CSS class strings are tightly coupled to TSX.

### `apps/api/src/app.test.ts`

Uses Node’s built-in test runner and strict assertions. Tests pure helpers and orchestration, including timeout injection and retry. It does not start Express or send actual HTTP/multipart requests. Global Map isolation is therefore mostly untested.

### `scripts/e2e-sample-flow.mjs`

Builds both apps, spawns API and web, waits for URLs, drives a real browser through an external Playwright-compatible CLI, checks result/export UI, then cleans child processes in `finally`. It is a smoke test, not comprehensive E2E coverage.

### Docker/config/docs/samples

Multi-stage Dockerfiles install at workspace root, compile, and copy runtime assets. Compose supplies ports/env. `.env.example` documents backend/public values. Planning docs state scope and rationale, but source is authoritative. Sample copies exist in repository `samples/` and browser public assets; maintaining two copies risks drift.

## 13. Important Functions and Components

| Name | Path | Role | Inputs → outputs | Edge cases / improvement |
|---|---|---|---|---|
| `createApp` | `apps/api/src/app.ts` | HTTP composition root | options → Express app | Split routes; typed errors; auth/rate limit |
| `parseCsvBuffer` | `apps/api/src/parsing/csv.ts` | Parse/bound rows | Buffer, limit → row objects | Streaming/content validation/truncation metadata |
| `preprocessRows` | `apps/api/src/parsing/preprocess.ts` | Derive evidence | raw rows → SourceRows | International phones/dates; fuzzy duplicates |
| `chunkRows` | same | Bound failure units | SourceRows, size → chunks | Validate positive size |
| `extractDeterministically` | `apps/api/src/ai/deterministic.ts` | No-key mapping | rows, batch ID → AI result | Header collisions; limited semantics |
| `extractBatch` | `apps/api/src/ai/openai.ts` | Provider adapter/fallback | rows, batch ID → Promise result | Retry/backoff/refusal/usage/evals |
| `normalizeBatchResult` | `apps/api/src/validation/normalize.ts` | Domain gate | AI result, rows, batch → final groups | Validate uniqueness and note references |
| `createBatches` | `apps/api/src/jobs/processor.ts` | Initialize batch state | chunks → ImportBatch[] | Empty chunks |
| `startJobProcessing` | same | Defer orchestration | job, optional batches → void | Not durable; unhandled top-level risk |
| `processBatches` | same | Sequential state machine | job, batches, extractor → Promise<void> | Race/idempotency/concurrency |
| `updateCounts` | `apps/api/src/jobs/store.ts` | Derive summary/status | mutable job → mutation | Repeated scans; explicit transitions |
| `formatCrmCsv` | `apps/api/src/exports/format.ts` | Exact downstream export | CRM records → CSV | Formula injection |
| `ImporterApp` | `apps/web/src/components/ImporterApp.tsx` | UI workflow | events/API → JSX/state | Split hooks/components; cancel requests |
| `parseFile` | same | Local preview | File → PreviewState | Empty/malformed/large input |
| `confirmImport` | same | Start job | preview → API state | Double submission/idempotency |
| polling effect | same | Refresh status | job → interval/fetch | Overlap/stale responses |
| results effect | same | Page data | job/page numbers → page state | Sequential requests/loading granularity |
| `apiFetch<T>` | `apps/web/src/lib/api.ts` | Transport wrapper | path/init → typed Promise | Generic is not runtime validation |

The functions form one teaching chain: `parseFile` proves local preview; `confirmImport` crosses the trust boundary; `parseCsvBuffer` and `preprocessRows` establish deterministic evidence; `extractBatch` proposes; `normalizeBatchResult` decides; `processBatches` records lifecycle; polling observes; export formats the outcome. Practice explaining that chain without looking at notes.

### Function/Component: `parseCsvBuffer`

File: `apps/api/src/parsing/csv.ts`

1. **What it does:** Converts uploaded CSV bytes into bounded string-keyed rows.
2. **Why it exists:** Browser preview is untrusted; the backend must parse independently.
3. **Inputs:** A Node `Buffer` and positive row limit.
4. **Outputs:** `Record<string, string>[]`, or a thrown error for no data rows.
5. **Internal logic:** BOM-aware header parsing, relaxed column count, slice, header/cell cleanup.
6. **Dependencies:** Synchronous `csv-parse`.
7. **Failure cases:** malformed/empty input, misleading headers, synchronous resource use.
8. **Security:** Combined with Multer/row caps; needs stronger content/cell/column limits for production.
9. **Interview explanation:** “It re-establishes a trusted row representation on the server.”
10. **Improvement:** Streaming/bounded parsing with original-row-count/truncation metadata.

### Function/Component: `preprocessRows`

File: `apps/api/src/parsing/preprocess.ts`

1. **What it does:** Adds normalized raw values, row numbers, deterministic signals, and duplicate state.
2. **Why it exists:** Gives both mapping paths predictable evidence and warnings.
3. **Inputs:** Parsed row objects.
4. **Outputs:** `SourceRow[]`.
5. **Internal logic:** Per-file Set signature plus regex/allowlist/value analysis.
6. **Dependencies:** Shared status/source constants and private signal helpers.
7. **Failure cases:** false-positive regex, locale-sensitive dates, exact-only duplicates.
8. **Security:** Reduces ambiguity but does not sanitize every malicious semantic input.
9. **Interview explanation:** “It separates deterministic facts from probabilistic mapping.”
10. **Improvement:** Country-aware phones, explicit date formats, normalized-contact duplicate keys.

### Function/Component: `extractDeterministically`

File: `apps/api/src/ai/deterministic.ts`

1. **What it does:** Produces the AI-adapter result shape without a provider call.
2. **Why it exists:** Enables a credential-free demo and reproducible baseline.
3. **Inputs:** Source rows and a batch ID.
4. **Outputs:** Records, skipped records, and mapping notes.
5. **Internal logic:** Header-hint first matches plus deterministic contact/enum/date signals.
6. **Dependencies:** Canonical columns/allowlists and private builder helpers.
7. **Failure cases:** substring collisions and weak understanding of ambiguous combined columns.
8. **Security:** Avoids provider transfer when no key, but still processes PII in API memory.
9. **Interview explanation:** “It implements the same downstream contract with deterministic heuristics.”
10. **Improvement:** Scored candidate mappings, conflicts, fixtures, and explicit ambiguity output.

### Function/Component: `normalizeBatchResult`

File: `apps/api/src/validation/normalize.ts`

1. **What it does:** Turns untrusted adapter output into final imported/skipped domain records.
2. **Why it exists:** The model/fallback must not own business validity.
3. **Inputs:** `AiBatchResult`, original `SourceRow[]`, batch ID.
4. **Outputs:** Validated `{imported, skipped, mappingNotes}`.
5. **Internal logic:** Row join, note parse/dedupe, skips, contact precedence, enum/date cleanup, Zod.
6. **Dependencies:** Shared schemas/constants, UUID, normalization helpers.
7. **Failure cases:** schema throw for malformed notes, duplicate provider rows, invalid note references.
8. **Security:** Strong untrusted-output boundary; still needs PII/log and formula policies elsewhere.
9. **Interview explanation:** “This is the final deterministic domain gate.”
10. **Improvement:** Index provider records, enforce one outcome per source row, validate references.

### Function/Component: `processBatches`

File: `apps/api/src/jobs/processor.ts`

1. **What it does:** Runs batch lifecycle and merges successful results into a job.
2. **Why it exists:** Isolates provider failures and exposes progress/retry units.
3. **Inputs:** Mutable job, selected batches, optional extractor dependency.
4. **Outputs:** `Promise<void>` plus deliberate job/batch mutation.
5. **Internal logic:** Sequential loop, state transitions, await, normalize, append, catch, counts.
6. **Dependencies:** extractor, normalizer, `updateCounts`.
7. **Failure cases:** provider/validation error, crash, concurrent duplicate execution.
8. **Security:** Error text may include provider details; no admission/cost control.
9. **Interview explanation:** “It is an in-process sequential orchestrator, not a worker.”
10. **Improvement:** Durable queue, atomic leases, idempotent commits, classified retry/backoff.

### Function/Component: `updateCounts`

File: `apps/api/src/jobs/store.ts`

1. **What it does:** Recomputes summary counts, timestamp, and overall job status.
2. **Why it exists:** Keeps status derived from batch/result source state.
3. **Inputs:** Mutable `ImportJob`.
4. **Outputs:** No return; mutates summary fields.
5. **Internal logic:** Filter/reduce batches and choose completed/partial/failed/processing.
6. **Dependencies:** None beyond job types/date runtime.
7. **Failure cases:** Inconsistent arrays, concurrent mutation, status transition ambiguity.
8. **Security:** No direct security boundary.
9. **Interview explanation:** “It is a compact derived state machine.”
10. **Improvement:** Explicit transition rules in a transactional repository.

### Function/Component: `formatCrmCsv`

File: `apps/api/src/exports/format.ts`

1. **What it does:** Serializes CRM records in the exact canonical column order.
2. **Why it exists:** Downstream CRM import must not contain audit/UI metadata or shifted columns.
3. **Inputs:** `CrmRecord[]`.
4. **Outputs:** Newline-terminated CSV string.
5. **Internal logic:** Canonical header, field lookup, CSV quote escaping.
6. **Dependencies:** `CRM_CSV_COLUMNS` and private `quoteCsv`.
7. **Failure cases:** unexpected huge exports, spreadsheet formula cells.
8. **Security:** Escapes CSV syntax but currently not formula injection.
9. **Interview explanation:** “The backend owns exact export shape and order.”
10. **Improvement:** Formula-neutralization policy, streaming, and download tests.

### Function/Component: `apiFetch<T>`

File: `apps/web/src/lib/api.ts`

1. **What it does:** Sends API requests and normalizes network/HTTP errors.
2. **Why it exists:** Avoids duplicated base URL and error parsing.
3. **Inputs:** Relative path and optional `RequestInit`.
4. **Outputs:** Promise typed as `T`.
5. **Internal logic:** Fetch, catch network, check status, parse error/success JSON.
6. **Dependencies:** browser fetch and public base URL.
7. **Failure cases:** timeout/hang, non-JSON success, stale request, schema mismatch.
8. **Security:** No auth credentials today; base URL is public by design.
9. **Interview explanation:** “It is a thin transport helper; the generic is not runtime validation.”
10. **Improvement:** Abort/timeout, typed errors, and required Zod response schema.

## 14. Error Handling and Debugging

Errors exist at different boundaries and should not be flattened into “something failed.” A browser parse error is local. A network error means the API was unreachable or blocked. An HTTP 400 means the API understood the request but rejected input. An async batch failure occurs after the 202 response and appears in job state. A result-fetch failure can leave the summary visible. A download failure is currently handled by normal browser navigation, not a toast.

| Area | Current Behavior | Risk | Better Production Approach |
| ---- | ---------------- | ---- | -------------------------- |
| Local preview | Papa error sets one shared string; parser notes kept in preview | Confirm may remain enabled for weak preview | Explicit preview state: idle/parsing/valid/invalid |
| Sample loading | try/catch + toast | No retry/diagnostic detail | Retry action, telemetry, cache headers |
| API network | `apiFetch` emits friendly error | Original cause/status unavailable to logs | Typed client error with cause/request ID |
| Upload parsing | try/catch returns message as 400 | Parser internals may be exposed | Known validation errors vs generic malformed CSV |
| Multer | size/count translated to 400 | Other Multer cases use one generic message | Code-specific stable error contract |
| Provider HTTP | status + first 500 body chars thrown | PII/provider details may reach job/UI | Redact, classify timeout/429/4xx/5xx, log safely |
| Provider JSON | JSON/Zod failures throw | No finish/refusal diagnostics | Explicit provider-response parser and metrics |
| Batch failure | stored retryable; later batches continue | Every error marked retryable | Classify permanent vs transient; attempt limits/backoff |
| Polling | shared error string | Continues interval and can overlap | Backoff, cancellation, last-updated/stale indicator |
| Result loading | catches combined load | Partial success hidden | Separate states/errors and retry controls |
| Unknown API error | generic 500 | No logging/request correlation | Structured logs + request/job/batch IDs |
| Retry | requeues failed batches | Concurrent duplicate processing | Atomic lease + idempotent result commit |

### A disciplined debugging workflow

First reproduce with the smallest known sample and record expected/actual behavior. Identify the boundary: before confirmation, request creation, route parsing, batch state, provider response, normalization, store, response, or rendering. Use browser Network to inspect method, URL, status, request body type, response, CORS, and timing. Use server logs or temporarily safe local diagnostics with job/batch IDs—never dump raw PII or secrets. Trace one row number through source, AI result, normalized record, and export. Write a failing test at the narrowest deterministic layer, fix the cause, then run typecheck/lint/tests/build and the representative browser flow.

A stack trace lists the error and frames from failure outward. Start at the first application-owned frame, not library internals. For async errors, inspect the awaited boundary. If the UI preview works but POST fails, the issue is backend/network, not PapaParse. If status completes but tables are empty, compare job counts with result endpoints and frontend page state. If CSV differs from UI, inspect `formatCrmCsv` and remember that UI metadata is intentionally excluded.

### Example: a row is wrongly skipped

Confirm the raw CSV cell and server `SourceRow`. Check `deterministicSignals.emails/phones`. If missing, debug regex and `looksLikeDate`. If signals exist, inspect provider result row number, then `normalizeCrm` precedence. Confirm the final contact check and Zod failure reason. Add a fixture to `app.test.ts`. This isolates extraction from validation instead of randomly editing UI.

## 15. Security Review

### Implemented safeguards

The browser makes upload consent explicit. Multer limits one 5 MB file, and the server caps rows. The API removes its framework header, adds `nosniff`, no-referrer, and no-store, configures CORS, sanitizes filenames, removes cell newlines, constrains AI shape, validates provider JSON, enforces allowlists, and escapes CSV quotes. The Next Vercel config requires an HTTPS nonlocal API URL without embedded credentials/query/hash.

These controls are useful but do not make the app safe for real multi-user PII.

### Input validation

Client extension/dropzone checks improve UX only. Server extension, size, count, parsing, and Zod checks are real boundaries. Missing pieces include content/MIME verification, validated integer query schemas, per-origin/user quotas, maximum columns/cell length/provider prompt size, and protection from hostile CSV complexity. `express.json()` is installed though current routes do not need JSON bodies; its default limit should still be deliberate.

### XSS and output escaping

React escapes string values rendered in JSX, reducing normal reflected/stored XSS. JSON is displayed as text in `<pre>/<code>`, not injected HTML. No `dangerouslySetInnerHTML` exists. XSS would still matter through compromised dependencies, unsafe future rendering, or a vulnerable browser surface. A Content-Security-Policy is absent.

### CSV formula injection

If an exported cell begins with `=`, `+`, `-`, or `@`, spreadsheet software may interpret it as a formula. `quoteCsv` protects CSV syntax, not spreadsheet execution. For untrusted data, prefix dangerous leading values with an apostrophe or choose an explicit safe export policy, and test it. This is a concrete security gap.

### CORS and CSRF

CORS determines which browser origins can read API responses; it is not authentication. Configuring `*` makes the unauthenticated API broadly readable. CSRF is less central now because there are no cookies/ambient credentials. If cookie sessions are added, configure exact origins, credentials, SameSite, and CSRF tokens/origin checks as required.

### Injection

SQL/NoSQL injection is not currently applicable because no database query exists. Do not say “protected by ORM.” Future database code must parameterize queries and validate filters. Prompt injection is a different concern: CSV text could contain instructions. The system prompt says not to invent and the output schema constrains shape, but row text is still untrusted. Delimit data clearly, minimize instructions/data mixing, validate outputs, and evaluate adversarial rows. The model has no tools, so prompt injection cannot directly execute a server tool in this implementation.

### Secrets and data exposure

`OPENAI_API_KEY` is server-side and `.env` is ignored. `NEXT_PUBLIC_API_BASE_URL` is intentionally public. Confirmed files may contain PII and are sent to the API and possibly OpenAI, then retained indefinitely in server memory until restart. There is no auth, consent detail about provider transfer, retention policy, deletion endpoint, encryption policy, audit log, or access ownership. Provider error text may expose details to the job/UI.

### Dependency, DoS, and operational risks

Run dependency audits and update deliberately; a passing build does not prove dependencies are safe. The upload/row caps bound some memory and cost, but unlimited requests/jobs can exhaust RAM or OpenAI spend. Jobs are never deleted. Batches can trigger up to 200 sequential provider calls. Add IP/user rate limits, active-job quotas, provider budgets, TTL cleanup, graceful shutdown, request IDs, and alerting.

### Security interview answer

“For the demo I implemented bounded uploads, CORS, no-store/security headers, filename and newline sanitation, strict provider schema, backend Zod validation, enum allowlists, and CSV quoting. I would not use it for real customer PII yet because there is no authentication, ownership, rate limiting, retention/deletion, CSP, formula-injection defense, or durable encrypted storage. My first production change is authenticated ownership on every job route plus rate/retention controls.”

## 16. Testing Strategy

### Present tests

`apps/api/src/app.test.ts` uses `node:test` and `node:assert/strict`. Fourteen passing tests cover health identity, CORS origin normalization, row limiting, empty CSV rejection, pagination clamping, missing-contact skip, extra-contact preservation, enum allowlists, deterministic aliases/mapping notes, CSV order/escaping, failed-batch retry, five-row batching, timeout isolation/continuation/retry, and failed-row progress.

These are mostly unit/behavior tests of exported functions. `processBatches` accepts an extractor parameter, enabling a controlled timeout without a network call. Test fixtures create jobs/batches/records in memory. This is good dependency injection.

`scripts/e2e-sample-flow.mjs` builds the system, starts API and Next, waits for health, uses a real browser CLI to load Mixed leads, confirms, waits for terminal text, opens Exports, and verifies title/copy/export links. It is optional and depends on an external Playwright-compatible executable.

### What is missing

- Express integration tests that send real multipart requests and validate response schemas/status/headers.
- Multer size/file-count and route-level extension tests.
- Frontend component tests for local-only preview, state, errors, tabs, keyboard behavior, and polling cleanup.
- Mock-server contract tests for OpenAI success, malformed JSON, refusal/empty content, 401, 429, 5xx, and timeout.
- AI evaluation fixtures measuring field accuracy, unsupported invention, skip precision/recall, and regressions.
- Concurrency tests for two retry requests, duplicate commits, overlapping polling, and stale responses.
- Export security tests for formula injection and content disposition.
- Deployment/container health and graceful restart tests.
- Accessibility automation/manual screen-reader coverage.

### Recommended exact test plan

1. POST a valid CSV to an ephemeral `createApp` server; assert 202 schema, poll terminal, validate every endpoint with shared Zod.
2. POST missing file, non-CSV name, >5 MB file, zero-row CSV, uneven columns, BOM, quoted comma/newline, duplicate/blank rows.
3. Stub provider fetch for valid schema, invalid JSON, wrong enum, duplicate row numbers, unknown row, omitted row, 429, 500, timeout.
4. Assert normalization never accepts invalid enum/date, preserves one valid contact, appends extra contacts once, and links only valid note IDs.
5. Fire retry twice concurrently and demonstrate the current duplicate/race bug; use this as a red test for an idempotent fix.
6. Render `ImporterApp` with mocked fetch; verify no API call before confirm, FormData after confirm, polling stops terminal, and errors remain actionable.
7. Keyboard-test tabs and dropzone; run axe and manual focus/screen-reader checks.
8. Test CSV cells beginning with formula characters after implementing policy.
9. Run labeled deterministic/AI fixtures and compare field-level and record-level scores in CI or controlled evaluation.

### How to explain test levels

A unit test isolates a small function. An integration test checks modules/boundaries together, such as HTTP + Multer + parser. E2E checks a user flow across browser and server. AI evals measure probabilistic quality rather than only code correctness. A test proves only the asserted behavior under its inputs; 14 green tests are evidence, not universal correctness.

## 17. Code Quality and Maintainability

### Strengths

The monorepo has clear deployable apps and a shared contract package. Domain constants are centralized. Zod produces runtime validation and inferred public types. Parsing, preprocessing, AI, normalization, jobs, and exports are separate modules. Provider extraction is injectable for orchestration tests. The README is unusually honest about in-memory limitations. Names such as `SourceRow`, `ImportBatch`, and `MappingNote` express domain intent. No unnecessary global frontend state library is introduced.

### Weaknesses

`ImporterApp` is oversized. `app.ts` holds every endpoint. Internal state is globally mutable. The job state machine is implicit. The provider JSON Schema and Zod schema duplicate structure. Frontend response generics create a false sense of runtime safety. Dates/phones are locale-specific. Mapping-note references are weakly checked. Two sample directories can drift. Some design documents describe intended behavior more strongly than the code implements, such as invalid-preview disabling. The TRD’s OpenAI SDK mention is stale.

### Maintainable direction

Refactor by responsibility only when behavior demands it. Extract frontend hooks/panels; define a typed API error contract; validate queries/responses; introduce an `ImportRepository` interface before persistence; represent batch transitions explicitly; isolate the provider client/parser; add evaluation fixtures. Avoid controller/service/repository layers that only forward arguments. A “deep module” hides complexity behind a small meaningful interface—`extractBatch` and `normalizeBatchResult` are good starting examples.

## 18. Performance and Scalability

For a demo, the 5 MB upload, 1,000-row cap, 80-row preview render, 100-row result pages, and five-row batches bound work. The frontend still parses and stores the whole local file. The backend parses the entire buffer synchronously. Every job retains raw rows and results forever. Polling happens every 900 ms. Maximum AI work can be 200 sequential calls, so provider latency dominates.

React performance is likely adequate at this size. `useMemo` for one division is not needed for computation cost, but is harmless. Large tables are bounded by pagination/preview cap and scroll. The entire `ImporterApp` rerenders on job updates; split components/memoization only after profiling. Avoid claiming a performance problem without measurement.

Backend hot spots include repeated batch filters in `updateCounts` and repeated `find` in normalization, but batch size five makes them negligible. Real bottlenecks are provider I/O, retained memory, synchronous CSV parsing, and request volume. There are no database query or N+1 issues because there is no database.

Horizontal scaling fails because each instance has a different Map. A load balancer may send polling to an instance that does not know the job. Restarts lose jobs. A long-running API process owns work with no lease. Production scaling therefore requires shared durable state and a queue before adding replicas. Add bounded worker concurrency rather than `Promise.all` over 200 provider calls. Apply backpressure and provider quotas.

## 19. Architecture Decisions and Trade-Offs

| Decision | Why chosen | Alternative | Trade-off / interview phrasing |
|---|---|---|---|
| TypeScript | One typed vocabulary and strict checks | JavaScript + JSDoc | Compile safety, but runtime still needs Zod |
| npm workspaces | Share contracts, one install | Separate repos | Simpler demo; deployments require workspace-aware builds |
| Next.js App Router | Modern React routing/build/deploy | Vite SPA | Framework overhead, but easy Vercel path |
| Separate Express API | Clear backend trust boundary | Next route handlers | Two deployments/CORS, but backend is explicit |
| Shared Zod package | Runtime + inferred types | OpenAPI/codegen, duplicated DTOs | Strong small-project contract; frontend currently underuses schemas |
| PapaParse + csv-parse | Local preview plus trusted server parse | One parser/server preview | Two parser behaviors may differ; preserves privacy boundary |
| Structured output | Bounded provider shape | Free-form JSON/text | Shape improves, factual correctness still uncertain |
| Deterministic fallback | Credential-free demo and baseline | Fail without key | Less semantic flexibility; excellent reviewer accessibility |
| Five-row batches | Small prompt/failure/retry unit | Whole file or larger batches | Up to 200 sequential calls and overhead |
| Sequential processing | Simple state and provider pacing | Concurrency pool | Slow but predictable; later add bounded concurrency after idempotency |
| `queueMicrotask` | Return 202 before processing loop | Inline await, worker queue | Async UX, but no durability/isolation |
| In-memory Map | Zero DB setup, fast demo | Postgres/Redis | Volatile, single-instance, unauthenticated |
| Polling | Simple client/server contract | SSE/WebSocket | Extra requests/latency; sufficient for short demo |
| Global CSS | Lightweight custom design | Tailwind/component library | Simple dependencies; class coupling and one large stylesheet |
| No auth | Reviewer opens immediately | Session/OAuth | Great demo speed, unsafe for real users |

The correct interview pattern is: state the goal, decision, benefit, accepted cost, and migration trigger. Do not defend every choice as ideal. Example: “In-memory state was intentional for a three-minute evaluator flow. The trigger to replace it is any requirement for history, multiple users, restarts, or multiple API replicas.”

## 20. AI-Assisted Coding Ownership

AI-assisted development is honest when you distinguish generation from engineering ownership. AI can scaffold, suggest patterns, explain errors, and produce tests. You remain responsible for requirements, boundaries, verification, security, trade-offs, and deployed consequences.

### Model answer: “Did you build this yourself?”

“Yes, with AI assistance. I used AI as a pair-programming and scaffolding tool rather than claiming every line came from memory. I own the project because I can trace every major flow, explain why the boundaries exist, run and interpret the tests, identify concrete defects, and modify the system. For example, I can explain why OpenAI output is validated twice, why `queueMicrotask` is not a worker, and why concurrent retry is unsafe.”

### Model answer: “Explain this code if AI wrote it”

“I start at its contract. `normalizeBatchResult` receives untrusted batch output plus the original source rows. It rejoins by row number, validates mapping notes, preserves provider skips only for known rows, applies deterministic contact precedence, blanks invalid enums/dates, forces missing-contact skips, and then constructs only Zod-validated records. The function exists so neither the prompt nor provider owns domain validity. Its current risks are repeated lookup, weak uniqueness/reference checks, and ten-digit phone assumptions.”

### Model answer: “How do you know it works?”

“I use layered evidence. Type checking and lint pass. Fourteen backend tests cover parsing, normalization, enums, export, batching, timeout isolation, progress, and retry. There is also a browser smoke harness. I do not overclaim: HTTP multipart routing, live OpenAI quality, frontend components, and concurrent retries need more tests. For probabilistic mapping I would add labeled evals, because unit tests alone cannot establish accuracy.”

### Model answer: “What would you rebuild differently?”

“I would keep the trust pipeline and shared contract, but model the job lifecycle explicitly from the start. For production I would persist the job before returning 202, enqueue idempotent batch IDs, add authenticated ownership, and build AI eval fixtures early. On the frontend I would extract an import-job hook and runtime-validate responses. For the demo scope, the current simpler architecture made the complete flow easier to review.”

### What not to say

Do not say “AI made the whole thing, I am not sure,” “the tests passed so it is production-ready,” “structured output prevents hallucination,” “TypeScript validates API JSON,” “UUID means authorized,” or “queueMicrotask runs a background worker.” Do not invent a database, auth, Redis, OpenAI SDK, RAG, agents, or CRM integration.

## 21. GrowEasy Screening Interview Answers

### Tell me about yourself

“I am a JavaScript and full-stack developer focused on becoming strong at understanding systems, not only generating features. I built Listwright as my GrowEasy project with AI assistance, then studied it from the workspace configuration through the React flow, Express routes, asynchronous jobs, AI boundary, validation, tests, and deployment. I enjoy turning unclear problems into small traceable modules, and I am looking for an internship where code review and real product work can accelerate that learning.”

### Why GrowEasy?

“GrowEasy appeals to me because the internship process values JavaScript fundamentals and the ability to explain a real project deeply. That matches how I want to grow: a strong base in language behavior, practical full-stack delivery, and feedback from experienced developers. I would bring curiosity, honest communication, and the willingness to debug beyond the first AI-generated answer.”

### Why software development?

“I like that software development combines precise reasoning with visible outcomes. A requirement becomes data structures, functions, interfaces, failure handling, tests, and an experience someone can use. Listwright made that concrete because one button click crosses frontend state, HTTP, parsing, AI, validation, storage, polling, and export.”

### Tell me about your project

Use the 30-second pitch from section 1, then pause. If invited, trace one row. Do not front-load every library.

### What tech stack did you use?

“It is an npm-workspace TypeScript monorepo. The frontend is Next.js App Router with React, PapaParse, react-dropzone, Sonner, and custom CSS. The backend is Node/Express with Multer, csv-parse, native fetch to OpenAI, and an in-memory Map. A shared package provides Zod schemas and canonical constants. Node’s test runner covers backend behavior, and Dockerfiles package web and API separately.”

### What part did you build?

“I worked across the end-to-end workflow: local preview and confirmation, API upload/job routes, deterministic signals, the structured AI adapter and fallback, backend normalization, polling/results, retries, exports, tests, and documentation. AI assisted implementation, but I reviewed and traced these boundaries and can identify what I would change.”

### What was difficult?

“The hardest part was not calling the model; it was deciding what the model must not control. I needed row traceability, strict output shape, deterministic contact precedence, enum/date rules, partial failures, and a retry path. That taught me that reliable AI features are mostly contract and failure design.”

### How did you use AI?

“I used AI for scaffolding, implementation suggestions, explanations, and iteration. I verified through source tracing, tests, builds, and manual flows. I also challenged the code: for example, I found that retry is not concurrency-safe and that frontend generics do not runtime-validate JSON.”

### How do you debug code?

“I reproduce with the smallest case, locate the failing boundary, inspect actual inputs/outputs, and form one testable hypothesis. In this app I trace a row number from CSV to deterministic signals, extraction, normalization, job state, API response, and UI. I add a failing test where the defect belongs, fix the cause, and rerun broader verification.”

### What are your JavaScript strengths and weaknesses?

“My strengths are functions, arrays/objects, async/await, and tracing client/server flows. I am actively strengthening tricky language details such as `this`, coercion output questions, closures, and event-loop ordering through deliberate practice. I prefer naming a real learning area and showing a plan rather than giving a fake weakness.”

### Are you comfortable learning fast?

“Yes. AI helped me iterate quickly, but the more important skill was turning generated code into understanding: reading contracts first, drawing flows, testing assumptions, and explaining trade-offs. I can learn fast without pretending I understand something before I verify it.”

### Availability and expectations

Answer availability factually. For expectations: “I want real tasks with clear feedback, exposure to team engineering practices, and increasing ownership. I expect to contribute as a learner—asking good questions, communicating blockers early, and improving through review.”

## 22. One-Hour Technical Interview Questions and Model Answers

### Project and architecture

**Q: Explain the architecture.**

“A Next.js client handles browser-only preview and interaction. Confirmation crosses to an Express REST API. The API bounds and parses the CSV, derives deterministic evidence, creates five-row batches, and chooses OpenAI structured output or a fallback mapper. Normalization and shared Zod schemas own final validity. A process-local Map stores job state. The frontend polls summaries and reads paginated results, then direct endpoints export CSV or JSON. There is no database, auth, or separate worker.”

**Q: What happens from button click to UI update?**

“The click handler calls `confirmImport`, sets busy/error/result state, creates FormData, and awaits POST `/api/imports`. Express/Multer parse the request, the route stores/schedules a job and returns 202. The client fetches its summary and sets `job`, causing React to render progress. An effect polls every 900 ms, and another effect loads result pages. Every setter schedules a render from the new state.”

**Q: What happens from form submit to database write?**

“There is no database write. The file POST creates an `ImportJob` object and inserts it into `jobsById`, a process-local Map. That distinction is important: it is fast but volatile and single-instance. A production version would transactionally insert the job and batches before returning 202.”

**Q: Why use a shared package?**

“The CRM columns, statuses, job response shape, and record vocabulary cross frontend/backend/export boundaries. Centralizing them reduces drift. Zod additionally lets the same definition validate at runtime and infer TypeScript types. The current missed opportunity is that the browser uses only inferred response types, not runtime parsing.”

**Q: Why HTTP 202?**

“The request creates work that continues after the response. 202 says accepted but not completed, so the client must check status. Returning 200 with final results would keep the request open across many provider calls and make partial progress/retry harder.”

**Q: Is `queueMicrotask` a background job?**

“It defers a callback until the current stack finishes and before the next task. Processing still runs in the API process and can be lost on crash. It is not a durable queue or worker. I describe it as in-process asynchronous scheduling.”

### JavaScript and TypeScript

**Q: Explain `var`, `let`, and `const`.**

“`var` is function-scoped, redeclarable, and initialized to undefined during hoisting. `let` and `const` are block-scoped and inaccessible in the temporal dead zone until initialized. `let` can be rebound; `const` cannot be rebound but referenced objects can mutate. I default to const, use let for rebinding, and avoid var.”

**Q: Explain closures with this codebase.**

“A closure is a function retaining its lexical environment. The private `pick` function inside `buildCrm` closes over `raw`; React event/effect callbacks close over state from a render. This is useful but creates stale-closure risk when effect dependencies are wrong.”

**Q: Explain promises and async/await.**

“A Promise represents eventual fulfillment or rejection. An async function returns a Promise; await pauses only that async function and resumes it in a microtask. `processBatches` awaits inside a loop, making batches sequential. `try/catch` around awaited extraction converts rejections into failed batch state.”

**Q: Explain the event loop here.**

“The POST handler builds and stores the job synchronously, then schedules processing with `queueMicrotask`. After the current request stack yields, the microtask starts `processBatches`. Each network await allows other events to run. Timer-based frontend polling is a separate browser event loop. None of this supplies durability.”

**Q: TypeScript versus Zod?**

“TypeScript checks source at compile time and is erased. Zod checks actual runtime values. Provider JSON and HTTP JSON can be wrong despite TypeScript assertions. The API validates provider and final domain objects; the frontend should additionally parse responses with shared schemas.”

**Q: Explain shallow versus deep copy.**

“Object/array spread copies only the outer container. Nested objects keep shared references. A deep clone recursively creates new nested values, using a suitable tool like structuredClone for supported data. This matters because React relies on new references for state changes, while backend jobs intentionally mutate shared objects.”

### React and frontend

**Q: What is React state?**

“State is data remembered between renders. A setter schedules React to recalculate UI. In `ImporterApp`, source-of-truth state includes preview, job, result pages, tabs, and errors; progress and readiness are derived to avoid duplicate state.”

**Q: Props versus state?**

“Props are inputs owned by a parent; state is owned by the component. `UploadDropzone` receives callbacks and samples as props, while `ImporterApp` owns the selected preview/job state. That keeps API logic out of the dropzone.”

**Q: Explain `useEffect`.**

“Effects synchronize with external systems after render. One effect installs/cleans polling; another fetches result pages when job/page dependencies change. Dependency arrays define which render values the closure uses. The current interval can overlap requests, so I would prefer a cancellable recursive timeout.”

**Q: What is a controlled component?**

“A controlled input gets its displayed value from React state and reports changes through a handler. This project does not have typical controlled text fields; react-dropzone manages the native file input while the parent controls the resulting preview workflow.”

**Q: Server versus client component?**

“App Router components are server by default. `page.tsx` can render on the server because it has no browser hooks. `ImporterApp` is client because it uses files, events, state/effects, refs, and browser parsing. The boundary avoids marking the entire route tree client-side.”

### Backend, API, and data

**Q: How is the file validated?**

“Client checks extension/accept for UX. Server Multer limits one 5 MB file, route checks `.csv`, parser requires data, row limit bounds output, cell normalization strips newlines, and later Zod validates records. Content-type sniffing and cell/column limits are missing.”

**Q: How does pagination work?**

“The helper converts query values to numbers, clamps page to at least 1 and limit to 1–200, computes totals, slices the in-memory array, and returns metadata. It clamps rather than rejects invalid values and reports one page for zero results.”

**Q: How does retry work and what is wrong with it?**

“The route filters failed batches, resets them to queued, updates counts, and schedules only those batches. Completed records remain. But two simultaneous retries can claim the same batch and append duplicates; there is no atomic lease/idempotent commit or maximum attempts.”

**Q: What is the data model?**

“A job owns batches, errors, imported/skipped records, and mapping notes. Source rows contain raw cells plus deterministic signals. Relationships are embedded arrays in memory. There is no relational database schema in the implementation.”

**Q: What does structured output guarantee?**

“It strongly constrains the response to a supported JSON Schema shape when strict mode/model support apply. It does not prove factual accuracy or grounding. That is why the project sends deterministic evidence and still applies Zod plus backend normalization.”

**Q: What happens without an API key?**

“`extractBatch` calls `extractDeterministically`. Header aliases and signals produce the same `AiBatchResult` contract, so downstream normalization, storage, UI, and exports remain the same. This makes the demo accessible and gives a baseline.”

### Security, testing, deployment, scaling

**Q: How would you secure the app?**

“First add authentication and job ownership to every read/retry/export route. Then rate/job/provider quotas, retention/deletion, safe logging, exact CORS and cookie/CSRF policy, CSP/security headers, CSV formula protection, validated query/body schemas, and audit logs. Confirmed PII needs an explicit provider and storage policy.”

**Q: How would you test it?**

“Keep pure tests, add real HTTP multipart integration tests and frontend component tests, mock provider failure contracts, add concurrency tests, and create labeled AI evals. E2E should verify local-only preview, terminal results, accessibility, and downloaded content—not only link presence.”

**Q: How would you deploy it?**

“Build shared first, then separate web/API images. Configure public API URL on web and secret/provider/CORS/cap values on API. The current backend must remain one instance because state is local. Production deployment requires durable shared state, queue workers, health/readiness, graceful shutdown, logs/metrics, and migrations.”

**Q: How would you scale it?**

“Authenticate tenants, persist jobs/results, enqueue idempotent batch IDs, add bounded worker concurrency and provider quotas, TTL/retention, indexed pagination, adaptive polling/SSE, and observability. Only then horizontally scale stateless API/web instances. Simply adding replicas now breaks job lookup.”

**Q: What would you improve first?**

“For production: authenticated ownership plus durable job persistence. For correctness in the demo code: fix retry idempotency/concurrency, add route/provider tests, and defend CSV formulas. For maintainability: split `ImporterApp` and runtime-parse frontend responses.”

**Q: How do you know AI-generated code is correct?**

“I do not assume it is. I inspect contracts and flows, typecheck/lint, test deterministic behavior, run an E2E path, test edge/failure cases, and document uncovered claims. For model quality I need evals. Correctness is evidence by layer, not trust in the generator.”

## 23. CodeChef JavaScript Practice Section

Try each before reading its answer.

### Scope and hoisting

**Question 1**

```js
console.log(x);
var x = 5;
function f() {
  console.log(x);
  var x = 9;
}
f();
```

**Answer:** `undefined`, `undefined`. Each function has its own hoisted `var x`, initialized to undefined before assignment. Concept: function scope and hoisting.

**Question 2**

```js
let x = 1;
{
  console.log(x);
  let x = 2;
}
```

**Answer:** ReferenceError before any value prints. The inner `x` shadows outer `x` across the block but is in its temporal dead zone. Concept: block scope/TDZ.

**Question 3**

```js
const item = { count: 1 };
item.count++;
console.log(item.count);
```

**Answer:** `2`. `const` prevents rebinding `item`, not mutation of the object. Concept: binding versus mutation.

### Closures

**Question 4**

```js
function counter() {
  let n = 0;
  return () => ++n;
}
const a = counter();
const b = counter();
console.log(a(), a(), b());
```

**Answer:** `1 2 1`. Each `counter` call creates a distinct lexical environment. Concept: closure/private state.

**Question 5**

```js
const out = [];
for (var i = 0; i < 3; i++) out.push(() => i);
console.log(out.map(fn => fn()));
```

**Answer:** `[3, 3, 3]`. All closures share the one function-scoped `i`. Replace `var` with `let` for `[0,1,2]`. Concept: closure and loop binding.

### `this`

**Question 6**

```js
const obj = {
  value: 4,
  regular() { return this.value; },
};
const fn = obj.regular;
console.log(obj.regular(), fn.call({ value: 7 }));
```

**Answer:** `4 7`. Call-site receiver determines regular-function `this`; `call` supplies one. Concept: dynamic `this`.

**Question 7**

```js
const obj = {
  value: 4,
  arrow: () => this?.value,
};
console.log(obj.arrow());
```

**Answer:** Not `4`; commonly `undefined` in a module context. Arrow captures lexical `this` and does not bind `obj`. Concept: arrow `this`.

### Types and references

**Question 8**

```js
console.log(typeof null, typeof [], Array.isArray([]));
```

**Answer:** `object object true`. `typeof null` is a historical quirk; arrays are objects, so use `Array.isArray`. Concept: type checks.

**Question 9**

```js
const a = { n: 1 };
const b = a;
const c = { ...a };
b.n = 2;
console.log(a.n, c.n, a === b, a === c);
```

**Answer:** `2 1 true false`. `b` shares the object; spread creates a new outer object. Concept: references/shallow copy.

**Question 10**

```js
console.log(0 == false, 0 === false, "5" + 1, "5" - 1);
```

**Answer:** `true false "51" 4`. Loose equality and arithmetic coerce; `+` concatenates when a string participates. Concept: coercion.

### Arrays and objects

**Question 11**

```js
const nums = [1, 2, 3, 4];
const result = nums.filter(n => n % 2 === 0).map(n => n * 10);
console.log(result);
```

**Answer:** `[20, 40]`. Filter keeps even values; map transforms them. Neither mutates `nums`. Concept: array pipelines.

**Question 12**

```js
const result = [1, 2, 3].reduce((sum, n) => sum + n, 10);
console.log(result);
```

**Answer:** `16`. Initial accumulator is 10. Concept: reduce.

**Question 13**

```js
const obj = { a: 1, b: 2 };
console.log(Object.entries(obj).map(([k, v]) => `${k}${v}`).join("-"));
```

**Answer:** `a1-b2` for this ordinary insertion order. Concept: entries/destructuring/map/join.

### Async/event loop

**Question 14**

```js
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);
```

**Answer:** `1 4 3 2`. Synchronous stack, then microtask, then timer task. Concept: event loop.

**Question 15**

```js
async function f() {
  console.log("A");
  await 0;
  console.log("B");
}
console.log("C");
f();
console.log("D");
```

**Answer:** `C A D B`. The async function runs synchronously until `await`; continuation is a microtask. Concept: async/await scheduling.

**Question 16**

```js
Promise.resolve()
  .then(() => { throw new Error("x"); })
  .catch(() => "recovered")
  .then(console.log);
```

**Answer:** `recovered`. Catch returns a fulfilled value consumed by the next then. Concept: promise error recovery.

### Debugging snippets

**Question 17:** Why does this not produce doubled values?

```js
const values = [1, 2, 3];
const doubled = values.forEach(v => v * 2);
```

**Answer:** `forEach` returns undefined. Use `values.map(v => v * 2)`. Concept: method contracts.

**Question 18:** Fix the lost asynchronous results.

```js
const results = [];
items.forEach(async item => results.push(await work(item)));
console.log(results);
```

**Answer:** Use `const results = await Promise.all(items.map(item => work(item)));` for concurrent work, or a `for...of` loop with await for sequential work. `forEach` does not await callbacks. Concept: async iteration.

### Short coding problems

**Problem 1: First non-repeating character**

```js
function firstUnique(text) {
  const counts = new Map();
  for (const ch of text) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  for (const ch of text) if (counts.get(ch) === 1) return ch;
  return null;
}
```

Time O(n), space O(k). The two passes preserve original order.

**Problem 2: Two sum indices**

```js
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
```

Expected O(n) time and O(n) space. Check before inserting so one element is not reused.

**Problem 3: Valid parentheses**

```js
function validBrackets(text) {
  const pairs = new Map([[")", "("], ["]", "["], ["}", "{"]]);
  const stack = [];
  for (const ch of text) {
    if (["(", "[", "{"].includes(ch)) stack.push(ch);
    else if (pairs.has(ch) && stack.pop() !== pairs.get(ch)) return false;
  }
  return stack.length === 0;
}
```

Time O(n), space O(n). Explain the stack as last-opened, first-closed.

**Problem 4: Group CSV-style records by status**

```js
function groupByStatus(records) {
  return records.reduce((groups, record) => {
    const key = record.status || "blank";
    (groups[key] ??= []).push(record);
    return groups;
  }, {});
}
```

This connects array reduction to Listwright’s domain. Mention that it mutates the accumulator intentionally.

### CodeChef input template

```js
const fs = require("node:fs");
const input = fs.readFileSync(0, "utf8").trim().split(/\s+/);
let cursor = 0;
const t = Number(input[cursor++]);
const answers = [];
for (let caseNo = 0; caseNo < t; caseNo++) {
  const n = Number(input[cursor++]);
  const values = Array.from({ length: n }, () => Number(input[cursor++]));
  answers.push(String(values.reduce((a, b) => a + b, 0)));
}
process.stdout.write(answers.join("\n"));
```

Adapt to the exact problem. Watch trailing-empty input, number precision, BigInt requirements, and O(n²) loops under large constraints.

## 24. Weaknesses, Gaps, and How To Defend Them

| Weakness | Seriousness | Honest interview defense | Improvement |
|---|---|---|---|
| No database/persistence | Critical for production | “Intentional demo simplification; jobs reset and one instance only.” | Postgres + repository + migrations/transactions |
| No auth/ownership | Critical for real PII | “No-login reviewer scope; UUID is not access control.” | Sessions/OIDC + owner on every query/route |
| No durable queue | Critical for reliability | “`queueMicrotask` is in-process scheduling only.” | Queue, workers, leases, dead letters |
| Retry race/idempotency | High | “Two retries can duplicate appended results.” | Atomic claim and unique/idempotent commit |
| No rate limits/TTL | High | “Upload cap bounds one request, not aggregate abuse/cost.” | User/IP quotas, active-job limits, cleanup |
| Formula injection | High for exports | “CSV syntax escaping is present; spreadsheet formula safety is not.” | Neutralize dangerous leading cells + tests |
| PII/provider/retention policy | High | “Preview is local, but confirmed data may reach provider and stays in memory.” | Consent, DPA/config, retention/delete/audit |
| Oversized `ImporterApp` | Medium | “Acceptable for a compact demo, now a refactor boundary.” | Hooks/panels/state machine |
| Frontend no runtime parsing | Medium | “Generics are compile-time only.” | Shared Zod parsing in API client |
| Poll overlap/stale results | Medium | “900 ms interval can overlap.” | Abortable recursive timeout/generation guard |
| Provider errors all retryable | Medium | “Demo exposes manual retry but does not classify.” | 429/5xx/timeout vs permanent errors/backoff |
| No AI evals | High for AI claims | “Schema validity is tested; semantic accuracy is not established.” | Labeled field/row evaluation suite |
| Limited HTTP/frontend tests | Medium | “14 backend tests pass, but route/component coverage is missing.” | Supertest/fetch integration + RTL/browser tests |
| Phone/date assumptions | Medium | “Heuristics are reviewer aids, not global normalization.” | Country-aware phone library and explicit date formats |
| Exact-only duplicates | Low/medium | “Deterministic and explainable baseline.” | Normalized contact keys/fuzzy review suggestions |
| Sample/document drift | Low | “Code is authoritative; I identified stale intent.” | Generate/copy fixtures and validate docs in CI |

### Sample answer when grilled

“The project is production-shaped but not production-ready. Its strongest property is the explicit trust pipeline. Its largest gaps are ownership, durability, idempotency, retention, and evaluation. I can point to the exact shortcuts: `jobsById` for persistence, `queueMicrotask` for scheduling, unauthenticated `getJob` for access, append-only processing for retry races, and no eval folder for model quality. I would fix them in that dependency order rather than adding visual features.”

### Claims to avoid

- Do not claim Fastify; it is Express.
- Do not claim the OpenAI SDK; implementation uses native fetch.
- Do not claim a database, Prisma, SQL, Redis, transactions, migrations, indexes, or cache.
- Do not claim a real worker or queue.
- Do not claim auth, authorization, user roles, sessions, or JWT.
- Do not claim structured output eliminates hallucination.
- Do not claim confidence is calibrated.
- Do not claim TypeScript validates runtime JSON.
- Do not claim tests cover live OpenAI, all routes, frontend, concurrency, or model quality.
- Do not claim horizontal scalability or production readiness.
- Do not claim RAG, embeddings, vector search, agents, tools, streaming, or direct CRM write-back.

## 25. Final GrowEasy Revision Sheet

### 30-second project pitch

“Listwright is an auditable AI-assisted CSV importer. The browser previews a file locally, then an Express API processes it only after confirmation. The API derives deterministic evidence, maps five-row batches through OpenAI structured output or a fallback, and treats both as untrusted until normalization and shared Zod validation pass. The React UI polls progress and exposes source comparisons, skips, warnings, notes, and CSV/JSON exports. The current Map-backed no-auth design is intentionally demo-only.”

### Architecture summary

```text
Next client/Papa preview -> confirmed multipart -> Express/Multer/csv-parse
-> signals -> 5-row extraction -> normalize/Zod -> in-memory Map
-> poll/pages/retry -> CSV or audit JSON
```

### Top ten files to study first

1. `packages/shared/src/constants.ts`
2. `packages/shared/src/schemas.ts`
3. `apps/api/src/app.ts`
4. `apps/api/src/parsing/preprocess.ts`
5. `apps/api/src/ai/openai.ts`
6. `apps/api/src/validation/normalize.ts`
7. `apps/api/src/jobs/processor.ts`
8. `apps/api/src/jobs/store.ts`
9. `apps/web/src/components/ImporterApp.tsx`
10. `apps/api/src/app.test.ts`

### Top ten JavaScript topics

1. `var`/`let`/`const`, scope, hoisting, TDZ.
2. Primitives, references, truthiness, `==` versus `===`.
3. Functions, callbacks, higher-order functions.
4. Closures and lexical environment.
5. `this`, arrow functions, call/apply/bind.
6. map/filter/reduce/find/some/every.
7. Destructuring, spread/rest, shallow/deep copy.
8. Promises, async/await, error propagation.
9. Call stack, microtasks, timers, event loop.
10. Map/Set, complexity, CodeChef input parsing.

### Frontend summary

One Next route renders a client workflow. PapaParse previews locally. State holds preview/job/results/navigation/errors; effects poll and fetch results. Dropzone, accessible stepper/tabs, paginated tables, source comparison, and exports complete the flow. Biggest weaknesses: 606-line component, no runtime response parsing, overlapping polling, and limited tests.

### Backend summary

Express composes headers/CORS/Multer/routes/errors. Server parsing and deterministic evidence precede optional AI. `normalizeBatchResult` is the domain gate. Batches run sequentially in-process and failures remain retryable. A Map stores everything. Exact exports are controlled by backend.

### Database and auth summary

Neither exists. Never imply otherwise. Production requires persistent owner-scoped jobs/results and authentication/authorization on every subresource and export.

### Strongest talking points

- Explicit local-preview/confirmation trust boundary.
- Deterministic evidence before probabilistic mapping.
- Structured provider shape plus backend Zod and normalization.
- Same downstream contract for OpenAI and no-key fallback.
- Five-row partial failure and retry visibility.
- Original-row traceability and different operational/audit exports.
- Honest understanding of demo versus production architecture.

### Likely grilling questions

- Why does structured output not guarantee correctness?
- Why is `queueMicrotask` not a queue?
- What happens on restart or with two API instances?
- Can two retry requests create duplicates?
- How are job IDs protected?
- Why parse CSV in both browser and server?
- What does Zod add to TypeScript?
- Why 202 and polling?
- How would you persist and transact batch results?
- What data reaches OpenAI and how is it protected?
- How would you measure mapping quality?
- What does CSV quoting fail to secure?

### One hour before interview

Draw the architecture and three main traces. Re-read the top ten files and the weaknesses table. Solve five event-loop/coercion/closure questions and two Map/array coding problems. Rehearse the 30-second and 2-minute pitches aloud. Review HTTP statuses, multipart, Zod versus TypeScript, batching/retry/idempotency, CORS/auth, and no-database production migration.

### Ten minutes before interview

Remember: **AI proposes; backend decides.** Name the product correctly. Say Express, native fetch, Map, `queueMicrotask`, no auth, no DB. Keep answers structured and pause after answering. If unsure, say what the code proves and how you would verify the rest.

### Final checklist

- [ ] I can trace one CSV row end to end without notes.
- [ ] I can explain `normalizeBatchResult`, `extractBatch`, `processBatches`, and `updateCounts`.
- [ ] I can explain React state/effects and the polling cleanup.
- [ ] I can explain 202, multipart, pagination, and exports.
- [ ] I can distinguish compile-time TypeScript from runtime Zod.
- [ ] I can explain the event loop ordering and `queueMicrotask` limitation.
- [ ] I can state every missing production area honestly.
- [ ] I can solve basic scope, closure, coercion, arrays, and async output questions.
- [ ] I can describe how I used AI while demonstrating ownership.
- [ ] I can propose a prioritized production migration, not a random wish list.

### Verification commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
# Optional real-browser smoke flow when a compatible CLI is installed:
PLAYWRIGHT_CLI=playwright-cli npm run test:e2e
```

The correct final interview attitude is neither defensive nor boastful: this is a thoughtful, bounded full-stack demo with a real trust model, real tests, and clear limitations. Your advantage is being able to explain both what works and precisely what must change next.
