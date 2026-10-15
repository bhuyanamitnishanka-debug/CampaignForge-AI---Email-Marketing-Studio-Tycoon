import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCampaignWordCount,
  evaluateContentLengthImpact,
  evaluateSubjectImpact,
  calculateSenderReputation,
} from './sender-reputation.ts';
import type { EmailCampaign } from '../types.ts';

const baseCampaign: EmailCampaign = {
  id: 'c-rep-test',
  title: 'FlowState Autonomous Deployment',
  objective: 'product_launch',
  targetAudience: 'DevOps Engineers',
  brandTone: 'authoritative',
  prompt: 'Launch email for developer automation platform',
  createdAt: 1000,
  selectedSubjectIndex: 0,
  previewText: 'Automate your entire release cycle with zero downtime.',
  subjectLines: [
    {
      id: 's1',
      text: '⚡ Introducing FlowState: Autonomous deployment pipelines are here',
      angle: 'benefit',
      spamScore: 4,
      predictedOpenRate: 48.4,
      isRecommended: true,
    },
    {
      id: 's2',
      text: 'FREE CASH URGENT ACT NOW CLICK HERE $$$',
      angle: 'urgency',
      spamScore: 85,
      predictedOpenRate: 18.0,
      isRecommended: false,
    },
    {
      id: 's3',
      text: 'Quick question regarding your CI/CD setup',
      angle: 'curiosity',
      spamScore: 12,
      predictedOpenRate: 42.0,
      isRecommended: false,
    },
  ],
  eyebrow: 'DEVELOPER PREVIEW',
  headline: 'Stop debugging brittle CI/CD YAML configurations.',
  subheadline: 'FlowState automates verification, security, and canary deployments.',
  introHook:
    'Modern engineering teams spend 30% of sprint capacity maintaining deployment scripts. FlowState eliminates that toil with predictive deployment routing.',
  benefits: [
    {
      id: 'b1',
      title: 'Instant Canary Releases',
      description: 'Zero downtime rolling rollouts with real-time error budget tracking.',
      icon: '🚀',
    },
    {
      id: 'b2',
      title: 'Self-Healing Workflows',
      description: 'Automated rollbacks the moment latency spikes or exceptions occur.',
      icon: '🛡️',
    },
  ],
  highlightQuote: {
    quote: 'We cut our deployment incidents by 80% in the first sprint.',
    author: 'Marcus Vance',
    role: 'Lead Site Reliability Engineer',
  },
  cta: {
    text: 'Start Your 14-Day Free Trial',
    url: 'https://flowstate.io/signup',
    secondaryText: 'Full enterprise capabilities. No credit card required.',
    style: 'primary',
  },
  urgencyBanner: 'Launch Week: Early access teams get 6 months of complimentary telemetry.',
  footerCompliance: {
    companyName: 'FlowState Systems Inc.',
    physicalAddress: '100 Montgomery St, Suite 400, San Francisco, CA',
    unsubscribeNotice: 'You opted in to receive developer announcements from FlowState.',
  },
  visual: {
    prompt: 'Futuristic glowing deployment node topology graph',
    aspectRatio: '16:9',
    imageSize: '2K',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
    altText: 'Deployment graph',
    placement: 'header',
  },
  tracking: {
    enableUtm: true,
    utmSource: 'newsletter',
    utmMedium: 'email',
    utmCampaign: 'flowstate-launch',
    utmContent: 'primary_cta',
    enableTrackingPixel: true,
    pixelEndpoint: 'https://track.campaignforge.io/pixel.gif',
  },
};

test('calculateCampaignWordCount aggregates text and returns positive word count', () => {
  const result = calculateCampaignWordCount(baseCampaign);
  assert.ok(result.wordCount > 50, `Expected word count > 50, got ${result.wordCount}`);
  assert.ok(result.charCount > 300, `Expected char count > 300, got ${result.charCount}`);
  assert.match(result.textBlock, /FlowState/);
});

test('evaluateContentLengthImpact awards high score for sweet-spot length', () => {
  const analysis = evaluateContentLengthImpact(baseCampaign);
  assert.equal(analysis.status, 'optimal');
  assert.ok(analysis.score >= 45, `Score should be >= 45 for sweet spot, got ${analysis.score}`);
  assert.ok(!analysis.message.includes('clipping risk'));
});

test('evaluateContentLengthImpact flags overly long content as clipping risk', () => {
  // Create bloated campaign with 700 words
  const longText = Array(120).fill('excessive marketing jargon boilerplate sentences').join(' ');
  const bloatedCampaign: EmailCampaign = {
    ...baseCampaign,
    introHook: longText,
  };

  const analysis = evaluateContentLengthImpact(bloatedCampaign);
  assert.ok(analysis.wordCount > 500);
  assert.ok(analysis.status === 'clipping_risk' || analysis.status === 'lengthy');
  assert.ok(analysis.score < 40, `Bloated campaign score should be lower, got ${analysis.score}`);
});

test('evaluateSubjectImpact awards higher score to clean, high-open-rate subject', () => {
  // s1 has low spam (4) and high predicted open rate (48.4%)
  const strongImpact = evaluateSubjectImpact(baseCampaign, baseCampaign.subjectLines[0]);
  assert.ok(strongImpact.score >= 40, `Strong subject should have high score, got ${strongImpact.score}`);

  // s2 has high spam (85) and low predicted open rate (18%)
  const spammyImpact = evaluateSubjectImpact(baseCampaign, baseCampaign.subjectLines[1]);
  assert.ok(
    spammyImpact.score < strongImpact.score,
    `Spammy subject score (${spammyImpact.score}) should be lower than strong subject (${strongImpact.score})`
  );
  assert.ok(spammyImpact.status === 'poor' || spammyImpact.status === 'fair');
});

test('calculateSenderReputation dynamically changes when subject line changes', () => {
  // With optimal subject (index 0)
  const repOptimal = calculateSenderReputation(baseCampaign);
  assert.ok(repOptimal.score >= 85, `Optimal reputation should be >= 85, got ${repOptimal.score}`);
  assert.equal(repOptimal.tier, 'prime');

  // Switching to spammy subject (index 1)
  const spamCampaign: EmailCampaign = {
    ...baseCampaign,
    selectedSubjectIndex: 1,
  };
  const repSpam = calculateSenderReputation(spamCampaign);

  assert.ok(
    repSpam.score < repOptimal.score,
    `Reputation with spam subject (${repSpam.score}) should be noticeably lower than optimal (${repOptimal.score})`
  );
  assert.ok(repSpam.score <= 75, `Spam subject should drop reputation score significantly`);
});

test('calculateSenderReputation adapts when body content is trimmed or altered', () => {
  const shortCampaign: EmailCampaign = {
    ...baseCampaign,
    introHook: 'Quick update.',
    benefits: [],
    highlightQuote: { quote: '', author: '', role: '' },
    urgencyBanner: '',
  };

  const repShort = calculateSenderReputation(shortCampaign);
  assert.ok(repShort.contentLength.wordCount < 60);
  assert.ok(
    repShort.score < 95,
    `Sparse content should receive slight penalty compared to balanced copy`
  );
});
