import {
  ALLOWED_CRM_STATUSES,
  ALLOWED_DATA_SOURCES,
  CRM_CSV_COLUMNS,
} from "@listwright/shared";
import { z } from "zod";

import { extractDeterministically } from "./deterministic.js";
import type { AiBatchResult, SourceRow } from "../types.js";

const structuredOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    records: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          rowNumber: { type: "number" },
          crm: {
            type: "object",
            additionalProperties: false,
            properties: Object.fromEntries(CRM_CSV_COLUMNS.map((column) => [column, { type: "string" }])),
            required: CRM_CSV_COLUMNS,
          },
          confidence: { type: "number" },
          warnings: { type: "array", items: { type: "string" } },
          mappingNoteIds: { type: "array", items: { type: "string" } },
        },
        required: ["rowNumber", "crm", "confidence", "warnings", "mappingNoteIds"],
      },
    },
    skippedRecords: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          rowNumber: { type: "number" },
          reason: { type: "string" },
          warnings: { type: "array", items: { type: "string" } },
        },
        required: ["rowNumber", "reason", "warnings"],
      },
    },
    mappingNotes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          scope: { type: "string", enum: ["global", "batch"] },
          batchId: { type: "string" },
          sourceColumn: { type: "string" },
          targetField: { type: "string" },
          note: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["id", "scope", "batchId", "sourceColumn", "targetField", "note", "confidence"],
      },
    },
  },
  required: ["records", "skippedRecords", "mappingNotes"],
} as const;

const aiCrmRecordSchema = z.object(Object.fromEntries(CRM_CSV_COLUMNS.map((column) => [column, z.string()])))
  .strict();
const aiBatchResultSchema = z.object({
  records: z.array(z.object({
    rowNumber: z.number().int().positive(),
    crm: aiCrmRecordSchema,
    confidence: z.number().min(0).max(1),
    warnings: z.array(z.string()),
    mappingNoteIds: z.array(z.string()),
  })),
  skippedRecords: z.array(z.object({
    rowNumber: z.number().int().positive(),
    reason: z.string(),
    warnings: z.array(z.string()),
  })),
  mappingNotes: z.array(z.object({
    id: z.string(),
    scope: z.enum(["global", "batch"]),
    batchId: z.string(),
    sourceColumn: z.string(),
    targetField: z.string(),
    note: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

export async function extractBatch(rows: SourceRow[], batchId: string): Promise<AiBatchResult> {
  if (!process.env.OPENAI_API_KEY) {
    return extractDeterministically(rows, batchId);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "listwright_import_batch",
          strict: true,
          schema: structuredOutputSchema,
        },
      },
      messages: [
        {
          role: "system",
          content: [
            "You are a careful CRM data-mapping engine for Listwright.",
            "Map each messy lead CSV row into the exact CRM fields in the schema.",
            "Return structured JSON only. Never invent facts that are not present in the row or deterministic signals.",
            "Use header meaning first, then value shape and deterministic signals. Treat columns like contact, details, info, or notes as ambiguous unless their values clearly identify a field.",
            "When a column could map to multiple fields, choose the strongest evidence, leave weaker fields blank, and add a batch mapping note explaining the ambiguity.",
            "Preserve names, companies, notes, and descriptions as text. Do not put a phone number into email, or an email into a name.",
            "Normalize only what the schema allows. Do not convert unknown statuses or sources into allowed values.",
            "Skip only rows missing both email and mobile after using the deterministic signals. A row with either contact method should remain reviewable.",
            `Allowed crm_status values: ${ALLOWED_CRM_STATUSES.join(", ")}`,
            `Allowed data_source values: ${ALLOWED_DATA_SOURCES.join(", ")}`,
            `CRM fields: ${CRM_CSV_COLUMNS.join(", ")}`,
            "Mapping notes must be batch-level or global, not one note per row. Include source column, target field, confidence, and a short reason.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify({ batchId, rows }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI structured extraction failed: ${response.status} ${message.slice(0, 500)}`);
  }

  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty structured response");
  const parsed = aiBatchResultSchema.safeParse(JSON.parse(content));
  if (!parsed.success) throw new Error("OpenAI returned structured data that failed backend validation.");
  return parsed.data as AiBatchResult;
}
