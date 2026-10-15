import type { EmailCampaign } from '../types.ts';

export type HotspotIntensity = 'critical' | 'high' | 'medium' | 'moderate' | 'low';

export interface ClickHotspot {
  id: string;
  elementKey:
    | 'hero_visual'
    | 'headline_eyebrow'
    | 'intro_hook'
    | 'benefit_item'
    | 'social_proof'
    | 'urgency_banner'
    | 'cta_primary'
    | 'cta_secondary'
    | 'footer_unsubscribe';
  label: string;
  title: string;
  description: string;
  /** Estimated percentage of total clicks in the email (sums to 100% across all hotspots) */
  predictedSharePct: number;
  /** Estimated Click-Through Rate (CTR) of total email openers, e.g. 3.8% */
  predictedCtrPct: number;
  /** Heat density score (0 to 100) */
  heatScore: number;
  intensity: HotspotIntensity;
  rank: number;
  /** Eye-tracking scan order in visual reading flow */
  scanOrder: number;
  /** Normalized X position (0 - 100) on preview canvas */
  xPercent: number;
  /** Normalized Y position (0 - 100) on preview canvas */
  yPercent: number;
  /** Approximate relative radius / width for heat halo effect */
  radiusPercent: number;
  driver: string;
  recommendation: string;
  isAboveFold: boolean;
}

export interface EyeScanStep {
  step: number;
  elementKey: string;
  label: string;
  dwellTimeSeconds: number;
  action: 'fixation' | 'saccade' | 'decision_click' | 'skimming';
}

export interface PredictiveEngagementReport {
  campaignId: string;
  viewport: 'desktop' | 'mobile';
  overallScore: number; // 0 - 100 overall clickability & attention score
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C';
  predictedTotalCtrPct: number;
  estimatedClickToOpenRatePct: number;
  estimatedReadTimeSeconds: number;
  aboveFoldSharePct: number;
  belowFoldSharePct: number;
  hotspots: ClickHotspot[];
  scanPattern: 'F-Pattern' | 'Z-Pattern' | 'Inverted Pyramid' | 'Linear';
  scanSteps: EyeScanStep[];
  topOpportunity: string;
  strengths: string[];
  weaknesses: string[];
}

const ACTION_VERBS = [
  'get',
  'claim',
  'shop',
  'start',
  'save',
  'unlock',
  'explore',
  'try',
  'join',
  'grab',
  'buy',
  'order',
  'discover',
  'download',
  'upgrade',
  'reserve',
  'access',
];

const URGENCY_WORDS = [
  'now',
  'today',
  'instant',
  'limited',
  'flash',
  'ends',
  'soon',
  'hurry',
  'last chance',
  'expires',
  'exclusive',
];

/**
 * Calculates predictive click-map distribution and engagement metrics for an EmailCampaign.
 */
export function calculatePredictiveClickMap(
  campaign: EmailCampaign,
  viewport: 'desktop' | 'mobile' = 'desktop'
): PredictiveEngagementReport {
  const isMobile = viewport === 'mobile';

  // 1. CTA Analysis
  const ctaText = (campaign.cta?.text || 'Click Here').toLowerCase();
  const hasActionVerb = ACTION_VERBS.some((v) => ctaText.includes(v));
  const hasUrgencyInCta = URGENCY_WORDS.some((v) => ctaText.includes(v));
  const isOptimalCtaLength = ctaText.split(/\s+/).length >= 2 && ctaText.split(/\s+/).length <= 4;

  let ctaWeight = 42; // Base percentage share of clicks
  if (hasActionVerb) ctaWeight += 6;
  if (hasUrgencyInCta) ctaWeight += 4;
  if (isOptimalCtaLength) ctaWeight += 3;
  if (campaign.cta?.style === 'pill' || campaign.cta?.style === 'primary') ctaWeight += 2;
  if (isMobile) ctaWeight += 5; // Mobile users focus heavily on tap targets

  // 2. Hero Visual Analysis
  const hasVisual = Boolean(campaign.visual?.imageUrl);
  let visualWeight = hasVisual ? 18 : 6;
  if (hasVisual && campaign.visual?.headlineOverlay) visualWeight += 3;

  // 3. Headline & Eyebrow (Fixation hotspot)
  let headlineWeight = 11;
  const headlineWords = (campaign.headline || '').toLowerCase();
  if (headlineWords.includes('%') || headlineWords.includes('$') || /\d+/.test(headlineWords)) {
    headlineWeight += 3;
  }
  if (campaign.eyebrow) headlineWeight += 1;

  // 4. Urgency Banner
  let urgencyWeight = 0;
  if (campaign.urgencyBanner && campaign.urgencyBanner.trim().length > 0) {
    urgencyWeight = isMobile ? 12 : 9;
  }

  // 5. Intro Hook
  let introWeight = 6;
  if (campaign.introHook && campaign.introHook.length > 200) {
    introWeight = 4; // Long text reduces scan interest
  }

  // 6. Benefits List
  const benefitCount = campaign.benefits?.length || 0;
  let benefitsWeight = Math.min(18, Math.max(6, benefitCount * 3.5));

  // 7. Testimonial / Social Proof
  let quoteWeight = 0;
  if (campaign.highlightQuote?.quote && campaign.highlightQuote.quote.trim().length > 0) {
    quoteWeight = 5;
  }

  // 8. Footer / Unsubscribe
  const footerWeight = 2.5;

  // Raw weights sum
  const rawHotspots: Array<{
    elementKey: ClickHotspot['elementKey'];
    label: string;
    title: string;
    description: string;
    rawWeight: number;
    scanOrder: number;
    xPercent: number;
    yPercent: number;
    radiusPercent: number;
    driver: string;
    recommendation: string;
    isAboveFold: boolean;
  }> = [];

  // Headline & Eyebrow
  rawHotspots.push({
    elementKey: 'headline_eyebrow',
    label: 'Headline & Hook',
    title: campaign.headline || 'Campaign Headline',
    description: campaign.eyebrow ? `Eyebrow: "${campaign.eyebrow}"` : 'Hero reader fixation area',
    rawWeight: headlineWeight,
    scanOrder: 1,
    xPercent: isMobile ? 50 : 48,
    yPercent: 12,
    radiusPercent: isMobile ? 32 : 28,
    driver: 'Primary gaze anchor; readers verify message relevance in first 1.2s.',
    recommendation: headlineWords.includes('%')
      ? 'Numbers present: +14% reading retention observed.'
      : 'Include a specific percentage discount or stat to boost hook strength.',
    isAboveFold: true,
  });

  // Hero Visual
  if (hasVisual || visualWeight > 0) {
    rawHotspots.push({
      elementKey: 'hero_visual',
      label: hasVisual ? 'Hero Visual Banner' : 'Visual Area (Missing)',
      title: campaign.visual?.altText || 'Featured graphic banner',
      description: hasVisual
        ? 'High visual curiosity zone with implicit product tap intent'
        : 'Placeholder graphic area',
      rawWeight: visualWeight,
      scanOrder: 2,
      xPercent: 50,
      yPercent: 24,
      radiusPercent: isMobile ? 42 : 36,
      driver: hasVisual
        ? 'Subconscious visual anchor; 1 in 5 subscribers instinctively tap hero images.'
        : 'Missing graphic reduces early visual engagement.',
      recommendation: hasVisual
        ? 'Ensure hero graphic links to the primary target landing page.'
        : 'Attach a high-resolution visual to lift campaign conversion by up to 28%.',
      isAboveFold: true,
    });
  }

  // Urgency Banner (if present)
  if (urgencyWeight > 0) {
    rawHotspots.push({
      elementKey: 'urgency_banner',
      label: 'Urgency / Flash Banner',
      title: campaign.urgencyBanner || 'Limited Time Offer',
      description: 'Scarcity and deadline trigger prompt immediate action',
      rawWeight: urgencyWeight,
      scanOrder: 3,
      xPercent: 50,
      yPercent: 37,
      radiusPercent: isMobile ? 38 : 30,
      driver: 'Scarcity heuristic; triggers immediate loss aversion response.',
      recommendation: 'Keep countdown/urgency under 8 words for peak cognitive clarity.',
      isAboveFold: true,
    });
  }

  // Intro Hook
  rawHotspots.push({
    elementKey: 'intro_hook',
    label: 'Intro Hook Copy',
    title: 'Intro Narrative',
    description: (campaign.introHook || '').slice(0, 80) + '...',
    rawWeight: introWeight,
    scanOrder: urgencyWeight > 0 ? 4 : 3,
    xPercent: isMobile ? 48 : 45,
    yPercent: 44,
    radiusPercent: isMobile ? 26 : 22,
    driver: 'Contextual bridge leading eye directly into benefit bullets.',
    recommendation:
      campaign.introHook?.length > 180
        ? 'Shorten intro copy to under 120 chars for faster transition to CTA.'
        : 'Concise paragraph length maintains high scanning velocity.',
    isAboveFold: true,
  });

  // Benefits List
  if (benefitCount > 0) {
    rawHotspots.push({
      elementKey: 'benefit_item',
      label: 'Key Value Bullets',
      title: `${benefitCount} Key Value Drivers`,
      description: campaign.benefits?.[0]?.title
        ? `e.g. "${campaign.benefits[0].title}"`
        : 'Feature & benefit highlights',
      rawWeight: benefitsWeight,
      scanOrder: urgencyWeight > 0 ? 5 : 4,
      xPercent: isMobile ? 48 : 46,
      yPercent: 57,
      radiusPercent: isMobile ? 36 : 30,
      driver: 'Bullet icons act as eye-rest pins during skimming.',
      recommendation:
        benefitCount === 3
          ? 'Optimal 3-item rule followed; high scan recall.'
          : '3 benefit bullets convert ~18% better than 4+ items.',
      isAboveFold: !isMobile,
    });
  }

  // Highlight Quote / Social Proof
  if (quoteWeight > 0) {
    rawHotspots.push({
      elementKey: 'social_proof',
      label: 'Social Proof Testimonial',
      title: campaign.highlightQuote?.author || 'Customer Quote',
      description: `"${(campaign.highlightQuote?.quote || '').slice(0, 60)}..."`,
      rawWeight: quoteWeight,
      scanOrder: urgencyWeight > 0 ? 6 : 5,
      xPercent: 50,
      yPercent: 69,
      radiusPercent: isMobile ? 30 : 25,
      driver: 'Reassurance trigger lowering perceived purchase risk.',
      recommendation: 'Adding full name and company/role reinforces trustworthiness.',
      isAboveFold: false,
    });
  }

  // Primary CTA Button
  rawHotspots.push({
    elementKey: 'cta_primary',
    label: 'Primary CTA Button',
    title: campaign.cta?.text || 'Main Action Button',
    description: campaign.cta?.url ? `Destination: ${campaign.cta.url}` : 'Primary conversion goal',
    rawWeight: ctaWeight,
    scanOrder: urgencyWeight > 0 ? (quoteWeight > 0 ? 7 : 6) : quoteWeight > 0 ? 6 : 5,
    xPercent: 50,
    yPercent: 78,
    radiusPercent: isMobile ? 44 : 35,
    driver: hasActionVerb
      ? `Strong verb "${campaign.cta?.text}" + vibrant contrast maximizes click propensity.`
      : 'Dominant button contrast drives subscriber decision closure.',
    recommendation: hasActionVerb
      ? 'High-performing action verb detected. Keep button color high contrast.'
      : 'Replace generic copy with action-oriented text (e.g., "Claim My Spot").',
    isAboveFold: false,
  });

  // Footer / Unsubscribe
  rawHotspots.push({
    elementKey: 'footer_unsubscribe',
    label: 'Compliance & Preferences',
    title: 'Unsubscribe / Preference Center',
    description: 'Mandatory CAN-SPAM / GDPR footer links',
    rawWeight: footerWeight,
    scanOrder: rawHotspots.length + 1,
    xPercent: 50,
    yPercent: 93,
    radiusPercent: 18,
    driver: 'Low click frequency; typical 1-2% utility traffic for preferences.',
    recommendation: 'Clear unsubscribe link ensures spam compliance and sender reputation.',
    isAboveFold: false,
  });

  // Normalize total percentage to exactly 100%
  const totalWeight = rawHotspots.reduce((acc, h) => acc + h.rawWeight, 0);

  // Sort by raw weight descending to assign ranks and heat intensities
  const sortedByWeight = [...rawHotspots].sort((a, b) => b.rawWeight - a.rawWeight);

  // Compute baseline predicted CTR (e.g. 3.2% - 5.5% depending on campaign tone and components)
  let baseCampaignCtr = 3.8;
  if (campaign.objective === 'flash_sale') baseCampaignCtr += 0.8;
  if (campaign.urgencyBanner) baseCampaignCtr += 0.4;
  if (hasVisual) baseCampaignCtr += 0.5;
  if (hasActionVerb) baseCampaignCtr += 0.3;

  const hotspots: ClickHotspot[] = sortedByWeight.map((item, index) => {
    const predictedSharePct = Math.round((item.rawWeight / totalWeight) * 1000) / 10;
    const predictedCtrPct = Math.round(((predictedSharePct / 100) * baseCampaignCtr) * 100) / 100;
    const rank = index + 1;

    let intensity: HotspotIntensity = 'low';
    let heatScore = Math.min(100, Math.round((item.rawWeight / sortedByWeight[0].rawWeight) * 100));

    if (rank === 1) intensity = 'critical';
    else if (rank === 2) intensity = 'high';
    else if (rank <= 4) intensity = 'medium';
    else if (rank <= 6) intensity = 'moderate';

    return {
      id: `hotspot-${item.elementKey}-${index}`,
      elementKey: item.elementKey,
      label: item.label,
      title: item.title,
      description: item.description,
      predictedSharePct,
      predictedCtrPct,
      heatScore,
      intensity,
      rank,
      scanOrder: item.scanOrder,
      xPercent: item.xPercent,
      yPercent: item.yPercent,
      radiusPercent: item.radiusPercent,
      driver: item.driver,
      recommendation: item.recommendation,
      isAboveFold: item.isAboveFold,
    };
  });

  // Sort final hotspots back by reading / visual order or rank
  // We'll keep ranks explicit and sort by rank in analytics tables
  const aboveFoldSharePct = Math.round(
    hotspots.filter((h) => h.isAboveFold).reduce((sum, h) => sum + h.predictedSharePct, 0)
  );
  const belowFoldSharePct = Math.max(0, 100 - aboveFoldSharePct);

  // Overall clickability score calculation (0 - 100)
  let overallScore = 70;
  if (hasActionVerb) overallScore += 8;
  if (hasVisual) overallScore += 7;
  if (campaign.urgencyBanner) overallScore += 5;
  if (benefitCount >= 3) overallScore += 5;
  if (campaign.highlightQuote?.quote) overallScore += 3;
  if (campaign.eyebrow) overallScore += 2;
  overallScore = Math.min(98, Math.max(50, overallScore));

  let grade: PredictiveEngagementReport['grade'] = 'B';
  if (overallScore >= 92) grade = 'A+';
  else if (overallScore >= 85) grade = 'A';
  else if (overallScore >= 78) grade = 'B+';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 62) grade = 'C+';
  else grade = 'C';

  // Eye scan simulation steps
  const scanSteps: EyeScanStep[] = [
    {
      step: 1,
      elementKey: 'headline_eyebrow',
      label: '1. Initial Fixation (0 - 1.2s)',
      dwellTimeSeconds: 1.2,
      action: 'fixation',
    },
    {
      step: 2,
      elementKey: 'hero_visual',
      label: hasVisual ? '2. Visual Engagement (1.2 - 2.8s)' : '2. Hero Scan (1.2 - 1.8s)',
      dwellTimeSeconds: hasVisual ? 1.6 : 0.6,
      action: 'saccade',
    },
    {
      step: 3,
      elementKey: 'urgency_banner',
      label: '3. Value & Urgency Assessment (2.8 - 4.1s)',
      dwellTimeSeconds: 1.3,
      action: 'skimming',
    },
    {
      step: 4,
      elementKey: 'benefit_item',
      label: '4. Benefit Bullet Skimming (4.1 - 6.5s)',
      dwellTimeSeconds: 2.4,
      action: 'skimming',
    },
    {
      step: 5,
      elementKey: 'cta_primary',
      label: '5. Action Decision & Click (6.5 - 8.2s)',
      dwellTimeSeconds: 1.7,
      action: 'decision_click',
    },
  ];

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (hasActionVerb) {
    strengths.push(`Action-oriented CTA ("${campaign.cta?.text}") creates clear intent.`);
  } else {
    weaknesses.push('CTA button lacks an urgent action verb (e.g. "Claim", "Get", "Shop").');
  }

  if (hasVisual) {
    strengths.push('Engaging visual banner drives strong secondary click engagement.');
  } else {
    weaknesses.push('No visual graphic attached; missing estimated ~22% image interaction.');
  }

  if (campaign.urgencyBanner) {
    strengths.push('Urgency banner introduces loss aversion above the conversion point.');
  }

  if (benefitCount >= 3) {
    strengths.push(`${benefitCount} structured value points facilitate skimming reader retention.`);
  }

  const topOpportunity = weaknesses[0] ||
    'Test placing a secondary ghost CTA link directly under the first intro paragraph to capture impulse clickers.';

  return {
    campaignId: campaign.id,
    viewport,
    overallScore,
    grade,
    predictedTotalCtrPct: baseCampaignCtr,
    estimatedClickToOpenRatePct: Math.round(baseCampaignCtr * 3.4 * 10) / 10,
    estimatedReadTimeSeconds: Math.round(15 + (campaign.introHook?.length || 100) / 25 + benefitCount * 4),
    aboveFoldSharePct,
    belowFoldSharePct,
    hotspots,
    scanPattern: isMobile ? 'Inverted Pyramid' : 'F-Pattern',
    scanSteps,
    topOpportunity,
    strengths,
    weaknesses,
  };
}
