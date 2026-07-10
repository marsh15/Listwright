export const CRM_CSV_COLUMNS = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
] as const;

export const ALLOWED_CRM_STATUSES = [
  "",
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export const ALLOWED_DATA_SOURCES = [
  "",
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

export const IMPORT_JOB_STATUSES = [
  "queued",
  "processing",
  "completed",
  "partial_failed",
  "failed",
] as const;

export const IMPORT_BATCH_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;

export const DEFAULT_IMPORT_ROW_LIMIT = 1000;
