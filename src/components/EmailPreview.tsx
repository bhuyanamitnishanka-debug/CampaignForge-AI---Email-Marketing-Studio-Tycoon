import React, { useState } from 'react';
import { EmailCampaign, CampaignVisual } from '../types';
import { generateEmailHtml, generatePlainText } from '../utils/html-template';
import {
  generateEspHtml,
  generatePrintablePdfHtml,
  triggerFileDownload,
  EspType,
} from '../utils/esp-export';
import {
  Monitor,
  Smartphone,
  Code,
  Eye,
  FileText,
  Copy,
  Check,
  Sparkles,
  Edit3,
  Image as ImageIcon,
  Download,
  Printer,
  Share2,
  Layers,
  ChevronDown,
  Radio,
  Link as LinkIcon,
  Sliders,
  Activity,
  Info,
  CheckCircle2,
  Flame,
  Archive,
} from 'lucide-react';
import { getDefaultTrackingConfig, appendUtmToUrl, generateTrackingPixelHtml } from '../utils/utm-tracking';
import { ClickMapOverlay } from './ClickMapOverlay';
import { ExportModal } from './ExportModal';
import { generateMhtmlArchive } from '../utils/mhtml-export';
import { exportCampaignToPdf } from '../utils/pdf-export';

interface EmailPreviewProps {
  campaign: EmailCampaign;
  onUpdateCampaign: (updated: EmailCampaign) => void;
  onOpenVisualModal: () => void;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  campaign,
  onUpdateCampaign,
  onOpenVisualModal,
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [tab, setTab] = useState<'visual' | 'html' | 'esp' | 'text'>('visual');
  const [selectedEsp, setSelectedEsp] = useState<EspType>('mailchimp');
  const [copied, setCopied] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isClickMapActive, setIsClickMapActive] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Active tracking state with fallback
  const tracking = campaign.tracking || getDefaultTrackingConfig(campaign.title);

  const selectedSubject =
    campaign.subjectLines[campaign.selectedSubjectIndex]?.text ||
    campaign.subjectLines[0]?.text ||
    campaign.title;

  const htmlCode = generateEmailHtml(campaign);
  const espHtmlCode = generateEspHtml(campaign, selectedEsp);
  const plainText = generatePlainText(campaign);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCleanSlug = () => {
    return (campaign.title || 'email-campaign')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Export handlers
  const handlePrintPdf = () => {
    const printHtml = generatePrintablePdfHtml(campaign);
    // Use an invisible iframe in DOM to trigger native print dialog without window.open
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print error fallback:', e);
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 300);
    }
    setIsExportDropdownOpen(false);
  };

  const handleDownloadDirectPdf = () => {
    exportCampaignToPdf(campaign, {
      filename: `${getCleanSlug()}.pdf`,
    });
    setIsExportDropdownOpen(false);
  };

  const handleDownloadDirectMhtml = (extension: 'mhtml' | 'mht' = 'mhtml') => {
    const mhtml = generateMhtmlArchive(campaign);
    triggerFileDownload(
      `${getCleanSlug()}.${extension}`,
      mhtml,
      'multipart/related;charset=utf-8'
    );
    setIsExportDropdownOpen(false);
  };

  const handleDownloadPdfBrief = () => {
    const printHtml = generatePrintablePdfHtml(campaign);
    triggerFileDownload(`${getCleanSlug()}-campaign-brief.html`, printHtml);
    setIsExportDropdownOpen(false);
  };

  const handleDownloadEsp = (esp: EspType) => {
    const content = generateEspHtml(campaign, esp);
    triggerFileDownload(`${getCleanSlug()}-${esp}-template.html`, content);
    setIsExportDropdownOpen(false);
  };

  const handleDownloadStandardHtml = () => {
    triggerFileDownload(`${getCleanSlug()}.html`, htmlCode);
    setIsExportDropdownOpen(false);
  };

  const handleDownloadPlainText = () => {
    triggerFileDownload(`${getCleanSlug()}.txt`, plainText, 'text/plain;charset=utf-8');
    setIsExportDropdownOpen(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col relative">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        
        {/* View Mode Tabs (Visual / Standard HTML / ESP / Text) */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('visual')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              tab === 'visual'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('html')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              tab === 'html'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Standard HTML</span>
          </button>

          {/* ESP Import Code Tab (Mailchimp, Klaviyo, HubSpot) */}
          <button
            type="button"
            onClick={() => setTab('esp')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              tab === 'esp'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>ESP Import Code</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('text')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              tab === 'text'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plain Text</span>
          </button>
        </div>

        {/* Viewport switch & Actions */}
        <div className="flex items-center space-x-2 flex-wrap">
          {tab === 'visual' && (
            <>
              {/* Viewport Toggle */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewport('desktop')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewport === 'desktop'
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Desktop View (600px)"
                  aria-label="Desktop view"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewport('mobile')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewport === 'mobile'
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Mobile View (375px)"
                  aria-label="Mobile view"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              {/* Inline Edit Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsEditingInline(!isEditingInline)}
                className={`flex items-center space-x-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  isEditingInline
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingInline ? 'Done' : 'Edit'}</span>
              </button>

              {/* Predictive Click-Map Overlay Toggle */}
              <button
                type="button"
                onClick={() => setIsClickMapActive(!isClickMapActive)}
                className={`flex items-center space-x-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                  isClickMapActive
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Toggle predictive click-map visualization overlay"
                aria-label="Toggle predictive click-map visualization"
              >
                <Flame className={`w-3.5 h-3.5 ${isClickMapActive ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                <span>Click Map</span>
                {isClickMapActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            </>
          )}

          {/* Tracking & UTM Configuration Button */}
          <button
            type="button"
            onClick={() => setIsTrackingModalOpen(true)}
            className={`flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              tracking.enableUtm || tracking.enableTrackingPixel
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Configure automated UTM parameters and open tracking pixel"
            aria-label="Configure UTM parameters and tracking pixel"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Tracking &amp; UTM</span>
            <span className="sm:hidden">UTM</span>
            {tracking.enableUtm && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={() =>
              handleCopy(
                tab === 'text'
                  ? plainText
                  : tab === 'esp'
                  ? espHtmlCode
                  : htmlCode
              )
            }
            className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            aria-label="Copy current format to clipboard"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* EXPORT / DOWNLOAD DROPDOWN (PDF & ESP EXPORTS) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-600/20"
              aria-label="Export or download campaign files"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                {/* Archival & Export Hub Modal Opener */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExportDropdownOpen(false);
                    setIsExportModalOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg bg-gradient-to-r from-indigo-950/80 to-purple-950/80 hover:from-indigo-900 hover:to-purple-900 text-indigo-200 hover:text-white flex items-center justify-between border border-indigo-700/50 transition-all mb-1.5"
                >
                  <div className="flex items-center space-x-2">
                    <Archive className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-bold text-white text-xs">Export &amp; Archival Hub</div>
                      <div className="text-[10px] text-indigo-300/80">Configure PDF, MHTML &amp; inspect MIME</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    HUB
                  </span>
                </button>

                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Document &amp; Web Archives
                </div>

                {/* Direct PDF Download */}
                <button
                  type="button"
                  onClick={handleDownloadDirectPdf}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-900 text-slate-200 hover:text-white flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span>Download PDF Document</span>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 px-1 rounded">1-Click</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Executive campaign brief &amp; specs</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-rose-950/60 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800/40">
                    .pdf
                  </span>
                </button>

                {/* Direct MHTML Web Archive Download */}
                <button
                  type="button"
                  onClick={() => handleDownloadDirectMhtml('mhtml')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-900 text-slate-200 hover:text-white flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Archive className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span>Download MHTML Archive</span>
                        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/50 px-1 rounded">RFC 2557</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Offline web archive for Chrome/Outlook</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-cyan-950/60 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/40">
                    .mhtml
                  </span>
                </button>

                {/* Print / Save as PDF */}
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Printer className="w-3.5 h-3.5 text-rose-400/80" />
                    <span className="text-xs">Print or Save as PDF (System)</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Dialog</span>
                </button>

                {/* Download PDF-Ready Brief HTML */}
                <button
                  type="button"
                  onClick={handleDownloadPdfBrief}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs">Download PDF Brief HTML</span>
                  </div>
                  <span className="text-[10px] text-slate-500">.html</span>
                </button>

                <div className="h-px bg-slate-800 my-1" />

                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Specialized ESP Import Files
                </div>

                {/* Mailchimp File */}
                <button
                  type="button"
                  onClick={() => handleDownloadEsp('mailchimp')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-900 text-slate-200 hover:text-white flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base leading-none">🐵</span>
                    <div>
                      <div className="font-semibold text-slate-100">Mailchimp Template</div>
                      <div className="text-[10px] text-slate-400">With mc:edit tags &amp; *|MERGE|*</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-950/60 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40">
                    .html
                  </span>
                </button>

                {/* Klaviyo File */}
                <button
                  type="button"
                  onClick={() => handleDownloadEsp('klaviyo')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-900 text-slate-200 hover:text-white flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base leading-none">⚡</span>
                    <div>
                      <div className="font-semibold text-slate-100">Klaviyo Template</div>
                      <div className="text-[10px] text-slate-400">With Klaviyo tokens &amp; variables</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/40">
                    .html
                  </span>
                </button>

                {/* HubSpot File */}
                <button
                  type="button"
                  onClick={() => handleDownloadEsp('hubspot')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-900 text-slate-200 hover:text-white flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base leading-none">💼</span>
                    <div>
                      <div className="font-semibold text-slate-100">HubSpot Template</div>
                      <div className="text-[10px] text-slate-400">With HubSpot contact tokens</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-orange-950/60 text-orange-300 px-1.5 py-0.5 rounded border border-orange-800/40">
                    .html
                  </span>
                </button>

                {/* SendGrid File */}
                <button
                  type="button"
                  onClick={() => handleDownloadEsp('sendgrid')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-900 text-slate-200 hover:text-white flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base leading-none">🚀</span>
                    <div>
                      <div className="font-semibold text-slate-100">SendGrid Template</div>
                      <div className="text-[10px] text-slate-400">With SendGrid substitution tags</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-950/60 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/40">
                    .html
                  </span>
                </button>

                <div className="h-px bg-slate-800 my-1" />

                {/* Standard HTML */}
                <button
                  type="button"
                  onClick={handleDownloadStandardHtml}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-slate-400" />
                    <span>Download Clean HTML</span>
                  </span>
                  <span className="text-[10px] text-slate-500">.html</span>
                </button>

                {/* Plain Text */}
                <button
                  type="button"
                  onClick={handleDownloadPlainText}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Download Plain Text</span>
                  </span>
                  <span className="text-[10px] text-slate-500">.txt</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      {tab === 'visual' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-x-auto min-h-[500px]">
          
          {/* Simulated Email Client Shell */}
          <div
            className={`w-full transition-all duration-300 mx-auto ${
              viewport === 'mobile' ? 'max-w-[380px]' : 'max-w-[620px]'
            }`}
          >
            {/* Email Client Header Bar (Inbox context) */}
            <div className="bg-slate-800/90 rounded-t-2xl p-3 border border-slate-700/80 text-xs text-slate-300 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200">
                  From: Campaign Team &lt;updates@brand.com&gt;
                </span>
                <span>Today, 9:42 AM</span>
              </div>
              <div className="text-slate-100 font-bold truncate">
                Subject: {selectedSubject}
              </div>
              <div className="text-slate-400 text-[11px] truncate">
                Preview: {campaign.previewText}
              </div>
              {/* Automated Tracking & UTM Status Pill */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-700/60">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${tracking.enableUtm ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900 text-slate-500'}`}>
                    <Radio className="w-2.5 h-2.5 text-emerald-400" />
                    <span>UTM: {tracking.enableUtm ? `${tracking.utmSource}/${tracking.utmMedium}` : 'Off'}</span>
                  </span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${tracking.enableTrackingPixel ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60' : 'bg-slate-900 text-slate-500'}`}>
                    <span>Pixel: {tracking.enableTrackingPixel ? '1x1 Embedded' : 'Off'}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTrackingModalOpen(true)}
                  className="text-indigo-400 hover:text-indigo-300 text-[10px] underline"
                >
                  Configure
                </button>
              </div>
            </div>

            {/* Email Body Canvas */}
            <div className="bg-white text-slate-900 rounded-b-2xl shadow-2xl border-x border-b border-slate-300 overflow-hidden relative">
              {/* Predictive Click-Map Heatmap Overlay */}
              <ClickMapOverlay
                campaign={campaign}
                viewport={viewport}
                isEnabled={isClickMapActive}
                onToggle={() => setIsClickMapActive(false)}
              />
              
              {/* Accent Bar */}
              <div className="h-1.5 bg-gradient-to-r from-indigo-600 to-violet-600" />

              <div className="p-6 sm:p-8 space-y-6">
                
                {/* Eyebrow */}
                {isEditingInline ? (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Eyebrow</span>
                    <input
                      type="text"
                      value={campaign.eyebrow}
                      onChange={(e) =>
                        onUpdateCampaign({ ...campaign, eyebrow: e.target.value })
                      }
                      className="w-full text-xs font-bold uppercase tracking-wider text-indigo-600 border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                ) : campaign.eyebrow ? (
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600">
                    {campaign.eyebrow}
                  </span>
                ) : null}

                {/* Headline */}
                {isEditingInline ? (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Headline</span>
                    <input
                      type="text"
                      value={campaign.headline}
                      onChange={(e) =>
                        onUpdateCampaign({ ...campaign, headline: e.target.value })
                      }
                      className="w-full text-xl sm:text-2xl font-extrabold text-slate-900 border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                ) : (
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {campaign.headline}
                  </h1>
                )}

                {/* Subheadline */}
                {isEditingInline ? (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Subheadline</span>
                    <input
                      type="text"
                      value={campaign.subheadline}
                      onChange={(e) =>
                        onUpdateCampaign({ ...campaign, subheadline: e.target.value })
                      }
                      className="w-full text-sm text-slate-600 border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                ) : campaign.subheadline ? (
                  <p className="text-base text-slate-600 leading-relaxed font-normal">
                    {campaign.subheadline}
                  </p>
                ) : null}

                {/* Visual Graphic Banner Area */}
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
                  {campaign.visual.imageUrl ? (
                    <div className="relative">
                      <img
                        src={campaign.visual.imageUrl}
                        alt={campaign.visual.altText || campaign.headline}
                        className="w-full object-cover max-h-[340px]"
                      />
                      <button
                        type="button"
                        onClick={onOpenVisualModal}
                        className="absolute bottom-3 right-3 bg-slate-950/80 hover:bg-slate-950 text-white text-xs font-semibold px-3 py-1.5 rounded-lg backdrop-blur-sm border border-slate-700 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        <span>Regenerate (gemini-3-pro-image-preview)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">No Visual Attached</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                          Render high-impact 1K, 2K, or 4K marketing imagery using gemini-3-pro-image-preview.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenVisualModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate 4K Visual With Gemini</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Intro Hook */}
                {isEditingInline ? (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Intro Hook</span>
                    <textarea
                      value={campaign.introHook}
                      onChange={(e) =>
                        onUpdateCampaign({ ...campaign, introHook: e.target.value })
                      }
                      rows={3}
                      className="w-full text-sm text-slate-700 border border-slate-300 rounded px-2 py-1 leading-relaxed"
                    />
                  </div>
                ) : (
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    {campaign.introHook}
                  </p>
                )}

                {/* Key Benefits List */}
                <div className="space-y-3 pt-2">
                  {campaign.benefits.map((b, idx) => (
                    <div key={b.id || idx} className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0 leading-6">{b.icon || '✦'}</span>
                      <div className="text-sm">
                        {isEditingInline ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={b.title}
                              onChange={(e) => {
                                const newBenefits = [...campaign.benefits];
                                newBenefits[idx].title = e.target.value;
                                onUpdateCampaign({ ...campaign, benefits: newBenefits });
                              }}
                              className="w-full font-bold text-slate-900 border border-slate-300 rounded px-2 py-0.5 text-xs"
                            />
                            <textarea
                              value={b.description}
                              onChange={(e) => {
                                const newBenefits = [...campaign.benefits];
                                newBenefits[idx].description = e.target.value;
                                onUpdateCampaign({ ...campaign, benefits: newBenefits });
                              }}
                              rows={2}
                              className="w-full text-slate-600 border border-slate-300 rounded px-2 py-0.5 text-xs"
                            />
                          </div>
                        ) : (
                          <>
                            <strong className="text-slate-900 font-bold">{b.title}:</strong>{' '}
                            <span className="text-slate-600">{b.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Testimonial Quote */}
                {campaign.highlightQuote?.quote && (
                  <div className="bg-slate-50 border-l-4 border-indigo-600 rounded-r-xl p-4 my-2">
                    <p className="font-serif italic text-slate-800 text-sm sm:text-base">
                      "{campaign.highlightQuote.quote}"
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-2">
                      — {campaign.highlightQuote.author}
                      {campaign.highlightQuote.role ? `, ${campaign.highlightQuote.role}` : ''}
                    </p>
                  </div>
                )}

                {/* Urgency Banner */}
                {campaign.urgencyBanner && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-semibold rounded-xl px-4 py-3 text-center">
                    ⏳ {campaign.urgencyBanner}
                  </div>
                )}

                {/* Call to Action Button */}
                <div className="text-center pt-2 pb-2">
                  <a
                    href={campaign.cta.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/30 transition-transform active:scale-[0.98]"
                  >
                    {campaign.cta.text} &rarr;
                  </a>
                  {campaign.cta.secondaryText && (
                    <p className="text-xs text-slate-400 mt-2">
                      {campaign.cta.secondaryText}
                    </p>
                  )}
                </div>

              </div>

              {/* Compliance Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-6 text-center space-y-1.5 text-xs text-slate-500">
                <p>{campaign.footerCompliance.unsubscribeNotice}</p>
                <p className="text-slate-400">
                  {campaign.footerCompliance.companyName} &bull;{' '}
                  {campaign.footerCompliance.physicalAddress}
                </p>
                <p className="text-indigo-600 space-x-2 pt-1 font-medium">
                  <span className="underline cursor-pointer">Unsubscribe</span>
                  <span>&bull;</span>
                  <span className="underline cursor-pointer">Manage Preferences</span>
                  <span>&bull;</span>
                  <span className="underline cursor-pointer">Privacy Policy</span>
                </p>
              </div>

            </div>
          </div>

        </div>
      ) : tab === 'esp' ? (
        <div className="flex-1 flex flex-col space-y-3">
          {/* ESP Provider Selector Submenu */}
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">Target ESP Platform:</span>
              <div className="flex items-center space-x-1">
                {(['mailchimp', 'klaviyo', 'hubspot', 'sendgrid'] as const).map((esp) => (
                  <button
                    key={esp}
                    type="button"
                    onClick={() => setSelectedEsp(esp)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                      selectedEsp === esp
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {esp === 'mailchimp'
                      ? '🐵 Mailchimp'
                      : esp === 'klaviyo'
                      ? '⚡ Klaviyo'
                      : esp === 'hubspot'
                      ? '💼 HubSpot'
                      : '🚀 SendGrid'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDownloadEsp(selectedEsp)}
              className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download .{selectedEsp}.html</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            {selectedEsp === 'mailchimp'
              ? 'Includes Mailchimp editable blocks (mc:edit="headline", mc:edit="intro", mc:edit="hero_image") and native merge tags (*|FNAME|*, *|UNSUB|*, *|MC_PREVIEW_TEXT|*).'
              : selectedEsp === 'klaviyo'
              ? 'Configured with Klaviyo template tokens ({{ first_name|default:"there" }}, {% unsubscribe %}, and {% manage_preferences %}).'
              : selectedEsp === 'hubspot'
              ? 'Configured with HubSpot contact properties ({{ contact.firstname }}, {{ unsubscribe_link }}).'
              : 'Configured with SendGrid substitution tags ({{first_name}}, {{Unsubscribe}}, and {{Sender_Name}}).'}
          </div>

          <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto max-h-[500px]">
            <pre className="text-xs font-mono text-amber-300/90 leading-relaxed whitespace-pre-wrap break-all">
              {espHtmlCode}
            </pre>
          </div>
        </div>
      ) : tab === 'html' ? (
        <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto max-h-[600px]">
          <pre className="text-xs font-mono text-indigo-300 leading-relaxed whitespace-pre-wrap break-all">
            {htmlCode}
          </pre>
        </div>
      ) : (
        <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto max-h-[600px]">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
            {plainText}
          </pre>
        </div>
      )}

      {/* TRACKING & UTM CONFIGURATION MODAL */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8 text-xs">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Automated Tracking &amp; UTM Analytics</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Automatically appends UTM query parameters to all links and embeds a 1x1 transparent open tracking pixel.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTrackingModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Close tracking configuration"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6">
              
              {/* SECTION 1: UTM PARAMETERS */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tracking.enableUtm}
                      onChange={(e) =>
                        onUpdateCampaign({
                          ...campaign,
                          tracking: { ...tracking, enableUtm: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                    />
                    <span className="font-bold text-slate-200 text-xs">
                      Auto-Append UTM Parameters To All Destination Links
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {tracking.enableUtm ? 'Active on all links' : 'Disabled'}
                  </span>
                </div>

                {tracking.enableUtm && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          utm_source (Traffic Source)
                        </label>
                        <input
                          type="text"
                          value={tracking.utmSource}
                          onChange={(e) =>
                            onUpdateCampaign({
                              ...campaign,
                              tracking: { ...tracking, utmSource: e.target.value },
                            })
                          }
                          placeholder="e.g. newsletter, product_hunt, partner"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          utm_medium (Marketing Medium)
                        </label>
                        <input
                          type="text"
                          value={tracking.utmMedium}
                          onChange={(e) =>
                            onUpdateCampaign({
                              ...campaign,
                              tracking: { ...tracking, utmMedium: e.target.value },
                            })
                          }
                          placeholder="e.g. email"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] uppercase font-bold text-slate-400">
                            utm_campaign (Campaign Name)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const slug = (campaign.title || 'campaign')
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '')
                                .slice(0, 50);
                              onUpdateCampaign({
                                ...campaign,
                                tracking: { ...tracking, utmCampaign: slug },
                              });
                            }}
                            className="text-[10px] text-indigo-400 hover:underline"
                          >
                            Sync Title
                          </button>
                        </div>
                        <input
                          type="text"
                          value={tracking.utmCampaign}
                          onChange={(e) =>
                            onUpdateCampaign({
                              ...campaign,
                              tracking: { ...tracking, utmCampaign: e.target.value },
                            })
                          }
                          placeholder="e.g. launch-cohort-1"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          utm_content (Link Identifier)
                        </label>
                        <input
                          type="text"
                          value={tracking.utmContent || 'primary_cta'}
                          onChange={(e) =>
                            onUpdateCampaign({
                              ...campaign,
                              tracking: { ...tracking, utmContent: e.target.value },
                            })
                          }
                          placeholder="e.g. primary_cta, banner_click"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Live URL comparison */}
                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] space-y-1">
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-indigo-400" />
                        Live Tracked URL Preview (CTA Button):
                      </span>
                      <p className="font-mono text-emerald-400 break-all select-all">
                        {appendUtmToUrl(
                          campaign.cta.url || 'https://example.com/signup',
                          tracking,
                          'primary_cta'
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: OPEN TRACKING PIXEL */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tracking.enableTrackingPixel}
                      onChange={(e) =>
                        onUpdateCampaign({
                          ...campaign,
                          tracking: {
                            ...tracking,
                            enableTrackingPixel: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                    />
                    <span className="font-bold text-slate-200 text-xs">
                      Embed 1x1 Transparent Open Rate Tracking Pixel
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {tracking.enableTrackingPixel ? 'Active in footer' : 'Disabled'}
                  </span>
                </div>

                {tracking.enableTrackingPixel && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Tracking Endpoint / Collector URL
                      </label>
                      <input
                        type="text"
                        value={
                          tracking.pixelEndpoint ||
                          'https://track.campaignforge.io/pixel.gif'
                        }
                        onChange={(e) =>
                          onUpdateCampaign({
                            ...campaign,
                            tracking: { ...tracking, pixelEndpoint: e.target.value },
                          })
                        }
                        placeholder="https://track.yourdomain.com/pixel.gif"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
                      <span className="text-slate-300 font-semibold block mb-0.5">
                        Generated 1x1 Pixel Tag:
                      </span>
                      {generateTrackingPixelHtml(tracking, campaign.id).trim()}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Applied automatically to all email links &amp; exported templates.
              </span>
              <button
                type="button"
                onClick={() => setIsTrackingModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EXPORT & ARCHIVAL HUB MODAL */}
      <ExportModal
        campaign={campaign}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onTriggerPrintPdf={handlePrintPdf}
        htmlCode={htmlCode}
        plainText={plainText}
      />

    </div>
  );
};
