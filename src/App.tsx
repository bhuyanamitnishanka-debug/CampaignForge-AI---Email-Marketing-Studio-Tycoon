import React, { useState, useEffect } from 'react';
import { EmailCampaign, CampaignVisual, CampaignObjective, BrandTone } from './types';
import { CAMPAIGN_PRESETS } from './data/presets';
import { Header } from './components/Header';
import { CampaignGeneratorForm } from './components/CampaignGeneratorForm';
import { SubjectLineTester } from './components/SubjectLineTester';
import { EmailPreview } from './components/EmailPreview';
import { VisualGeneratorModal } from './components/VisualGeneratorModal';
import { AiStrategistChat } from './components/AiStrategistChat';
import { InboxTycoonGame } from './components/InboxTycoonGame';
import { SenderReputationMetric } from './components/SenderReputationMetric';
import { generateEmailHtml } from './utils/html-template';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'game'>('studio');
  const [campaign, setCampaign] = useState<EmailCampaign>(CAMPAIGN_PRESETS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check URL params for direct game access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('game') === '1' || params.get('autostart') === '1') {
      setActiveTab('game');
    }
  }, []);

  // Handle Full Campaign Generation via Gemini API
  const handleGenerateCampaign = async (data: {
    prompt: string;
    objective: CampaignObjective;
    targetAudience: string;
    brandTone: BrandTone;
  }) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/campaign/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const campaignResult = await res.json();
      if (campaignResult && campaignResult.headline) {
        setCampaign(campaignResult);
      }
    } catch (err: any) {
      console.error('Failed to generate campaign:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Select Subject Line
  const handleSelectSubject = (index: number) => {
    setCampaign((prev) => ({
      ...prev,
      selectedSubjectIndex: index,
    }));
  };

  // Update specific subject line text
  const handleUpdateSubject = (index: number, newText: string) => {
    setCampaign((prev) => {
      const updatedLines = [...prev.subjectLines];
      if (updatedLines[index]) {
        updatedLines[index] = { ...updatedLines[index], text: newText };
      }
      return { ...prev, subjectLines: updatedLines };
    });
  };

  // Update preview text
  const handleUpdatePreviewText = (previewText: string) => {
    setCampaign((prev) => ({ ...prev, previewText }));
  };

  // Apply new Visual
  const handleApplyVisual = (visual: CampaignVisual) => {
    setCampaign((prev) => ({ ...prev, visual }));
  };

  // Copy full HTML code
  const handleCopyHtml = () => {
    const html = generateEmailHtml(campaign);
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If in Deliverability Tycoon Game mode, render the full-viewport Game Shell
  if (activeTab === 'game') {
    return <InboxTycoonGame onBackToStudio={() => setActiveTab('studio')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        campaign={campaign}
        onLoadPreset={(preset) => setCampaign(preset)}
        onCopyHtml={handleCopyHtml}
        copied={copied}
        onOpenVisualModal={() => setIsVisualModalOpen(true)}
      />

      {/* Main Campaign Studio Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Campaign Prompt Generation Form */}
        <CampaignGeneratorForm
          onGenerate={handleGenerateCampaign}
          isGenerating={isGenerating}
        />

        {/* 2-Column Working Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Subject Lines, A/B Tester & Diagnostics */}
          <div className="lg:col-span-5 space-y-6">
            <SubjectLineTester
              subjectLines={campaign.subjectLines}
              selectedIndex={campaign.selectedSubjectIndex}
              onSelectIndex={handleSelectSubject}
              onUpdateSubject={handleUpdateSubject}
              previewText={campaign.previewText}
              onUpdatePreviewText={handleUpdatePreviewText}
            />

            {/* Campaign Summary & Quick Stats Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Campaign Strategy Metadata
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  Live Deliverability
                </span>
              </div>

              {/* Dynamic Sender Reputation Score Metric */}
              <SenderReputationMetric campaign={campaign} />

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Objective</span>
                  <span className="font-semibold text-slate-200 capitalize">
                    {campaign.objective.replace('_', ' ')}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Tone</span>
                  <span className="font-semibold text-slate-200 capitalize">
                    {campaign.brandTone}
                  </span>
                </div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Audience Segment</span>
                <p className="font-medium text-slate-300 mt-0.5">{campaign.targetAudience}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Email Preview & Code Exporter */}
          <div className="lg:col-span-7">
            <EmailPreview
              campaign={campaign}
              onUpdateCampaign={(updated) => setCampaign(updated)}
              onOpenVisualModal={() => setIsVisualModalOpen(true)}
            />
          </div>

        </div>

      </main>

      {/* Visual Generator Modal (gemini-3-pro-image-preview with 1K, 2K, 4K affordances) */}
      <VisualGeneratorModal
        isOpen={isVisualModalOpen}
        onClose={() => setIsVisualModalOpen(false)}
        visual={campaign.visual}
        onApplyVisual={handleApplyVisual}
        defaultPrompt={campaign.visual.prompt}
      />

      {/* AI Strategist Multi-Turn Chat Copilot Drawer */}
      <AiStrategistChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        campaign={campaign}
      />
    </div>
  );
}
