export interface SpamAnalysisResult {
  score: number; // 0 to 100 (0 = clean, 100 = severe spam risk)
  rating: 'Clean' | 'Moderate' | 'High Risk' | 'Critical';
  flaggedWords: string[];
  issues: string[];
  recommendations: string[];
}

const COMMON_SPAM_TRIGGERS = [
  '100% free',
  'act now',
  'all natural',
  'apply now',
  'as seen on',
  'bad credit',
  'bargain',
  'be your own boss',
  'best price',
  'big bucks',
  'billion dollars',
  'bonus',
  'buy direct',
  'cancel at any time',
  'cash bonus',
  'cash prize',
  'certified',
  'cheap',
  'claim',
  'clearance',
  'click below',
  'click here',
  'compare rates',
  'congratulations',
  'credit card offers',
  'cures',
  'dear friend',
  'direct email',
  'direct marketing',
  'discount',
  'double your',
  'earn extra cash',
  'earn money',
  'eliminate debt',
  'exclusive deal',
  'expect to earn',
  'extra income',
  'fast cash',
  'financial freedom',
  'free consultation',
  'free gift',
  'free info',
  'free sample',
  'free trial',
  'get out of debt',
  'get paid',
  'giveaway',
  'guaranteed',
  'hidden assets',
  'income from home',
  'increase sales',
  'instant',
  'investment',
  'join millions',
  'limited time',
  'lowest price',
  'make money',
  'millionaire',
  'miracle',
  'money back',
  'mortgage rates',
  'multi-level marketing',
  'no catch',
  'no cost',
  'no credit check',
  'no experience',
  'no fees',
  'no gimmick',
  'no hidden',
  'no obligation',
  'no purchase necessary',
  'no risk',
  'no strings attached',
  'not spam',
  'one time',
  'online marketing',
  'open immediately',
  'order now',
  'passwords',
  'pennies a day',
  'potential earnings',
  'prize',
  'promise you',
  'pure profit',
  'refinance',
  'refund',
  'remove',
  'risk-free',
  'save big',
  'save up to',
  'score',
  'see for yourself',
  'special promotion',
  'stop snoring',
  'terms and conditions',
  'this isn\'t spam',
  'time limited',
  'unlimited',
  'unsolicited',
  'urgent',
  'valuable',
  'viagra',
  'vicodin',
  'warranty',
  'weight loss',
  'while supplies last',
  'win',
  'winner',
  'winning',
  'work from home',
  'you have been selected',
  'you’re a winner',
  'zero percent'
];

/**
 * Analyzes subject line and/or email text for spam triggers and deliverability risks.
 */
export function analyzeSpamScore(text: string): SpamAnalysisResult {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      rating: 'Clean',
      flaggedWords: [],
      issues: ['Empty input'],
      recommendations: ['Add engaging, specific copy describing real value.']
    };
  }

  let penalty = 0;
  const flaggedWords: string[] = [];
  const issues: string[] = [];
  const recommendations: string[] = [];

  const lowerText = text.toLowerCase();

  // 1. Check for spam trigger phrases
  for (const trigger of COMMON_SPAM_TRIGGERS) {
    if (lowerText.includes(trigger)) {
      flaggedWords.push(trigger);
      penalty += 14;
    }
  }

  // 2. Check for ALL CAPS words
  const words = text.split(/\s+/).filter(w => w.length > 2);
  const capsWords = words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w));
  if (capsWords.length >= 2) {
    penalty += Math.min(25, capsWords.length * 8);
    issues.push(`${capsWords.length} words in ALL CAPS ("${capsWords.slice(0, 3).join(', ')}")`);
    recommendations.push('Use sentence case instead of all capital letters to avoid inbox spam filters.');
  }

  // 3. Check for excessive exclamation marks or dollar signs
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    penalty += Math.min(20, exclamationCount * 7);
    issues.push(`Excessive exclamation marks (${exclamationCount})`);
    recommendations.push('Limit exclamation marks to at most one per email, or zero in subject lines.');
  }

  const dollarSignCount = (text.match(/\$/g) || []).length;
  if (dollarSignCount > 1) {
    penalty += Math.min(25, dollarSignCount * 8);
    issues.push(`Multiple currency symbols (${dollarSignCount})`);
    recommendations.push('Avoid multiple dollar signs ($$$) which trigger aggressive mail heuristics.');
  }

  // 4. Excessive emojis
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojiMatches = text.match(emojiRegex) || [];
  if (emojiMatches.length > 3) {
    penalty += 12;
    issues.push(`High emoji density (${emojiMatches.length} emojis)`);
    recommendations.push('Use at most 1-2 tasteful emojis in subject lines.');
  }

  // 5. Length considerations (for subjects)
  if (text.length > 90) {
    penalty += 6;
    issues.push('Text length exceeds 90 characters (may be truncated on mobile devices)');
    recommendations.push('Keep subject lines between 35 and 65 characters for optimal mobile readability.');
  }

  const finalScore = Math.min(100, Math.max(0, penalty));

  let rating: SpamAnalysisResult['rating'] = 'Clean';
  if (finalScore >= 65) {
    rating = 'Critical';
  } else if (finalScore >= 40) {
    rating = 'High Risk';
  } else if (finalScore >= 20) {
    rating = 'Moderate';
  }

  if (flaggedWords.length > 0) {
    issues.push(`Detected ${flaggedWords.length} spam-trigger keyword(s): "${flaggedWords.slice(0, 4).join('", "')}"`);
    recommendations.push('Replace high-spam trigger words with specific, benefit-driven product terminology.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Deliverability looks great! Test send to ensure inbox placement.');
  }

  return {
    score: finalScore,
    rating,
    flaggedWords,
    issues,
    recommendations
  };
}

/**
 * Predicts open rate based on angle, length, and spam score.
 */
export function estimateOpenRate(
  subject: string, 
  angle: 'curiosity' | 'urgency' | 'benefit' | 'social_proof' | 'how_to',
  spamScore: number
): number {
  let baseRate = 32.0;

  // Angle bonuses based on industry benchmarks
  switch (angle) {
    case 'curiosity':
      baseRate += 7.2;
      break;
    case 'benefit':
      baseRate += 6.5;
      break;
    case 'social_proof':
      baseRate += 5.8;
      break;
    case 'urgency':
      baseRate += 4.5;
      break;
    case 'how_to':
      baseRate += 5.1;
      break;
  }

  // Length optimization (sweet spot 35-60 chars)
  const len = subject.trim().length;
  if (len >= 30 && len <= 60) {
    baseRate += 4.0;
  } else if (len > 80) {
    baseRate -= 4.5;
  }

  // Emojis (1 tasteful emoji adds ~2-3%)
  const hasEmoji = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(subject);
  if (hasEmoji) {
    baseRate += 2.2;
  }

  // Spam score deduction (high spam score drives mail to junk folder)
  const spamDeduction = (spamScore / 100) * 18;
  baseRate -= spamDeduction;

  return Math.min(68, Math.max(8, Math.round(baseRate * 10) / 10));
}
