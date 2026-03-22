# Van311 Reporter - Architecture & Schema Reference

---

## 1. System Architecture

```text
Frontend (React / Next / Vite)
  ├─ Public map
  ├─ Public issue list
  ├─ Issue detail panel
  ├─ Chat intake UI
  ├─ Upload UI for image evidence
  └─ Submission receipt UI

Convex
  ├─ serviceCategorySpecs
  ├─ publicIssues
  ├─ ingestRuns
  ├─ chatSessions
  ├─ chatMessages
  ├─ reportDrafts
  ├─ attachments
  ├─ submissionAttempts
  ├─ submissionReceipts
  └─ optional prompt / model config tables

AI / Extraction Layer
  ├─ category suggestion
  ├─ evidence summarization
  ├─ fact extraction
  ├─ location extraction / cleanup
  ├─ missing-field detection
  └─ submission summary generation

Submission Bridge
  ├─ accepts category-specific payload
  ├─ fills the browser / website flow
  ├─ returns submission status
  ├─ returns case number when available
  └─ returns raw bridge metadata / diagnostics

Open Data Ingest
  ├─ pulls city issue records
  ├─ normalizes into PublicIssue
  ├─ stores map/list records in Convex
  └─ tracks ingest runs
```

---

## 2. Category Spec Types

### 2.1 `ServiceCategorySpec`

```ts
export type ServiceCategorySpec = {
  _id?: string;

  slug: string;
  display_name: string;

  topic_group: string | null;
  topic_subgroup: string | null;

  is_active: boolean;
  sort_order: number | null;

  bridge_target: string;

  description: string | null;
  help_text: string | null;
  example_reports_text: string | null;

  requires_location: boolean;
  allows_images: boolean;
  allows_multiple_images: boolean;
  requires_description: boolean;
  requires_contact_email: boolean | null;

  fields: CategoryFieldSpec[];

  payload_instructions: string | null;

  source_url: string | null;
  scraped_at: string | null;
  scrape_version: string | null;

  raw_scrape: Record<string, unknown> | null;
};
```

### 2.2 `CategoryFieldSpec`

```ts
export type CategoryFieldSpec = {
  key: string;
  label: string;

  // UI / validation / payload hint
  input_kind:
    | "short_text"
    | "long_text"
    | "select"
    | "multi_select"
    | "boolean"
    | "number"
    | "date"
    | "location_text"
    | "email"
    | "phone"
    | "unknown";

  // Requiredness as scraped or normalized
  required: boolean;

  // Optionality / guidance
  placeholder: string | null;
  help_text: string | null;

  // Select options if applicable
  options: FieldOption[];

  // Whether this field is intended for user entry, AI extraction, or either
  collection_mode:
    | "user_only"
    | "ai_only"
    | "user_or_ai"
    | "system";

  // How strict validation should be in the draft phase
  validation_mode:
    | "strict"
    | "soft"
    | "bridge_only";

  // If true, the chatbot should explicitly ask follow-ups when missing
  ask_if_missing: boolean;

  // Optional mapping info for the submission bridge
  payload_key: string | null;
  payload_transform_hint: string | null;

  // Raw scraped field shape for future debugging
  raw_field: Record<string, unknown> | null;
};
```

### 2.3 `FieldOption`

```ts
export type FieldOption = {
  value: string;
  label: string;
  sort_order: number | null;
  is_active: boolean;
};
```

---

## 3. Public Issue Types

### 3.1 `PublicIssue`

```ts
export type PublicIssue = {
  _id?: string;

  source: "city_open_data";
  city_case_id: string | null;

  city_call_type: string;
  mapped_category_slug: string | null;

  title: string;
  summary: string;
  status: "open" | "closed" | "unknown";

  location: {
    lat: number | null;
    lng: number | null;
    address_text: string | null;
    intersection_text: string | null;
    local_area: string | null;
    location_label: string | null;
  };

  metadata: {
    department: string | null;
    division: string | null;
    received_at: string | null;
    closed_at: string | null;
    last_seen_in_ingest_at: string | null;
  };

  map_visibility: "map_and_list" | "list_only";
  browse_priority: number | null;

  raw: Record<string, unknown>;
};
```

### 3.2 `IngestRun`

```ts
export type IngestRun = {
  _id?: string;
  source: "vancouver_open_data";
  started_at: string;
  finished_at: string | null;
  status: "running" | "succeeded" | "failed";
  records_seen: number;
  records_written: number;
  records_updated: number;
  error_text: string | null;
};
```

---

## 4. Chat & Intake Types

### 4.1 `ChatSession`

```ts
export type ChatSession = {
  _id?: string;
  created_at: string;
  updated_at: string;

  state:
    | "collecting_category"
    | "collecting_location"
    | "collecting_evidence"
    | "collecting_missing_fields"
    | "ready_to_submit"
    | "submitting"
    | "submitted"
    | "failed";

  draft_id: string;

  session_label: string | null;
  last_error: string | null;
  last_assistant_question: string | null;
};
```

### 4.2 `ChatMessage`

```ts
export type ChatMessage = {
  _id?: string;
  session_id: string;
  created_at: string;

  role: "user" | "assistant" | "system";
  text: string;

  attachment_ids: string[];

  extraction_notes: string | null;
};
```

### 4.3 `Attachment`

```ts
export type Attachment = {
  _id?: string;
  created_at: string;

  kind: "image" | "file" | "other";
  storage_id: string; // Convex file storage id or equivalent
  mime_type: string | null;
  filename: string | null;
  size_bytes: number | null;

  width: number | null;
  height: number | null;

  session_id: string | null;
  draft_id: string | null;

  semantic_role:
    | "context"
    | "closeup"
    | "location_cue"
    | "other"
    | null;
};
```

---

## 5. Report Draft Types

### 5.1 `ReportDraft`

```ts
export type ReportDraft = {
  _id?: string;
  created_at: string;
  updated_at: string;

  session_id: string;

  selected_category_slug: string | null;
  category_confidence: number | null;
  category_reasoning_text: string | null;
  category_selection_source: "user" | "ai" | "hybrid" | null;

  evidence: {
    attachment_ids: string[];
    user_description_text: string | null;
    user_location_text: string | null;
    user_extra_context_text: string | null;
  };

  location: {
    lat: number | null;
    lng: number | null;
    address_text: string | null;
    intersection_text: string | null;
    local_area: string | null;
    location_notes_text: string | null;
    normalized_location_text: string | null;
    location_confidence: number | null;
  };

  ai_output: {
    evidence_summary_text: string | null;
    issue_summary_text: string | null;
    extracted_facts_text: string | null;
    reasoning_text: string | null;
    submission_ready_summary_text: string | null;
  };

  field_answers: Record<string, DraftFieldAnswer>;

  required_field_keys: string[];
  missing_field_keys: string[];
  unresolved_questions: string[];

  ready_for_submission: boolean;
  readiness_reason_text: string | null;

  contact: {
    email: string | null;
    phone: string | null;
    name: string | null;
  };

  last_extracted_at: string | null;
  last_validated_at: string | null;
  last_payload_built_at: string | null;
};
```

### 5.2 `DraftFieldAnswer`

```ts
export type DraftFieldAnswer = {
  field_key: string;

  value_text: string | null;
  value_normalized: string | number | boolean | string[] | null;

  provenance: "user" | "ai" | "hybrid" | "system";
  confidence: number | null;

  notes_text: string | null;

  is_resolved: boolean;
};
```

---

## 6. Submission Types

### 6.1 `SubmissionPayloadEnvelope`

```ts
export type SubmissionPayloadEnvelope = {
  _id?: string;

  report_draft_id: string;
  category_slug: string;
  category_display_name: string;
  bridge_target: string;

  category_spec_snapshot: ServiceCategorySpec;

  common: {
    summary_text: string | null;
    description_text: string | null;
    location_text: string | null;
    lat: number | null;
    lng: number | null;
    address_text: string | null;
    intersection_text: string | null;
    local_area: string | null;
    image_attachment_ids: string[];
    email: string | null;
    phone: string | null;
    name: string | null;
  };

  fields: Record<string, PayloadFieldValue>;

  instructions_text: string | null;

  created_at: string;
};
```

### 6.2 `PayloadFieldValue`

```ts
export type PayloadFieldValue = {
  payload_key: string;
  value: string | number | boolean | string[] | null;
  display_text: string | null;
  source_field_key: string | null;
};
```

### 6.3 `SubmissionAttempt`

```ts
export type SubmissionAttempt = {
  _id?: string;
  created_at: string;
  finished_at: string | null;

  report_draft_id: string;
  category_slug: string;

  status:
    | "queued"
    | "sent_to_bridge"
    | "submitted"
    | "failed";

  payload_snapshot: SubmissionPayloadEnvelope;

  bridge_response: {
    success: boolean;
    case_number: string | null;
    response_summary_text: string | null;
    raw_response: Record<string, unknown> | null;
    error_text: string | null;
  };
};
```

### 6.4 `SubmissionReceipt`

```ts
export type SubmissionReceipt = {
  _id?: string;
  report_draft_id: string;
  submission_attempt_id: string;

  status: "submitted" | "failed";
  case_number: string | null;

  submitted_category_name: string;
  submitted_summary_text: string;
  submitted_location_text: string | null;
  submitted_field_summary: Array<{
    label: string;
    value_text: string;
  }>;

  created_at: string;
};
```

---

## 7. Frontend View Models

### 7.1 `MapMarkerView`

```ts
export type MapMarkerView = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  status: string;
  category_slug: string | null;
};
```

### 7.2 `IssueListItemView`

```ts
export type IssueListItemView = {
  id: string;
  title: string;
  summary: string;
  status: string;
  local_area: string | null;
  location_label: string | null;
  category_slug: string | null;
  received_at: string | null;
};
```

### 7.3 `IssueDetailView`

```ts
export type IssueDetailView = {
  id: string;
  title: string;
  summary: string;
  status: string;
  category_slug: string | null;
  address_text: string | null;
  intersection_text: string | null;
  local_area: string | null;
  department: string | null;
  division: string | null;
  received_at: string | null;
  closed_at: string | null;
};
```

### 7.4 `ChatViewState`

```ts
export type ChatViewState = {
  session_id: string;
  state: string;
  selected_category_slug: string | null;
  category_display_name: string | null;
  last_assistant_question: string | null;
  missing_field_labels: string[];
  ready_for_submission: boolean;
  attachment_ids: string[];
};
```

### 7.5 `ReceiptView`

```ts
export type ReceiptView = {
  status: "submitted" | "failed";
  case_number: string | null;
  submitted_category_name: string;
  submitted_summary_text: string;
  submitted_location_text: string | null;
  submitted_field_summary: Array<{
    label: string;
    value_text: string;
  }>;
};
```

---

## 8. Convex Collections & Indexes

### 8.1 `serviceCategorySpecs`

Indexes:
- `by_slug`
- `by_active`
- `by_topic_group`

### 8.2 `publicIssues`

Indexes:
- `by_city_case_id`
- `by_status`
- `by_mapped_category_slug`
- `by_local_area`

### 8.3 `ingestRuns`

Indexes:
- `by_started_at`
- `by_status`

### 8.4 `chatSessions`

Indexes:
- `by_created_at`
- `by_state`

### 8.5 `chatMessages`

Indexes:
- `by_session_id`
- `by_session_id_created_at`

### 8.6 `attachments`

Indexes:
- `by_session_id`
- `by_draft_id`

### 8.7 `reportDrafts`

Indexes:
- `by_session_id`
- `by_selected_category_slug`
- `by_ready_for_submission`
- `by_updated_at`

### 8.8 `submissionAttempts`

Indexes:
- `by_report_draft_id`
- `by_status`
- `by_created_at`

### 8.9 `submissionReceipts`

Indexes:
- `by_report_draft_id`
- `by_submission_attempt_id`

---

## 9. Convex Functions

### 9.1 Public issue browsing
- `syncPublicIssues()`
- `listPublicIssues({ cursor, limit, categorySlug, status })`
- `listMapIssues({ bounds, categorySlug })`
- `getPublicIssue(issueId)`

### 9.2 Category catalog
- `listActiveCategories()`
- `getCategorySpec(slug)`
- `upsertCategorySpecsFromScrape(payload)`

### 9.3 Chat/intake
- `createChatSession()`
- `appendChatMessage({ sessionId, role, text, attachmentIds })`
- `attachFileToSession({ sessionId, storageId, ... })`
- `getChatSession(sessionId)`
- `getChatMessages(sessionId)`
- `getDraftBySession(sessionId)`
- `extractDraftFromSession(sessionId)`
- `getNextMissingFieldQuestion(sessionId)`

### 9.4 Draft lifecycle
- `selectCategory({ sessionId, slug })`
- `updateDraftLocation({ sessionId, ... })`
- `setDraftFieldAnswer({ sessionId, fieldKey, answer })`
- `validateDraft(sessionId)`
- `markDraftReady(sessionId)`

### 9.5 Submission
- `buildSubmissionPayload(sessionId)`
- `submitDraft(sessionId)`
- `getLatestSubmissionAttempt(reportDraftId)`
- `getSubmissionReceipt(reportDraftId)`

---

## 10. Example Category Spec Record

```json
{
  "slug": "pothole",
  "display_name": "Pothole",
  "topic_group": "Streets, Transportation & Parking",
  "topic_subgroup": null,
  "is_active": true,
  "sort_order": 20,
  "bridge_target": "pothole",
  "description": "Road surface pothole report",
  "help_text": "Report a pothole on a city street.",
  "example_reports_text": "Large pothole in right lane near curb outside 123 Main St.",
  "requires_location": true,
  "allows_images": true,
  "allows_multiple_images": true,
  "requires_description": true,
  "requires_contact_email": false,
  "fields": [
    {
      "key": "issue_description",
      "label": "Describe the pothole",
      "input_kind": "long_text",
      "required": true,
      "placeholder": "Describe the size, shape, and exact position.",
      "help_text": null,
      "options": [],
      "collection_mode": "user_or_ai",
      "validation_mode": "soft",
      "ask_if_missing": true,
      "payload_key": "description",
      "payload_transform_hint": null,
      "raw_field": null
    },
    {
      "key": "lane_position",
      "label": "Where is it located on the road?",
      "input_kind": "short_text",
      "required": true,
      "placeholder": "Right lane, bike lane, near curb, etc.",
      "help_text": null,
      "options": [],
      "collection_mode": "user_or_ai",
      "validation_mode": "soft",
      "ask_if_missing": true,
      "payload_key": "lane_position",
      "payload_transform_hint": null,
      "raw_field": null
    }
  ],
  "payload_instructions": "Use the location text and image context to fill the site form.",
  "source_url": "https://example.com",
  "scraped_at": "2026-03-22T00:00:00Z",
  "scrape_version": "v1",
  "raw_scrape": {}
}
```

---

## 11. Example Draft Record

```json
{
  "session_id": "sess_123",
  "selected_category_slug": "pothole",
  "category_confidence": 0.93,
  "category_reasoning_text": "The user described a road hole and the attached image appears to show asphalt surface damage.",
  "category_selection_source": "hybrid",
  "evidence": {
    "attachment_ids": ["att_1"],
    "user_description_text": "There is a big pothole outside 123 Main St near the curb in the right lane.",
    "user_location_text": "123 Main St, Vancouver",
    "user_extra_context_text": "Cars keep swerving around it."
  },
  "location": {
    "lat": 49.282,
    "lng": -123.117,
    "address_text": "123 Main St, Vancouver, BC",
    "intersection_text": null,
    "local_area": "Downtown",
    "location_notes_text": "Near the curb in the right lane",
    "normalized_location_text": "123 Main St, Vancouver, BC, near curb in right lane",
    "location_confidence": 0.9
  },
  "ai_output": {
    "evidence_summary_text": "Image shows a road depression consistent with a pothole.",
    "issue_summary_text": "Large pothole affecting the right lane near the curb.",
    "extracted_facts_text": "Possible traffic hazard, no visible cones or barriers.",
    "reasoning_text": "Selected pothole because issue concerns asphalt roadway damage.",
    "submission_ready_summary_text": "Pothole outside 123 Main St near the curb in the right lane, causing vehicles to swerve."
  },
  "field_answers": {
    "issue_description": {
      "field_key": "issue_description",
      "value_text": "Large pothole near curb in right lane outside 123 Main St.",
      "value_normalized": null,
      "provenance": "hybrid",
      "confidence": 0.95,
      "notes_text": null,
      "is_resolved": true
    },
    "lane_position": {
      "field_key": "lane_position",
      "value_text": "Right lane near curb",
      "value_normalized": null,
      "provenance": "hybrid",
      "confidence": 0.92,
      "notes_text": null,
      "is_resolved": true
    }
  },
  "required_field_keys": ["issue_description", "lane_position"],
  "missing_field_keys": [],
  "unresolved_questions": [],
  "ready_for_submission": true,
  "readiness_reason_text": "All required pothole fields have resolved answers.",
  "contact": {
    "email": null,
    "phone": null,
    "name": null
  }
}
```
