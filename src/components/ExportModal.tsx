import React, { useState } from 'react';
import {
  Download,
  FileText,
  Printer,
  Archive,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Settings2,
  Code,
  X,
  FileCode,
  Layers,
  Info,
} from 'lucide-react';
import type { EmailCampaign } from '../types.ts';
import { generateMhtmlArchive, getMhtmlStats, MhtmlOptions } from '../utils/mhtml-export.ts';
import { exportCampaignToPdf, PdfExportOptions } from '../utils/pdf-export.ts';
import { generateEspHtml, triggerFileDownload, EspType } from '../utils/esp-export.ts';

interface ExportModalProps {
  campaign: EmailCampaign;
  isOpen: boolean;
  onClose: () => void;
  onTriggerPrintPdf: () => void;
  htmlCode: string;
  plainText: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onTriggerPrintPdf,
  htmlCode,
  plainText,
}) => {
  const [activeTab, setActiveTab] = useState<'primary' | 'mhtml-source' | 'esp'>('primary');
  const [includeAlternatives, setIncludeAlternatives] = useState(true);
  const [includeTracking, setIncludeTracking] = useState(true);
  const [copiedMhtml, setCopiedMhtml] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [mhtmlDownloaded, setMhtmlDownloaded] = useState(false);

  if (!isOpen) return null;

  const mhtmlOptions: MhtmlOptions = {
    includeAlternativeSubjects: includeAlternatives,
    includeTrackingAppendix: includeTracking,
  };

  const mhtmlContent = generateMhtmlArchive(campaign, mhtmlOptions);
  const mhtmlStats = getMhtmlStats(campaign, mhtmlOptions);

  const getCleanSlug = () =>
    (campaign.title || 'campaign')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 45);

  const handleDownloadPdf = () => {
    setPdfGenerating(true);
    try {
      exportCampaignToPdf(campaign, {
        filename: `${getCleanSlug()}.pdf`,
        includeAlternatives,
        includeTracking,
      });
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setTimeout(() => setPdfGenerating(false), 800);
    }
  };

  const handleDownloadMhtml = (extension: 'mhtml' | 'mht' = 'mhtml') => {
    triggerFileDownload(
      `${getCleanSlug()}.${extension}`,
      mhtmlContent,
      'multipart/related;charset=utf-8'
    );
    setMhtmlDownloaded(true);
    setTimeout(() => setMhtmlDownloaded(false), 2000);
  };

  const handleCopyMhtml = async () => {
    try {
      await navigator.clipboard.writeText(mhtmlContent);
      setCopiedMhtml(true);
      setTimeout(() => setCopiedMhtml(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadEsp = (esp: EspType) => {
    const espHtml = generateEspHtml(campaign, esp);
    triggerFileDownload(`${getCleanSlug()}-${esp}-template.html`, espHtml);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative my-6 text-xs text-slate-300 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Campaign Archival &amp; Export Hub
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  PDF &bull; MHTML &bull; ESP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Export your campaign as a standalone PDF report, an RFC 2557 MHTML offline web archive, or deployable ESP code.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close export dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('primary')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'primary'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF &amp; MHTML Archival</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mhtml-source')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'mhtml-source'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>MHTML Source Inspector</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
              RFC 2557
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('esp')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'esp'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ESP Email Formats</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {activeTab === 'primary' && (
            <>
              {/* Export Options Toolbar */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center space-x-1 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Archival Inclusions:</span>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeAlternatives}
                      onChange={(e) => setIncludeAlternatives(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                    />
                    <span>Tested Subject Variants</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeTracking}
                      onChange={(e) => setIncludeTracking(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                    />
                    <span>UTM &amp; Tracking Appendix</span>
                  </label>
                </div>
              </div>

              {/* TWO CORE ARCHIVAL FORMAT CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. PDF EXPORT CARD */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-slate-700 transition-all group">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
                        .PDF FILE
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                      Executive Campaign Brief &amp; PDF
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Instant client-side vector PDF document with campaign specs, visual asset placement, layout rendering, spam scores, and legal footers.
                    </p>

                    <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Ready for stakeholder sign-off &amp; legal archives</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Includes subject variations &amp; predicted CTR</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Full UTM attribution parameters attached</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={pdfGenerating}
                      className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{pdfGenerating ? 'Generating PDF...' : 'Download PDF Document (.pdf)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onTriggerPrintPdf();
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-colors border border-slate-800"
                    >
                      <Printer className="w-3.5 h-3.5 text-rose-400" />
                      <span>Print or Save via Browser Dialog</span>
                    </button>
                  </div>
                </div>

                {/* 2. MHTML ARCHIVE CARD */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-slate-700 transition-all group">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Archive className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        .MHTML ARCHIVE
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      MIME HTML Web Archive (RFC 2557)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Self-contained offline document bundle with complete inline styling, metadata headers, and content encapsulation.
                    </p>

                    <div className="mt-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>Standard:</span>
                        <span className="text-slate-200">RFC 2557 / MIME</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Encoding:</span>
                        <span className="text-slate-200">{mhtmlStats.encoding}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Archive Size:</span>
                        <span className="text-cyan-300 font-bold">{mhtmlStats.formattedSize}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Compatible:</span>
                        <span className="text-slate-200">Chrome, Edge, Outlook, Thunderbird</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadMhtml('mhtml')}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-600/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{mhtmlDownloaded ? 'Downloaded!' : 'Download MHTML Archive (.mhtml)'}</span>
                    </button>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadMhtml('mht')}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium py-1.5 px-2 rounded-lg text-center transition-colors border border-slate-800"
                        title="Download with legacy .mht extension for older email clients"
                      >
                        Download as .mht
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyMhtml}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1 transition-colors border border-slate-800"
                      >
                        {copiedMhtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedMhtml ? 'Copied' : 'Copy MIME'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informational Guidance Callout */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-start space-x-3 text-[11px]">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Archival Tip:</strong> MHTML (<code className="text-indigo-300 font-mono">.mhtml</code>) files are tamper-evident email archives that open offline in any modern browser or email client. Use PDF (<code className="text-rose-300 font-mono">.pdf</code>) when distributing briefs to non-technical executive teams or clients.
                </div>
              </div>
            </>
          )}

          {activeTab === 'mhtml-source' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="font-mono text-cyan-400 font-bold">RFC 2557 MIME Stream</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-slate-400">Boundary: {mhtmlStats.boundary.slice(0, 30)}...</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMhtml}
                  className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-slate-200 text-xs font-semibold"
                >
                  {copiedMhtml ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMhtml ? 'Copied!' : 'Copy Source'}</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 max-h-[380px] overflow-auto">
                <pre className="font-mono text-[11px] text-cyan-300/90 leading-relaxed whitespace-pre-wrap break-all">
                  {mhtmlContent}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'esp' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-[11px]">
                Specialized templates pre-configured with platform-specific merge tags, unsubscribe tokens, and editable canvas directives:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadEsp('mailchimp')}
                  className="text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-600/60 hover:bg-slate-900 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">🐵</span>
                    <div>
                      <div className="font-bold text-white text-xs">Mailchimp (.html)</div>
                      <div className="text-[10px] text-slate-400">*|MC_PREVIEW_TEXT|*, *|UNSUB|*</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadEsp('klaviyo')}
                  className="text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-600/60 hover:bg-slate-900 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">⚡</span>
                    <div>
                      <div className="font-bold text-white text-xs">Klaviyo (.html)</div>
                      <div className="text-[10px] text-slate-400">{`{% unsubscribe %}`}, tokens</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-indigo-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadEsp('hubspot')}
                  className="text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-600/60 hover:bg-slate-900 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">💼</span>
                    <div>
                      <div className="font-bold text-white text-xs">HubSpot (.html)</div>
                      <div className="text-[10px] text-slate-400">{`{{ unsubscribe_link }}`}, tokens</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-orange-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadEsp('sendgrid')}
                  className="text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-600/60 hover:bg-slate-900 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">🚀</span>
                    <div>
                      <div className="font-bold text-white text-xs">SendGrid (.html)</div>
                      <div className="text-[10px] text-slate-400">{`{{Unsubscribe}}`}, substitution tags</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-blue-400" />
                </button>
              </div>

              <div className="h-px bg-slate-800 my-2" />

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => triggerFileDownload(`${getCleanSlug()}.html`, htmlCode)}
                  className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center justify-center space-x-2 text-slate-300 hover:text-white"
                >
                  <Code className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download Clean HTML</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerFileDownload(`${getCleanSlug()}.txt`, plainText, 'text/plain;charset=utf-8')}
                  className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center justify-center space-x-2 text-slate-300 hover:text-white"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download Plain Text</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between shrink-0 text-[11px] text-slate-500">
          <div>Archived format: RFC 2557 MHTML &amp; PDF/A Document Brief</div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
