# Van311 Reporter

An open-source, AI-powered civic issue reporting app for Vancouver. Report city issues by recording a short video and voice note — AI handles the rest.

## How It Works

1. **Record** — Take a video (up to 60s) of a city issue and optionally add a voice note describing it
2. **AI Classifies** — Vision AI analyzes video frames to identify the issue type (pothole, graffiti, abandoned garbage, etc.) and speech-to-text transcribes your voice note
3. **Auto-Routes** — The app maps the issue to the correct Van311 service category, generates a structured report, and submits it via email to the City of Vancouver
4. **Track** — See your report status, browse existing city issues on a map, and get updates as the city responds

## Features

- **Video + Voice Reporting** — Record up to 60s of video and attach a voice note. No forms to fill out.
- **AI Issue Classification** — Vision AI identifies the issue type from video frames and maps it to one of 80+ Van311 service categories
- **Auto-Generated Reports** — Combines video analysis, voice transcript, GPS location, and reverse geocoding into a complete service request
- **Existing Issues Map** — Displays current 311 service requests from the Vancouver Open Data API on an interactive map
- **Issue Feed** — Browse recent reports in a grid view with date, category, neighbourhood, and status
- **Status Tracking** — Polls the Vancouver Open Data API to match and track report status updates
- **Email Submission** — Sends structured reports via email to the City of Vancouver's 311 service
- **Authentication** — Email, social login, or phone number verification via Clerk

## Tech Stack

### Frontend
- **React** — UI framework
- **shadcn/ui** — Component library
- **Mapbox GL JS** — Interactive map for displaying issues
- **MediaRecorder API** — In-browser video and audio recording

### Backend
- **Python / FastAPI** — API server
- **FFmpeg** — Video processing, keyframe extraction, audio extraction
- **OpenAI Whisper API** — Speech-to-text for voice notes
- **Claude Vision / OpenAI Vision** — Image classification from video frames
- **Resend** — Email delivery for report submission

### Data & Auth
- **Convex** — Real-time database, file storage, backend functions
- **Clerk** — Authentication (email, Google, phone OTP)
- **Vancouver Open Data API** — Existing 311 service request data (Opendatasoft v2.1)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + shadcn/ui)                       │
│                                                     │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │ Record  │  │ Issue    │  │ Map + Feed         │ │
│  │ Video + │  │ Preview  │  │ (existing issues   │ │
│  │ Voice   │  │ + Submit │  │  + user reports)   │ │
│  └────┬────┘  └────┬─────┘  └────────┬───────────┘ │
│       │            │                 │              │
└───────┼────────────┼─────────────────┼──────────────┘
        │            │                 │
        ▼            ▼                 ▼
┌───────────────────────────────────────────────────┐
│  FastAPI Backend                                  │
│                                                   │
│  /api/process-report                              │
│    ├── FFmpeg: extract keyframes + audio           │
│    ├── Whisper: transcribe voice note              │
│    ├── Vision AI: classify issue from frames       │
│    ├── Mapbox Geocoding: reverse geocode GPS       │
│    └── Returns: category, description, address     │
│                                                   │
│  /api/submit-report                               │
│    ├── Resend: email report to City of Vancouver   │
│    └── Convex: store submission for tracking       │
│                                                   │
│  /api/existing-issues                             │
│    └── Vancouver Open Data API: fetch recent 311s  │
└───────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
┌──────────────┐            ┌─────────────────────┐
│  Convex      │            │ Vancouver Open Data  │
│  - Users     │            │ API (v2.1)           │
│  - Reports   │            │ - 311 service        │
│  - Files     │            │   requests from 2022 │
│  - Status    │            │ - Updated monthly    │
└──────────────┘            └─────────────────────┘
```

## Van311 Service Categories

The AI classifier maps issues to the city's official categories:

| Category | Examples |
|----------|----------|
| Garbage, Recycling & Litter | Abandoned garbage, illegal dumping, missed bin, needle cleanup |
| Streets, Transportation & Parking | Pothole, abandoned vehicle, broken meter, pavement markings |
| Lights, Signals & Signs | Street lighting, traffic signals, utility box damage |
| Graffiti | Graffiti removal, free paint voucher |
| Noise | Construction noise, event noise, business noise |
| Parks & Recreation | Park issues, facility feedback |
| Property | Empty home, private property concern, short-term rental |
| Trees & Vegetation | Boulevard damage, tree removal, pests |
| Water, Sewers & Environment | Catch basins, street flooding, water quality |
| Building & Development | Construction concern, building bylaw question |
| Snow & Ice | Sidewalk not cleared, city property snow removal |
| Animals | Dead animal, wildlife, lost pet |
| Fire & Safety | Fire hazards, hoarding, fireworks |

## Vancouver Open Data API

Existing 311 service requests are fetched from the City of Vancouver's Open Data Portal.

**Endpoint:**
```
GET https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/3-1-1-service-requests/records
```

**Useful query parameters:**
```
?order_by=date_time_received desc    # Most recent first
&limit=50                             # Number of records
&where=local_area="Kitsilano"         # Filter by neighbourhood
&where=call_type="Pothole"            # Filter by issue type
```

**Available fields:**
- `date_time_received` — When the issue was reported
- `date_time_closed` — When resolved (null if open)
- `department` — City department responsible
- `division` — Sub-division
- `call_type` — Specific service category
- `address` — Street address or intersection
- `local_area` — Neighbourhood (e.g., Kitsilano, Downtown, Mount Pleasant)
- `geom` — Lat/lng coordinates

**Vancouver neighbourhoods (22 local areas):**
Arbutus Ridge, Downtown, Dunbar-Southlands, Fairview, Grandview-Woodland, Hastings-Sunrise, Kensington-Cedar Cottage, Kerrisdale, Killarney, Kitsilano, Marpole, Mount Pleasant, Oakridge, Renfrew-Collingwood, Riley Park, Shaughnessy, South Cambie, Strathcona, Sunset, Victoria-Fraserview, West End, West Point Grey

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- FFmpeg installed (`brew install ffmpeg` on macOS)
- API keys for: OpenAI (Whisper + Vision) or Anthropic (Claude Vision), Mapbox, Resend, Clerk

### Environment Variables

```bash
# .env (backend)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
MAPBOX_ACCESS_TOKEN=pk...
RESEND_API_KEY=re_...
CONVEX_URL=https://...convex.cloud
VAN311_RECIPIENT_EMAIL=311@vancouver.ca

# .env.local (frontend)
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_CONVEX_URL=https://...convex.cloud
VITE_MAPBOX_ACCESS_TOKEN=pk...
VITE_API_URL=http://localhost:8000
```

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/van311-reporter.git
cd van311-reporter

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install

# Convex
npx convex dev
```

### Running Locally

```bash
# Terminal 1 — Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev

# Terminal 3 — Convex
cd frontend
npx convex dev
```

## Project Structure

```
van311-reporter/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── routers/
│   │   ├── reports.py          # /api/process-report, /api/submit-report
│   │   └── issues.py           # /api/existing-issues (Vancouver Open Data proxy)
│   ├── services/
│   │   ├── video.py            # FFmpeg keyframe + audio extraction
│   │   ├── transcription.py    # Whisper speech-to-text
│   │   ├── classification.py   # Vision AI issue classification
│   │   ├── geocoding.py        # Mapbox reverse geocoding
│   │   └── email.py            # Resend email submission
│   ├── models/
│   │   └── schemas.py          # Pydantic request/response models
│   ├── config.py               # Environment config
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoRecorder.tsx    # Video capture (≤60s)
│   │   │   ├── VoiceRecorder.tsx    # Voice note recording
│   │   │   ├── ReportPreview.tsx    # AI-generated report preview
│   │   │   ├── IssueMap.tsx         # Mapbox map with issue pins
│   │   │   ├── IssueFeed.tsx        # Grid of existing issues
│   │   │   ├── IssueCard.tsx        # Individual issue card
│   │   │   ├── StatusBadge.tsx      # Open/Resolved status indicator
│   │   │   └── ReportHistory.tsx    # User's submitted reports
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Landing + issue feed + map
│   │   │   ├── Report.tsx           # Record video + voice → submit
│   │   │   └── Dashboard.tsx        # User's reports + status tracking
│   │   ├── lib/
│   │   │   ├── api.ts              # FastAPI client
│   │   │   └── convex.ts           # Convex client setup
│   │   └── App.tsx
│   ├── convex/
│   │   ├── schema.ts               # Convex database schema
│   │   ├── reports.ts              # Report mutations + queries
│   │   ├── users.ts                # User profile functions
│   │   └── auth.config.ts          # Clerk integration config
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Contributing

This is an open-source project. Contributions welcome — open an issue or submit a PR.

## License

MIT
