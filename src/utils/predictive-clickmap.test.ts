import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePredictiveClickMap } from './predictive-clickmap.ts';
import type { EmailCampaign } from '../types.ts';

const mockCampaign: EmailCampaign = {
  id: 'test-campaign-123',
  title: 'Spring Drop Flash Sale',
  objective: 'flash_sale',
  targetAudience: 'Activewear fans',
  brandTone: 'urgent',
  prompt: 'Create a spring drop email',
  createdAt: 1700000000,
  subjectLines: [
    {
      id: 's1',
      text: '⚡ 48 Hours Only: 30% Off Spring Essentials',
      angle: 'urgency',
      spamScore: 12,
      predictedOpenRate: 46.2,
      isRecommended: true,
    },
  ],
  selectedSubjectIndex: 0,
  previewText: 'Claim your exclusive VIP discount before it expires.',
  eyebrow: 'LIMITED DROP',
  headline: 'Claim 30% Off Everything This Weekend',
  subheadline: 'Engineered for maximum endurance and lightweight performance.',
  introHook: 'Spring is here, and our freshest performance gear just dropped.',
  benefits: [
    {
      id: 'b1',
      title: 'Ultralight Fabrics',
      description: 'Zero friction materials engineered for peak output.',
      icon: '⚡',
    },
    {
      id: 'b2',
      title: 'Thermal Regulation',
      description: 'Stay cool under pressure with ventilated airflow.',
      icon: '❄️',
    },
    {
      id: 'b3',
      title: 'Lifetime Guarantee',
      description: 'Tested across 10,000 miles of rigorous training.',
      icon: '🛡️',
    },
  ],
  highlightQuote: {
    quote: 'The single best running kit I have ever used.',
    author: 'Alex Rivera',
    role: 'Marathon Finisher',
  },
  urgencyBanner: 'Flash sale ends Sunday at midnight EST.',
  cta: {
    text: 'Claim Your 30% Discount',
    url: 'https://example.com/shop-spring',
    style: 'primary',
    secondaryText: 'Free shipping on orders over $50',
  },
  visual: {
    prompt: 'Athletic runner on misty morning track',
    aspectRatio: '16:9',
    imageSize: '2K',
    imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80',
    altText: 'Athletic runner wearing spring drop apparel',
    headlineOverlay: '30% OFF ALL RUNNING GEAR',
    placement: 'header',
  },
  footerCompliance: {
    companyName: 'Apex Athletics Inc.',
    physicalAddress: '123 Performance Way, Portland OR 97201',
    unsubscribeNotice: 'You are receiving this because you subscribed to Apex updates.',
  },
};

test('calculatePredictiveClickMap produces complete report with hotspots', () => {
  const report = calculatePredictiveClickMap(mockCampaign, 'desktop');

  assert.equal(report.campaignId, 'test-campaign-123');
  assert.equal(report.viewport, 'desktop');
  assert.ok(report.overallScore >= 50 && report.overallScore <= 100);
  assert.ok(report.hotspots.length >= 4);

  // Check that hotspot shares sum to approximately 100%
  const totalShare = report.hotspots.reduce((sum, h) => sum + h.predictedSharePct, 0);
  assert.ok(Math.abs(totalShare - 100) <= 2, `Total share was ${totalShare}, expected near 100`);

  // Check that CTA is highest rank hotspot
  const ctaHotspot = report.hotspots.find((h) => h.elementKey === 'cta_primary');
  assert.ok(ctaHotspot, 'Primary CTA hotspot must be present');
  assert.equal(ctaHotspot?.rank, 1, 'CTA should be #1 predicted click hotspot');
  assert.equal(ctaHotspot?.intensity, 'critical');
  assert.ok(ctaHotspot.predictedSharePct > 30, 'CTA should capture >30% click share');

  // Check hero visual hotspot
  const visualHotspot = report.hotspots.find((h) => h.elementKey === 'hero_visual');
  assert.ok(visualHotspot, 'Hero visual hotspot should be present');
  assert.ok(visualHotspot.predictedSharePct > 10);
});

test('calculatePredictiveClickMap adapts to mobile viewport', () => {
  const desktopReport = calculatePredictiveClickMap(mockCampaign, 'desktop');
  const mobileReport = calculatePredictiveClickMap(mockCampaign, 'mobile');

  assert.equal(mobileReport.viewport, 'mobile');
  assert.equal(mobileReport.scanPattern, 'Inverted Pyramid');
  assert.equal(desktopReport.scanPattern, 'F-Pattern');

  const mobileCta = mobileReport.hotspots.find((h) => h.elementKey === 'cta_primary');
  const desktopCta = desktopReport.hotspots.find((h) => h.elementKey === 'cta_primary');

  assert.ok(
    (mobileCta?.predictedSharePct || 0) >= (desktopCta?.predictedSharePct || 0),
    'Mobile CTA tap focus should be equal or higher than desktop'
  );
});

test('calculatePredictiveClickMap penalizes missing visual and weak CTA', () => {
  const textOnlyCampaign: EmailCampaign = {
    ...mockCampaign,
    visual: {
      prompt: '',
      aspectRatio: '16:9',
      imageSize: '1K',
      imageUrl: null,
      altText: '',
      placement: 'header',
    },
    cta: {
      text: 'Click here',
      url: 'https://example.com',
      style: 'dark',
    },
  };

  const report = calculatePredictiveClickMap(textOnlyCampaign, 'desktop');
  assert.ok(report.weaknesses.length > 0, 'Should identify weaknesses');
  assert.ok(
    report.weaknesses.some((w) => w.toLowerCase().includes('visual') || w.toLowerCase().includes('cta')),
    'Should identify lack of visual or generic CTA'
  );
});
