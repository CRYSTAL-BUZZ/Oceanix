# OCEANIX / ORCA Project Guide

This guide describes the source and configuration files present in this
workspace. It is intended as an orientation to the project, not as a claim that
ORCA replaces official marine bulletins or operational navigation systems.

## 1. What the project is

OCEANIX is a web-based marine decision-support application for Indian coastal
users. ORCA is its marine reasoning engine. A user can ask questions about
potential fishing zones (PFZs), weather, waves, tides, marine alerts, routes,
restricted waters, and longer-term fishery productivity. The interface is
available in eleven Indian language options and has dashboards aimed at five
different roles: fishers, researchers, coastal authorities, disaster managers,
and maritime authorities.

The application is a TypeScript project with two main parts:

- **Browser client:** React 19 and Vite. It renders dashboards, maps, chat,
  reports, traces, and data visualizations.
- **API and engine host:** Express. It serves the API and, in development,
  mounts Vite in the same Node process. In production it serves the built
  client and API from one process.

The marine engine is deliberately deterministic and can run without an API key.
Its reference knowledge base contains fixed geographic and domain catalogues
plus reproducible generated products. The live-data layer attempts to obtain
real-time products from public upstream sources; when it cannot obtain a
product, ORCA falls back to its reference product and marks the data mode so
the result is not presented as live. Gemini is optional and is used for
language phrasing and plan refinement, not as the source of the engine's
measurements or risk calculations.

**Safety note:** this is decision support and a software prototype. Always
check current IMD/INCOIS bulletins, port-authority instructions, and applicable
official sources before making a real voyage or fishing decision.

## 2. How one question becomes an answer

1. **The UI collects context.** `src/App.tsx` owns the selected role, harbour,
   language, GPS fix, situation brief, map bundle, and current screen.
2. **The client service sends the request.** `src/services/orcaApi.ts` is the
   UI's network boundary. It calls the API when reachable and can run the
   deterministic engine in the browser as a labeled offline fallback.
3. **The API validates and anchors it.** `src/server/routes.ts` handles HTTP,
   and `src/server/context.ts` converts untrusted query values into known
   language, harbour, vessel, time-horizon, and coordinate values.
4. **The query is understood and planned.** `src/core/language.ts` detects
   script/language; `src/core/intent.ts` resolves one of twelve intents and
   slots; `src/agents/planner.ts` turns that into a dependency-aware task plan.
5. **Live products are warmed.** `src/core/live.ts` refreshes available
   upstream data. `src/core/dataAccess.ts` gives agents live-first access and
   falls back to `src/core/dataset.ts` where necessary.
6. **Specialists reason over a shared blackboard.** The orchestrator executes
   the chosen agents in order. They publish typed products into `artifacts`
   (weather, ocean, tides, alerts, zones, routes, risk, and visualizations).
   Agents may request a follow-up round when another specialist must re-check
   something.
7. **The result is narrated and audited.** The deterministic synthesizer
   assembles an answer from evidence. If enabled, Gemini may rewrite the prose.
   The critic then checks the rendered answer for overconfident safety wording,
   missing escalation, and missing deferral to official authorities.
8. **The UI renders answer and provenance.** Chat can show the answer,
   recommendation, evidence, sources, risk trajectory, maps/charts, and a
   trace of the agents that actually ran.

The important domain objects shared across these layers are in
`src/types.ts`. The engine is not a collection of independent mock API
responses: the chat, single-product endpoints, and proactive situation brief
are intended to use the same agent/data logic.

## 3. Main capabilities and API surface

The engine recognizes these canonical question types: nearest PFZ, PFZ
hotspots, safety assessment, tide/weather/sea brief, hazard alerts, safe route,
productivity diagnosis, zones to avoid, geofence proximity, ocean state,
weather brief, and a general marine report.

The Express router is mounted under `/api`. Its route families include:

- **Service status:** `/health`, `/ready`, `/metrics`, `/status`, `/agents`,
  `/languages`, `/harbors`, `/scenarios`.
- **Marine products:** `/pfz`, `/hotspots`, `/weather`, `/ocean`, `/tides`,
  `/fleet`, `/alerts`, `/geofences`, `/geofence/check`, `/route`,
  `/historical`, `/map-data`.
- **Conversation and briefing:** `/chat`, `/chat/stream` (server-sent events),
  `/situation`, and `/session/reset`.

Success responses generally use an envelope containing `status`, `apiVersion`,
`data`, and `timestamp`. The streaming chat endpoint sends orchestration
events, allowing the UI trace to reflect real execution rather than a fake
progress animation.

## 4. Repository file-by-file guide

### Root files

| File | Purpose |
|---|---|
| `README.md` | Project overview, architecture diagram, quick start, configuration, examples, and deployment notes. Treat it as the main existing project introduction; this guide adds a more complete per-file map. |
| `PROJECT_GUIDE.md` | This guide: project concepts, request flow, operations, and first-party file inventory. |
| `package.json` | Package identity, dependencies, and commands such as `dev`, `build`, `start`, `lint`, and test scripts. |
| `package-lock.json` | Exact npm dependency resolution used by `npm ci` and the Docker build. |
| `.env.example` | Commented list of optional environment variables for Gemini, server, persistence, rate limiting, upstream backoff, and split hosting. It contains examples, not actual secrets. |
| `.gitignore` | Files excluded from Git, including build output, local environment files, logs, session state, and editor/Expo artifacts. |
| `.dockerignore` | Files excluded from the Docker build context to keep images smaller and avoid copying local state/secrets. |
| `Dockerfile` | Two-stage Node 22 Alpine container build: compile client and server, install production dependencies, expose port 3000, and health-check `/api/health`. |
| `ecosystem.config.cjs` | PM2 configuration for running the bundled production server as a single process. A single instance preserves its process-local live caches and session/rate-limit state. |
| `render.yaml` | Render Blueprint for the long-running Docker API/engine service, including its health check and externally configured `APP_URL`. |
| `vercel.json` | Static-client Vercel build settings, SPA fallback rewrite, and response security headers. It does not deploy the Express engine. |
| `vite.config.ts` | Vite setup for React and Tailwind, the `@` alias, HMR controls, and a development middleware for serving selected AI Studio media assets. |
| `tsconfig.json` | TypeScript compiler settings. It enables strict checks, React JSX, bundler module resolution, path aliases, and no emit. |
| `server.ts` | Express process entry point. Adds headers/CSP, JSON parsing, request logging, CORS behavior, API mounting, Vite middleware in development or static client serving in production, graceful shutdown, and centralized error handling. |
| `index.html` | Browser document shell: title/metadata, theme-color, fonts, root element, and Vite entry script. |
| `metadata.json` | AI Studio/project metadata, including app description and declared microphone/geolocation permissions. |

### `scripts/` — validation programs

| File | Purpose |
|---|---|
| `scripts/unit-tests.ts` | Fast, deterministic checks for core geodesy, advisory expiry/headline rules, live-data helper behavior, and localization integrity. It runs without starting the web server. |
| `scripts/test-sweep.ts` | Large integration/regression sweep over harbours, intents, languages, personas, vessels, visualization invariants, endpoints, and streamed chat. Its HTTP checks expect the server at `localhost:3000`. |

### `src/` — shared application source

| File | Purpose |
|---|---|
| `src/main.tsx` | React browser entry point. Loads the app, global stylesheet, and Leaflet stylesheet, then mounts `App` in React Strict Mode. |
| `src/App.tsx` | Top-level state owner and screen coordinator. Controls persona, theme, harbour, language, GPS, proactive brief, map bundle, conversation, and navigation between dashboard/map/chat/fleet/report. |
| `src/index.css` | Global Tailwind import, design tokens/theme variables, page-level styling, and shared visual rules for the application's light/dark themes. |
| `src/types.ts` | Shared domain/API model: supported languages; agent registry; risk/advisory levels; harbours, PFZ, weather/ocean, tide, alerts, routes, geofences, historical data, plans, evidence, conversation memory, and orchestration results. |
| `src/personas.ts` | Definitions for the five user roles, including labels, icon/accent, description, and quick questions that seed the chat. |
| `src/vite-env.d.ts` | Vite client type declarations for the TypeScript compiler. |

### `src/agents/` — ORCA reasoning pipeline

Agents are coordinated by the orchestrator. A specialist generally reads the
shared `AgentContext`, writes to its typed `artifacts` blackboard, and returns
findings/evidence. The planner and agents are deterministic unless an optional
Gemini bridge refines the plan or answer prose.

| File | Purpose |
|---|---|
| `src/agents/base.ts` | Shared agent contract and utilities: context/blackboard types, result construction, findings/evidence helpers, risk thresholds, and the wrapper that runs a specialist consistently. |
| `src/agents/planner.ts` | Maps parsed intent and conversation context into the selected roster, ordered dependency graph, reference position, vessel, horizon, and phrasebook. |
| `src/agents/orchestrator.ts` | Runs the full turn: language/intent, plan, live refresh, round-one specialists, requested follow-ups, synthesis, safety critique, memory update, and typed events for streaming. |
| `src/agents/gisAgent.ts` | Establishes the spatial reference and computes relevant marine distances, bearings, and related location context. |
| `src/agents/pfzAgent.ts` | Ranks advisory fishing grounds and scans productivity hotspots using chlorophyll/SST and productivity scores. |
| `src/agents/weatherAgent.ts` | Interprets forecast slots for wind, gusts, rain, visibility, lightning, squall, time horizon, and vessel limits. |
| `src/agents/oceanAgent.ts` | Interprets waves, swell, sea state, currents, and SST, accounting for the difference between harbour and offshore conditions. |
| `src/agents/tideAgent.ts` | Produces tide/current reports and departure windows from station harmonic constituents and forecast time ranges. |
| `src/agents/alertAgent.ts` | Finds nearby and in-force marine advisories, applies validity/influence rules, preserves prescribed actions, and contributes escalation evidence. |
| `src/agents/geofencingAgent.ts` | Checks positions/corridors against maritime boundaries, protected/restricted zones, and applicable buffers. |
| `src/agents/routeAgent.ts` | Compares candidate navigation corridors (including great-circle, offset, and inshore alternatives) against hazards/geofences and ranks them by safety. |
| `src/agents/riskAgent.ts` | Combines risk contributions into an explainable conservative verdict and safety score; also computes departure-window risk trajectory. |
| `src/agents/historicalAgent.ts` | Analyses productivity time series, trends, catch-per-unit-effort and relationships between fishery outcomes and environmental drivers. |
| `src/agents/visualizationAgent.ts` | Chooses and orders the most useful map/chart layer for an intent and ensures meaningful geographic visualization is available. |
| `src/agents/synthesizer.ts` | Builds deterministic multilingual answer text, recommendation, headline, source list, and evidence ledger from the specialist outputs. |
| `src/agents/critic.ts` | Audits and corrects the final rendered answer to prevent unsupported safety guarantees and to preserve escalation and official-source deferral. |

### `src/core/` — shared domain logic and data

| File | Purpose |
|---|---|
| `src/core/geo.ts` | Dependency-free geodesy and computational geometry: distances, bearings, coordinate projection, path/polygon helpers, and unit conversions. Shared by server and browser. |
| `src/core/dataset.ts` | Reference knowledge base: harbour gazetteer, vessels, fishing grounds, tide stations, geofences, alerts, profiles, and deterministic reference products/time series. |
| `src/core/live.ts` | Live-data fetch/cache layer for public upstreams (including Open-Meteo and GDACS). Tracks product status/failures and backoff; unavailable or unusable products can fall back to reference data. |
| `src/core/dataAccess.ts` | Live-first accessor seam for the agents and API. It overlays live product snapshots on reference products while preserving shared domain shapes and computing spatial results. |
| `src/core/language.ts` | Script analysis and language detection for the eleven language options, combining Unicode script evidence with Romanized keyword markers and the user's selected preference. |
| `src/core/intent.ts` | Multilingual intent grammar. Scores lexicons, identifies the canonical intent, and resolves time horizon, harbour, vessel, and conversational references. |
| `src/core/i18n.ts` | Phrasebooks and localized labels/templates for deterministic answers, risk/productivity terminology, and headlines. |
| `src/core/localize.ts` | Localizes generated conditions, alerts, source labels, reasons, and related strings at presentation/aggregation time while preserving source/product names and bulletin text. |
| `src/core/alerts.ts` | Shared bulletin validity and headline-selection rules, including parsing absolute and relative expiry formats. Keeps expired advisories from governing current risk while retaining reportability. |
| `src/core/riskTrajectory.ts` | Re-runs the risk model over successive forecast windows to show how conditions change and identify the least-risky departure window. |
| `src/core/fleet.ts` | Builds a coast-wide, worst-first risk snapshot per harbour from the same weather, ocean, alerts, and PFZ products used by the agents. |

### `src/server/` — API implementation details

| File | Purpose |
|---|---|
| `src/server/routes.ts` | Express API router. Defines status/catalogue/data/chat/situation/fleet endpoints, success/error envelopes, metrics, rate-limited chat handling, and SSE forwarding for orchestration events. |
| `src/server/context.ts` | Coerces and validates request values, resolves harbour/GPS anchors, builds specialist context, and executes single-agent chains for product endpoints. |
| `src/server/session.ts` | Server-side conversation memory store with bounded/expiring sessions and optional JSON-file persistence controlled by environment configuration. |
| `src/server/scenarios.ts` | Canonical one-tap questions/capabilities and their translated question text for supported languages. |
| `src/server/gemini.ts` | Optional Google Gemini integration for plan refinement and answer prose, with configuration/status reporting and offline-compatible fallback behavior. |

### `src/services/` — browser integration

| File | Purpose |
|---|---|
| `src/services/orcaApi.ts` | Client's single API boundary. Defines API-facing shapes and helpers for chat, situation brief, map bundle, status, fleet/research products, session identity, and local-engine fallback. |
| `src/services/speechService.ts` | Browser Web Speech API wrapper for speech recognition and speech synthesis, mapping ORCA language codes to browser-recognized locale tags. |

### `src/hooks/`

| File | Purpose |
|---|---|
| `src/hooks/useNow.ts` | Clock/freshness helpers and auto-refresh hooks, including visibility/connectivity refresh behavior and IST time formatting. |

### `src/components/` — reusable UI and screens

| File | Purpose |
|---|---|
| `src/components/AppShell.tsx` | Common application frame: navigation, harbour/language/persona controls, theme/GPS controls, status, and freshness context around the active screen. |
| `src/components/ChatScreen.tsx` | Conversational interface: submits questions, receives streamed progress/results, renders messages and evidence, and supports speech/chat actions. |
| `src/components/AgentTrace.tsx` | Trace state/reducer and UI for rendering plans, agent steps, findings, rounds, collaboration requests, and final status from orchestrator events. |
| `src/components/MapScreen.tsx` | Geographic view of marine products and map layers, with harbour/zone focus and actions to ask about locations. |
| `src/components/FleetWatchScreen.tsx` | Coast-wide fleet/harbour risk overview and navigation back into harbour-specific questions or maps. |
| `src/components/PrintReportScreen.tsx` | Print-oriented presentation of the current situation report and map/product context. |
| `src/components/AlertBanner.tsx` | Compact visual alert/advisory banner for the highest-priority marine warning. |
| `src/components/FreshnessStrip.tsx` | Shows report age/loading/freshness so cached or old information is not mistaken for a new observation. |
| `src/components/RiskStrip.tsx` | Displays the changing risk level across forecast/departure windows. |
| `src/components/RouteCard.tsx` | Renders a recommended route and route summary, including corridor/segment details. |
| `src/components/GeofencePanel.tsx` | Shows nearby or intersected geofences, severity, distance, and related restrictions. |
| `src/components/TideTable.tsx` | Tabular presentation of tide events, current phase, and windows. |
| `src/components/Charts.tsx` | Renders the agent-selected chart/time-series/map visualization data and chart legends. |
| `src/components/LanguageModal.tsx` | Language picker for supported language options. |
| `src/components/LocalizedCode.tsx` | Utilities/components for displaying localized text while preserving designated technical tokens. |
| `src/components/InfoScreen.tsx` | Informational/about screen with application and product context. |
| `src/components/ApkExportModal.tsx` | Build/demo help modal with Android EAS build commands, engine/API information, repository structure, and a judge demo. The Android commands refer to a `mobile/` project that is not present in this checked-out workspace, and the modal itself is not a native build pipeline. |

### `src/components/dashboards/` — role-specific home screens

| File | Purpose |
|---|---|
| `src/components/dashboards/common.ts` | Shared dashboard props and data contracts passed down from the app shell. |
| `src/components/dashboards/index.tsx` | Selects the dashboard component corresponding to the active persona. |
| `src/components/dashboards/FisherDashboard.tsx` | Fisher-focused go/no-go, PFZ, sea/weather/tide, and fishing questions. |
| `src/components/dashboards/ResearcherDashboard.tsx` | Productivity, environmental trends, historical data, and research questions. |
| `src/components/dashboards/CoastalDashboard.tsx` | Coastal-authority view of advisories, jurisdiction, and regulated waters. |
| `src/components/dashboards/DisasterDashboard.tsx` | Disaster-management view focused on warning severity and response posture. |
| `src/components/dashboards/MaritimeDashboard.tsx` | Maritime-authority view focused on vessel routes, corridors, and geofence conflicts. |
| `src/components/dashboards/quickAsk.ts` | Resolves localized labels for canonical quick-ask scenario chips while retaining the canonical query text sent to the engine. |
| `src/components/dashboards/widgets.tsx` | Shared dashboard presentation primitives such as panels, metrics/readouts, risk/advisory badges, offline tags, safety dial, and source lines. |

## 5. Development and validation

Install dependencies once with `npm install`. The most common commands are:

```text
npm run dev          Start Express + Vite development server on port 3000
npm run build        Build the browser bundle and bundled production server
npm start            Run dist/server.cjs in production mode
npm run lint         Run the TypeScript check (tsc --noEmit)
npm run test:unit    Run deterministic offline unit tests
npm run test:sweep   Run the integration sweep (requires server at localhost:3000)
npm test             Run unit tests followed by the integration sweep
```

For tests which make HTTP requests, start `npm run dev` in another terminal
first. An optional `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) enables the Gemini
layer; it is not required for the engine. See `.env.example` for all optional
settings.

## 6. Deployment and workspace notes

- `npm run build` creates `dist/` with the Vite client and esbuild server bundle.
- The Dockerfile and Render Blueprint deploy the long-lived combined engine/API
  service. `vercel.json` is configured for the client-only static build, which
  can call a separately hosted API using build-time `VITE_API_BASE`.
- Local live-data caches, rate limiting, and default in-memory sessions are
  process-local. PM2 is configured for one instance for that reason; session
  persistence can optionally be enabled with `ORCA_SESSIONS_FILE`.
- The checked-out workspace does **not** currently contain a `mobile/`
  directory, although some README/ignore-file references discuss an Expo
  client. This guide covers the files actually present here; it does not
  document an absent mobile implementation.
- The contents of `node_modules/` are installed third-party packages, not
  OCEANIX source files, so they are intentionally excluded from the
  first-party file inventory above.
