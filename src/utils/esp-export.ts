import type { EmailCampaign } from '../types.ts';
import {
  appendUtmToUrl,
  generateTrackingPixelHtml,
  getDefaultTrackingConfig,
} from './utm-tracking.ts';

export type EspType = 'mailchimp' | 'klaviyo' | 'hubspot' | 'sendgrid' | 'generic';

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates Mailchimp-compatible HTML template with editable mc:edit tags and merge tags.
 */
export function generateMailchimpHtml(campaign: EmailCampaign): string {
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

  const visualHtml = campaign.visual.imageUrl
    ? `
    <!-- Hero Visual (Mailchimp Editable) -->
    <tr>
      <td align="center" style="padding: 0 0 28px 0;" mc:edit="hero_image">
        <img src="${campaign.visual.imageUrl}" alt="${escapeHtml(campaign.visual.altText || campaign.headline)}" width="560" style="width: 100%; max-width: 560px; height: auto; display: block; border-radius: 12px; border: 0;" />
      </td>
    </tr>`
    : '';

  const benefitsHtml = campaign.benefits
    .map(
      (b, idx) => `
    <tr>
      <td style="padding: 8px 0;" mc:edit="benefit_${idx + 1}">
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
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(selectedSubject)}</title>
  <style>
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
  <!-- Mailchimp Preheader with Fallback -->
  <span class="mcnPreviewText" style="display:none; font-size:0px; line-height:0px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; visibility:hidden; mso-hide:all;">
    *|MC_PREVIEW_TEXT|*
    ${escapeHtml(campaign.previewText)}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </span>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); height: 6px; font-size: 1px; line-height: 1px;">&nbsp;</td>
          </tr>

          <tr>
            <td class="mobile-padding" style="padding: 40px 44px 32px 44px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                
                ${
                  campaign.eyebrow
                    ? `
                <tr>
                  <td style="padding-bottom: 12px;" mc:edit="eyebrow">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #6366f1;">
                      ${escapeHtml(campaign.eyebrow)}
                    </span>
                  </td>
                </tr>`
                    : ''
                }

                <tr>
                  <td style="padding-bottom: 14px;" mc:edit="headline">
                    <h1 class="hero-title" style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 30px; line-height: 38px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                      ${escapeHtml(campaign.headline)}
                    </h1>
                  </td>
                </tr>

                ${
                  campaign.subheadline
                    ? `
                <tr>
                  <td style="padding-bottom: 24px;" mc:edit="subheadline">
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; line-height: 26px; color: #475569;">
                      ${escapeHtml(campaign.subheadline)}
                    </p>
                  </td>
                </tr>`
                    : ''
                }

                ${visualHtml}

                <tr>
                  <td style="padding-bottom: 24px;" mc:edit="intro">
                    <p style="margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 26px; color: #334155;">
                      Dear *|FNAME|*,
                    </p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 26px; color: #334155;">
                      ${escapeHtml(campaign.introHook)}
                    </p>
                  </td>
                </tr>

                ${benefitsHtml}

                ${
                  campaign.highlightQuote?.quote
                    ? `
                <tr>
                  <td style="padding: 24px 0 16px 0;" mc:edit="quote">
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
                    : ''
                }

                ${
                  campaign.urgencyBanner
                    ? `
                <tr>
                  <td style="padding: 16px 0 24px 0;" mc:edit="urgency">
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: #b45309;">
                      ⏳ ${escapeHtml(campaign.urgencyBanner)}
                    </div>
                  </td>
                </tr>`
                    : ''
                }

                <tr>
                  <td align="center" style="padding: 28px 0 16px 0;" mc:edit="cta">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius: 10px; background-color: #4f46e5;">
                          <a href="${escapeHtml(finalCtaUrl)}" target="_blank" class="cta-button" style="display: inline-block; padding: 16px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; background-color: #4f46e5;">
                            ${escapeHtml(campaign.cta.text || 'Get Started Now')} &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    ${
                      campaign.cta.secondaryText
                        ? `
                    <p style="margin: 10px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #94a3b8;">
                      ${escapeHtml(campaign.cta.secondaryText)}
                    </p>`
                        : ''
                    }
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Mailchimp Merge Tag Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 44px; text-align: center;" mc:edit="footer">
              <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 18px; color: #64748b;">
                ${escapeHtml(campaign.footerCompliance.unsubscribeNotice)}
              </p>
              <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 18px; color: #94a3b8;">
                *|LIST:COMPANY|* &bull; *|LIST:ADDRESS|*
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 18px;">
                <a href="*|UNSUB|*" style="color: #6366f1; text-decoration: underline;">Unsubscribe</a>
                &nbsp;&bull;&nbsp;
                <a href="*|UPDATE_PROFILE|*" style="color: #6366f1; text-decoration: underline;">Update Preferences</a>
                &nbsp;&bull;&nbsp;
                <a href="*|ARCHIVE|*" style="color: #6366f1; text-decoration: underline;">View In Browser</a>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #cbd5e1;">
                &copy; *|CURRENT_YEAR|* *|LIST:COMPANY|*. All rights reserved.
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
 * Generates Klaviyo-compatible HTML template with Klaviyo tags and variables.
 */
export function generateKlaviyoHtml(campaign: EmailCampaign): string {
  const mailchimpHtml = generateMailchimpHtml(campaign);
  return mailchimpHtml
    .replace(/\*\|FNAME\|\*/g, "{{ first_name|default:'there' }}")
    .replace(/\*\|UNSUB\|\*/g, '{% unsubscribe %}')
    .replace(/\*\|UPDATE_PROFILE\|\*/g, '{% manage_preferences %}')
    .replace(/\*\|ARCHIVE\|\*/g, '{% web_view %}')
    .replace(/\*\|LIST:COMPANY\|\*/g, '{{ organization.name }}')
    .replace(/\*\|LIST:ADDRESS\|\*/g, '{{ organization.address }}')
    .replace(/\*\|CURRENT_YEAR\|\*/g, '{% current_year %}')
    .replace(/\*\|MC_PREVIEW_TEXT\|\*/g, '');
}

/**
 * Generates HubSpot-compatible HTML template with HubSpot contact tokens.
 */
export function generateHubspotHtml(campaign: EmailCampaign): string {
  const mailchimpHtml = generateMailchimpHtml(campaign);
  return mailchimpHtml
    .replace(/\*\|FNAME\|\*/g, "{{ contact.firstname|default('there') }}")
    .replace(/\*\|UNSUB\|\*/g, '{{ unsubscribe_link }}')
    .replace(/\*\|UPDATE_PROFILE\|\*/g, '{{ unsubscribe_link_all }}')
    .replace(/\*\|ARCHIVE\|\*/g, '{{ view_as_page_url }}')
    .replace(/\*\|LIST:COMPANY\|\*/g, '{{ site_settings.company_name }}')
    .replace(/\*\|LIST:ADDRESS\|\*/g, '{{ site_settings.company_address }}')
    .replace(/\*\|CURRENT_YEAR\|\*/g, '{{ year }}')
    .replace(/\*\|MC_PREVIEW_TEXT\|\*/g, '');
}

/**
 * Generates SendGrid-compatible HTML template with SendGrid substitution tags.
 */
export function generateSendGridHtml(campaign: EmailCampaign): string {
  const mailchimpHtml = generateMailchimpHtml(campaign);
  return mailchimpHtml
    .replace(/\*\|FNAME\|\*/g, '{{first_name}}')
    .replace(/\*\|UNSUB\|\*/g, '{{Unsubscribe}}')
    .replace(/\*\|UPDATE_PROFILE\|\*/g, '{{Preferences}}')
    .replace(/\*\|ARCHIVE\|\*/g, '{{Weblink}}')
    .replace(/\*\|LIST:COMPANY\|\*/g, '{{Sender_Name}}')
    .replace(/\*\|LIST:ADDRESS\|\*/g, '{{Sender_Address}}')
    .replace(/\*\|CURRENT_YEAR\|\*/g, '{{Current_Year}}')
    .replace(/\*\|MC_PREVIEW_TEXT\|\*/g, '');
}

/**
 * Generates specialized ESP HTML based on selected provider.
 */
export function generateEspHtml(campaign: EmailCampaign, esp: EspType): string {
  switch (esp) {
    case 'mailchimp':
      return generateMailchimpHtml(campaign);
    case 'klaviyo':
      return generateKlaviyoHtml(campaign);
    case 'hubspot':
      return generateHubspotHtml(campaign);
    case 'sendgrid':
      return generateSendGridHtml(campaign);
    default:
      return generateMailchimpHtml(campaign);
  }
}

/**
 * Generates an executive-ready, printable HTML document designed for saving/printing as PDF.
 */
export function generatePrintablePdfHtml(campaign: EmailCampaign): string {
  const selectedSubject =
    campaign.subjectLines[campaign.selectedSubjectIndex]?.text ||
    campaign.subjectLines[0]?.text ||
    campaign.title;

  const tracking = campaign.tracking || getDefaultTrackingConfig(campaign.title);
  const finalCtaUrl = tracking.enableUtm
    ? appendUtmToUrl(campaign.cta.url || 'https://example.com', tracking, 'primary_cta')
    : (campaign.cta.url || 'https://example.com');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(campaign.title)} - Campaign Brief &amp; PDF Export</title>
  <style>
    @page {
      size: letter portrait;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .header-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #4f46e5;
      background: #eef2ff;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    h1 {
      margin: 0 0 6px 0;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 11px;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
    }
    .meta-label {
      color: #64748b;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      display: block;
    }
    .meta-value {
      font-weight: 600;
      color: #1e293b;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #334155;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .subject-box {
      background: #f1f5f9;
      border-left: 4px solid #4f46e5;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 14px;
    }
    .subject-text {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    .preview-text {
      font-size: 12px;
      color: #475569;
      margin-top: 3px;
    }
    .email-body-card {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 20px;
      background: #ffffff;
      margin-top: 12px;
    }
    .visual-container {
      margin: 14px 0;
      text-align: center;
    }
    .visual-container img {
      max-width: 100%;
      height: auto;
      max-height: 280px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .benefit-item {
      margin: 8px 0;
      font-size: 13px;
    }
    .quote-box {
      background: #f8fafc;
      border-left: 3px solid #6366f1;
      padding: 10px 14px;
      font-style: italic;
      margin: 12px 0;
      border-radius: 0 6px 6px 0;
      font-size: 13px;
    }
    .cta-button {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff;
      padding: 10px 22px;
      font-weight: 700;
      font-size: 13px;
      border-radius: 6px;
      text-decoration: none;
      margin: 12px 0 6px 0;
    }
    .tracking-summary {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 11px;
      margin-top: 14px;
    }
    .footer-note {
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      margin-top: 24px;
      text-align: center;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-badge">CampaignForge AI &bull; Campaign PDF Brief</div>
    <h1>${escapeHtml(campaign.title)}</h1>
    <div style="font-size: 12px; color: #64748b;">
      Ready-to-deploy Email Campaign Package &amp; Specifications
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <span class="meta-label">Objective</span>
      <span class="meta-value">${escapeHtml(campaign.objective.replace('_', ' '))}</span>
    </div>
    <div>
      <span class="meta-label">Brand Tone</span>
      <span class="meta-value">${escapeHtml(campaign.brandTone)}</span>
    </div>
    <div>
      <span class="meta-label">Target Audience</span>
      <span class="meta-value">${escapeHtml(campaign.targetAudience)}</span>
    </div>
    <div>
      <span class="meta-label">Visual Quality</span>
      <span class="meta-value">${escapeHtml(campaign.visual.imageSize || '2K')} (${escapeHtml(campaign.visual.aspectRatio || '16:9')})</span>
    </div>
  </div>

  <div class="section-title">Selected Subject Line &amp; Snippet</div>
  <div class="subject-box">
    <div class="subject-text">Subject: ${escapeHtml(selectedSubject)}</div>
    <div class="preview-text">Inbox Preview: ${escapeHtml(campaign.previewText)}</div>
  </div>

  <div class="section-title">Email Content Layout</div>
  <div class="email-body-card">
    ${campaign.eyebrow ? `<div style="font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase;">${escapeHtml(campaign.eyebrow)}</div>` : ''}
    <h2 style="font-size: 18px; font-weight: 800; margin: 4px 0 8px 0;">${escapeHtml(campaign.headline)}</h2>
    ${campaign.subheadline ? `<p style="font-size: 14px; color: #475569; margin: 0 0 12px 0;">${escapeHtml(campaign.subheadline)}</p>` : ''}

    ${campaign.visual.imageUrl ? `<div class="visual-container"><img src="${campaign.visual.imageUrl}" alt="${escapeHtml(campaign.visual.altText || campaign.headline)}" /></div>` : ''}

    <p style="font-size: 13px; line-height: 1.6; color: #334155;">
      ${escapeHtml(campaign.introHook)}
    </p>

    <div style="margin: 12px 0;">
      ${campaign.benefits.map(b => `
        <div class="benefit-item">
          <strong>${escapeHtml(b.icon || '✦')} ${escapeHtml(b.title)}:</strong> ${escapeHtml(b.description)}
        </div>
      `).join('')}
    </div>

    ${campaign.highlightQuote?.quote ? `
      <div class="quote-box">
        "${escapeHtml(campaign.highlightQuote.quote)}"
        <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 3px;">
          — ${escapeHtml(campaign.highlightQuote.author)}${campaign.highlightQuote.role ? `, ${escapeHtml(campaign.highlightQuote.role)}` : ''}
        </div>
      </div>
    ` : ''}

    ${campaign.urgencyBanner ? `
      <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #b45309; text-align: center; margin: 12px 0;">
        ⏳ ${escapeHtml(campaign.urgencyBanner)}
      </div>
    ` : ''}

    <div style="text-align: center; margin-top: 14px;">
      <span class="cta-button">${escapeHtml(campaign.cta.text)} &rarr;</span>
      ${campaign.cta.secondaryText ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${escapeHtml(campaign.cta.secondaryText)}</div>` : ''}
    </div>
  </div>

  <div class="section-title">Automated Tracking &amp; Analytics</div>
  <div class="tracking-summary">
    <strong>UTM Link Tracking:</strong> ${tracking.enableUtm ? 'Active' : 'Disabled'} &bull; 
    <strong>utm_campaign:</strong> ${escapeHtml(tracking.utmCampaign)} &bull; 
    <strong>utm_source:</strong> ${escapeHtml(tracking.utmSource)} &bull; 
    <strong>utm_medium:</strong> ${escapeHtml(tracking.utmMedium)}<br/>
    <strong>Destination URL with UTMs:</strong> <span style="font-family: monospace; font-size: 10px; word-break: break-all;">${escapeHtml(finalCtaUrl)}</span><br/>
    <strong>Open Tracking Pixel:</strong> ${tracking.enableTrackingPixel ? `Active (${escapeHtml(tracking.pixelEndpoint || 'https://track.campaignforge.io/pixel.gif')})` : 'Disabled'}
  </div>

  <div class="footer-note">
    ${escapeHtml(campaign.footerCompliance.companyName)} &bull; ${escapeHtml(campaign.footerCompliance.physicalAddress)}<br/>
    CAN-SPAM &amp; GDPR Compliant Email Brief &bull; Generated by CampaignForge AI
  </div>
</body>
</html>`;
}

/**
 * Client-side file downloader trigger.
 */
export function triggerFileDownload(filename: string, content: string | Blob, mimeType: string = 'text/html;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { generateMhtmlArchive, getMhtmlStats } from './mhtml-export.ts';
export { exportCampaignToPdf, generateCampaignPdfDoc, generateCampaignPdfBlob } from './pdf-export.ts';

