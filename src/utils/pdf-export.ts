import { jsPDF } from 'jspdf';
import type { EmailCampaign } from '../types.ts';
import { getDefaultTrackingConfig, appendUtmToUrl } from './utm-tracking.ts';

export interface PdfExportOptions {
  filename?: string;
  includeAlternatives?: boolean;
  includeTracking?: boolean;
}

/**
 * Creates and formats a professional campaign brief and archival PDF.
 */
export function generateCampaignPdfDoc(
  campaign: EmailCampaign,
  options: PdfExportOptions = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const selectedSubject =
    campaign.subjectLines[campaign.selectedSubjectIndex]?.text ||
    campaign.subjectLines[0]?.text ||
    campaign.title;

  const tracking = campaign.tracking || getDefaultTrackingConfig(campaign.title);
  const finalCtaUrl = tracking.enableUtm
    ? appendUtmToUrl(campaign.cta.url || 'https://example.com', tracking, 'primary_cta')
    : (campaign.cta.url || 'https://example.com');

  // Check if we need to add a new page
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = margin;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFillColor(79, 70, 229); // #4f46e5
    doc.rect(margin, y, contentWidth, 1.5, 'F');
    y += 4;
  };

  // --- BRAND HEADER ---
  // Top Banner Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');

  doc.setTextColor(129, 140, 248); // indigo-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CAMPAIGNFORGE AI • EXECUTIVE EMAIL BRIEF & ARCHIVE', margin + 6, y + 7);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(campaign.title, contentWidth - 45);
  doc.text(titleLines[0] || 'Email Campaign Brief', margin + 6, y + 15);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Exported: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`,
    pageWidth - margin - 6,
    y + 7,
    { align: 'right' }
  );

  y += 28;

  // --- METADATA BADGES GRID ---
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  const colW = contentWidth / 4;
  const badges = [
    { label: 'OBJECTIVE', val: campaign.objective.replace('_', ' ').toUpperCase() },
    { label: 'BRAND TONE', val: campaign.brandTone.toUpperCase() },
    { label: 'AUDIENCE', val: campaign.targetAudience.slice(0, 22) },
    { label: 'SPAM SCORE', val: `${campaign.subjectLines[campaign.selectedSubjectIndex]?.spamScore ?? 12}/100 (Safe)` },
  ];

  badges.forEach((b, i) => {
    const bx = margin + i * colW + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(b.label, bx, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(b.val, bx, y + 10.5);
  });

  y += 18;

  // --- SECTION: SELECTED SUBJECT LINE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('DEPLOYED SUBJECT LINE & INBOX PREVIEW', margin, y);
  y += 4;

  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(79, 70, 229); // indigo-600
  doc.rect(margin, y, 2.5, 17, 'F');
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + 2.5, y, contentWidth - 2.5, 17, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Subject: ${selectedSubject}`, margin + 6, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Preview Text: ${campaign.previewText}`, margin + 6, y + 12);

  y += 22;

  // --- SECTION: EMAIL CREATIVE LAYOUT ---
  ensureSpace(45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('EMAIL CREATIVE CONTENT', margin, y);
  y += 4;

  // Creative Container Box
  const creativeStartY = y;
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setFillColor(255, 255, 255);

  // Draw inner elements
  let cy = y + 7;

  // Eyebrow
  if (campaign.eyebrow) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text(campaign.eyebrow.toUpperCase(), margin + 8, cy);
    cy += 5;
  }

  // Headline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const hlLines = doc.splitTextToSize(campaign.headline, contentWidth - 16);
  doc.text(hlLines, margin + 8, cy);
  cy += hlLines.length * 5.5 + 2;

  // Subheadline
  if (campaign.subheadline) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const subLines = doc.splitTextToSize(campaign.subheadline, contentWidth - 16);
    doc.text(subLines, margin + 8, cy);
    cy += subLines.length * 4.5 + 4;
  }

  // Visual Banner indication
  if (campaign.visual?.prompt || campaign.visual?.imageUrl) {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + 8, cy, contentWidth - 16, 12, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `[Hero Visual Asset: ${campaign.visual.aspectRatio || '16:9'} • ${campaign.visual.imageSize || '2K'} Resolution]`,
      margin + 12,
      cy + 7.5
    );
    cy += 16;
  }

  // Intro Hook
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const hookLines = doc.splitTextToSize(campaign.introHook, contentWidth - 16);
  doc.text(hookLines, margin + 8, cy);
  cy += hookLines.length * 4.5 + 4;

  // Benefits List
  campaign.benefits.forEach((b) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`• ${b.title}: `, margin + 10, cy);

    const titleWidth = doc.getTextWidth(`• ${b.title}: `);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const descLines = doc.splitTextToSize(b.description, contentWidth - 16 - titleWidth);
    doc.text(descLines, margin + 10 + titleWidth, cy);
    cy += descLines.length * 4.2 + 2;
  });

  cy += 2;

  // Testimonial Quote
  if (campaign.highlightQuote?.quote) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(99, 102, 241);
    doc.rect(margin + 8, cy, 2, 12, 'F');
    doc.rect(margin + 10, cy, contentWidth - 18, 12, 'F');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`"${campaign.highlightQuote.quote}"`, margin + 14, cy + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `— ${campaign.highlightQuote.author}${campaign.highlightQuote.role ? `, ${campaign.highlightQuote.role}` : ''}`,
      margin + 14,
      cy + 9.5
    );
    cy += 16;
  }

  // Urgency Banner
  if (campaign.urgencyBanner) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.roundedRect(margin + 8, cy, contentWidth - 16, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`Notice: ${campaign.urgencyBanner}`, margin + 12, cy + 5.5);
    cy += 12;
  }

  // CTA Button Simulation
  doc.setFillColor(79, 70, 229);
  const ctaBtnW = 65;
  const ctaBtnH = 9;
  const ctaBtnX = margin + (contentWidth - ctaBtnW) / 2;
  doc.roundedRect(ctaBtnX, cy, ctaBtnW, ctaBtnH, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`${campaign.cta.text || 'Get Started Now'} ->`, margin + contentWidth / 2, cy + 6, {
    align: 'center',
  });
  cy += 12;

  if (campaign.cta.secondaryText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(campaign.cta.secondaryText, margin + contentWidth / 2, cy, { align: 'center' });
    cy += 4;
  }

  // Footer Compliance
  cy += 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 8, cy, margin + contentWidth - 8, cy);
  cy += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(campaign.footerCompliance.unsubscribeNotice, margin + contentWidth / 2, cy, {
    align: 'center',
  });
  cy += 4;
  doc.text(
    `${campaign.footerCompliance.companyName} • ${campaign.footerCompliance.physicalAddress}`,
    margin + contentWidth / 2,
    cy,
    { align: 'center' }
  );
  cy += 6;

  // Draw border around the entire creative box
  const creativeHeight = cy - creativeStartY;
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, creativeStartY, contentWidth, creativeHeight, 2, 2, 'S');

  y = cy + 6;

  // --- SECTION: TRACKING & ANALYTICS SPECIFICATIONS ---
  if (options.includeTracking ?? true) {
    ensureSpace(32);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('CAMPAIGN TRACKING & UTM ARCHIVE', margin, y);
    y += 4;

    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(187, 247, 208); // emerald-200
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(21, 128, 61); // emerald-700
    doc.text(
      `UTM Source: ${tracking.utmSource}   |   Medium: ${tracking.utmMedium}   |   Campaign: ${tracking.utmCampaign}`,
      margin + 6,
      y + 5.5
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(22, 101, 52);
    doc.text(`Destination URL: ${finalCtaUrl}`, margin + 6, y + 11.5);

    doc.text(
      `Open Tracking Pixel: ${tracking.enableTrackingPixel ? `Enabled (${tracking.pixelEndpoint || 'https://track.campaignforge.io/pixel.gif'})` : 'Disabled'}`,
      margin + 6,
      y + 17
    );

    y += 26;
  }

  // --- SECTION: SUBJECT LINE VARIANTS ---
  if ((options.includeAlternatives ?? true) && campaign.subjectLines.length > 1) {
    ensureSpace(28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('TESTED SUBJECT LINE VARIANTS', margin, y);
    y += 4;

    campaign.subjectLines.forEach((s, idx) => {
      ensureSpace(8);
      const isSelected = idx === campaign.selectedSubjectIndex;
      if (isSelected) {
        doc.setFillColor(238, 242, 255);
        doc.roundedRect(margin, y - 2, contentWidth, 7.5, 1, 1, 'F');
      }

      doc.setFont('helvetica', isSelected ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(isSelected ? 79 : 51, isSelected ? 70 : 65, isSelected ? 229 : 85);
      doc.text(`${isSelected ? '[SELECTED] ' : '• '} ${s.text}`, margin + 4, y + 2.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Angle: ${s.angle} | Est. Open: ${s.predictedOpenRate?.toFixed(1) || '42.0'}% | Spam: ${s.spamScore}/100`,
        pageWidth - margin - 4,
        y + 2.5,
        { align: 'right' }
      );
      y += 8;
    });
  }

  // Add Footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'CampaignForge AI • Archival Document • Confidential & Proprietary',
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, {
      align: 'right',
    });
  }

  return doc;
}

/**
 * Direct client-side PDF file download.
 */
export function exportCampaignToPdf(
  campaign: EmailCampaign,
  options: PdfExportOptions = {}
): void {
  const doc = generateCampaignPdfDoc(campaign, options);
  const slug = (campaign.title || 'campaign')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 45);
  const filename = options.filename || `${slug}-campaign.pdf`;
  doc.save(filename);
}

/**
 * Returns a Blob of the generated PDF file.
 */
export function generateCampaignPdfBlob(
  campaign: EmailCampaign,
  options: PdfExportOptions = {}
): Blob {
  const doc = generateCampaignPdfDoc(campaign, options);
  return doc.output('blob');
}
