import React, { useState } from 'react';
import {
  Flame,
  Info,
  TrendingUp,
  Eye,
  Sliders,
  Sparkles,
  ChevronRight,
  X,
  Target,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { EmailCampaign } from '../types.ts';
import {
  calculatePredictiveClickMap,
  type ClickHotspot,
  type PredictiveEngagementReport,
} from '../utils/predictive-clickmap.ts';

interface ClickMapOverlayProps {
  campaign: EmailCampaign;
  viewport: 'desktop' | 'mobile';
  isEnabled: boolean;
  onToggle: () => void;
}

export const ClickMapOverlay: React.FC<ClickMapOverlayProps> = ({
  campaign,
  viewport,
  isEnabled,
  onToggle,
}) => {
  const [selectedHotspot, setSelectedHotspot] = useState<ClickHotspot | null>(null);
  const [viewMode, setViewMode] = useState<'combined' | 'thermal' | 'pins'>('combined');
  const [intensity, setIntensity] = useState<number>(75);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);

  const report: PredictiveEngagementReport = React.useMemo(() => {
    return calculatePredictiveClickMap(campaign, viewport);
  }, [campaign, viewport]);

  if (!isEnabled) {
    return null;
  }

  const getIntensityColor = (intensityType: ClickHotspot['intensity']) => {
    switch (intensityType) {
      case 'critical':
        return {
          glow: 'from-rose-500/80 via-amber-500/50 to-transparent',
          badgeBg: 'bg-rose-500 text-white shadow-rose-500/50',
          ring: 'border-rose-400',
          text: 'text-rose-400',
        };
      case 'high':
        return {
          glow: 'from-amber-500/70 via-yellow-500/40 to-transparent',
          badgeBg: 'bg-amber-500 text-white shadow-amber-500/50',
          ring: 'border-amber-400',
          text: 'text-amber-400',
        };
      case 'medium':
        return {
          glow: 'from-emerald-500/60 via-teal-500/30 to-transparent',
          badgeBg: 'bg-emerald-600 text-white shadow-emerald-500/50',
          ring: 'border-emerald-400',
          text: 'text-emerald-400',
        };
      case 'moderate':
        return {
          glow: 'from-cyan-500/50 via-sky-500/20 to-transparent',
          badgeBg: 'bg-cyan-600 text-white shadow-cyan-500/50',
          ring: 'border-cyan-400',
          text: 'text-cyan-400',
        };
      case 'low':
      default:
        return {
          glow: 'from-slate-400/40 via-slate-500/10 to-transparent',
          badgeBg: 'bg-slate-600 text-white shadow-slate-500/50',
          ring: 'border-slate-400',
          text: 'text-slate-400',
        };
    }
  };

  return (
    <>
      {/* Click-Map Control Floating Header Bar */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/30 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Flame className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">Predictive Click-Map</span>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold">
                {report.overallScore}/100 Score
              </span>
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block">
              Predicted CTR: <strong className="text-emerald-400">{report.predictedTotalCtrPct}%</strong> • {report.scanPattern} scan flow
            </div>
          </div>
        </div>

        {/* View Mode Switches */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('combined')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'combined'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Thermal heat glows + pins"
            >
              Combined
            </button>
            <button
              type="button"
              onClick={() => setViewMode('thermal')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'thermal'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pure heat density glow"
            >
              Thermal Heat
            </button>
            <button
              type="button"
              onClick={() => setViewMode('pins')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'pins'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pin percentages only"
            >
              Pins Only
            </button>
          </div>

          {/* Opacity slider */}
          <div className="hidden md:flex items-center space-x-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300">
            <Sliders className="w-3 h-3 text-slate-400" />
            <span>Heat: {intensity}%</span>
            <input
              type="range"
              min="30"
              max="100"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-14 h-1 accent-amber-500 cursor-pointer"
              title="Adjust heatmap glow opacity"
            />
          </div>

          {/* Heatmap Insights Modal Button */}
          <button
            type="button"
            onClick={() => setShowAnalyticsModal(true)}
            className="flex items-center space-x-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Insights</span>
          </button>

          {/* Close Overlay */}
          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Exit Click-Map mode"
            aria-label="Exit Click-Map mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* OVERLAY CANVAS LAYER: Rendered directly on top of the email preview */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden select-none">
        
        {/* Thermal Heat Glow Blooms */}
        {viewMode !== 'pins' && (
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{ opacity: intensity / 100 }}
          >
            {report.hotspots.map((h) => {
              const colors = getIntensityColor(h.intensity);
              const sizePx = (h.radiusPercent * (viewport === 'mobile' ? 3.5 : 5.8));

              return (
                <div
                  key={`glow-${h.id}`}
                  className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl filter mix-blend-multiply opacity-85"
                  style={{
                    left: `${h.xPercent}%`,
                    top: `${h.yPercent}%`,
                    width: `${sizePx}px`,
                    height: `${sizePx * 0.75}px`,
                    background: `radial-gradient(ellipse at center, ${
                      h.intensity === 'critical'
                        ? 'rgba(239, 68, 68, 0.75) 0%, rgba(245, 158, 11, 0.5) 45%, rgba(254, 240, 138, 0.2) 75%, transparent 100%)'
                        : h.intensity === 'high'
                        ? 'rgba(245, 158, 11, 0.7) 0%, rgba(234, 179, 8, 0.45) 50%, transparent 100%)'
                        : h.intensity === 'medium'
                        ? 'rgba(16, 185, 129, 0.6) 0%, rgba(6, 182, 212, 0.35) 50%, transparent 100%)'
                        : 'rgba(6, 182, 212, 0.4) 0%, transparent 100%)'
                    }`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Hotspot Interactive Pins & Badges */}
        {viewMode !== 'thermal' && (
          <div className="absolute inset-0 pointer-events-auto">
            {report.hotspots.map((h) => {
              const colors = getIntensityColor(h.intensity);
              const isSelected = selectedHotspot?.id === h.id;
              const isTopRank = h.rank === 1;

              return (
                <div
                  key={`pin-${h.id}`}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 z-10"
                  style={{
                    left: `${h.xPercent}%`,
                    top: `${h.yPercent}%`,
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHotspot(isSelected ? null : h);
                    }}
                    className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold border shadow-xl transition-all duration-200 cursor-pointer ${
                      colors.badgeBg
                    } ${
                      isSelected
                        ? 'scale-115 ring-4 ring-white shadow-2xl'
                        : 'hover:scale-105 active:scale-95'
                    }`}
                    title={`Click to inspect ${h.label} (${h.predictedSharePct}% share)`}
                    aria-label={`Hotspot ${h.rank}: ${h.label}`}
                  >
                    {/* Pulsing ring for #1 rank */}
                    {isTopRank && (
                      <span className="absolute -inset-1 rounded-full border-2 border-rose-400 animate-ping opacity-60 pointer-events-none" />
                    )}

                    <span className="w-4 h-4 rounded-full bg-black/25 flex items-center justify-center text-[10px] font-black">
                      #{h.rank}
                    </span>
                    <span className="font-extrabold tracking-tight">
                      {h.predictedSharePct}%
                    </span>
                    <span className="text-[10px] font-normal opacity-90 hidden sm:inline">
                      clicks
                    </span>
                  </button>

                  {/* Hotspot detail popup */}
                  {isSelected && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-72 sm:w-80 bg-slate-950 border border-slate-700/80 rounded-xl shadow-2xl p-3.5 text-left text-slate-200 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${colors.badgeBg}`}
                          >
                            Rank #{h.rank}
                          </span>
                          <span className="font-bold text-white text-sm">{h.label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedHotspot(null)}
                          className="text-slate-400 hover:text-white p-0.5 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Metrics grid */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-900/90 rounded-lg p-2 mb-2.5 border border-slate-800/80 text-center">
                        <div>
                          <div className="text-[10px] text-slate-400">Click Share</div>
                          <div className="font-extrabold text-amber-400 text-sm">{h.predictedSharePct}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Est. CTR</div>
                          <div className="font-extrabold text-emerald-400 text-sm">{h.predictedCtrPct}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Scan Step</div>
                          <div className="font-extrabold text-indigo-400 text-sm">#{h.scanOrder}</div>
                        </div>
                      </div>

                      {/* Content target info */}
                      <div className="text-[11px] text-slate-300 mb-2 bg-slate-900/50 px-2 py-1.5 rounded border border-slate-800">
                        <strong className="text-white">Content:</strong> {h.title}
                      </div>

                      {/* Engagement Driver */}
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                          <Eye className="w-3 h-3" />
                          <span>Attention Driver</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{h.driver}</p>
                      </div>

                      {/* Optimization Tip */}
                      <div className="space-y-1 bg-amber-950/30 border border-amber-500/30 rounded-lg p-2">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Optimization Tip</span>
                        </div>
                        <p className="text-[11px] text-amber-200/90 leading-relaxed">{h.recommendation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Heatmap Legend in bottom-right */}
        <div className="absolute bottom-3 right-3 z-30 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg px-2.5 py-1.5 shadow-xl text-[10px] text-slate-300 flex items-center space-x-2">
          <span className="font-bold text-slate-400 uppercase tracking-wider">Heat:</span>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" title="Hotspot >30% click share" />
            <span className="text-slate-400">Critical</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" title="High 15-30%" />
            <span className="text-slate-400">High</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Medium 5-15%" />
            <span className="text-slate-400">Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" title="Low <5%" />
            <span className="text-slate-400">Low</span>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE HEATMAP ANALYTICS MODAL */}
      {showAnalyticsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowAnalyticsModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Predictive Click &amp; Attention Analytics</h3>
                    <p className="text-xs text-slate-400">
                      Based on eye-tracking heuristics, copy density, CTA contrast, and device viewport
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAnalyticsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scorecard Hero */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Clickability
                </div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {report.overallScore}<span className="text-sm font-normal text-slate-500">/100</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">Grade: {report.grade}</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Predicted CTR
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {report.predictedTotalCtrPct}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Of Total Openers</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Click-to-Open (CTOR)
                </div>
                <div className="text-2xl font-black text-indigo-400 mt-1">
                  {report.estimatedClickToOpenRatePct}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Estimated intent</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Avg. Read Time
                </div>
                <div className="text-2xl font-black text-sky-400 mt-1">
                  {report.estimatedReadTimeSeconds}s
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Scanning velocity</div>
              </div>
            </div>

            {/* Fold Distribution Meter */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Fold Distribution (First Impression Focus)</span>
                <span className="text-amber-400 font-mono">
                  {report.aboveFoldSharePct}% Above Fold • {report.belowFoldSharePct}% Below Fold
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-amber-500 to-rose-500 h-full"
                  style={{ width: `${report.aboveFoldSharePct}%` }}
                  title={`Above Fold: ${report.aboveFoldSharePct}%`}
                />
                <div
                  className="bg-indigo-600 h-full"
                  style={{ width: `${report.belowFoldSharePct}%` }}
                  title={`Below Fold: ${report.belowFoldSharePct}%`}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Subscribers allocate ~{report.aboveFoldSharePct}% of total gaze and preliminary interaction to the header, visual banner, and hook before scrolling.
              </p>
            </div>

            {/* Hotspots Ranking Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span>Predicted Hotspot Ranking</span>
                </h4>
                <span className="text-[11px] text-slate-400">Sorted by click propensity</span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950">
                {report.hotspots.map((h) => {
                  const colors = getIntensityColor(h.intensity);
                  return (
                    <div key={`table-${h.id}`} className="p-3 hover:bg-slate-900/60 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] ${colors.badgeBg}`}
                          >
                            #{h.rank}
                          </span>
                          <span className="font-bold text-slate-200 text-xs sm:text-sm">{h.label}</span>
                          <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
                            ({h.elementKey})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-black text-amber-400">{h.predictedSharePct}%</span>
                            <span className="text-[10px] text-slate-500 ml-1">share</span>
                          </div>
                          <div className="text-right text-emerald-400 font-mono text-xs">
                            {h.predictedCtrPct}% CTR
                          </div>
                        </div>
                      </div>

                      {/* Mini bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
                        <div
                          className={`h-full ${
                            h.intensity === 'critical'
                              ? 'bg-rose-500'
                              : h.intensity === 'high'
                              ? 'bg-amber-500'
                              : h.intensity === 'medium'
                              ? 'bg-emerald-500'
                              : 'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.min(100, h.predictedSharePct * 2)}%` }}
                        />
                      </div>

                      <div className="text-[11px] text-slate-400">
                        <strong className="text-slate-300">Driver:</strong> {h.driver}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Eye-Scan Path Flow */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Subscriber Eye-Scan Sequence ({report.scanPattern})
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {report.scanSteps.map((step) => (
                  <div
                    key={step.step}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center space-y-1"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 font-mono font-bold text-xs mx-auto flex items-center justify-center">
                      {step.step}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-200 line-clamp-2">
                      {step.label}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      ~{step.dwellTimeSeconds}s dwell
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Top Conversion Opportunity</span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                {report.topOpportunity}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAnalyticsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Close Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
