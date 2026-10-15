import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateMhtmlArchive,
  getMhtmlStats,
  encodeQuotedPrintable,
  formatByteSize,
} from './mhtml-export.ts';
import type { EmailCampaign } from '../types.ts';

const mockCampaign: EmailCampaign = {
  id: 'c-mhtml-test',
  title: 'Summer Launch Sale',
  objective: 'flash_sale',
  targetAudience: 'Growth Marketers',
  brandTone: 'playful',
  prompt: 'Summer promotional campaign',
  createdAt: Date.now(),
  selectedSubjectIndex: 0,
  previewText: 'Unlock 40% off our pro tier today.',
  subjectLines: [
    {
      id: 's1',
      text: '☀️ Summer Sale: 40% Off Everything Today',
      angle: 'urgency',
      spamScore: 10,
      predictedOpenRate: 46.5,
      isRecommended: true,
    },
    {
      id: 's2',
      text: 'Supercharge your marketing stack for less',
      angle: 'benefit',
      spamScore: 8,
      predictedOpenRate: 39.0,
      isRecommended: false,
    },
  ],
  eyebrow: 'EXCLUSIVE OFFER',
  headline: 'Accelerate Campaign Conversions Like Never Before',
  subheadline: 'The all-in-one AI engine designed for high-growth brands.',
  introHook: 'Get ready for peak season with automated email creation.',
  benefits: [
    {
      id: 'b1',
      title: 'Real-time Spam Guard',
      description: 'Pre-flight checks to guarantee primary inbox delivery.',
      icon: '🛡️',
    },
    {
      id: 'b2',
      title: 'Automated UTM Tracking',
      description: 'Zero manual link tagging needed.',
      icon: '🎯',
    },
  ],
  highlightQuote: {
    quote: 'Our CTR increased 3x within two weeks.',
    author: 'Elena Rostova',
    role: 'VP of Growth',
  },
  cta: {
    text: 'Claim Your 40% Discount',
    url: 'https://example.com/summer-sale',
    secondaryText: 'No credit card required to start free trial',
    style: 'primary',
  },
  urgencyBanner: 'Promo code SUMMER40 expires in 24 hours',
  footerCompliance: {
    companyName: 'Acme SaaS Corp',
    physicalAddress: '500 Howard St, San Francisco, CA',
    unsubscribeNotice: 'You received this because you subscribed to product updates.',
  },
  visual: {
    prompt: 'Vibrant summer illustration with marketing analytics charts',
    aspectRatio: '16:9',
    imageSize: '2K',
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
    altText: 'Summer Launch Visual',
    placement: 'header',
  },
  tracking: {
    enableUtm: true,
    utmSource: 'newsletter',
    utmMedium: 'email',
    utmCampaign: 'summer-launch-sale',
    utmContent: 'primary_cta',
    enableTrackingPixel: true,
    pixelEndpoint: 'https://track.campaignforge.io/pixel.gif',
  },
};

test('encodeQuotedPrintable correctly encodes non-ascii and wraps lines at 76 chars', () => {
  const input = 'Hello World = Test ☀️ Summer Sale!';
  const encoded = encodeQuotedPrintable(input);
  // Equals sign must be encoded as =3D
  assert.match(encoded, /=3D/);
  // Lines should not exceed 76 characters without soft line break '=\r\n'
  const lines = encoded.split('\r\n');
  for (const line of lines) {
    assert.ok(line.length <= 76, `Line exceeds 76 chars: ${line.length}`);
  }
});

test('generateMhtmlArchive generates valid RFC 2557 multipart headers and boundaries', () => {
  const mhtml = generateMhtmlArchive(mockCampaign);

  assert.match(mhtml, /^From: <CampaignForge AI/m);
  assert.match(mhtml, /^Subject: /m);
  assert.match(mhtml, /^MIME-Version: 1\.0/m);
  assert.match(mhtml, /^Content-Type: multipart\/related; boundary="----=_NextPart_CampaignForge_/m);
  assert.match(mhtml, /X-Mailer: CampaignForge AI Email Engine \(RFC 2557 MHTML Standard\)/);
  assert.match(mhtml, /Content-Type: text\/html; charset="utf-8"/);
  assert.match(mhtml, /Content-Transfer-Encoding: quoted-printable/);
  assert.match(mhtml, /Content-Location: http:\/\/localhost\/campaign-archive\.html/);

  // Boundary checks: must contain opening boundary and closing boundary `--boundary--`
  const boundaryMatch = mhtml.match(/boundary="([^"]+)"/);
  assert.ok(boundaryMatch, 'Boundary must be specified in header');
  const boundary = boundaryMatch[1];
  assert.ok(mhtml.includes(`--${boundary}\r\n`), 'Opening boundary must be present');
  assert.ok(mhtml.includes(`--${boundary}--\r\n`), 'Closing boundary must be present');
});

test('generateMhtmlArchive includes campaign content and compliance details', () => {
  const mhtml = generateMhtmlArchive(mockCampaign);

  // The decoded or quoted content must reference the campaign headline and company info
  assert.match(mhtml, /Accelerate Campaign Conversions/);
  assert.match(mhtml, /Acme SaaS Corp/);
  assert.match(mhtml, /SUMMER40/);
});

test('getMhtmlStats returns valid byte size and formatting', () => {
  const stats = getMhtmlStats(mockCampaign);

  assert.ok(stats.byteSize > 1000, 'Byte size should be substantial');
  assert.ok(stats.formattedSize.includes('KB') || stats.formattedSize.includes('B'));
  assert.equal(stats.encoding, 'quoted-printable');
  assert.ok(stats.boundary.startsWith('----=_NextPart_CampaignForge_'));
  assert.equal(stats.partsCount, 1);
});

test('formatByteSize formats bytes, KB, and MB accurately', () => {
  assert.equal(formatByteSize(500), '500 B');
  assert.equal(formatByteSize(2048), '2.0 KB');
  assert.equal(formatByteSize(1048576 * 2.5), '2.50 MB');
});
