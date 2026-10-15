import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateMailchimpHtml,
  generateKlaviyoHtml,
  generateHubspotHtml,
  generateSendGridHtml,
  generateEspHtml,
  generatePrintablePdfHtml,
} from './esp-export.ts';
import type { EmailCampaign } from '../types.ts';

const mockCampaign: EmailCampaign = {
  id: 'c-esp-test',
  title: 'Cyber Week Special',
  objective: 'flash_sale',
  targetAudience: 'Software Developers',
  brandTone: 'urgent',
  prompt: 'Cyber week sale for developers',
  createdAt: 1000,
  selectedSubjectIndex: 0,
  previewText: 'Exclusive 50% discount ends at midnight.',
  subjectLines: [
    {
      id: 's1',
      text: '🚨 Cyber Week: 50% Off Lifetime Access',
      angle: 'urgency',
      spamScore: 12,
      predictedOpenRate: 49.0,
      isRecommended: true,
    },
  ],
  eyebrow: 'CYBER WEEK',
  headline: 'Build Faster with 50% Off Everything',
  subheadline: 'Lifetime licenses unlocked for the next 24 hours only.',
  introHook: 'Don’t miss our biggest discount of the entire year.',
  benefits: [
    {
      id: 'b1',
      title: 'Unlimited Workspaces',
      description: 'Collaborate with your full engineering team.',
      icon: '⚡',
    },
  ],
  highlightQuote: { quote: 'Unbeatable value!', author: 'DevLead', role: 'CTO' },
  cta: { text: 'Claim 50% Discount', url: 'https://example.com/checkout', style: 'primary' },
  urgencyBanner: 'Only 37 discount codes remaining.',
  footerCompliance: {
    companyName: 'CodeCorp',
    physicalAddress: '1 Market St, SF',
    unsubscribeNotice: 'You opted in for developer specials.',
  },
  visual: {
    prompt: 'Neon cyber computer banner',
    aspectRatio: '16:9',
    imageSize: '2K',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
    altText: 'Cyber Week visual',
    placement: 'header',
  },
  tracking: {
    enableUtm: true,
    utmSource: 'newsletter',
    utmMedium: 'email',
    utmCampaign: 'cyber-week-special',
    utmContent: 'primary_cta',
    enableTrackingPixel: true,
    pixelEndpoint: 'https://track.campaignforge.io/pixel.gif',
  },
};

test('generateMailchimpHtml embeds Mailchimp editable tags and merge tags', () => {
  const html = generateMailchimpHtml(mockCampaign);
  assert.match(html, /mc:edit="headline"/);
  assert.match(html, /mc:edit="intro"/);
  assert.match(html, /mc:edit="hero_image"/);
  assert.match(html, /\*\|FNAME\|\*/);
  assert.match(html, /\*\|UNSUB\|\*/);
  assert.match(html, /\*\|MC_PREVIEW_TEXT\|\*/);
  assert.match(html, /utm_source=newsletter/);
  assert.match(html, /<img src="https:\/\/track\.campaignforge\.io\/pixel\.gif/);
});

test('generateKlaviyoHtml substitutes Klaviyo variables and tags', () => {
  const html = generateKlaviyoHtml(mockCampaign);
  assert.match(html, /\{\{\s*first_name\|default:'there'\s*\}\}/);
  assert.match(html, /\{%\s*unsubscribe\s*%\}/);
  assert.match(html, /\{%\s*manage_preferences\s*%\}/);
});

test('generateHubspotHtml replaces merge tags with HubSpot contact tokens', () => {
  const html = generateHubspotHtml(mockCampaign);
  assert.match(html, /\{\{\s*contact\.firstname/);
  assert.match(html, /\{\{\s*unsubscribe_link\s*\}\}/);
});

test('generateSendGridHtml replaces merge tags with SendGrid substitution tags', () => {
  const html = generateSendGridHtml(mockCampaign);
  assert.match(html, /\{\{first_name\}\}/);
  assert.match(html, /\{\{Unsubscribe\}\}/);
  assert.match(html, /\{\{Sender_Name\}\}/);
});

test('generateEspHtml routes to appropriate provider generator', () => {
  const mailchimp = generateEspHtml(mockCampaign, 'mailchimp');
  const klaviyo = generateEspHtml(mockCampaign, 'klaviyo');
  const hubspot = generateEspHtml(mockCampaign, 'hubspot');
  const sendgrid = generateEspHtml(mockCampaign, 'sendgrid');

  assert.match(mailchimp, /\*\|FNAME\|\*/);
  assert.match(klaviyo, /first_name/);
  assert.match(hubspot, /contact\.firstname/);
  assert.match(sendgrid, /\{\{first_name\}\}/);
});

test('generatePrintablePdfHtml creates formatted brief ready for print-to-PDF', () => {
  const printHtml = generatePrintablePdfHtml(mockCampaign);
  assert.match(printHtml, /CampaignForge AI &bull; Campaign PDF Brief/);
  assert.match(printHtml, /Cyber Week Special/);
  assert.match(printHtml, /@page/);
  assert.match(printHtml, /Automated Tracking &amp; Analytics/);
  assert.match(printHtml, /utm_campaign/);
});
