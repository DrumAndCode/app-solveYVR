# SolveYVR Frontend Build Plan

**Overview:** Scaffold the SolveYVR frontend with Next.js 15, shadcn/ui, AI Elements, Google Maps, and mock data so the UX can be reviewed before backend integration. Auth is deferred (placeholder Sign In in nav).

## Task checklist

- [ ] Initialize Next.js 15 + Tailwind + shadcn/ui + AI Elements + all dependencies
- [ ] Create `lib/mock-data.ts` with 10–15 representative Van311 reports
- [ ] Build root `layout.tsx` with providers and `nav.tsx`
- [ ] Build homepage with full-viewport Google Map, pins, popups, filter overlay, CTA
- [ ] Build report chat flow with AI Elements (split-view desktop, full-screen mobile, mock AI steps)
- [ ] Build `/reports` page with filter bar, report cards, pagination
- [ ] Build `/my-reports` list and `/my-reports/[id]` detail page with timeline
- [ ] (Optional / later) Scaffold `/sign-in` with Convex Auth / Better Auth — **currently skipped**

---

## Tech stack (confirmed)

| Area | Choice |
|------|--------|
| **Framework** | Next.js 15 (App Router), TypeScript, host on Vercel |
| **Styling** | Tailwind CSS v4 |
| **UI** | shadcn/ui (Cards, Buttons, Badges, Select, Input, Sheet, Dialog, etc.) |
| **Chat UI** | Vercel AI Elements (`npx ai-elements@latest`) — Conversation, Message, PromptInput in `components/ai-elements/` |
| **Map** | Google Maps via `@vis.gl/react-google-maps` (`"use client"`) |
| **Geocoding** | Google Maps Geocoding + Places Autocomplete (same API key as Maps JS) |
| **Auth** | Skipped for now — placeholder Sign In in nav |
| **Database** | Convex — wired later |
| **Icons** | Lucide React (with shadcn/ui) |

## Routes (from UX spec)

| Route | Description |
|-------|-------------|
| `/` | Full-viewport Google Map with issue pins, filter overlay, “Report Issue Here” CTA |
| `/reports` | All Reports feed (Van311 data, filters, search, sort) |
| `/my-reports` | User’s submitted reports with status tracking |
| `/my-reports/[id]` | Report detail: attachments, description, timeline |
| `/sign-in` | Deferred — Convex Auth when implemented |

## File structure

```
frontend/
  app/
    layout.tsx            -- Root layout: providers, Nav
    page.tsx              -- / (Map homepage)
    reports/
      page.tsx            -- /reports
    my-reports/
      page.tsx            -- /my-reports
      [id]/
        page.tsx          -- /my-reports/:id
    sign-in/
      page.tsx            -- /sign-in (when auth is added)
  components/
    nav.tsx
    issue-map.tsx
    map-popup.tsx
    map-filter.tsx
    report-chat.tsx
    report-preview.tsx
    report-card.tsx
    status-badge.tsx
    status-timeline.tsx
    ui/                   -- shadcn/ui
    ai-elements/          -- Vercel AI Elements
  lib/
    mock-data.ts
    utils.ts
  convex/                 -- schema, functions (when wired)
  public/
  package.json
  next.config.ts
  tailwind.config.ts
  tsconfig.json
```

## Implementation order

### Phase 1: Project scaffold

- Initialize Next.js 15 with TypeScript + Tailwind + App Router
- Configure shadcn/ui
- Install AI Elements (`npx ai-elements@latest`)
- Install `@vis.gl/react-google-maps`, Convex packages as needed for later wiring
- Add `lib/mock-data.ts` with 10–15 Van311-style reports

### Phase 2: Layout + navigation

- Root `layout.tsx` with providers (Convex when ready)
- `nav.tsx` — SolveYVR logo, All Reports, My Reports, Sign In placeholder
- Responsive nav (desktop horizontal; mobile-friendly)

### Phase 3: Homepage — map (`/`)

- Full-viewport map centered on Vancouver (~49.2827, -123.1207)
- Pins from mock data; click → popup (type, address, neighbourhood, age, status)
- Filter control → sheet/overlay (neighbourhood, department, status)
- Floating “Report Issue Here” CTA
- Optional GPS recenter when permission granted

### Phase 4: Report chat flow

- Desktop: split view (map + chat)
- Mobile: full-screen chat sheet with close
- AI Elements: Conversation, Message, PromptInput
- Mock steps: location → capture → classification → review card → confirmation
- Attachment affordances (camera, mic, file) on input
- Quick-reply suggestions for follow-ups
- Report preview card with inline-editable description
- Confirmation with reference number

### Phase 5: All reports (`/reports`)

- Filters: area, department, status, search, sort
- Rows via `report-card.tsx` (title, address, neighbourhood, department, date, badge, closure line when closed)
- “Load more” pagination
- Footer note: Vancouver Open Data
- Client-side filter/sort on mock data

### Phase 6: My reports (`/my-reports`, `/my-reports/[id]`)

- List: status, ref, “View”
- Detail: location, department, submitted time, description, attachments (placeholders + audio UI), status timeline
- Back link
- Auth gate → later with Convex Auth

### Phase 7: Auth (`/sign-in`)

- **Skipped for now** — nav uses static “Sign In” placeholder.

## Mock data shape

```typescript
interface MockReport {
  id: string;
  service_request_type: string;
  address: string;
  local_area: string;
  department: string;
  status: "Open" | "Closed";
  closure_reason?: string;
  date: string;
  lat: number;
  lng: number;
  description?: string;
  attachments?: string[];
  ref?: string;
}
```

## UX details

- Map pins: distinct treatment for Open vs Closed
- Status badges: e.g. green dot “Open”, checkmark “Closed”
- Chat: AI left, user right
- Report preview: edit icon toggles textarea
- Mobile-first breakpoints (`sm` / `md` / `lg`)
- Smooth open/close for mobile chat sheet
