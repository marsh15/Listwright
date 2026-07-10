import {
  ALLOWED_CRM_STATUSES,
  ALLOWED_DATA_SOURCES,
} from "@listwright/shared";

import type { DeterministicSignals, SourceRow } from "../types.js";

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phoneRegex = /(?:\+?\d[\d\s().-]{6,}\d)/g;
const dateHints = /\b\d{4}-\d{1,2}-\d{1,2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g;

export function preprocessRows(rows: Record<string, string>[]): SourceRow[] {
  const seen = new Set<string>();

  return rows.map((raw, index) => {
    const normalized = normalizeRaw(raw);
    const signature = JSON.stringify(normalized).toLowerCase();
    const isDuplicate = signature !== "{}" && seen.has(signature);
    seen.add(signature);

    return {
      rowNumber: index + 2,
      raw: normalized,
      deterministicSignals: detectSignals(normalized, isDuplicate),
    };
  });
}

export function chunkRows(rows: SourceRow[], size = 25) {
  const batches: SourceRow[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    batches.push(rows.slice(index, index + size));
  }
  return batches;
}

function normalizeRaw(raw: Record<string, string>) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    normalized[key.trim()] = String(value ?? "").replace(/\r?\n/g, " ").trim();
  }
  return normalized;
}

function detectSignals(row: Record<string, string>, isDuplicate: boolean): DeterministicSignals {
  const text = Object.values(row).join(" ");
  const emails = unique(text.match(emailRegex) ?? []);
  const phoneCandidates = unique(Object.values(row).flatMap((value) => value.match(phoneRegex) ?? []))
    .filter((value) => !looksLikeDate(value))
    .map(cleanPhone)
    .filter((phone) => phone.replace(/\D/g, "").length >= 10);
  const dates = unique(text.match(dateHints) ?? []).filter((date) => !Number.isNaN(new Date(date).getTime()));
  const values = Object.values(row).map((value) => value.toLowerCase());
  const likelyStatuses = ALLOWED_CRM_STATUSES.filter((status) => status && values.some((value) => value.includes(status.toLowerCase())));
  const likelyDataSources = ALLOWED_DATA_SOURCES.filter((source) => {
    if (!source) return false;
    const readable = source.replace(/_/g, " ");
    return values.some((value) => value.includes(source) || value.includes(readable));
  });
  const possibleCountryCodes = unique(phoneCandidates
    .filter((phone) => phone.startsWith("+") || (phone.length > 10 && !phone.startsWith("0")))
    .map((phone) => {
      const digits = phone.replace(/\D/g, "");
      if (phone.startsWith("+")) return `+${digits.slice(0, Math.max(1, digits.length - 10))}`;
      return digits.length > 10 ? `+${digits.slice(0, digits.length - 10)}` : "";
    })
    .filter(Boolean));
  const isEmpty = Object.values(row).every((value) => value.trim() === "");
  const extraContactValues = [...emails.slice(1), ...phoneCandidates.slice(1)];
  const warnings = [
    ...(isEmpty ? ["Empty row detected"] : []),
    ...(isDuplicate ? ["Duplicate row detected"] : []),
    ...(extraContactValues.length > 0 ? ["Extra contact values will be appended to crm_note"] : []),
  ];

  return {
    emails,
    phones: phoneCandidates,
    possibleCountryCodes,
    dates,
    likelyStatuses,
    likelyDataSources,
    isDuplicate,
    isEmpty,
    extraContactValues,
    warnings,
  };
}

function cleanPhone(value: string) {
  const trimmed = value.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  return `${prefix}${trimmed.replace(/\D/g, "")}`;
}

function looksLikeDate(value: string) {
  const trimmed = value.trim();
  return /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(trimmed) || /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(trimmed);
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
