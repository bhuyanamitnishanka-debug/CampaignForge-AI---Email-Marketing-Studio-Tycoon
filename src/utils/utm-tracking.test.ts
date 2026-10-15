import test from 'node:test';
import assert from 'node:assert/strict';
import {
  slugifyCampaignName,
  getDefaultTrackingConfig,
  isTrackableUrl,
  appendUtmToUrl,
  injectUtmIntoText,
  autoTagCampaign,
  generateTrackingPixelHtml,
  injectTrackingIntoHtml,
} from './utm-tracking.ts';
import type { EmailCampaign } from '../types.ts';

test('slugifyCampaignName handles special characters and spaces', () => {
  assert.equal(
    slugifyCampaignName('FlowState AI: Next-Gen Autonomous Workflows!'),
    'flowstate-ai-next-gen-autonomous-workflows'
  );
  assert.equal(slugifyCampaignName(''), 'email-campaign');
});

test('isTrackableUrl allows valid web URLs and filters internal/merge tags', () => {
  assert.equal(isTrackableUrl('https://example.com/pricing'), true);
  assert.equal(isTrackableUrl('http://mybrand.io'), true);
  assert.equal(isTrackableUrl('/cart/checkout'), true);

  // Should ignore mailto, tel, anchor jumps, and ESP merge tags
  assert.equal(isTrackableUrl('mailto:support@example.com'), false);
  assert.equal(isTrackableUrl('tel:+1234567890'), false);
  assert.equal(isTrackableUrl('#unsubscribe'), false);
  assert.equal(isTrackableUrl('*|UNSUB|*'), false);
  assert.equal(isTrackableUrl('{{ unsubscribe }}'), false);
  assert.equal(isTrackableUrl('{% unsubscribe %}'), false);
});

test('appendUtmToUrl preserves existing query params and attaches UTM parameters', () => {
  const config = {
    enableUtm: true,
    utmSource: 'newsletter',
    utmMedium: 'email',
    utmCampaign: 'black-friday-sale',
    utmContent: 'hero_btn',
  };

  const tagged = appendUtmToUrl('https://example.com/product?ref=partner#section', config);
  assert.match(tagged, /utm_source=newsletter/);
  assert.match(tagged, /utm_medium=email/);
  assert.match(tagged, /utm_campaign=black-friday-sale/);
  assert.match(tagged, /utm_content=hero_btn/);
  assert.match(tagged, /ref=partner/);
  assert.match(tagged, /#section$/);
});

test('injectUtmIntoText automatically tags both markdown links and plain URLs in body copy', () => {
  const config = {
    enableUtm: true,
    utmSource: 'newsletter',
    utmMedium: 'email',
    utmCampaign: 'launch',
    utmContent: 'body_cta',
  };

  const bodyCopy = 'Read our guide at https://example.com/guide and visit [our portal](https://example.com/portal) today!';
  const processed = injectUtmIntoText(bodyCopy, config, 'body_copy');

  assert.match(processed, /https:\/\/example\.com\/guide\?utm_source=newsletter/);
  assert.match(processed, /\[our portal\]\(https:\/\/example\.com\/portal\?utm_source=newsletter/);
});

test('autoTagCampaign tags CTA and all body text across the campaign', () => {
  const mockCampaign: EmailCampaign = {
    id: 'c-test-1',
    title: 'Spring Drop',
    objective: 'flash_sale',
    targetAudience: 'Fashion Shoppers',
    brandTone: 'playful',
    prompt: 'Spring flash sale',
    createdAt: 1000,
    selectedSubjectIndex: 0,
    previewText: 'Preview',
    subjectLines: [
      {
        id: 's1',
        text: 'Spring Drop is here',
        angle: 'benefit',
        spamScore: 10,
        predictedOpenRate: 45.0,
      },
    ],
    eyebrow: 'SPRING',
    headline: 'Spring arrives',
    subheadline: 'Explore styles at https://example.com/catalog',
    introHook: 'Get ready for spring at https://example.com/spring',
    benefits: [
      {
        id: 'b1',
        title: 'New Styles',
        description: 'See arrivals at https://example.com/new',
        icon: '🌸',
      },
    ],
    highlightQuote: { quote: 'Great!', author: 'Jane', role: 'Buyer' },
    cta: { text: 'Shop Now', url: 'https://example.com/shop', style: 'primary' },
    footerCompliance: {
      companyName: 'Brand Inc',
      physicalAddress: '123 Main St',
      unsubscribeNotice: 'Unsub',
    },
    visual: {
      prompt: 'Flower',
      aspectRatio: '16:9',
      imageSize: '2K',
      imageUrl: null,
      altText: 'Flower',
      placement: 'header',
    },
  };

  const tagged = autoTagCampaign(mockCampaign);
  assert.equal(tagged.tracking?.enableUtm, true);
  assert.match(tagged.cta.url, /utm_source=newsletter/);
  assert.match(tagged.introHook, /utm_source=newsletter/);
  assert.match(tagged.subheadline, /utm_source=newsletter/);
  assert.match(tagged.benefits[0].description, /utm_source=newsletter/);
});

test('generateTrackingPixelHtml outputs a 1x1 transparent tracking image', () => {
  const config = {
    enableUtm: true,
    utmSource: 'newsletter',
    utmMedium: 'email',
    utmCampaign: 'launch-v1',
    enableTrackingPixel: true,
    pixelEndpoint: 'https://track.campaignforge.io/pixel.gif',
  };

  const pixel = generateTrackingPixelHtml(config, 'camp-123');
  assert.match(pixel, /<img src="https:\/\/track\.campaignforge\.io\/pixel\.gif\?/);
  assert.match(pixel, /cid=camp-123/);
  assert.match(pixel, /width="1"/);
  assert.match(pixel, /height="1"/);
});

test('injectTrackingIntoHtml injects UTM parameters and appends tracking pixel to HTML', () => {
  const rawHtml = `<html><body><a href="https://example.com/buy">Buy</a></body></html>`;
  const config = {
    enableUtm: true,
    utmSource: 'newsletter',
    utmMedium: 'email',
    utmCampaign: 'summer-sale',
    enableTrackingPixel: true,
    pixelEndpoint: 'https://track.campaignforge.io/pixel.gif',
  };

  const injected = injectTrackingIntoHtml(rawHtml, config, 'camp-999');
  assert.match(injected, /utm_source=newsletter/);
  assert.match(injected, /utm_campaign=summer-sale/);
  assert.match(injected, /<img src="https:\/\/track\.campaignforge\.io\/pixel\.gif/);
});
