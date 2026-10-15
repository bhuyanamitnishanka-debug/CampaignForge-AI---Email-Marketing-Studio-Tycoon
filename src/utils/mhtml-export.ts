import type { EmailCampaign } from '../types.ts';
import {
  appendUtmToUrl,
  generateTrackingPixelHtml,
  getDefaultTrackingConfig,
} from './utm-tracking.ts';
import { generateMailchimpHtml } from './esp-export.ts';

export interface MhtmlOptions {
  includeAlternativeSubjects?: boolean;
  includeTrackingAppendix?: boolean;
  fileExtension?: 'mhtml' | 'mht';
}

export interface MhtmlStats {
  boundary: string;
  partsCount: number;
  byteSize: number;
  formattedSize: string;
  subject: string;
  dateString: string;
  encoding: 'quoted-printable';
}

/**
 * Encodes a UTF-8 string into RFC 2045 compliant quoted-printable text.
 * Max line length: 76 chars, lines wrapped with soft line break "=\r\n".
 */
export function encodeQuotedPrintable(input: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  let result = '';
  let lineLength = 0;

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];

    // Preserve standard printable ASCII characters except '=' (ASCII 61) and control chars
    // Space (32) and Tab (9) are allowed, but trailing whitespace requires encoding
    let encodedChar: string;

    if (byte === 13 && bytes[i + 1] === 10) {
      // CRLF line break in source
      result += '\r\n';
      lineLength = 0;
      i++; // skip LF
      continue;
    } else if (byte === 10) {
      // Lone LF
      result += '\r\n';
      lineLength = 0;
      continue;
    } else if (
      (byte >= 33 && byte <= 60) ||
      (byte >= 62 && byte <= 126) ||
      byte === 32 ||
      byte === 9
    ) {
      encodedChar = String.fromCharCode(byte);
    } else {
      // Needs hex representation =XX
      encodedChar = '=' + byte.toString(16).toUpperCase().padStart(2, '0');
    }

    // Check if appending would exceed 75 characters (saving room for '=' soft break)
    if (lineLength + encodedChar.length > 74) {
      result += '=\r\n';
      lineLength = 0;
    }

    result += encodedChar;
    lineLength += encodedChar.length;
  }

  return result;
}

/**
 * Formats byte size into human readable string.
 */
export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Builds standard compliant RFC 2557 MHTML archive text for an email campaign.
 */
export function generateMhtmlArchive(
  campaign: EmailCampaign,
  options: MhtmlOptions = {}
): string {
  const boundary = `----=_NextPart_CampaignForge_${Date.now().toString(16).toUpperCase()}_${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
  const now = new Date();
  const rfcDate = now.toUTCString();

  const selectedSubject =
    campaign.subjectLines[campaign.selectedSubjectIndex]?.text ||
    campaign.subjectLines[0]?.text ||
    campaign.title;

  const tracking = campaign.tracking || getDefaultTrackingConfig(campaign.title);
  const finalCtaUrl = tracking.enableUtm
    ? appendUtmToUrl(campaign.cta.url || 'https://example.com', tracking, 'primary_cta')
    : (campaign.cta.url || 'https://example.com');
  const trackingPixelHtml = tracking.enableTrackingPixel
    ? generateTrackingPixelHtml(tracking, campaign.id)
    : '';

  // Generate enriched email HTML body with archival banner & meta
  const emailHtml = generateArchivalHtml(campaign, {
    selectedSubject,
    finalCtaUrl,
    trackingPixelHtml,
    includeAlternativeSubjects: options.includeAlternativeSubjects ?? true,
    includeTrackingAppendix: options.includeTrackingAppendix ?? true,
    exportTimestamp: rfcDate,
  });

  const qpEncodedHtml = encodeQuotedPrintable(emailHtml);

  // RFC 2557 / MIME multipart/related header block
  const mhtml = [
    `From: <CampaignForge AI <campaign-archive@campaignforge.io>>`,
    `To: <archival@campaignforge.io>`,
    `Subject: ${selectedSubject.replace(/[\r\n]+/g, ' ')}`,
    `Date: ${rfcDate}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/related; boundary="${boundary}"; type="text/html"`,
    `Content-Location: http://localhost/campaign-archive.html`,
    `X-Mailer: CampaignForge AI Email Engine (RFC 2557 MHTML Standard)`,
    `X-Campaign-ID: ${campaign.id}`,
    `X-Campaign-Title: ${campaign.title.replace(/[\r\n]+/g, ' ')}`,
    `X-Unsent: 1`,
    ``,
    `This is a multi-part message in MIME format (RFC 2557 MHTML Web Archive).`,
    `Open this file in Google Chrome, Microsoft Edge, Mozilla Thunderbird, or Microsoft Outlook`,
    `to view the archived email campaign offline with complete styling and formatting.`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="utf-8"`,
    `Content-Transfer-Encoding: quoted-printable`,
    `Content-Location: http://localhost/campaign-archive.html`,
    ``,
    qpEncodedHtml,
    ``,
    `--${boundary}--`,
    ``,
  ].join('\r\n');

  return mhtml;
}

/**
 * Returns statistics and metadata about the generated MHTML archive.
 */
export function getMhtmlStats(
  campaign: EmailCampaign,
  options: MhtmlOptions = {}
): MhtmlStats {
  const content = generateMhtmlArchive(campaign, options);
  const selectedSubject =
    campaign.subjectLines[campaign.selectedSubjectIndex]?.text ||
    campaign.subjectLines[0]?.text ||
    campaign.title;

  const boundaryMatch = content.match(/boundary="([^"]+)"/);
  const boundary = boundaryMatch ? boundaryMatch[1] : 'unknown';
  const byteSize = new TextEncoder().encode(content).length;

  return {
    boundary,
    partsCount: 1, // Single HTML part archive
    byteSize,
    formattedSize: formatByteSize(byteSize),
    subject: selectedSubject,
    dateString: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    encoding: 'quoted-printable',
  };
}

/**
 * Builds complete archival-grade HTML for the email campaign.
 */
function generateArchivalHtml(
  campaign: EmailCampaign,
  ctx: {
    selectedSubject: string;
    finalCtaUrl: string;
    trackingPixelHtml: string;
    includeAlternativeSubjects: boolean;
    includeTrackingAppendix: boolean;
    exportTimestamp: string;
  }
): string {
  const escape = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const tracking = campaign.tracking || getDefaultTrackingConfig(campaign.title);

  const alternativeSubjectsHtml =
    ctx.includeAlternativeSubjects && campaign.subjectLines.length > 1
      ? `
    <div style="margin-top: 24px; padding: 16px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 8px;">
        Alternative Subject Line Variants Tested:
      </div>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        ${campaign.subjectLines
          .map(
            (s, idx) => `
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: ${idx === campaign.selectedSubjectIndex ? '#4f46e5; font-weight: 700;' : '#334155;'}">
              ${idx === campaign.selectedSubjectIndex ? '★ ' : '• '} ${escape(s.text)}
            </td>
            <td align="right" style="padding: 6px 0; font-size: 11px; color: #64748b; font-family: monospace;">
              Open: ${s.predictedOpenRate?.toFixed(1) || '42.0'}% &bull; Spam: ${s.spamScore || 0}/100
            </td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>`
      : '';

  const trackingAppendixHtml = ctx.includeTrackingAppendix
    ? `
    <div style="margin-top: 16px; padding: 14px 18px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #166534;">
      <div style="font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.8px; margin-bottom: 6px; color: #15803d;">
        Archival UTM &amp; Tracking Specifications:
      </div>
      <div><strong>UTM Campaign:</strong> ${escape(tracking.utmCampaign)} &bull; <strong>Source:</strong> ${escape(tracking.utmSource)} &bull; <strong>Medium:</strong> ${escape(tracking.utmMedium)}</div>
      <div style="margin-top: 4px; word-break: break-all; font-family: monospace; font-size: 11px; color: #14532d;">
        <strong>Target CTA Link:</strong> ${escape(ctx.finalCtaUrl)}
      </div>
      <div style="margin-top: 4px; font-size: 11px; color: #15803d;">
        <strong>Open Tracking:</strong> ${tracking.enableTrackingPixel ? `Enabled (Endpoint: ${escape(tracking.pixelEndpoint || 'https://track.campaignforge.io/pixel.gif')})` : 'Disabled'}
      </div>
    </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escape(ctx.selectedSubject)} - MHTML Archive</title>
  <!-- MHTML Archival Snapshot Meta -->
  <meta name="archive-source" content="CampaignForge AI">
  <meta name="archive-date" content="${escape(ctx.exportTimestamp)}">
  <meta name="campaign-title" content="${escape(campaign.title)}">
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .hero-title { font-size: 26px !important; line-height: 32px !important; }
      .cta-button { width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">

  <!-- Inbox Preheader Preview -->
  <span style="display:none; font-size:0px; line-height:0px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; visibility:hidden; mso-hide:all;">
    ${escape(campaign.previewText)}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </span>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        
        <!-- Archival Header Ribbon -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; margin-bottom: 12px;">
          <tr>
            <td style="background-color: #0f172a; color: #e2e8f0; padding: 12px 18px; border-radius: 12px; font-size: 11px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.8px;">Archive Record</span>
                    &bull; <span style="color: #cbd5e1;">MHTML Web Document (RFC 2557)</span>
                  </td>
                  <td align="right" style="color: #94a3b8; font-family: monospace;">
                    ${escape(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }))}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 4px; color: #94a3b8; font-size: 10px;">
                    Subject: <strong style="color: #ffffff;">${escape(ctx.selectedSubject)}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Main Email Container -->
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #cbd5e1;">
          
          <!-- Gradient Brand Accent -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); height: 6px; font-size: 1px; line-height: 1px;">&nbsp;</td>
          </tr>

          <!-- Content Padding -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 44px 32px 44px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                
                ${
                  campaign.eyebrow
                    ? `
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #4f46e5;">
                      ${escape(campaign.eyebrow)}
                    </span>
                  </td>
                </tr>`
                    : ''
                }

                <tr>
                  <td style="padding-bottom: 14px;">
                    <h1 class="hero-title" style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 30px; line-height: 38px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                      ${escape(campaign.headline)}
                    </h1>
                  </td>
                </tr>

                ${
                  campaign.subheadline
                    ? `
                <tr>
                  <td style="padding-bottom: 24px;">
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; line-height: 26px; color: #475569;">
                      ${escape(campaign.subheadline)}
                    </p>
                  </td>
                </tr>`
                    : ''
                }

                ${
                  campaign.visual?.imageUrl
                    ? `
                <tr>
                  <td align="center" style="padding: 0 0 28px 0;">
                    <img src="${campaign.visual.imageUrl}" alt="${escape(campaign.visual.altText || campaign.headline)}" width="560" style="width: 100%; max-width: 560px; height: auto; display: block; border-radius: 12px; border: 0;" />
                  </td>
                </tr>`
                    : ''
                }

                <tr>
                  <td style="padding-bottom: 24px;">
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 26px; color: #334155;">
                      ${escape(campaign.introHook)}
                    </p>
                  </td>
                </tr>

                <!-- Benefits -->
                ${campaign.benefits
                  .map(
                    (b) => `
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="28" valign="top" style="padding-right: 12px; font-size: 18px; line-height: 24px;">
                          ${escape(b.icon || '✦')}
                        </td>
                        <td valign="top" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 22px; color: #334155;">
                          <strong style="color: #0f172a;">${escape(b.title)}:</strong> ${escape(b.description)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`
                  )
                  .join('')}

                ${
                  campaign.highlightQuote?.quote
                    ? `
                <tr>
                  <td style="padding: 24px 0 16px 0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-left: 4px solid #6366f1; border-radius: 4px 8px 8px 4px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0 0 8px 0; font-family: Georgia, serif; font-style: italic; font-size: 16px; line-height: 24px; color: #1e293b;">
                            "${escape(campaign.highlightQuote.quote)}"
                          </p>
                          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #64748b; font-weight: 600;">
                            — ${escape(campaign.highlightQuote.author)}${campaign.highlightQuote.role ? `, ${escape(campaign.highlightQuote.role)}` : ''}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`
                    : ''
                }

                ${
                  campaign.urgencyBanner
                    ? `
                <tr>
                  <td style="padding: 16px 0 24px 0;">
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: #b45309;">
                      ⏳ ${escape(campaign.urgencyBanner)}
                    </div>
                  </td>
                </tr>`
                    : ''
                }

                <!-- Primary CTA Button -->
                <tr>
                  <td align="center" style="padding: 28px 0 16px 0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius: 10px; background-color: #4f46e5;">
                          <a href="${escape(ctx.finalCtaUrl)}" target="_blank" class="cta-button" style="display: inline-block; padding: 16px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; background-color: #4f46e5;">
                            ${escape(campaign.cta.text || 'Get Started Now')} &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    ${
                      campaign.cta.secondaryText
                        ? `
                    <p style="margin: 10px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #94a3b8;">
                      ${escape(campaign.cta.secondaryText)}
                    </p>`
                        : ''
                    }
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer Compliance -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 44px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 18px; color: #64748b;">
                ${escape(campaign.footerCompliance.unsubscribeNotice)}
              </p>
              <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 18px; color: #94a3b8;">
                ${escape(campaign.footerCompliance.companyName)} &bull; ${escape(campaign.footerCompliance.physicalAddress)}
              </p>
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #cbd5e1;">
                CAN-SPAM &amp; GDPR Compliant Archival Snapshot &bull; Generated by CampaignForge AI
              </p>
            </td>
          </tr>

        </table>

        <!-- Appendices (Alternative Subjects & Tracking) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; margin-top: 14px;">
          <tr>
            <td>
              ${alternativeSubjectsHtml}
              ${trackingAppendixHtml}
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
  ${ctx.trackingPixelHtml}
</body>
</html>`;
}
