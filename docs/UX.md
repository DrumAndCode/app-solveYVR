# SolveYVR — UX Specification

## Sitemap

```
SolveYVR
├── / ..................... Map (homepage, full viewport, existing issue pins)
│   └── + Report ......... Chat flow (auth gate → location → capture → review → submit)
├── /reports .............. All Reports (Van311 API feed, filters, search)
├── /my-reports ........... My Reports (user's submissions, status tracking)
│   └── /my-reports/:id ... Report Detail (full report + attachments + timeline)
└── /sign-in .............. Clerk auth (email, Google, phone OTP)
```

---

## Tech Choices

| Concern | Choice |
|---|---|
| Chat UI | Vercel Elements AI (`elements.ai-sdk.dev`) |
| Map | Mapbox GL JS (geocoding, pins, interactivity) |
| Location input | GPS auto-detect or Google Maps address autocomplete |
| Auth | Clerk (email, Google, phone OTP) — gate before chat |
| Components | ShadCN + Base UI |

---

## 1. Homepage — Map (`/`)

The app **is** the map. Full viewport, centered on Vancouver, showing existing Van311 issue pins.

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌─ Nav ──────────────────────────────────────────────────────────┐  │
│  │  SolveYVR          All Reports   My Reports           [Sign In]│  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Map (full viewport) ─────────────────────────────────────────┐  │
│  │                                                                │  │
│  │         ●        ●                                             │  │
│  │    ●                   ●                                       │  │
│  │             ●                ●                                 │  │
│  │       ●          ●       ●                                    │  │
│  │                                                                │  │
│  │                    ╳ (you are here)                            │  │
│  │                                                                │  │
│  │  ┌─────────────────────────────────┐                          │  │
│  │  │ Pothole · W 4th Ave             │                          │  │
│  │  │ Kitsilano · 3 days ago · Open   │                          │  │
│  │  └─────────────────────────────────┘                          │  │
│  │                                                                │  │
│  │  ┌──────────┐                                                 │  │
│  │  │ Filter ▾ │                                                 │  │
│  │  └──────────┘                                                 │  │
│  │                                                                │  │
│  │                ┌───────────────────────┐                       │  │
│  │                │  + Report Issue Here  │                       │  │
│  │                └───────────────────────┘                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

- Nav: flat links — All Reports, My Reports, Sign In / Avatar
- Map: Mapbox GL, full viewport, pins for existing Van311 issues
- Click pin → popup with issue type, address, neighbourhood, age, status
- Filter button: overlay for neighbourhood, department, status
- "Report Issue Here" CTA: triggers auth gate → chat flow
- GPS auto-centers on user if permissions granted

---

## 2. Report Flow — Chat UX

Triggered by tapping "Report Issue Here". Requires auth (Clerk sign-in) before chat starts.

Built with **Vercel Elements AI** components: Thread, Message, PromptInput, Suggestion, Attachments.

### Desktop — Split View (Map + Chat)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌─ Nav ──────────────────────────────────────────────────────────┐  │
│  │  SolveYVR          All Reports   My Reports           [Avatar] │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Split View ──────────────────────────────────────────────────┐  │
│  │                          │                                     │  │
│  │   Map (left panel)       │   Chat (right panel)               │  │
│  │                          │                                     │  │
│  │                          │   SolveYVR                          │  │
│  │         ●    ●           │   Hi! Let's report an issue.       │  │
│  │    ●              ●      │   First — where is it?             │  │
│  │         📍                │                                     │  │
│  │              ●           │   📍 Using your location:           │  │
│  │                          │   1425 W 4th Ave, Kitsilano        │  │
│  │                          │   [✓ Correct]  [✎ Change]          │  │
│  │                          │                                     │  │
│  │                          │                                     │  │
│  │                          │   ┌──────────────────────────────┐  │  │
│  │                          │   │ Type or attach...   📷 🎤 📎 │  │  │
│  │                          │   └──────────────────────────────┘  │  │
│  └──────────────────────────┴─────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Mobile — Full-Screen Chat

```
┌────────────────────────────┐
│  SolveYVR       [× Close]  │
├────────────────────────────┤
│                            │
│  SolveYVR                  │
│  Hi! Let's report an       │
│  issue. Where is it?       │
│                            │
│  📍 1425 W 4th Ave         │
│  Kitsilano                 │
│  [✓ Correct] [✎ Change]   │
│                            │
│                  You       │
│           ✓ That's right   │
│                            │
│  SolveYVR                  │
│  What's going on?          │
│  Send photos, video, or    │
│  describe it.              │
│                            │
├────────────────────────────┤
│ Type or attach... 📷 🎤 📎 │
└────────────────────────────┘
```

### Chat Flow Steps

**Step 1 — Location**
- GPS auto-detects and reverse geocodes via Mapbox
- User confirms or types a different address (Google Maps autocomplete)
- Pin updates on map (desktop) as location changes
- Fallback if GPS denied: address search field

**Step 2 — Capture**
- AI asks "What's going on? Send photos, a video, or just describe it."
- User attaches 1-4 photos, a video, and/or a voice note via input bar (📷 🎤 📎)
- Voice notes sent as audio attachments — stored as proof, playable later

**Step 3 — AI Classification + Follow-ups**
- AI analyzes photos/video with vision model
- Classifies to Van311 category + department
- Asks category-specific follow-up questions with quick-reply Suggestion buttons
- If photos are unclear: "Can you take a clearer photo of [specific thing]?"

Example follow-ups for "Abandoned Garbage":
```
  How big is the pile roughly?
  [ Small — fits in a bag ]
  [ Medium — a few bags ]
  [ Large — needs a truck ]

  Is it blocking the sidewalk or roadway?
  [ Yes — sidewalk ]
  [ Yes — road ]
  [ No — on private property ]
```

**Step 4 — Review & Submit**
- AI generates a report preview as a structured card in the chat
- Description is inline-editable (tap edit icon → text area in place)
- User taps "Submit to City of Vancouver"
- Email sent to 311@vancouver.ca via Resend
- Report saved to Convex

```
  ┌─ Report Preview ────────────────────┐
  │                                      │
  │  Abandoned Garbage                   │
  │  ENG - Sanitation Services           │
  │  1425 W 4th Ave, Kitsilano          │
  │                                      │
  │  Large pile of household waste       │
  │  including broken furniture and      │
  │  garbage bags. Blocking sidewalk.    │
  │  Approx 2m x 1m. Requires truck     │
  │  pickup.                    [edit ✎] │
  │                                      │
  │  ┌──────┐ ┌──────┐                  │
  │  │ IMG1 │ │ IMG2 │                  │
  │  └──────┘ └──────┘                  │
  │                                      │
  └──────────────────────────────────────┘

  [ Submit to City of Vancouver ]
```

**Step 5 — Confirmation**
- Final message in the chat thread:

```
  ✓ Report submitted!

  Emailed to 311@vancouver.ca
  Reference: #SYV-00247

  We'll check for status updates
  from the city and notify you.

  [ View in My Reports ]
  [ Report another issue ]
```

---

## 3. All Reports (`/reports`)

Feed of all Van311 service requests fetched from the Vancouver Open Data API.

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌─ Nav ──────────────────────────────────────────────────────────┐  │
│  │  SolveYVR          All Reports   My Reports           [Avatar] │  │
│  │                    ━━━━━━━━━━━                                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Filters ──────────────────────────────────────────────────────┐  │
│  │  Area: [ All ▾ ]   Department: [ All ▾ ]   Status: [ All ▾ ]  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ 🔍 Search by address or type...                          │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Results ── 2,481 reports ─────────────── Sort: [ Newest ▾ ] ─┐  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │  Abandoned Bike Case                          ✓ Closed  │  │  │
│  │  │  1770 Davie St · West End                               │  │  │
│  │  │  ENG - Sanitation Services · Feb 10                     │  │  │
│  │  │  Resolved: Service provided                             │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │  Pothole - Loss of Material                   ● Open    │  │  │
│  │  │  W 4th Ave & Vine St · Kitsilano                        │  │  │
│  │  │  ENG - Streets · Mar 20                                 │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  [ Load more ]                                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Footer ───────────────────────────────────────────────────────┐  │
│  │  Data from Vancouver Open Data · Updated monthly               │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### API field mapping per row

| Row element | API field |
|---|---|
| Title (bold) | `service_request_type` |
| Address | `address` (title-cased) |
| Neighbourhood | `local_area` |
| Department | `department` |
| Date | `service_request_open_timestamp` (formatted) |
| Status badge | `status` → Open / Closed |
| Resolution line | `closure_reason` (shown only when Closed) |

### Filters

| Filter | API field | Options |
|---|---|---|
| Area | `local_area` | 22 Vancouver neighbourhoods |
| Department | `department` | ENG - Sanitation, ENG - Streets, etc. |
| Status | `status` | Open / Closed / All |
| Search | `address`, `service_request_type` | Free text |
| Sort | `service_request_open_timestamp` | Newest / Oldest |

---

## 4. My Reports (`/my-reports`)

User's submitted reports with status tracking. Requires auth.

```
┌──────────────────────────────────────────────────────────────────────┐
│  My Reports (3)                                                      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Abandoned Garbage                                    ● Open  │  │
│  │  1425 W 4th Ave · Kitsilano                                   │  │
│  │  ENG - Sanitation Services · Submitted Mar 20                 │  │
│  │  Ref: #SYV-00247                                    [View →]  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Pothole - Loss of Material                          ✓ Closed │  │
│  │  W Broadway & Alma · Kitsilano                                │  │
│  │  ENG - Streets · Submitted Mar 12 · Resolved Mar 18          │  │
│  │  Ref: #SYV-00198                                    [View →]  │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Report Detail (`/my-reports/:id`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back to My Reports                                                │
│                                                                      │
│  Abandoned Garbage                                          ● Open   │
│  Ref: #SYV-00247                                                     │
│                                                                      │
│  Location          1425 W 4th Ave, Kitsilano                        │
│  Department        ENG - Sanitation Services                         │
│  Submitted         Mar 20, 2026 at 2:34 PM                          │
│  Channel           SolveYVR (Email)                                  │
│                                                                      │
│  Description                                                         │
│  Large pile of household waste including broken furniture and        │
│  garbage bags. Blocking sidewalk. Approx 2m x 1m. Requires          │
│  truck pickup.                                                       │
│                                                                      │
│  Attachments                                                         │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────────┐               │
│  │          │ │          │ │ 🎤 Voice note  0:12    │               │
│  │   IMG1   │ │   IMG2   │ │    ▶ ━━━━━━━━━━━━━━━   │               │
│  │          │ │          │ │                        │               │
│  └──────────┘ └──────────┘ └────────────────────────┘               │
│                                                                      │
│  Status Timeline                                                     │
│  ● Mar 20   Submitted via SolveYVR                                  │
│  │          Email sent to 311@vancouver.ca                           │
│  ● Mar 20   Matched in Van311 system                                │
│  │          Service request received by city                         │
│  ○ ...      Awaiting resolution                                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## UX Decisions

| Decision | Choice |
|---|---|
| Homepage | Map is the app — full viewport, no landing page |
| Report flow | Chat UX via Vercel Elements AI |
| Auth timing | Before chat starts (gate on "Report Issue Here") |
| Location input | GPS auto-detect or type address (Google Maps autocomplete) |
| Media capture | Photos, video, voice notes via chat input bar |
| Voice notes | Sent as audio attachments, stored as report proof |
| AI follow-ups | Category-specific questions with quick-reply suggestion buttons |
| Unclear photos | AI asks for clearer photo with specific reason |
| Report editing | Inline edit on AI-generated description |
| Post-submit | Confirmation message in chat with link to My Reports |
| All Reports | Stacked list rows from Van311 API, filterable |
| Status tracking | Poll Van311 API, match by address + date + category |
