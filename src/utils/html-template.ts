import type { EmailCampaign } from '../types.ts';
import {
  appendUtmToUrl,
  generateTrackingPixelHtml,
  getDefaultTrackingConfig,
} from './utm-tracking.ts';

/**
 * Generates production-ready, responsive, client-compatible HTML email code.
 */
export function generateEmailHtml(campaign: EmailCampaign): string {
  const selectedSubject = campaign.subjectLines[campaign.selectedSubjectIndex]?.text || campaign.subjectLines[0]?.text || campaign.title;
  const tracking = campaign.tracking || getDefaultTrackingConfig(campaign.title);
  const finalCtaUrl = tracking.enableUtm
    ? appendUtmToUrl(campaign.cta.url || 'https://example.com', tracking, 'primary_cta')
    : (campaign.cta.url || 'https://example.com');
  const trackingPixelHtml = tracking.enableTrackingPixel
    ? generateTrackingPixelHtml(tracking, campaign.id)
    : '';
  const visualHtml = campaign.visual.imageUrl
    ? `
    <!-- Hero Visual -->
    <tr>
      <td align="center" style="padding: 0 0 28px 0;">
        <img src="${campaign.visual.imageUrl}" alt="${escapeHtml(campaign.visual.altText || campaign.headline)}" width="560" style="width: 100%; max-width: 560px; height: auto; display: block; border-radius: 12px; border: 0;" />
      </td>
    </tr>`
    : '';

  const benefitsHtml = campaign.benefits.map((b) => `
    <tr>
      <td style="padding: 8px 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="28" valign="top" style="padding-right: 12px; font-size: 18px; line-height: 24px;">
              ${escapeHtml(b.icon || '✦')}
            </td>
            <td valign="top" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 22px; color: #334155;">
              <strong style="color: #0f172a;">${escapeHtml(b.title)}:</strong> ${escapeHtml(b.description)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const quoteHtml = campaign.highlightQuote?.quote
    ? `
    <!-- Testimonial Quote -->
    <tr>
      <td style="padding: 24px 0 16px 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-left: 4px solid #6366f1; border-radius: 4px 8px 8px 4px;">
          <tr>
            <td style="padding: 16px 20px;">
              <p style="margin: 0 0 8px 0; font-family: Georgia, serif; font-style: italic; font-size: 16px; line-height: 24px; color: #1e293b;">
                "${escapeHtml(campaign.highlightQuote.quote)}"
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #64748b; font-weight: 600;">
                — ${escapeHtml(campaign.highlightQuote.author)}${campaign.highlightQuote.role ? `, ${escapeHtml(campaign.highlightQuote.role)}` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : '';

  const urgencyHtml = campaign.urgencyBanner
    ? `
    <!-- Urgency Notice -->
    <tr>
      <td style="padding: 16px 0 24px 0;">
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: #b45309;">
          ⏳ ${escapeHtml(campaign.urgencyBanner)}
        </div>
      </td>
    </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(selectedSubject)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset & Client-Specific Styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .hero-title { font-size: 26px !important; line-height: 32px !important; }
      .cta-button { width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <!-- Preheader preview text (hidden from view, shows in inbox snippet) -->
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${escapeHtml(campaign.previewText)}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <!-- Email Card Container (600px standard) -->
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);">
          
          <!-- Top Accent Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); height: 6px; font-size: 1px; line-height: 1px;">&nbsp;</td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 44px 32px 44px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                
                ${campaign.eyebrow ? `
                <!-- Eyebrow Tag -->
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #6366f1;">
                      ${escapeHtml(campaign.eyebrow)}
                    </span>
                  </td>
                </tr>` : ''}

                <!-- Headline -->
                <tr>
                  <td style="padding-bottom: 14px;">
                    <h1 class="hero-title" style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 30px; line-height: 38px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                      ${escapeHtml(campaign.headline)}
                    </h1>
                  </td>
                </tr>

                ${campaign.subheadline ? `
                <!-- Subheadline -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; line-height: 26px; color: #475569;">
                      ${escapeHtml(campaign.subheadline)}
                    </p>
                  </td>
                </tr>` : ''}

                ${visualHtml}

                <!-- Intro Hook Paragraph -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 26px; color: #334155;">
                      ${escapeHtml(campaign.introHook)}
                    </p>
                  </td>
                </tr>

                <!-- Key Benefits List -->
                ${benefitsHtml}

                ${quoteHtml}

                ${urgencyHtml}

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding: 28px 0 16px 0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius: 10px; background-color: #4f46e5;">
                          <a href="${escapeHtml(finalCtaUrl)}" target="_blank" class="cta-button" style="display: inline-block; padding: 16px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; background-color: #4f46e5; letter-spacing: 0.2px;">
                            ${escapeHtml(campaign.cta.text || 'Get Started Now')} &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    ${campaign.cta.secondaryText ? `
                    <p style="margin: 10px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #94a3b8;">
                      ${escapeHtml(campaign.cta.secondaryText)}
                    </p>` : ''}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer Area (CAN-SPAM / GDPR Compliant) -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 44px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 18px; color: #64748b;">
                ${escapeHtml(campaign.footerCompliance.unsubscribeNotice || 'You are receiving this email because you signed up on our platform.')}
              </p>
              <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 18px; color: #94a3b8;">
                ${escapeHtml(campaign.footerCompliance.companyName)} &bull; ${escapeHtml(campaign.footerCompliance.physicalAddress)}
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 18px;">
                <a href="#unsubscribe" style="color: #6366f1; text-decoration: underline;">Unsubscribe</a>
                &nbsp;&bull;&nbsp;
                <a href="#preferences" style="color: #6366f1; text-decoration: underline;">Manage Preferences</a>
                &nbsp;&bull;&nbsp;
                <a href="#privacy" style="color: #6366f1; text-decoration: underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
  ${trackingPixelHtml}
</body>
</html>`;
}

/**
 * Generates clean plain text version for multipart email support.
 */
export function generatePlainText(campaign: EmailCampaign): string {
  const selectedSubject = campaign.subjectLines[campaign.selectedSubjectIndex]?.text || campaign.subjectLines[0]?.text || campaign.title;
  const tracking = campaign.tracking || getDefaultTrackingConfig(campaign.title);
  const finalCtaUrl = tracking.enableUtm
    ? appendUtmToUrl(campaign.cta.url || 'https://example.com', tracking, 'primary_cta')
    : (campaign.cta.url || 'https://example.com');
  const benefitsText = campaign.benefits.map(b => `• ${b.title}: ${b.description}`).join('\n');
  const quoteText = campaign.highlightQuote?.quote ? `\n"${campaign.highlightQuote.quote}" - ${campaign.highlightQuote.author}\n` : '';
  const urgencyText = campaign.urgencyBanner ? `\n[NOTE: ${campaign.urgencyBanner}]\n` : '';

  return `SUBJECT: ${selectedSubject}
PREVIEW: ${campaign.previewText}

${campaign.eyebrow ? `[ ${campaign.eyebrow} ]\n` : ''}${campaign.headline}
${campaign.subheadline ? `${campaign.subheadline}\n` : ''}
${campaign.introHook}

${benefitsText}
${quoteText}${urgencyText}
${campaign.cta.text} -> ${finalCtaUrl}
${campaign.cta.secondaryText ? `(${campaign.cta.secondaryText})\n` : ''}

--------------------------------------------------
${campaign.footerCompliance.unsubscribeNotice}
${campaign.footerCompliance.companyName} | ${campaign.footerCompliance.physicalAddress}
To unsubscribe, visit: https://example.com/unsubscribe
`;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
