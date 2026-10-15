import React from 'react';
import { Mail, Sparkles, Gamepad2, Bot, Download, Copy, Check, RefreshCw } from 'lucide-react';
import { CAMPAIGN_PRESETS } from '../data/presets';
import { EmailCampaign } from '../types';

interface HeaderProps {
  activeTab: 'studio' | 'game';
  setActiveTab: (tab: 'studio' | 'game') => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  campaign: EmailCampaign;
  onLoadPreset: (preset: EmailCampaign) => void;
  onCopyHtml: () => void;
  copied: boolean;
  onOpenVisualModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isChatOpen,
  setIsChatOpen,
  campaign,
  onLoadPreset,
  onCopyHtml,
  copied,
  onOpenVisualModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg text-white tracking-tight">CampaignForge</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Studio AI
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Full-Funnel Campaigns, 4K Visuals &amp; Deliverability Arcade</p>
          </div>
        </div>

        {/* Navigation & Mode switch */}
        <nav className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'studio'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campaign Studio</span>
          </button>
          
          <button
            onClick={() => setActiveTab('game')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'game'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Deliverability Tycoon</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Preset selector */}
          <div className="relative hidden md:block">
            <select
              onChange={(e) => {
                const found = CAMPAIGN_PRESETS.find(p => p.id === e.target.value);
                if (found) onLoadPreset(found);
              }}
              value={campaign.id}
              className="bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-medium rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              aria-label="Load Campaign Preset"
            >
              <option value="" disabled>Load Sample Campaign...</option>
              {CAMPAIGN_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title.slice(0, 32)}...
                </option>
              ))}
            </select>
          </div>

          {/* AI Visual button */}
          <button
            onClick={onOpenVisualModal}
            className="flex items-center space-x-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            title="Generate visual with gemini-3-pro-image-preview (1K/2K/4K)"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">4K Visual</span>
          </button>

          {/* AI Copilot chat drawer toggle */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              isChatOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
            aria-label="Toggle AI Marketing Copilot"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Copy HTML button */}
          <button
            onClick={onCopyHtml}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            title="Copy clean responsive HTML code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{copied ? 'Copied HTML!' : 'Copy Code'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
