import type { TrackingConfig, EmailCampaign } from '../types.ts';

/**
 * Slugifies a title for clean UTM campaign names.
 */
export function slugifyCampaignName(name: string): string {
  if (!name) return 'email-campaign';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}

/**
 * Provides default tracking configuration based on campaign details.
 */
export function getDefaultTrackingConfig(title: string = 'campaign'): TrackingConfig {
  return {
    enableUtm: true,
    utmSource: 'newsletter',
    utmMedium: 'email',
    utmCampaign: slugifyCampaignName(title),
    utmContent: 'primary_cta',
    enableTrackingPixel: true,
    pixelEndpoint: 'https://track.campaignforge.io/pixel.gif',
  };
}

/**
 * Checks whether a URL should receive UTM parameters.
 * Skips anchor jumps (#), mailto:, tel:, and template merge tags.
 */
export function isTrackableUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // Ignore anchors, mailto, tel, javascript
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('javascript:')
  ) {
    return false;
  }

  // Ignore ESP merge tags like *|UNSUB|* or {{ unsubscribe }} or {% unsubscribe %}
  if (
    trimmed.includes('*|') ||
    trimmed.startsWith('{{') ||
    trimmed.startsWith('{%')
  ) {
    return false;
  }

  // Only track absolute http/https URLs or root-relative paths
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  );
}

/**
 * Appends or updates UTM parameters on a URL while preserving existing params and fragments.
 */
export function appendUtmToUrl(
  rawUrl: string,
  config: Partial<TrackingConfig>,
  contentTag?: string
): string {
  if (!isTrackableUrl(rawUrl)) {
    return rawUrl;
  }

  try {
    const trimmed = rawUrl.trim();
    // Support relative paths by providing a dummy base
    const isRelative = trimmed.startsWith('/');
    const dummyBase = 'https://example.com';
    const parsed = new URL(trimmed, dummyBase);

    if (config.utmSource) {
      parsed.searchParams.set('utm_source', config.utmSource);
    }
    if (config.utmMedium) {
      parsed.searchParams.set('utm_medium', config.utmMedium);
    }
    if (config.utmCampaign) {
      parsed.searchParams.set('utm_campaign', config.utmCampaign);
    }
    if (config.utmTerm) {
      parsed.searchParams.set('utm_term', config.utmTerm);
    }

    const contentToUse = contentTag || config.utmContent;
    if (contentToUse) {
      parsed.searchParams.set('utm_content', contentToUse);
    }

    if (isRelative) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
    return parsed.toString();
  } catch {
    // If URL parsing fails, return raw URL as fallback
    return rawUrl;
  }
}

/**
 * Automatically detects all URLs in free text / markdown and appends UTM parameters to each trackable URL.
 */
export function injectUtmIntoText(
  text: string,
  config: Partial<TrackingConfig>,
  defaultContentTag?: string
): string {
  if (!text || typeof text !== 'string') return text;
  if (!config.enableUtm) return text;

  // 1. Match Markdown links: [label](https://...)
  const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  let result = text.replace(markdownRegex, (_, label, url) => {
    const tracked = appendUtmToUrl(
      url,
      config,
      defaultContentTag || slugifyCampaignName(label)
    );
    return `[${label}](${tracked})`;
  });

  // 2. Match raw URLs not inside quotes or parentheses
  const urlRegex = /(?<![("'])(https?:\/\/[^\s<>"')]+)/g;
  result = result.replace(urlRegex, (url) => {
    return appendUtmToUrl(url, config, defaultContentTag || 'body_link');
  });

  return result;
}

/**
 * Automatically applies UTM tracking and attaches tracking pixel configuration across an entire EmailCampaign object.
 */
export function autoTagCampaign(campaign: EmailCampaign): EmailCampaign {
  const tracking = campaign.tracking || getDefaultTrackingConfig(campaign.title);

  const updated: EmailCampaign = {
    ...campaign,
    tracking: { ...tracking },
  };

  if (tracking.enableUtm) {
    // Tag primary CTA button URL
    if (updated.cta && updated.cta.url) {
      updated.cta = {
        ...updated.cta,
        url: appendUtmToUrl(
          updated.cta.url,
          tracking,
          tracking.utmContent || 'primary_cta'
        ),
      };
    }

    // Tag introHook
    if (updated.introHook) {
      updated.introHook = injectUtmIntoText(
        updated.introHook,
        tracking,
        'intro_link'
      );
    }

    // Tag subheadline
    if (updated.subheadline) {
      updated.subheadline = injectUtmIntoText(
        updated.subheadline,
        tracking,
        'subheadline_link'
      );
    }

    // Tag benefits
    if (Array.isArray(updated.benefits)) {
      updated.benefits = updated.benefits.map((b, idx) => ({
        ...b,
        description: injectUtmIntoText(
          b.description,
          tracking,
          `benefit_${idx + 1}`
        ),
      }));
    }

    // Tag urgency banner
    if (updated.urgencyBanner) {
      updated.urgencyBanner = injectUtmIntoText(
        updated.urgencyBanner,
        tracking,
        'urgency_link'
      );
    }
  }

  return updated;
}

/**
 * Generates the 1x1 transparent tracking pixel HTML tag.
 */
export function generateTrackingPixelHtml(
  config: TrackingConfig,
  campaignId: string = 'cid-default'
): string {
  if (!config.enableTrackingPixel) return '';

  const baseEndpoint =
    config.pixelEndpoint || 'https://track.campaignforge.io/pixel.gif';

  try {
    const parsed = new URL(baseEndpoint);
    parsed.searchParams.set('cid', campaignId);
    if (config.utmCampaign) {
      parsed.searchParams.set('utm_campaign', config.utmCampaign);
    }
    if (config.utmSource) {
      parsed.searchParams.set('utm_source', config.utmSource);
    }
    parsed.searchParams.set('t', Date.now().toString());

    return `\n  <!-- Open Rate Tracking Pixel -->\n  <img src="${parsed.toString()}" width="1" height="1" border="0" alt="" style="display:none !important;width:1px !important;height:1px !important;max-height:0px !important;max-width:0px !important;opacity:0 !important;overflow:hidden !important;mso-hide:all;" />\n`;
  } catch {
    return `\n  <!-- Open Rate Tracking Pixel -->\n  <img src="${baseEndpoint}?cid=${campaignId}" width="1" height="1" border="0" alt="" style="display:none !important;width:1px !important;height:1px !important;max-height:0px !important;max-width:0px !important;opacity:0 !important;overflow:hidden !important;mso-hide:all;" />\n`;
  }
}

/**
 * Automatically applies UTM parameters to all trackable links in HTML markup and appends the tracking pixel.
 */
export function injectTrackingIntoHtml(
  html: string,
  tracking: TrackingConfig,
  campaignId?: string
): string {
  if (!html) return '';

  let processedHtml = html;

  // 1. Inject UTMs into <a href="..."> links if enabled
  if (tracking.enableUtm) {
    processedHtml = processedHtml.replace(
      /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1([^>]*)>/gi,
      (match, quote, url, rest) => {
        if (!isTrackableUrl(url)) {
          return match;
        }

        // Determine contextual content tag
        let contentTag = 'link';
        if (
          match.toLowerCase().includes('cta') ||
          rest.toLowerCase().includes('cta')
        ) {
          contentTag = 'primary_cta';
        } else if (
          match.toLowerCase().includes('banner') ||
          rest.toLowerCase().includes('banner')
        ) {
          contentTag = 'hero_visual';
        }

        const trackedUrl = appendUtmToUrl(url, tracking, contentTag);
        return `<a href=${quote}${trackedUrl}${quote}${rest}>`;
      }
    );
  }

  // 2. Inject tracking pixel before </body> or at bottom of email container
  if (tracking.enableTrackingPixel) {
    const pixelHtml = generateTrackingPixelHtml(tracking, campaignId);
    if (processedHtml.includes('</body>')) {
      processedHtml = processedHtml.replace('</body>', `${pixelHtml}</body>`);
    } else {
      processedHtml += pixelHtml;
    }
  }

  return processedHtml;
}
