import React, { useState } from 'react';
import { Sparkles, Wand2, Target, Sliders, ArrowRight, Loader2, Lightbulb } from 'lucide-react';
import { CampaignObjective, BrandTone } from '../types';

interface CampaignGeneratorFormProps {
  onGenerate: (data: {
    prompt: string;
    objective: CampaignObjective;
    targetAudience: string;
    brandTone: BrandTone;
  }) => void;
  isGenerating: boolean;
}

const OBJECTIVE_OPTIONS: { id: CampaignObjective; label: string; icon: string }[] = [
  { id: 'product_launch', label: 'Product Launch', icon: '🚀' },
  { id: 'flash_sale', label: 'Flash Sale / Promo', icon: '⚡' },
  { id: 'welcome_sequence', label: 'Welcome Series', icon: '👋' },
  { id: 'newsletter', label: 'Value Newsletter', icon: '📰' },
  { id: 're_engagement', label: 'Win-Back / Churn', icon: '🔄' },
  { id: 'webinar_invite', label: 'Webinar / Event', icon: '🎟️' },
  { id: 'case_study', label: 'B2B Case Study', icon: '💼' },
];

const TONE_OPTIONS: { id: BrandTone; label: string }[] = [
  { id: 'persuasive', label: 'Persuasive & Direct' },
  { id: 'urgent', label: 'High Urgency (FOMO)' },
  { id: 'conversational', label: 'Warm & Conversational' },
  { id: 'authoritative', label: 'Authoritative & Data-Driven' },
  { id: 'luxury', label: 'Luxury & Elevated' },
  { id: 'playful', label: 'Witty & Playful' },
];

const PROMPT_SUGGESTIONS = [
  {
    title: 'AI Code Assistant v2.0',
    prompt: 'Launch v2 of an AI code review assistant that catches security flaws in pull requests before deployment. Audience: Senior Engineers and CTOs.',
    objective: 'product_launch' as CampaignObjective,
  },
  {
    title: 'Spring Clean Flash Sale',
    prompt: '48-hour flash sale offering 40% off ergonomic standing desks and smart dual-motor frames with free shipping. Audience: Remote knowledge workers.',
    objective: 'flash_sale' as CampaignObjective,
  },
  {
    title: 'SaaS Inactive User Win-Back',
    prompt: 'Re-engage trial users who dropped off on day 4 by offering a 1-on-1 strategy audit and extending their trial by 14 days with zero risk.',
    objective: 're_engagement' as CampaignObjective,
  },
  {
    title: 'Exclusive Executive Masterclass',
    prompt: 'Invite founders to an intimate live teardown on scaling outbound sales pipelines from $1M to $10M ARR without hiring SDR armies.',
    objective: 'webinar_invite' as CampaignObjective,
  },
];

export const CampaignGeneratorForm: React.FC<CampaignGeneratorFormProps> = ({
  onGenerate,
  isGenerating,
}) => {
  const [prompt, setPrompt] = useState('');
  const [objective, setObjective] = useState<CampaignObjective>('product_launch');
  const [targetAudience, setTargetAudience] = useState('Growth marketers and startup founders');
  const [brandTone, setBrandTone] = useState<BrandTone>('persuasive');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerate({ prompt, objective, targetAudience, brandTone });
  };

  const handleApplySuggestion = (s: typeof PROMPT_SUGGESTIONS[0]) => {
    setPrompt(s.prompt);
    setObjective(s.objective);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-400" />
              Generate Complete Email Campaign
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates high-converting subject lines, preheaders, body copy, CTA triggers, and visuals.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Powered by Gemini AI Engine</span>
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Campaign Brief / Core Offer Prompt <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe what you want to promote (e.g. 'Announce our new AI analytics feature that cuts churn by 35%. Offer a 20% discount code VALID48HRS with free onboarding for early signups...')"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y"
            required
          />

          {/* Quick inspiration tags */}
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" /> Quick ideas:
            </span>
            {PROMPT_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySuggestion(s)}
                className="text-xs bg-slate-800/80 hover:bg-slate-800 hover:text-indigo-300 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700/60 transition-colors"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Objective & Audience & Tone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          
          {/* Objective */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              Campaign Objective
            </label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value as CampaignObjective)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {OBJECTIVE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.icon} {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. B2B decision makers, busy moms, gym goers"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Brand Tone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>🎭</span> Tone of Voice
            </label>
            <select
              value={brandTone}
              onChange={(e) => setBrandTone(e.target.value as BrandTone)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-lg shadow-indigo-600/30 ${
              isGenerating || !prompt.trim()
                ? 'bg-indigo-600/50 cursor-not-allowed text-slate-300'
                : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Crafting Campaign Copy &amp; Heuristics...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Generate Full Campaign</span>
                <ArrowRight className="w-4 h-4 text-indigo-200" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
