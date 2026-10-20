import React, { useEffect, useState } from 'react';
import { Anchor, Compass, History, Map, Route as RouteIcon, Ship, TriangleAlert } from 'lucide-react';
import { Panel, Metric, OfflineTag, RiskBadge, SourceLine } from './widgets';
import { scenarioChipText, type QuickAsk } from './quickAsk';
import type { DashboardProps } from './common';
import { getPhrasebook } from '../../core/i18n';
import { localizeRouteReason } from '../../core/localize';
import { fleetWatch } from '../../services/orcaApi';
import type { FleetOverview } from '../../types';

/**
 * Maritime authority dashboard — the voyage & corridor console.
 *
 * The routing engine's chosen corridor, leg-by-leg risk, waypoints and any
 * geofence conflicts along the track — the picture a harbour master or
 * maritime regulator needs before clearing a transit.
 */
export const MaritimeDashboard: React.FC<DashboardProps> = ({
  bundle,
  bundleOffline,
  brief,
  language,
  onAsk,
  onOpenMap,
}) => {
  const book = getPhrasebook(language.code);
  const ui = book.ui;
  const [fleet, setFleet] = useState<FleetOverview | null>(null);
  const [fleetError, setFleetError] = useState<string | null>(null);
  const quickAsks: QuickAsk[] = [
    { q: 'What is the safest route from my harbour for a trawler?', label: scenarioChipText(language.code, 'safest-route') },
    { q: 'Which regulated zones lie along the planned corridor?', label: ui.questionMarRegulated },
    { q: 'Show the risk level of each leg of the route.', label: ui.questionMarLegs },
    { q: 'Can I get from here to the nearest fishing zone safely?', label: ui.questionMarNearest },
  ];
  const route = bundle?.route;
  const operatingPressure = bundle?.safetyScore == null ? null : Math.max(0, 100 - bundle.safetyScore);
  const returnHours =
    route && route.speedKnots > 0
      ? (2 * route.totalDistanceKm) / (route.speedKnots * 1.852)
      : null;

  useEffect(() => {
    let active = true;
    fleetWatch()
      .then((data) => {
        if (active) setFleet(data);
      })
      .catch((cause: unknown) => {
        if (active) setFleetError(cause instanceof Error ? cause.message : 'Fleet posture unavailable');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
      {/* Corridor summary */}
      <section className="dashboard-feature xl:col-span-5">
        <Panel
          title={ui.selectedCorridorWord}
          icon={RouteIcon}
          accent="sky"
          loading={!bundle}
          right={
            <button
              onClick={() => onOpenMap()}
              className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200"
            >
              {ui.viewOnMapWord}
            </button>
          }
        >
          {route ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/30 p-3">
                <div className="flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-[10px] text-slate-400">{ui.vesselWord}</span>
                  <span className="text-xs font-semibold text-slate-100 ml-auto">
                    {route.vesselLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-slate-100 truncate">
                    {route.origin.name}
                  </span>
                  <span className="text-sky-400 shrink-0">→</span>
                  <span className="text-xs font-bold text-slate-100 truncate">
                    {route.destination.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                  <Compass className="w-3 h-3" />
                  {route.totalDistanceKm.toFixed(0)} km · {route.estimatedTimeHours} @{' '}
                  {route.speedKnots} kn
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-800/50 border border-slate-700/60 p-2.5">
                  <span className="hud-label text-slate-500">{ui.corridorSafetyWord}</span>
                  <p className="hud-num text-xl font-bold text-sky-300 mt-0.5">
                    {route.safetyScore}
                    <span className="text-xs text-slate-500 font-normal ml-1">/100</span>
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 border border-slate-700/60 p-2.5">
                  <span className="hud-label text-slate-500">{book.labels.risk}</span>
                  <p className="mt-1.5">
                    <RiskBadge level={route.riskLevel} />
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2">
                {route.recommendation}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">{ui.noCorridorWord}</p>
          )}
        </Panel>
      </section>

      {/* Leg-by-leg */}
      <section className="xl:col-span-7">
        <Panel
          title={ui.legByLegRiskWord}
          icon={Map}
          accent="sky"
          loading={!bundle}
          right={<OfflineTag offline={bundleOffline} label={ui.offlineEngine} />}
        >
          {route && route.segments.length > 0 ? (
            <div className="space-y-2 pr-1">
              {route.segments.map((segment) => (
                <div
                  key={segment.index}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="hud-num text-[10px] text-slate-500 w-6">
                      {segment.index}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-200 truncate">
                      {segment.from} → {segment.to}
                    </span>
                    <RiskBadge level={segment.riskLevel} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <span className="hud-label text-slate-500">{book.labels.distance}</span>
                      <p className="hud-num text-xs text-slate-200">{segment.distanceKm.toFixed(0)} km</p>
                    </div>
                    <div>
                      <span className="hud-label text-slate-500">{ui.maxWaveWord}</span>
                      <p className="hud-num text-xs text-slate-200">{segment.maxWaveHeightMeters.toFixed(1)} m</p>
                    </div>
                    <div>
                      <span className="hud-label text-slate-500">{ui.maxWindWord}</span>
                      <p className="hud-num text-xs text-slate-200">{segment.maxWindKnots.toFixed(0)} kn</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1.5">{segment.reasons.map((r) => localizeRouteReason(r, book)).join(' · ')}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{ui.noSegmentsWord}</p>
          )}
        </Panel>
      </section>

      {/* Waypoints */}
      <section className="xl:col-span-4">
        <Panel title={ui.waypointsWord} icon={History} accent="sky">
          {route && route.waypoints.length > 0 ? (
            <div className="space-y-1.5 pr-1">
              {route.waypoints.map((wp, index) => (
                <div key={wp.name} className="flex items-center gap-2 text-[11px]">
                  <span className="hud-num text-[10px] text-slate-500 w-5">{index + 1}</span>
                  <span className="text-slate-200 truncate flex-1">{wp.name}</span>
                  <span className="text-slate-500">ETA {wp.etaHours.toFixed(1)}h</span>
                  <RiskBadge level={wp.riskLevel} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{ui.noWaypointsWord}</p>
          )}
        </Panel>
      </section>

      {/* Geofence conflicts */}
      <section className="xl:col-span-4">
        <Panel
          title={ui.geofenceConflictsWord}
          icon={TriangleAlert}
          accent="rose"
          empty={
            route && route.geofenceConflicts.length === 0
              ? { message: ui.corridorClearWord, secondary: ui.noBoundaryConflictsWord }
              : undefined
          }
        >
          {route && route.geofenceConflicts.length > 0 && (
            <div className="space-y-2 pr-1">
              {route.geofenceConflicts.map((conflict, index) => (
                <div
                  key={`${conflict.boundaryId}-${index}`}
                  className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-200 truncate">
                      {conflict.boundaryName}
                    </span>
                    <span className="ml-auto text-[9px] text-rose-300 font-bold">
                      {conflict.distanceKm.toFixed(0)} km
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5">{conflict.regulation}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      {/* Vessel & transit metrics */}
      <section className="xl:col-span-4">
        <Panel title={ui.transitMetricsWord} icon={Ship} accent="sky">
          {route ? (
            <div>
              <Metric label={ui.effortHoursWord} value={route.estimatedTimeHours} />
              <Metric label={ui.cruiseSpeedWord} value={`${route.speedKnots} kn`} />
              <Metric label={ui.departureWord} value={route.origin.name} sub={ui.originWaypointWord} />
              <Metric label={ui.arrivalWord} value={route.destination.name} sub={ui.destinationWaypointWord} />
              <div className="mt-3">
                <button
                  onClick={() => onAsk('What is the safest route from my harbour for a trawler?')}
                  className="w-full rounded-xl bg-sky-500/15 border border-sky-500/40 hover:bg-sky-500/25 transition-colors py-2 text-[11px] font-bold text-sky-300"
                >
                  {ui.askReRouteWord}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">{ui.noTransitMetricsWord}</p>
          )}
        </Panel>
      </section>

      {/* Endurance, coast-wide fleet posture and port pressure */}
      <section className="xl:col-span-4">
        <Panel title="Vessel endurance watch" icon={TriangleAlert} accent="amber">
          {route && returnHours !== null ? (
            <div className="space-y-3">
              <div className={`rounded-xl border p-3 ${
                route.riskLevel === 'HIGH' || route.riskLevel === 'SEVERE'
                  ? 'border-rose-500/40 bg-rose-950/20'
                  : 'border-emerald-500/30 bg-emerald-950/20'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-300">Estimated round-trip underway time</span>
                  <span className="hud-num text-lg font-bold text-amber-200">{returnHours.toFixed(1)} h</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  {route.totalDistanceKm.toFixed(0)} km each way at {route.speedKnots} kn; route risk is {route.riskLevel}.
                </p>
              </div>
              <p className="text-[9px] text-slate-500">
                Planning estimate only. Fuel capacity and vessel-specific endurance are not available in this feed.
              </p>
              {(route.riskLevel === 'HIGH' || route.riskLevel === 'SEVERE') && (
                <p className="text-[10px] font-semibold text-rose-300">
                  Review the route and return conditions before departure.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{ui.noTransitMetricsWord}</p>
          )}
        </Panel>
      </section>

      <section className="xl:col-span-4">
        <Panel title="Fleet risk concentration" icon={Ship} accent="sky" loading={!fleet && !fleetError}>
          {fleetError && <p className="text-[10px] text-rose-300">{fleetError}</p>}
          {fleet && (
            <div className="space-y-3">
              {(['SEVERE', 'HIGH', 'MODERATE', 'LOW'] as const).map((level) => {
                const count = fleet.counts[level] ?? 0;
                const width = fleet.harbours.length ? (count / fleet.harbours.length) * 100 : 0;
                const color =
                  level === 'SEVERE' ? 'bg-rose-500' :
                  level === 'HIGH' ? 'bg-orange-400' :
                  level === 'MODERATE' ? 'bg-amber-400' : 'bg-emerald-400';
                return (
                  <div key={level}>
                    <div className="mb-1 flex justify-between text-[10px]">
                      <span className="text-slate-400">{level}</span>
                      <span className="hud-num text-slate-200">{count} harbours</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-[9px] text-slate-500">
                Coast-wide harbour risk distribution; this is not a live AIS vessel-density feed.
              </p>
            </div>
          )}
        </Panel>
      </section>

      <section className="xl:col-span-4">
        <Panel title="Port operations pressure" icon={Anchor} accent="amber">
          {operatingPressure !== null ? (
            <div>
              <div className="flex items-end justify-between">
                <span className="text-[10px] text-slate-400">Weather/advisory pressure proxy</span>
                <span className="hud-num text-2xl font-bold text-amber-200">{operatingPressure.toFixed(0)}%</span>
              </div>
              <div
                className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800"
                role="meter"
                aria-label="Weather and advisory pressure proxy"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={operatingPressure}
              >
                <div
                  className={`h-full rounded-full ${operatingPressure >= 65 ? 'bg-rose-500' : operatingPressure >= 35 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${operatingPressure}%` }}
                />
              </div>
              <p className="mt-2 text-[9px] text-slate-500">
                Derived from the route bundle safety score; no berth queue or vessel-arrival data is supplied.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">{ui.loading}</p>
          )}
        </Panel>
      </section>

      {/* Northern strip */}
      <section className="xl:col-span-12">
        <Panel title={ui.maritimeQuestionsWord} icon={Anchor} accent="sky">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {quickAsks.map(({ q, label }) => (
              <button
                key={q}
                onClick={() => onAsk(q)}
                className="rounded-xl border border-slate-800 bg-slate-900/40 hover:border-sky-500/40 hover:bg-slate-800/40 transition-colors px-3 py-2.5 text-left text-xs text-slate-300"
              >
                {label}
              </button>
            ))}
          </div>
          {brief && <SourceLine sources={brief.sources} label={book.labels.sources} />}
        </Panel>
      </section>
    </div>
  );
};