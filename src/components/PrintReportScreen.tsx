import React from 'react';
import { Printer } from 'lucide-react';
import type { HarborLocation } from '../types';
import type { SituationBrief, MapBundle } from '../services/orcaApi';
import type { Persona } from '../personas';

interface PrintReportScreenProps {
  harbor: HarborLocation;
  persona: Persona;
  brief: SituationBrief | null;
  briefLoading: boolean;
  briefOffline: boolean;
  bundle: MapBundle | null;
}

const RISK_STYLES: Record<SituationBrief['riskLevel'], string> = {
  LOW: 'report-risk-low',
  MODERATE: 'report-risk-moderate',
  HIGH: 'report-risk-high',
  SEVERE: 'report-risk-severe',
};

function reportTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export const PrintReportScreen: React.FC<PrintReportScreenProps> = ({
  harbor,
  persona,
  brief,
  briefLoading,
  briefOffline,
  bundle,
}) => {
  const alerts = (bundle?.alerts ?? [])
    .filter((alert) => alert.advisoryLevel !== 'GREEN')
    .sort((a, b) =>
      ({ RED: 3, ORANGE: 2, YELLOW: 1, GREEN: 0 }[b.advisoryLevel] -
        { RED: 3, ORANGE: 2, YELLOW: 1, GREEN: 0 }[a.advisoryLevel]) ||
      a.distanceKm - b.distanceKm,
    )
    .slice(0, 6);
  const zones = (bundle?.fishingZones ?? []).slice(0, 6);

  return (
    <article className="print-report-view">
      <div className="report-toolbar print-hide">
        <div>
          <p className="report-eyebrow">OCEANIX · MARINE INTELLIGENCE</p>
          <h1>Print report</h1>
          <p>Current marine situation for {harbor.shortName}</p>
        </div>
        <button type="button" onClick={() => window.print()} className="report-print-button">
          <Printer aria-hidden="true" />
          Print report
        </button>
      </div>

      <header className="report-heading">
        <div>
          <p className="report-eyebrow">OCEANIX · MARINE INTELLIGENCE PLATFORM</p>
          <h1>Marine Situation Report</h1>
          <p className="report-location">{harbor.name} · {harbor.state} · {harbor.basin}</p>
        </div>
        <div className="report-meta">
          <span>Prepared for: {persona.label}</span>
          <span>Generated: {brief ? reportTime(brief.timestamp) : reportTime(new Date().toISOString())} IST</span>
          {briefOffline && <span className="report-offline">Reference / offline engine</span>}
        </div>
      </header>

      {briefLoading && !brief ? (
        <section className="report-section report-status">
          Situation report is loading. Refresh or wait for the latest report before printing.
        </section>
      ) : brief ? (
        <>
          <section className={`report-verdict ${RISK_STYLES[brief.riskLevel]}`}>
            <div>
              <p className="report-eyebrow">MARINE RISK · {brief.riskLabel}</p>
              <h2>{brief.headline}</h2>
              <p>{brief.recommendation}</p>
            </div>
            <div className="report-score">
              <strong>{brief.safetyScore}</strong>
              <span>Safety index / 100</span>
            </div>
          </section>

          <section className="report-section">
            <h2>Conditions at a glance</h2>
            <div className="report-metrics">
              <ReportMetric
                label="Wind"
                value={brief.weather
                  ? `${brief.weather.windKnots} kn ${brief.weather.windDirection}`
                  : 'Unavailable'}
                detail={brief.weather
                  ? `Gusts ${brief.weather.gustKnots} kn · ${brief.weather.condition}`
                  : undefined}
              />
              <ReportMetric
                label="Sea state"
                value={brief.ocean ? `${brief.ocean.waveHeightMeters.toFixed(1)} m waves` : 'Unavailable'}
                detail={brief.ocean
                  ? `${brief.ocean.seaCondition} · SST ${brief.ocean.sstCelsius.toFixed(1)}°C · swell ${brief.ocean.swellDirection}`
                  : undefined}
              />
              <ReportMetric
                label="Tide"
                value={brief.tide
                  ? `${brief.tide.currentLevelMeters.toFixed(2)} m · ${brief.tide.isRising ? 'rising' : 'falling'}`
                  : 'Unavailable'}
                detail={brief.tide?.recommendedWindow
                  ? `Suggested window: ${brief.tide.recommendedWindow.startLabel}–${brief.tide.recommendedWindow.endLabel}`
                  : brief.tide?.nextEvent?.label}
              />
            </div>
          </section>

          <section className="report-section">
            <h2>Active advisories</h2>
            {alerts.length ? (
              <div className="report-list">
                {alerts.map((alert) => (
                  <div className="report-list-item" key={alert.id}>
                    <div className="report-list-heading">
                      <strong>{alert.title}</strong>
                      <span className={`report-advisory report-advisory-${alert.advisoryLevel.toLowerCase()}`}>
                        {alert.advisoryLevel}
                      </span>
                    </div>
                    <p>{alert.description}</p>
                    <p><strong>Action:</strong> {alert.action}</p>
                    <small>{alert.distanceKm.toFixed(0)} km {alert.bearing} · Valid until {reportTime(alert.validUntil)} · {alert.source}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="report-muted">
                {bundle ? 'No elevated advisories in the current map data.' : 'Advisory data is unavailable.'}
              </p>
            )}
          </section>

          <section className="report-section">
            <h2>Nearby fishing grounds</h2>
            {zones.length ? (
              <div className="report-table-wrap">
                <table className="report-table">
                  <thead>
                    <tr><th>Ground</th><th>Range</th><th>Potential index</th><th>Species</th><th>Valid until</th></tr>
                  </thead>
                  <tbody>
                    {zones.map((zone) => (
                      <tr key={zone.id}>
                        <td>{zone.name}</td>
                        <td>{zone.distanceKm.toFixed(0)} km {zone.bearing}</td>
                        <td>{zone.productivityIndex}/100 · {zone.productivityClass}</td>
                        <td>{zone.targetFishSpecies.join(', ') || '—'}</td>
                        <td>{reportTime(zone.validTill)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : brief.fishingZone ? (
              <div className="report-metric">
                <strong>{brief.fishingZone.name}</strong>
                <span>{brief.fishingZone.distanceKm.toFixed(0)} km {brief.fishingZone.bearing} · potential index {brief.fishingZone.productivityIndex}/100</span>
                <small>{brief.fishingZone.species.join(', ')}</small>
              </div>
            ) : (
              <p className="report-muted">Fishing-ground data is unavailable.</p>
            )}
            <p className="report-note">Productivity index is an indicator, not a guaranteed catch probability.</p>
          </section>

          {bundle?.route && (
            <section className="report-section">
              <h2>Planned route</h2>
              <div className="report-route">
                <strong>{bundle.route.origin.name} → {bundle.route.destination.name}</strong>
                <span>{bundle.route.totalDistanceKm.toFixed(0)} km · {bundle.route.estimatedTimeHours} · {bundle.route.speedKnots} kn</span>
                <span>Safety index {bundle.route.safetyScore}/100 · {bundle.route.riskLevel}</span>
                <p>{bundle.route.recommendation}</p>
              </div>
            </section>
          )}

          <section className="report-section report-provenance">
            <h2>Sources and limitations</h2>
            <p>{brief.sources.length ? brief.sources.join(' · ') : 'Source details unavailable.'}</p>
            <p>{brief.disclaimer}</p>
          </section>
        </>
      ) : (
        <section className="report-section report-status">
          No situation report is available yet. Refresh the situation brief and try again.
        </section>
      )}

      <footer className="report-footer">
        <span>OCEANIX Marine Intelligence Platform · ORCA decision engine</span>
        <span>Operational guidance is indicative. Follow official IMD / INCOIS bulletins and local authority instructions.</span>
      </footer>
    </article>
  );
};

const ReportMetric: React.FC<{ label: string; value: string; detail?: string }> = ({
  label,
  value,
  detail,
}) => (
  <div className="report-metric">
    <span>{label}</span>
    <strong>{value}</strong>
    {detail && <small>{detail}</small>}
  </div>
);
