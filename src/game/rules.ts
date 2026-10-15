export interface GameScoreState {
  delivered: number;
  bounced: number;
  spamTrapsHit: number;
  combo: number;
  maxCombo: number;
  score: number;
}

export interface WaveConfig {
  wave: number;
  targetDeliveries: number;
  enemySpeed: number;
  spawnIntervalMs: number;
  spamTrapRatio: number;
  subscribersPerPacket: number;
}

/**
 * Calculates email deliverability percentage (reputation score).
 * Clean delivery adds to reputation; bounces and spam traps damage it.
 */
export function calculateDeliverabilityScore(delivered: number, bounced: number, spamTrapsHit: number): number {
  const total = delivered + bounced * 2 + spamTrapsHit * 5;
  if (total === 0) return 100.0;
  
  const penalizedLoss = (bounced * 1.5 + spamTrapsHit * 4) / total;
  const deliverability = Math.max(0, Math.min(100, (1 - penalizedLoss) * 100));
  return Math.round(deliverability * 10) / 10;
}

/**
 * Computes arcade score using combo multipliers and clean deliveries.
 */
export function calculateScore(delivered: number, combo: number, spamTrapsAvoided: number): number {
  const comboMultiplier = 1 + Math.min(4, Math.floor(combo / 5) * 0.5);
  const deliveryPoints = delivered * 50 * comboMultiplier;
  const avoidanceBonus = spamTrapsAvoided * 120;
  return Math.round(deliveryPoints + avoidanceBonus);
}

/**
 * Evaluates collision against an ISP spam filter or bounce trap.
 */
export function evaluateSpamCollision(
  currentShieldPips: number, 
  filterStrength: number = 1
): { shieldConsumed: number; remainingShield: number; damage: number; bounceAdded: number } {
  if (currentShieldPips >= filterStrength) {
    return {
      shieldConsumed: filterStrength,
      remainingShield: currentShieldPips - filterStrength,
      damage: 0,
      bounceAdded: 0
    };
  }

  const damage = filterStrength - currentShieldPips;
  return {
    shieldConsumed: currentShieldPips,
    remainingShield: 0,
    damage,
    bounceAdded: damage * 2
  };
}

/**
 * Generates wave difficulty parameters across waves.
 */
export function getWaveParameters(wave: number): WaveConfig {
  const safeWave = Math.max(1, wave);
  return {
    wave: safeWave,
    targetDeliveries: 10 + safeWave * 8, // Target packets to deliver this wave
    enemySpeed: 160 + (safeWave - 1) * 25, // Pixels per second
    spawnIntervalMs: Math.max(450, 1200 - (safeWave - 1) * 120),
    spamTrapRatio: Math.min(0.45, 0.15 + (safeWave - 1) * 0.05),
    subscribersPerPacket: 100 + safeWave * 50
  };
}

/**
 * Checks if wave completion target is reached.
 */
export function checkWinCondition(deliveredThisWave: number, targetDeliveries: number): boolean {
  return deliveredThisWave >= targetDeliveries;
}

/**
 * Checks if campaign has suffered critical deliverability blacklist (loss).
 */
export function checkGameOverCondition(deliverabilityPercent: number, currentShieldPips: number): boolean {
  return deliverabilityPercent < 60.0 || currentShieldPips <= 0;
}
