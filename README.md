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
- **Next.js 16** (App Router) — React framework
- **React 19** — UI framework
- **Tailwind CSS 4** — Styling with OKLch design tokens
- **shadcn/ui** — Component library
- **MapLibre GL** + **react-map-gl** — Interactive map with clustering (Supercluster)
- **Vercel AI SDK** — Chat streaming primitives

### Backend
- **Python / FastAPI** — AI agent server with SSE streaming
- **OpenRouter** — LLM gateway (GPT-4o-mini default, configurable)
- **Geopy** — Reverse geocoding for report locations

### Data
- **Convex** — Real-time database and backend functions
- **Vancouver Open Data API** — Existing 311 service request data

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

- **Node.js 18+**
- **Python 3.11+**
- An [OpenRouter](https://openrouter.ai/) API key (powers the AI chat agent)
- A [Convex](https://convex.dev) account (free tier works)

### Environment Variables

Create a `.env` file in the project root:

```bash
# .env — Python agent server
OPENROUTER_API_KEY=sk-or-...          # Required
OPENROUTER_MODEL=openai/gpt-4o-mini  # Optional, this is the default
PARALLEL_API_KEY=...                  # Optional, for Parallel Extract tool
```

Create a `.env.local` file in the project root (used by Next.js and Convex):

```bash
# .env.local — Next.js + Convex
CONVEX_DEPLOYMENT=dev:your-deployment  # Set by `npx convex dev`
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
AGENT_API_URL=http://localhost:8000    # Optional, defaults to this
```

### Installation

```bash
# Clone the repo
git clone https://github.com/YashSerai/SolveYVR.git
cd SolveYVR

# Install frontend dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### Running Locally

You need **three terminals** running simultaneously:

```bash
# Terminal 1 — Python agent server (FastAPI)
uvicorn server.main:app --reload --port 8000
```

```bash
# Terminal 2 — Convex backend (real-time database)
npx convex dev
```

```bash
# Terminal 3 — Next.js frontend
npm run dev
```

The app will be available at **http://localhost:3000**.

The Next.js frontend proxies chat requests to the Python server via `/api/chat/` route, so the browser never talks to port 8000 directly.

### How the pieces connect

1. **Next.js** (`npm run dev`) serves the frontend on port 3000
2. **Convex** (`npx convex dev`) provides the real-time database for issues and reports
3. **Python/FastAPI** (`uvicorn server.main:app`) runs the AI chat agent that classifies issues, geocodes locations, and drafts reports via OpenRouter

## Project Structure

```
SolveYVR/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home — welcome screen + report chat
│   ├── reports/page.tsx        # All reports with filters
│   ├── my-reports/page.tsx     # User's submitted reports
│   ├── my-reports/[id]/page.tsx # Report detail view
│   └── api/chat/route.ts      # Proxy to Python agent server
├── components/                 # React components
│   ├── app-shell.tsx           # Main layout — map + floating panel
│   ├── nav.tsx                 # Top navigation bar
│   ├── report-chat.tsx         # AI chat interface for reporting
│   ├── issue-map.tsx           # MapLibre map with clustered pins
│   ├── map-filter.tsx          # Map filter controls
│   ├── map-popup.tsx           # Map pin popup
│   ├── report-card.tsx         # Report list item
│   ├── status-badge.tsx        # Open/Closed badge
│   ├── status-timeline.tsx     # Report status timeline
│   ├── ai-elements/            # Chat UI primitives
│   └── ui/                     # shadcn component library
├── server/
│   └── main.py                 # FastAPI server — /api/chat/stream SSE endpoint
├── agent/                      # Python AI agent
│   ├── config.py               # OpenRouter config from env
│   ├── prompts.py              # System prompt + Van311 categories
│   ├── loop.py                 # Agent tool-calling loop
│   ├── streaming.py            # SSE streaming for agent events
│   ├── types.py                # Type definitions
│   └── tools/                  # Agent tools (geocode, HTTP, parallel)
├── convex/                     # Convex backend
│   ├── schema.ts               # Database schema
│   ├── publicIssues.ts         # Public issue queries
│   └── ingest.ts               # Data ingestion
├── lib/                        # Frontend utilities
│   ├── map-context.tsx         # Map state context provider
│   ├── chat-stream.ts          # SSE chat streaming client
│   ├── mock-data.ts            # Development mock data
│   └── utils.ts                # Helpers (cn, etc.)
├── requirements.txt            # Python dependencies
├── package.json                # Node.js dependencies
└── README.md
```

## Contributing

This is an open-source project. Contributions welcome — open an issue or submit a PR.

## License

MIT
