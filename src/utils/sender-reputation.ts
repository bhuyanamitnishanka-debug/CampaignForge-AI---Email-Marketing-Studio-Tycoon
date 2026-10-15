import type { EmailCampaign, SubjectLine } from '../types.ts';

export type ReputationTier = 'prime' | 'healthy' | 'caution' | 'at_risk';

export interface ReputationFactor {
  name: string;
  impact: number; // positive or negative points
  description: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface ContentLengthAnalysis {
  wordCount: number;
  charCount: number;
  estimatedHtmlSizeKb: number;
  status: 'optimal' | 'light' | 'lengthy' | 'clipping_risk';
  score: number; // 0 to 50
  message: string;
}

export interface SubjectImpactAnalysis {
  selectedSubject: string;
  length: number;
  spamScore: number;
  predictedOpenRate: number;
  score: number; // 0 to 50
  status: 'strong' | 'good' | 'fair' | 'poor';
  message: string;
}

export interface SenderReputationResult {
  score: number; // 0 to 100
  tier: ReputationTier;
  tierLabel: string;
  tierColor: string; // Tailwind color token
  summary: string;
  contentLength: ContentLengthAnalysis;
  subjectImpact: SubjectImpactAnalysis;
  factors: ReputationFactor[];
  isClippingRisk: boolean;
}

/**
 * Calculates raw word count across all email campaign content elements.
 */
export function calculateCampaignWordCount(campaign: EmailCampaign): {
  wordCount: number;
  charCount: number;
  textBlock: string;
} {
  const parts = [
    campaign.eyebrow || '',
    campaign.headline || '',
    campaign.subheadline || '',
    campaign.introHook || '',
    ...(campaign.benefits || []).map((b) => `${b.title} ${b.description}`),
    campaign.highlightQuote?.quote || '',
    campaign.highlightQuote?.author || '',
    campaign.urgencyBanner || '',
    campaign.cta?.text || '',
    campaign.cta?.secondaryText || '',
    campaign.footerCompliance?.unsubscribeNotice || '',
    campaign.footerCompliance?.companyName || '',
    campaign.footerCompliance?.physicalAddress || '',
  ];

  const textBlock = parts.join(' ').replace(/\s+/g, ' ').trim();
  const words = textBlock ? textBlock.split(/\s+/).filter(Boolean) : [];
  return {
    wordCount: words.length,
    charCount: textBlock.length,
    textBlock,
  };
}

/**
 * Evaluates the impact of email content length on sender reputation.
 * Optimal marketing email length: 75 to 250 words (~500 - 1,800 chars).
 * Too short (<40 words): sparse content triggers heuristic filters.
 * Too long (>550 words): high risk of Gmail 102KB clipping, higher unsubscribe/spam complaints.
 */
export function evaluateContentLengthImpact(campaign: EmailCampaign): ContentLengthAnalysis {
  const { wordCount, charCount } = calculateCampaignWordCount(campaign);

  // Approximate HTML size (markup + styles + tracking + boilerplate)
  // Usually raw text char count * ~4 to 7x for responsive table boilerplate
  const estimatedHtmlSizeKb = Math.round((charCount * 5.2 + 8500) / 1024 * 10) / 10;
  const isClippingRisk = estimatedHtmlSizeKb >= 95; // Gmail clips at 102KB

  let score = 50;
  let status: ContentLengthAnalysis['status'] = 'optimal';
  let message = 'Optimal email length: High engagement without clipping risk';

  if (isClippingRisk || wordCount > 600) {
    status = 'clipping_risk';
    score = 24;
    message = 'High clipping risk (>102KB HTML): Gmail may hide unsubscribe link and tracking';
  } else if (wordCount > 400) {
    status = 'lengthy';
    score = 36;
    message = 'Lengthy email: High scroll depth may reduce CTR and lower read-through signals';
  } else if (wordCount < 40) {
    status = 'light';
    score = 32;
    message = 'Sparse content: Very short emails may trigger heuristic spam filters';
  } else if (wordCount >= 75 && wordCount <= 280) {
    status = 'optimal';
    score = 50;
    message = 'Sweet spot (75-280 words): Maximizes mobile engagement and reply rates';
  } else {
    // 40-74 or 281-400
    status = 'optimal';
    score = 44;
    message = 'Good length: Solid message structure for inbox engagement';
  }

  return {
    wordCount,
    charCount,
    estimatedHtmlSizeKb,
    status,
    score,
    message,
  };
}

/**
 * Evaluates the impact of the currently selected subject line on sender reputation.
 * Key factors:
 * - Spam Risk Score (from spam detection engine: high score penalizes reputation)
 * - Predicted Open Rate (higher open rate = strong positive engagement signal to ISP algorithms)
 * - Character count (ideal: 30-55 characters; <20 is cryptic, >70 is truncated on mobile)
 */
export function evaluateSubjectImpact(
  campaign: EmailCampaign,
  selectedSubjectOverride?: SubjectLine
): SubjectImpactAnalysis {
  const subjectObj =
    selectedSubjectOverride ||
    campaign.subjectLines[campaign.selectedSubjectIndex] ||
    campaign.subjectLines[0] || {
      id: 'default',
      text: campaign.title,
      angle: 'benefit',
      spamScore: 10,
      predictedOpenRate: 40.0,
    };

  const subjectText = subjectObj.text || campaign.title || '';
  const length = subjectText.length;
  const spamScore = subjectObj.spamScore ?? 10;
  const openRate = subjectObj.predictedOpenRate ?? 40.0;

  // Base score out of 50
  let score = 35;
  const messages: string[] = [];

  // Open Rate Impact (positive engagement signal for reputation)
  if (openRate >= 48) {
    score += 10;
    messages.push('High open rate signals strong engagement to mailbox providers');
  } else if (openRate >= 40) {
    score += 6;
  } else if (openRate < 32) {
    score -= 6;
    messages.push('Lower predicted open rate may weaken domain engagement tier');
  }

  // Spam Score Penalty
  if (spamScore <= 10) {
    score += 5;
    messages.push('Zero/low spam trigger keywords protect domain reputation');
  } else if (spamScore <= 25) {
    score += 1;
  } else if (spamScore <= 45) {
    score -= 8;
    messages.push('Spam-triggering phrases detected in subject line');
  } else {
    score -= 16;
    messages.push('High spam score risks ISP gateway throttling or junk routing');
  }

  // Length Quality
  if (length >= 28 && length <= 60) {
    score += 0; // optimal
  } else if (length > 70) {
    score -= 4;
    messages.push('Subject length >70 chars clips on mobile inboxes');
  } else if (length < 20) {
    score -= 2;
  }

  // Cap score between 10 and 50
  score = Math.max(10, Math.min(50, Math.round(score)));

  let status: SubjectImpactAnalysis['status'] = 'good';
  if (score >= 45) status = 'strong';
  else if (score >= 35) status = 'good';
  else if (score >= 26) status = 'fair';
  else status = 'poor';

  return {
    selectedSubject: subjectText,
    length,
    spamScore,
    predictedOpenRate: openRate,
    score,
    status,
    message: messages[0] || 'Subject line provides balanced engagement signals',
  };
}

/**
 * Calculates complete Sender Reputation metric dynamically.
 * Combines content length analysis (50 max) and subject line impact (50 max).
 */
export function calculateSenderReputation(
  campaign: EmailCampaign,
  selectedSubjectOverride?: SubjectLine
): SenderReputationResult {
  const contentLength = evaluateContentLengthImpact(campaign);
  const subjectImpact = evaluateSubjectImpact(campaign, selectedSubjectOverride);

  // Total score: content length score (0-50) + subject impact score (0-50)
  const totalScore = Math.max(0, Math.min(100, contentLength.score + subjectImpact.score));

  // Determine reputation tier
  let tier: ReputationTier = 'healthy';
  let tierLabel = 'Healthy (Good)';
  let tierColor = 'text-blue-400';
  let summary = 'Safe deliverability profile with steady inbox placement expected.';

  if (totalScore >= 90) {
    tier = 'prime';
    tierLabel = 'Prime (Excellent)';
    tierColor = 'text-emerald-400';
    summary = 'Top-tier sender reputation: Maximizes primary inbox placement and domain trust.';
  } else if (totalScore >= 75) {
    tier = 'healthy';
    tierLabel = 'Healthy (Good)';
    tierColor = 'text-blue-400';
    summary = 'Strong reputation profile with low spam risk across major ESPs.';
  } else if (totalScore >= 60) {
    tier = 'caution';
    tierLabel = 'Caution (Moderate)';
    tierColor = 'text-amber-400';
    summary = 'Deliverability at moderate risk. Refine content length or subject line spam score.';
  } else {
    tier = 'at_risk';
    tierLabel = 'At Risk (Low)';
    tierColor = 'text-rose-400';
    summary = 'High likelihood of junk placement or clipping. Optimize subject line and copy.';
  }

  // Build granular factors list for transparency
  const factors: ReputationFactor[] = [
    {
      name: 'Content Length & Flow',
      impact: contentLength.score >= 45 ? +15 : contentLength.score >= 35 ? +8 : -10,
      description: `${contentLength.wordCount} words • ${contentLength.message}`,
      type: contentLength.status === 'optimal' ? 'positive' : 'negative',
    },
    {
      name: 'Subject Line Engagement Signal',
      impact: subjectImpact.predictedOpenRate >= 45 ? +12 : +5,
      description: `${subjectImpact.predictedOpenRate.toFixed(1)}% est. open rate indicates positive recipient interaction`,
      type: subjectImpact.predictedOpenRate >= 40 ? 'positive' : 'neutral',
    },
    {
      name: 'Spam Filter Resistance',
      impact: subjectImpact.spamScore <= 15 ? +10 : -12,
      description: `Subject spam score: ${subjectImpact.spamScore}/100 • ${subjectImpact.message}`,
      type: subjectImpact.spamScore <= 20 ? 'positive' : 'negative',
    },
  ];

  return {
    score: totalScore,
    tier,
    tierLabel,
    tierColor,
    summary,
    contentLength,
    subjectImpact,
    factors,
    isClippingRisk: contentLength.status === 'clipping_risk',
  };
}
