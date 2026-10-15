import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCampaignPdfDoc } from './pdf-export.ts';
import type { EmailCampaign } from '../types.ts';

const mockCampaign: EmailCampaign = {
  id: 'c-pdf-test',
  title: 'Q4 Product Launch',
  objective: 'product_launch',
  targetAudience: 'Product Managers',
  brandTone: 'authoritative',
  prompt: 'Launch email for enterprise SaaS tool',
  createdAt: Date.now(),
  selectedSubjectIndex: 0,
  previewText: 'Discover the next evolution of product workflow.',
  subjectLines: [
    {
      id: 's1',
      text: '🚀 Introducing Workflow Pro 2.0',
      angle: 'curiosity',
      spamScore: 5,
      predictedOpenRate: 52.0,
      isRecommended: true,
    },
    {
      id: 's2',
      text: 'Supercharge your sprint planning today',
      angle: 'benefit',
      spamScore: 10,
      predictedOpenRate: 41.5,
    },
  ],
  eyebrow: 'PRODUCT UPDATE',
  headline: 'Ship Products 2x Faster with Real-Time AI Workspaces',
  subheadline: 'The unified collaboration platform engineered for agile teams.',
  introHook: 'We are thrilled to announce the official release of Workflow Pro 2.0.',
  benefits: [
    {
      id: 'b1',
      title: 'Automated Roadmapping',
      description: 'Sync Jira, GitHub, and Figma directly into live executive briefs.',
      icon: '🗺️',
    },
    {
      id: 'b2',
      title: 'AI Sprint Summaries',
      description: 'Generate weekly team updates in seconds.',
      icon: '⚡',
    },
  ],
  highlightQuote: {
    quote: 'It saved our product leads over 10 hours every week.',
    author: 'Sarah Chen',
    role: 'Head of Product',
  },
  cta: {
    text: 'Explore Workflow Pro 2.0',
    url: 'https://example.com/demo',
    secondaryText: 'Instant access. No credit card required.',
    style: 'primary',
  },
  urgencyBanner: 'Early-bird access open to the first 500 teams',
  footerCompliance: {
    companyName: 'Workflow Technologies Inc.',
    physicalAddress: '100 Pine Street, San Francisco, CA 94111',
    unsubscribeNotice: 'You are receiving this update because you registered for early access.',
  },
  visual: {
    prompt: 'Clean modern isometric 3D product dashboard preview',
    aspectRatio: '16:9',
    imageSize: '2K',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    altText: 'Workflow Pro dashboard',
    placement: 'header',
  },
  tracking: {
    enableUtm: true,
    utmSource: 'newsletter',
    utmMedium: 'email',
    utmCampaign: 'q4-product-launch',
    utmContent: 'primary_cta',
    enableTrackingPixel: true,
    pixelEndpoint: 'https://track.campaignforge.io/pixel.gif',
  },
};

test('generateCampaignPdfDoc produces a multi-page jsPDF instance without errors', () => {
  const doc = generateCampaignPdfDoc(mockCampaign);
  assert.ok(doc, 'PDF doc instance must be defined');

  // Verify page count
  const pageCount = doc.getNumberOfPages();
  assert.ok(pageCount >= 1, `Page count should be at least 1, got ${pageCount}`);

  // Verify binary output string / arraybuffer starts with %PDF
  const output = doc.output();
  assert.ok(output.startsWith('%PDF-'), 'PDF output should start with standard %PDF- header');
});
