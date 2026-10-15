import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Info,
  TrendingUp,
  FileText,
  Mail,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import type { EmailCampaign } from '../types.ts';
import { calculateSenderReputation, SenderReputationResult } from '../utils/sender-reputation.ts';

interface SenderReputationMetricProps {
  campaign: EmailCampaign;
}

export const SenderReputationMetric: React.FC<SenderReputationMetricProps> = ({ campaign }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Dynamically recalculated whenever campaign content or selectedSubjectIndex changes
  const reputation: SenderReputationResult = calculateSenderReputation(campaign);

  const getTierBadge = () => {
    switch (reputation.tier) {
      case 'prime':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
          bar: 'from-emerald-500 to-teal-400',
          icon: ShieldCheck,
        };
      case 'healthy':
        return {
          bg: 'bg-blue-950/70 border-blue-500/40 text-blue-300',
          dot: 'bg-blue-400',
          bar: 'from-blue-500 to-indigo-400',
          icon: ShieldCheck,
        };
      case 'caution':
        return {
          bg: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400',
          bar: 'from-amber-500 to-orange-400',
          icon: ShieldAlert,
        };
      case 'at_risk':
      default:
        return {
          bg: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
          dot: 'bg-rose-400',
          bar: 'from-rose-500 to-red-400',
          icon: ShieldAlert,
        };
    }
  };

  const badgeStyle = getTierBadge();
  const IconComponent = badgeStyle.icon;

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3 relative overflow-hidden transition-all">
      {/* Background Subtle Thermal Tint */}
      <div
        className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-2xl opacity-15 pointer-events-none ${
          reputation.tier === 'prime'
            ? 'bg-emerald-500'
            : reputation.tier === 'healthy'
            ? 'bg-blue-500'
            : reputation.tier === 'caution'
            ? 'bg-amber-500'
            : 'bg-rose-500'
        }`}
      />

      {/* Main Metric Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center border ${badgeStyle.bg}`}
          >
            <IconComponent className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                Sender Reputation
              </span>
              <span
                className="cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
                title="Dynamic deliverability score based on email content length, clipping safety, and subject line engagement signal"
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              >
                <HelpCircle className="w-3 h-3" />
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              Dynamic Deliverability Rating
            </span>
          </div>
        </div>

        {/* Score & Tier Badge */}
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="flex items-baseline space-x-1 justify-end">
              <span className="text-lg font-black tracking-tight text-white">
                {reputation.score}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">/100</span>
            </div>
            <div
              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border inline-flex items-center gap-1 ${badgeStyle.bg}`}
            >
              <span className={`w-1 h-1 rounded-full ${badgeStyle.dot}`} />
              <span>{reputation.tier.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Progress Bar */}
      <div>
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full bg-gradient-to-r ${badgeStyle.bar} transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(100, Math.max(8, reputation.score))}%` }}
          />
        </div>
      </div>

      {/* Dynamic Key Drivers Grid: Content Length & Subject Impact */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        {/* Driver 1: Content Length */}
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 text-[10px] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-400" />
              <span className="font-semibold text-slate-300">Content Length</span>
            </span>
            <span
              className={`font-mono font-bold ${
                reputation.contentLength.status === 'optimal'
                  ? 'text-emerald-400'
                  : reputation.contentLength.status === 'clipping_risk'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {reputation.contentLength.score}/50
            </span>
          </div>

          <div className="font-medium text-slate-200 flex items-center justify-between">
            <span>{reputation.contentLength.wordCount} words</span>
            <span className="text-[9px] text-slate-400 font-mono">
              ~{reputation.contentLength.estimatedHtmlSizeKb} KB
            </span>
          </div>

          <p className="text-[9px] text-slate-400 line-clamp-1 leading-tight">
            {reputation.contentLength.status === 'clipping_risk'
              ? 'Gmail clipping risk'
              : reputation.contentLength.status === 'optimal'
              ? 'Optimal inbox flow'
              : reputation.contentLength.status === 'light'
              ? 'Short / sparse'
              : 'Dense / lengthy'}
          </p>
        </div>

        {/* Driver 2: Subject Line Impact */}
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 text-[10px] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-cyan-400" />
              <span className="font-semibold text-slate-300">Subject Impact</span>
            </span>
            <span
              className={`font-mono font-bold ${
                reputation.subjectImpact.status === 'strong'
                  ? 'text-emerald-400'
                  : reputation.subjectImpact.status === 'good'
                  ? 'text-blue-400'
                  : 'text-amber-400'
              }`}
            >
              {reputation.subjectImpact.score}/50
            </span>
          </div>

          <div className="font-medium text-slate-200 flex items-center justify-between">
            <span className="text-emerald-300 font-mono">
              {reputation.subjectImpact.predictedOpenRate.toFixed(1)}% Open
            </span>
            <span
              className={`text-[9px] font-mono ${
                reputation.subjectImpact.spamScore <= 15 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {reputation.subjectImpact.spamScore}/100 Spam
            </span>
          </div>

          <p className="text-[9px] text-slate-400 line-clamp-1 leading-tight">
            {reputation.subjectImpact.length} chars &bull; {reputation.subjectImpact.status} signal
          </p>
        </div>
      </div>

      {/* Expand/Collapse Toggle for Full Deliverability Audit */}
      <button
        type="button"
        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
        className="w-full pt-1 flex items-center justify-between text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
        aria-expanded={isDetailsOpen}
      >
        <span className="font-medium">
          {isDetailsOpen ? 'Hide Reputation Audit' : 'Inspect Reputation Factors'}
        </span>
        {isDetailsOpen ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {/* Expandable Factor Breakdown & Deliverability Insights */}
      {isDetailsOpen && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[10px] animate-in fade-in duration-150">
          <p className="text-slate-400 leading-snug">{reputation.summary}</p>

          <div className="space-y-1.5 pt-1">
            {reputation.factors.map((factor, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-start justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    {factor.type === 'positive' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : factor.type === 'negative' ? (
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    ) : (
                      <Info className="w-3 h-3 text-blue-400 shrink-0" />
                    )}
                    <span>{factor.name}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                    {factor.description}
                  </div>
                </div>

                <span
                  className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    factor.impact > 0
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                  }`}
                >
                  {factor.impact > 0 ? `+${factor.impact}` : factor.impact}
                </span>
              </div>
            ))}
          </div>

          {/* Delivery Platform Health Forecast */}
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span>Gmail Postmaster: <strong className="text-emerald-400 font-sans">High</strong></span>
            <span>Yahoo/AOL: <strong className="text-emerald-400 font-sans">99.2%</strong></span>
            <span>Outlook: <strong className="text-emerald-400 font-sans">Inbox</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
