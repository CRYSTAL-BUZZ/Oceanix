# OCEANIX / ORCA Marine Intelligence Platform

OCEANIX is a marine decision-support web application built for Indian coastal users. Its core intelligence engine, ORCA, combines deterministic marine reasoning, live upstream data, and optional Gemini-assisted natural-language refinement to answer operational questions about fishing zones, weather, wave conditions, tides, routing, geofencing, alerts, and risk.

This project is designed as a full-stack TypeScript application with:

- a React + Vite client for dashboards, maps, alerts, and chat
- an Express API that serves the engine and client
- a deterministic multi-agent reasoning layer for marine analysis
- optional AI summarization for language quality without replacing the core calculations

Important safety note: this software is a decision-support prototype. It does not replace official maritime advisories, IMD/INCOIS bulletins, port authority instructions, or legal compliance requirements. Always verify the latest official sources before making a voyage or fishing decision.

## Project overview

The platform is built around five user personas:

- Fisher: go/no-go decisions, PFZ, tide, weather, route safety
- Researcher: productivity diagnosis, historical trends, chlorophyll/SST analysis
- Coastal Authority: regulated zones, geofence proximity, local advisories
- Disaster Management: severity-ranked warnings and escalation awareness
- Maritime Authority: corridor oversight, route safety, vessel-specific transit risk

The app recognizes speech and text in 11 Indian languages and supports region-aware marine reasoning for the Indian coastline.

## What the system does

ORCA can answer questions such as:

- Where is the nearest fishing zone from my current location or harbour?
- Is it safe to leave the shore today or tomorrow morning?
- Which areas show high PFZ productivity and favourable ocean conditions?
- What are the tides, waves, swell, and coastal weather conditions near me?
- Are there cyclone, squall, lightning, high-wave, or other marine alerts nearby?
- Which restricted or hazardous zones should I avoid?
- What is the safest route from a harbour to a fishing ground or waypoint?
- Why did fish productivity decline in a region?
- What is the live marine situation summary for a location?

## Key design principles

- Deterministic by default: the engine can run without an API key.
- Live-first, reference-safe fallback: live upstream products are preferred, but the app falls back to reference data when products are unavailable.
- Evidence-based decisions: risk, route and synthesis are grounded in a shared evidence ledger.
- Safety-first critique: a critic agent checks for overconfidence and escalates when necessary.
- Localized for Indian users: 11 language packs and coastal-specific phrasing.
- Full stack in one Node process: the API and frontend can be served together in dev and production.

## Architecture

The workspace is a TypeScript monolith-style app, but it is functionally split into frontend and backend layers.

```text
Browser / UI (React + Vite)
    │
    ├── Persona dashboards
    ├── Chat and map screens
    ├── Route, risk, tide, and weather panels
    └── Agent trace / evidence UI
    │
    ▼
Express API (server.ts + src/server/routes.ts)
    │
    ├── Request validation and context anchoring
    ├── Session and memory handling
    ├── Marine product endpoints
    └── Streaming orchestration events
    │
    ▼
ORCA Multi-Agent Engine
    │
    ├── Intent parsing and language detection
    ├── Planner agent
    ├── PFZ / weather / ocean / tide / alert / route / geofence / risk / historical / visualization agents
    ├── Structured artifact blackboard
    ├── Synthesizer agent
    └── Safety critic
    │
    ▼
Data layer
    ├── Live marine products (best effort)
    ├── Reference dataset / deterministic expansion
    ├── Harbours, tide stations, geofences, historical regions
    └── Geodesy and risk rules
```

## Supported marine intelligence domains

The engine recognizes the following canonical intents:

- FIND_PFZ
- PFZ_HOTSPOTS
- SAFETY_ASSESSMENT
- TIDE_WEATHER_SEA
- HAZARD_ALERTS
- SAFE_ROUTE
- PRODUCTIVITY_DIAGNOSIS
- AVOID_ZONES
- GEOFENCE_PROXIMITY
- OCEAN_STATE
- WEATHER_BRIEF
- GENERAL_MARINE

The system reasons across these specialist areas:

- PFZ analysis
- Ocean state and wave behaviour
- Tide and current timing
- Weather and lightning risk
- Marine alert detection and severity ranking
- Geofence / protected area proximity
- Navigation route optimization
- Fish productivity diagnosis and historical trends
- Visualization of evidence and spatial overlays
- Safety critique and escalation checks

## Agent roster

The orchestration uses a set of specialist agents:

- Planner Agent
- GIS Agent
- PFZ Agent
- Weather Agent
- Ocean Agent
- Tide & Current Agent
- Marine Alert Agent
- Geofencing Agent
- Route Optimization Agent
- Risk Validation Agent
- Historical Analysis Agent
- Visualization Agent
- Critic Agent

These agents share artifacts and evidence instead of operating as disconnected mocks. The API and UI read the same structured reasoning objects and can display the real execution trace.

## Data model and operational behaviour

The project includes a deterministic reference model and a live-data layer:

- Fixed geographic and domain catalogues
- Reproducible generated forecast products
- Live upstream products when available
- Reference fallback when data is unavailable or throttled
- Product status tracking and reporting
- Cached situation snapshots to avoid unnecessary refreshes

The engine is deliberately designed so that the same question can yield a safe offline answer even when the network or AI service is unavailable.

## Supported languages

The app supports 11 Indian languages:

- English
- Hindi
- Marathi
- Gujarati
- Kannada
- Malayalam
- Telugu
- Tamil
- Bengali
- Odia
- Punjabi

Language detection works across native script and Romanized input, and all output can be localized to the selected language.

## UI and experience

The frontend contains multiple screens and dashboard layouts:

- Chat screen
- Map screen
- Fleet watch screen
- Print report screen
- Role-based dashboards
- Agent trace panel
- Alert banner and status strips
- Localized code and localized UI

The persona dashboards are tuned to different mission goals:

- Fisher dashboard: conditions affecting safe fishing and return journey
- Research dashboard: trends, hotspots, productivity diagnosis
- Coastal dashboard: local regulatory context and restricted waters
- Disaster dashboard: danger ranking and escalation posture
- Maritime dashboard: route safety and corridor oversight

## API surface

The Express router is mounted under `/api` and exposes these major route families.

### Core health and status

- `/api/health`
- `/api/ready`
- `/api/metrics`
- `/api/status`
- `/api/agents`
- `/api/languages`
- `/api/harbors`
- `/api/scenarios`

### Marine products

- `/api/pfz`
- `/api/hotspots`
- `/api/weather`
- `/api/ocean`
- `/api/tides`
- `/api/fleet`
- `/api/alerts`
- `/api/geofences`
- `/api/geofence/check`
- `/api/route`
- `/api/historical`
- `/api/map-data`

### Conversation and briefing

- `/api/chat`
- `/api/chat/stream`
- `/api/situation`
- `/api/session/reset`

All successful responses follow a consistent envelope based on `status`, `apiVersion`, `data`, and `timestamp`.

## Project structure

```text
.
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── PROJECT_GUIDE.md
├── index.html
├── metadata.json
├── package.json
├── package-lock.json
├── render.yaml
├── server.ts
├── tsconfig.json
├── vite.config.ts
├── ecosystem.config.cjs
├── vercel.json
├── scripts/
│   ├── unit-tests.ts
│   └── test-sweep.ts
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── personas.ts
│   ├── types.ts
│   ├── agents/
│   │   ├── alertAgent.ts
│   │   ├── base.ts
│   │   ├── critic.ts
│   │   ├── geofencingAgent.ts
│   │   ├── gisAgent.ts
│   │   ├── historicalAgent.ts
│   │   ├── oceanAgent.ts
│   │   ├── orchestrator.ts
│   │   ├── pfzAgent.ts
│   │   ├── planner.ts
│   │   ├── riskAgent.ts
│   │   ├── routeAgent.ts
│   │   ├── synthesizer.ts
│   │   ├── tideAgent.ts
│   │   ├── visualizationAgent.ts
│   │   └── weatherAgent.ts
│   ├── components/
│   │   ├── AgentTrace.tsx
│   │   ├── AlertBanner.tsx
│   │   ├── ApkExportModal.tsx
│   │   ├── AppShell.tsx
│   │   ├── Charts.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── FleetWatchScreen.tsx
│   │   ├── FreshnessStrip.tsx
│   │   ├── GeofencePanel.tsx
│   │   ├── InfoScreen.tsx
│   │   ├── LanguageModal.tsx
│   │   ├── LocalizedCode.tsx
│   │   ├── MapScreen.tsx
│   │   ├── PrintReportScreen.tsx
│   │   ├── RiskStrip.tsx
│   │   ├── RouteCard.tsx
│   │   ├── TideTable.tsx
│   │   ├── dashboards/
│   │   │   ├── common.ts
│   │   │   ├── index.tsx
│   │   │   ├── quickAsk.ts
│   │   │   ├── widgets.tsx
│   │   │   ├── CoastalDashboard.tsx
│   │   │   ├── DisasterDashboard.tsx
│   │   │   ├── FisherDashboard.tsx
│   │   │   ├── MaritimeDashboard.tsx
│   │   │   └── ResearcherDashboard.tsx
│   │   └── ...
│   ├── core/
│   │   ├── alerts.ts
│   │   ├── dataAccess.ts
│   │   ├── dataset.ts
│   │   ├── fleet.ts
│   │   ├── geo.ts
│   │   ├── i18n.ts
│   │   ├── intent.ts
│   │   ├── language.ts
│   │   ├── live.ts
│   │   ├── localize.ts
│   │   ├── riskTrajectory.ts
│   │   └── ...
│   ├── hooks/
│   │   └── useNow.ts
│   ├── server/
│   │   ├── context.ts
│   │   ├── gemini.ts
│   │   ├── routes.ts
│   │   ├── scenarios.ts
│   │   └── session.ts
│   └── services/
│       ├── orcaApi.ts
│       └── speechService.ts
└── dist/ (generated build output)
```

## Core technical stack

### Frontend

- React 19
- Vite 6
- TypeScript
- Leaflet for maps
- Tailwind-based styling
- Lucide icons
- Motion animations

### Backend

- Express
- TypeScript
- Node.js runtime
- Optional Gemini integration via `@google/genai`
- Deterministic local marine reasoning engine

### Build and validation

- `tsc --noEmit` for TypeScript checks
- `tsx` for script execution
- `vite build` for frontend build
- `esbuild` to bundle the server

## Environment configuration

The project uses `.env` values, with a template available in `.env.example`.

Example optional values:

```bash
PORT=3000
NODE_ENV=development
APP_URL=https://orca.example.org
GEMINI_API_KEY=your-key-here
ORCA_GEMINI_MODEL=gemini-2.5-flash
ORCA_DATA_CYCLE_PIN=2026-09-09T03:00:00.000Z
ORCA_SESSIONS_FILE=/var/lib/orca/sessions.json
VITE_API_BASE=https://your-engine-host/api
```

Notes:

- The app can run without any key.
- Gemini is optional and used for language refinement and plan phrasing.
- The engine still computes all risk values and measurements locally.
- `ORCA_DATA_CYCLE_PIN` lets you freeze the reference cycle for reproducible outputs.

## Local development

Install dependencies:

```bash
npm install
```

Run the app in development mode:

```bash
npm run dev
```

This starts the Express server and mounts the Vite development middleware. The app normally runs on:

```text
http://localhost:3000
```

## Production build

Build the project:

```bash
npm run build
```

Run the bundled server:

```bash
npm start
```

## Scripts

### Development and build

```bash
npm run dev
npm run build
npm run build:client
npm start
```

### Linting and type checking

```bash
npm run lint
```

### Testing

```bash
npm run test:unit
npm run test:sweep
npm test
```

The project includes:

- fast deterministic unit checks for geodesy, risk, localization, and data rules
- integration/regression sweeps covering harbours, intents, languages, scenarios, and visualization paths

## Deployment notes

### Docker

The repository includes a `Dockerfile` for a Node-based production container. It builds the client and server, installs production dependencies, and exposes port 3000.

### Render / PM2 style hosting

- `render.yaml` provides a Render blueprint for the long-running service.
- `ecosystem.config.cjs` supports PM2 deployment for a single-process production setup.
- `vercel.json` configures static front-end hosting for client-only deployment patterns.

### Split hosting pattern

The project supports a split deployment where the frontend and engine are hosted separately:

- set `VITE_API_BASE` to the remote engine origin
- keep the API service on a server with the ORCA engine
- run the frontend on Vercel or another static host

## Security and operational posture

The server applies baseline hardening:

- no X-Powered-By header
- strict content security policy in production
- anti-clickjacking headers
- no stack trace leakage in API errors
- request logging
- graceful shutdown
- optional reverse-proxy trust flag for `X-Forwarded-For`

The live-data layer is intentionally best-effort and conservative. A dead network or throttled product must never silently produce fake numbers.

## References and source context

This project was built around marine aid and decision support for Indian coastal operators. It intentionally aligns with domain sources such as:

- INCOIS PFZ advisories
- INCOIS Ocean State Forecast and tide network
- IMD Coastal Marine Met Bulletin
- IMD Cyclone Warning Centre
- INSAT sea-surface temperature and ocean-colour products
- ORCA geodesy, geofencing and risk logic

The project guide in `PROJECT_GUIDE.md` provides a more granular map of the codebase and request flow.

## Quick start summary

```bash
npm install
cp .env.example .env
npm run dev
```

Open:

```text
http://localhost:3000
```

Then select a persona, set the harbour or GPS fix, and ask a marine question in English or an Indian language.

## Final note

OCEANIX is a working prototype for coastal marine intelligence, designed for rapid demos, operational planning support, and live marine situational awareness. It is most useful as a decision-support companion rather than a substitute for official marine advisories or legal navigation guidance.

## where is all data coming from 

The app has two layers of data, and they are intentionally split:

- A built-in reference dataset for offline/reproducible operation
- A live upstream fetch layer that tries to pull current data from public sources

The clearest evidence is here:

- `src/core/dataset.ts`: the project’s embedded marine knowledge base
- `src/core/live.ts`: the live data fetch layer
- `src/core/dataAccess.ts`: the switch between live data and static fallback

What each one is doing:

1. Built-in reference data
In `src/core/dataset.ts`, the file header says:

- “In production these products are ingested from ISRO/INCOIS/IMD open-data portals.”
- “For the prototype they are embedded as a snapshot with a deterministic synthetic expander…”

So the project is designed to behave like this:
- real-world data sources are the intended upstream producers
- but in this repo, many values are stored as generated reference snapshots so the app still works without network access

This includes:
- harbours and tide stations
- PFZ areas
- geofences
- historical regions
- weather/ocean model reference values
- deterministic calculations for risk and marine state

2. Live upstream sources
In `src/core/live.ts`, the file explicitly lists the live sources:

- Open-Meteo Forecast API
  - wind, gusts, temperature, precipitation, weather code, visibility, cloud
- Open-Meteo Marine API
  - waves, swell, SST, ocean currents
- Open-Meteo Archive API
  - 36-month SST / wind / rainfall series for productivity analysis
- GDACS RSS
  - cyclone and disaster events near the Indian coast
- MODIS-Aqua regional ocean-colour climatology
  - chlorophyll / productivity context
- ORCA harmonic tide model
  - astronomical tide prediction

So the “live” feed is not a database; it is a set of public API calls.

3. How the app decides which data to use
`src/core/dataAccess.ts` is the key seam:
- it tries live products first
- if not available, it falls back to the reference data from `src/core/dataset.ts`
- the fallback is flagged as not-live so the UI remains honest

Examples from `src/core/dataAccess.ts`:

- getWeather() → live weather or static reference
- getOceanState() → live ocean or static reference
- getMarineAlertsNear() → merge live alerts with static alerts
- getHistoricalSeries() → live series or static region series

So the project’s real answer is:

- The app is fed by public marine datasets and forecast APIs when online
- It is backed by embedded reference data when offline or throttled
- No single central database is the source of truth; the source is a hybrid of deterministic local data + live public APIs

A good mental model:
- “Reference layer” = local embedded dataset for reproducibility
- “Live layer” = real-time public data fetches
- “Data access layer” = chooses one or the other depending on availability

If you want, I can also map the exact data source for each feature area:
- PFZ
- weather
- ocean
- tides
- alerts
- geofencing
- historical productivity
