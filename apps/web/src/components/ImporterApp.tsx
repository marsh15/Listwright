"use client";

import {
  DEFAULT_IMPORT_ROW_LIMIT,
  CRM_CSV_COLUMNS,
  type ImportedRecordsPage,
  type ImportJobResponse,
  type ImportJobSummary,
  type SkippedRecordsPage,
} from "@listwright/shared";
import Papa from "papaparse";
import { toast } from "sonner";
import { Fragment, type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiFetch, exportUrl } from "../lib/api";
import { ImporterStepper } from "./importer/ImporterStepper";
import { UploadDropzone } from "./importer/UploadDropzone";

type PreviewState = {
  file: File;
  fileName: string;
  columns: string[];
  rows: Record<string, string>[];
  errors: string[];
};

const samples = [
  { label: "Listwright test leads", path: "/samples/listwright_test_leads.csv" },
  { label: "Mixed leads", path: "/samples/mixed-leads.csv" },
  { label: "Messy contacts", path: "/samples/messy-contacts.csv" },
];

const resultTabs = [
  { id: "parsed", label: "Parsed records" },
  { id: "skipped", label: "Skipped records" },
  { id: "mapping", label: "Mapping notes" },
  { id: "exports", label: "Exports" },
  { id: "raw", label: "Raw JSON" },
] as const;

type ResultTab = (typeof resultTabs)[number]["id"];

export function ImporterApp() {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [job, setJob] = useState<ImportJobSummary | null>(null);
  const [recordsPage, setRecordsPage] = useState<ImportedRecordsPage | null>(null);
  const [skippedPage, setSkippedPage] = useState<SkippedRecordsPage | null>(null);
  const [recordsPageNumber, setRecordsPageNumber] = useState(1);
  const [skippedPageNumber, setSkippedPageNumber] = useState(1);
  const [activeTab, setActiveTab] = useState<ResultTab>("parsed");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tabRefs = useRef<Record<ResultTab, HTMLButtonElement | null>>({
    parsed: null,
    skipped: null,
    mapping: null,
    exports: null,
    raw: null,
  });

  const progress = useMemo(() => {
    if (!job || job.totalRows === 0) return 0;
    return Math.min(100, Math.round((job.processedRows / job.totalRows) * 100));
  }, [job]);
  const terminalJob = job ? ["completed", "partial_failed", "failed"].includes(job.status) : false;
  const exportsReady = Boolean(job && terminalJob);
  const currentStep = !preview ? 0 : !job ? 1 : terminalJob ? 3 : 2;
  const successRate = job && job.totalRows > 0 ? Math.round((job.importedCount / job.totalRows) * 100) : 0;

  const parseFile = useCallback((file: File) => {
    setError("");
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Choose a CSV file to continue.");
      toast.error("That file is not a CSV", { description: "Choose a .csv file to preview." });
      return;
    }
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (result) => {
        const rows = result.data.map((row) => sanitizeRow(row));
        const columns = result.meta.fields?.filter(Boolean) ?? Object.keys(rows[0] ?? {});
        setPreview({
          file,
          fileName: file.name,
          columns,
          rows,
          errors: result.errors.slice(0, 3).map((item) => item.message),
        });
        toast.success("CSV preview ready", { description: `${rows.length.toLocaleString()} rows detected locally.` });
      },
      error: (parseError) => setError(parseError.message),
    });
  }, []);

  const loadSample = async (samplePath: string) => {
    setError("");
    try {
      const response = await fetch(samplePath);
      if (!response.ok) throw new Error("Could not load sample file");
      const text = await response.text();
      const file = new File([text], samplePath.split("/").pop() ?? "sample.csv", { type: "text/csv" });
      parseFile(file);
    } catch (sampleError) {
      const message = sampleError instanceof Error ? sampleError.message : "Could not load sample file";
      setError(message);
      toast.error("Sample file unavailable", { description: "Choose a CSV from your device instead." });
    }
  };

  const confirmImport = async () => {
    if (!preview) return;
    setBusy(true);
    setError("");
    setRecordsPage(null);
    setSkippedPage(null);
    setRecordsPageNumber(1);
    setSkippedPageNumber(1);
    try {
      const formData = new FormData();
      formData.append("file", preview.file);
      const response = await apiFetch<{ jobId: string }>("/api/imports", { method: "POST", body: formData });
      const jobResponse = await apiFetch<ImportJobResponse>(`/api/imports/${response.jobId}`);
      setJob(jobResponse.job);
      toast.success("Import started", { description: "AI extraction is now running on the backend." });
    } catch (importError) {
      const message = importError instanceof Error ? importError.message : "Import failed";
      setError(message);
      toast.error("Import could not start", { description: message });
    } finally {
      setBusy(false);
    }
  };

  const retryFailed = async () => {
    if (!job) return;
    setBusy(true);
    setError("");
    setRecordsPageNumber(1);
    setSkippedPageNumber(1);
    try {
      const response = await apiFetch<{ job: ImportJobSummary; retriedBatches: number }>(`/api/imports/${job.id}/retry`, { method: "POST" });
      setJob(response.job);
      toast.success("Retry started", { description: `${response.retriedBatches} failed batch${response.retriedBatches === 1 ? "" : "es"} queued again.` });
    } catch (retryError) {
      const message = retryError instanceof Error ? retryError.message : "Retry failed";
      setError(message);
      toast.error("Retry failed", { description: message });
    } finally {
      setBusy(false);
    }
  };

  const focusTab = (tab: ResultTab) => {
    setActiveTab(tab);
    tabRefs.current[tab]?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tab: ResultTab) => {
    const currentIndex = resultTabs.findIndex((item) => item.id === tab);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusTab(resultTabs[(currentIndex + 1) % resultTabs.length].id);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusTab(resultTabs[(currentIndex - 1 + resultTabs.length) % resultTabs.length].id);
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusTab(resultTabs[0].id);
    }
    if (event.key === "End") {
      event.preventDefault();
      focusTab(resultTabs[resultTabs.length - 1].id);
    }
  };

  useEffect(() => {
    if (!job || ["completed", "partial_failed", "failed"].includes(job.status)) return;
    const timer = window.setInterval(async () => {
      try {
        const response = await apiFetch<ImportJobResponse>(`/api/imports/${job.id}`);
        setJob(response.job);
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : "Could not poll job");
      }
    }, 900);
    return () => window.clearInterval(timer);
  }, [job]);

  useEffect(() => {
    if (!job) return;
    const loadResults = async () => {
      if (job.importedCount > 0 || ["completed", "partial_failed", "failed"].includes(job.status)) {
        setRecordsPage(await apiFetch<ImportedRecordsPage>(`/api/imports/${job.id}/records?page=${recordsPageNumber}&limit=100`));
        setSkippedPage(await apiFetch<SkippedRecordsPage>(`/api/imports/${job.id}/skipped?page=${skippedPageNumber}&limit=100`));
      }
    };
    void loadResults().catch((resultError) => {
      setError(resultError instanceof Error ? resultError.message : "Could not load results");
    });
  }, [job, recordsPageNumber, skippedPageNumber]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">L</div>
          <div>
            <div className="eyebrow">LISTWRIGHT WORKBENCH</div>
            <h1>Listwright</h1>
            <p>Turn messy lead files into reviewable CRM records.</p>
          </div>
        </div>
        <div className="topbar-meta">
          <span className="meta-label">SAFE DEMO MODE</span>
          <span className="limit-chip">{DEFAULT_IMPORT_ROW_LIMIT.toLocaleString()} row limit</span>
        </div>
      </header>

      <ImporterStepper currentStep={currentStep} />

      {error ? <div className="alert alert-error" role="alert">Error: {error}</div> : null}

      <section className="workbench">
        <div className="panel upload-panel">
          <div className="section-title">
            <div>
              <span className="section-kicker">STEP 1 / 3</span>
              <h2>Inspect your source file</h2>
              <p>Everything stays in your browser until you confirm the import.</p>
            </div>
            <span className="status-dot status-safe"><span className="status-symbol">●</span> Local only</span>
          </div>

          <UploadDropzone onFile={parseFile} samples={samples} onLoadSample={(path) => void loadSample(path)} rowLimit={DEFAULT_IMPORT_ROW_LIMIT} />

          <div className="boundary-strip" aria-live="polite">
            <span className="boundary-step active">1. Local preview</span>
            <span className={job ? "boundary-step active" : "boundary-step"}>2. Confirmed backend import</span>
            <span className={terminalJob ? "boundary-step active" : "boundary-step"}>3. Reviewable exports</span>
          </div>

          <PreviewTable preview={preview} />

          <div className="confirm-strip">
            <div>
              <span className="confirm-label">READY TO REVIEW</span>
              <strong>{preview ? `${preview.rows.length.toLocaleString()} rows detected` : "No CSV selected"}</strong>
              <span>{preview ? `${preview.columns.length} columns · ${preview.fileName}` : "Load a sample or choose a file."}</span>
            </div>
            <button type="button" className="primary-button" disabled={!preview || busy} onClick={() => void confirmImport()}>
              {busy ? "Starting import…" : "Confirm import"}
            </button>
          </div>
        </div>

        <div className="panel progress-panel" aria-live="polite">
          <div className="section-title">
            <div>
              <h2>Import progress</h2>
              <p>Real backend batch status appears after confirmation.</p>
            </div>
            <span className={`status-dot status-${job?.status ?? "idle"}`}>{formatStatus(job?.status)}</span>
          </div>

          <div className="progress-bar" role="progressbar" aria-label={`Import progress ${progress}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="metrics-grid">
            <Metric label="Batches" value={job ? `${job.completedBatches}/${job.batchCount}` : "0/0"} />
            <Metric label="Processed rows" value={job?.processedRows ?? 0} />
            <Metric label="Imported" value={job?.importedCount ?? 0} />
            <Metric label="Skipped" value={job?.skippedCount ?? 0} />
            <Metric label="Failed batches" value={job?.failedBatches ?? 0} />
          </div>

          {job?.errors.length ? (
            <div className="error-list">
              {job.errors.slice(-3).map((jobError, index) => (
                <div key={`${jobError.createdAt}-${index}`}>Warning: {jobError.message}</div>
              ))}
            </div>
          ) : null}

          <div className="action-row">
            <button type="button" className="secondary-button" disabled={!job || job.failedBatches === 0 || busy} onClick={() => void retryFailed()}>
              Retry failed batches
            </button>
            {exportsReady && job ? (
              <>
                <a className="secondary-button link-button" href={exportUrl(job.id, "csv")}>Export CSV</a>
                <a className="secondary-button link-button" href={exportUrl(job.id, "json")}>Export JSON</a>
              </>
            ) : job ? (
              <span className="action-note">Exports unlock after processing reaches a terminal status.</span>
            ) : null}
          </div>
        </div>
      </section>

      <ResultsSummary job={job} successRate={successRate} />

      <section className="panel results-panel">
        <div className="tabs" role="tablist" aria-label="Import results">
          {resultTabs.map((tab) => (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              id={`${tab.id}-tab`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
            >
              {tab.label} {tab.id === "parsed" ? `(${job?.importedCount ?? 0})` : ""}
              {tab.id === "skipped" ? `(${job?.skippedCount ?? 0})` : ""}
              {tab.id === "mapping" ? `(${job?.mappingNotes.length ?? 0})` : ""}
            </button>
          ))}
        </div>

        <div id="parsed-panel" role="tabpanel" aria-labelledby="parsed-tab" hidden={activeTab !== "parsed"}>
          <RecordsTable records={recordsPage?.records ?? []} expanded={expanded} setExpanded={setExpanded} />
          <PaginationControls pagination={recordsPage?.pagination} page={recordsPageNumber} onPageChange={setRecordsPageNumber} label="parsed records" />
        </div>
        <div id="skipped-panel" role="tabpanel" aria-labelledby="skipped-tab" hidden={activeTab !== "skipped"}>
          <SkippedTable records={skippedPage?.records ?? []} />
          <PaginationControls pagination={skippedPage?.pagination} page={skippedPageNumber} onPageChange={setSkippedPageNumber} label="skipped records" />
        </div>
        <div id="mapping-panel" role="tabpanel" aria-labelledby="mapping-tab" hidden={activeTab !== "mapping"}>
          <MappingNotes job={job} />
        </div>
        <div id="exports-panel" role="tabpanel" aria-labelledby="exports-tab" hidden={activeTab !== "exports"}>
          <ExportsPanel job={job} exportsReady={exportsReady} />
        </div>
        <div id="raw-panel" role="tabpanel" aria-labelledby="raw-tab" hidden={activeTab !== "raw"}>
          <RawJsonPanel job={job} records={recordsPage?.records ?? []} skipped={skippedPage?.records ?? []} />
        </div>
      </section>
    </main>
  );
}

function ResultsSummary({ job, successRate }: { job: ImportJobSummary | null; successRate: number }) {
  const metrics = [
    { label: "Total rows", value: job?.totalRows ?? 0, icon: "rows" },
    { label: "Imported", value: job?.importedCount ?? 0, icon: "imported" },
    { label: "Skipped", value: job?.skippedCount ?? 0, icon: "skipped" },
    { label: "Success rate", value: job ? `${successRate}%` : "—", icon: "rate" },
  ];
  return (
    <section className="summary-strip" aria-label="Import summary">
      <div className="summary-intro"><span className="section-kicker">WORKSPACE SUMMARY</span><strong>{job ? "Review the output" : "Your output will appear here"}</strong><span>{job ? "Trace every decision from source row to CRM record." : "Start with a CSV to unlock parsed records and exportable results."}</span></div>
      <div className="summary-metrics">
        {metrics.map((metric) => <div className="summary-metric" key={metric.label}><span>{metric.label}</span><strong>{typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}</strong></div>)}
      </div>
    </section>
  );
}

function PreviewTable({ preview }: { preview: PreviewState | null }) {
  if (!preview) {
    return (
      <div className="empty-state">
        <span className="empty-state-title">Your preview will appear here</span>
        <span>We show the first rows and detected columns so you can catch mapping issues before processing.</span>
      </div>
    );
  }

  return (
    <div className="preview-block">
      <div className="preview-toolbar">
        <div>
          <span className="section-kicker">LOCAL PREVIEW</span>
          <strong>{preview.fileName}</strong>
        </div>
        <div className="preview-stats">
          <span><strong>{preview.rows.length.toLocaleString()}</strong> rows</span>
          <span><strong>{preview.columns.length}</strong> columns</span>
          <span><strong>{formatFileSize(preview.file.size)}</strong></span>
        </div>
      </div>
      <div className="table-wrap preview-wrap">
        <table>
          <thead>
            <tr><th scope="col">#</th>{preview.columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {preview.rows.slice(0, 80).map((row, index) => (
              <tr key={index}>
                <td className="row-number">{index + 1}</td>
                {preview.columns.map((column) => <td key={column}>{row[column] || ""}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {preview.rows.length > 80 ? <div className="table-note">Showing first 80 rows for local review. Confirm import processes up to the row limit.</div> : null}
        {preview.errors.length ? <div className="table-note">Preview parser notes: {preview.errors.join("; ")}</div> : null}
      </div>
    </div>
  );
}

function RecordsTable({
  records,
  expanded,
  setExpanded,
}: {
  records: ImportedRecordsPage["records"];
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}) {
  if (!records.length) return <div className="empty-state">No parsed records yet. Start an import or inspect skipped rows after processing.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Trace</th>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Mobile</th>
            <th scope="col">Status</th>
            <th scope="col">Source</th>
            <th scope="col">Confidence</th>
            <th scope="col">Warnings</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <Fragment key={record.id}>
              <tr>
                <td>
                  <button className="expand-button" type="button" onClick={() => setExpanded(expanded === record.id ? null : record.id)}>
                    {expanded === record.id ? "Hide comparison for" : "Compare"} row {record.rowNumber}
                  </button>
                </td>
                <td>{record.crm.name}</td>
                <td>{record.crm.email}</td>
                <td>{record.crm.country_code} {record.crm.mobile_without_country_code}</td>
                <td>{record.crm.crm_status || "blank"}</td>
                <td>{record.crm.data_source || "blank"}</td>
                <td><span className="chip">Confidence {Math.round(record.confidence * 100)}%</span></td>
                <td>{record.warnings.length ? record.warnings.map((warning) => <span className="chip warning" key={warning}>Warning: {warning}</span>) : "None"}</td>
              </tr>
              {expanded === record.id ? (
                <tr className="comparison-row">
                  <td colSpan={8}>
                    <div className="comparison-grid">
                      <pre>{JSON.stringify(record.originalRow, null, 2)}</pre>
                      <pre>{JSON.stringify(record.crm, null, 2)}</pre>
                    </div>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkippedTable({ records }: { records: SkippedRecordsPage["records"] }) {
  if (!records.length) return <div className="empty-state">No skipped records. All processable rows produced CRM records.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Row</th>
            <th scope="col">Reason</th>
            <th scope="col">Warnings</th>
            <th scope="col">Original row</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.rowNumber}</td>
              <td>{record.reason}</td>
              <td>{record.warnings.length ? record.warnings.join(", ") : "None"}</td>
              <td><code>{JSON.stringify(record.originalRow)}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaginationControls({
  pagination,
  page,
  onPageChange,
  label,
}: {
  pagination?: { page: number; total: number; totalPages: number };
  page: number;
  onPageChange: (page: number) => void;
  label: string;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label={`${label} pagination`}>
      <span>Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
      <div className="pagination-actions">
        <button type="button" className="secondary-button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <button type="button" className="secondary-button" disabled={page >= pagination.totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}

function MappingNotes({ job }: { job: ImportJobSummary | null }) {
  if (!job?.mappingNotes.length) return <div className="empty-state">No mapping notes yet. Notes are aggregated by batch or globally.</div>;
  return (
    <div className="mapping-list">
      {job.mappingNotes.map((note) => (
        <div className="mapping-note" key={note.id}>
          <strong>{note.sourceColumn} → {note.targetField}</strong>
          <span>{note.note}</span>
          <small>{note.scope} {note.confidence ? `, confidence ${Math.round(note.confidence * 100)}%` : ""}</small>
        </div>
      ))}
    </div>
  );
}

function ExportsPanel({ job, exportsReady }: { job: ImportJobSummary | null; exportsReady: boolean }) {
  if (!job) return <div className="empty-state">Exports become available after an import job starts.</div>;
  if (!exportsReady) return <div className="empty-state">Exports unlock after processing completes, partially fails, or fails with reviewable job metadata.</div>;
  return (
    <div className="exports-grid">
      <div>
        <h3>CRM CSV export</h3>
        <p>Contains exactly the Listwright CRM columns, with UI-only confidence and warnings excluded.</p>
        <code>{CRM_CSV_COLUMNS.join(",")}</code>
        <a className="primary-button link-button" href={exportUrl(job.id, "csv")}>Export CSV</a>
      </div>
      <div>
        <h3>JSON review export</h3>
        <p>Includes records, skipped records, original rows, warnings, confidence, mapping notes, and job metadata.</p>
        <a className="secondary-button link-button" href={exportUrl(job.id, "json")}>Export JSON</a>
      </div>
    </div>
  );
}

function RawJsonPanel({
  job,
  records,
  skipped,
}: {
  job: ImportJobSummary | null;
  records: ImportedRecordsPage["records"];
  skipped: SkippedRecordsPage["records"];
}) {
  if (!job) return <div className="empty-state">Raw review JSON becomes available after an import starts.</div>;
  return (
    <div className="raw-json-panel">
      <div className="raw-json-header"><div><h3>Raw review payload</h3><p>Current page of parsed and skipped records, plus job metadata and mapping notes.</p></div><span className="chip">Read only</span></div>
      <pre>{JSON.stringify({ job, records, skippedRecords: skipped, mappingNotes: job.mappingNotes }, null, 2)}</pre>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatStatus(status: ImportJobSummary["status"] | undefined) {
  if (!status) return "Not started";
  return status.replace(/_/g, " ");
}

function sanitizeRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? "").replace(/\r?\n/g, " ").trim()]));
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
