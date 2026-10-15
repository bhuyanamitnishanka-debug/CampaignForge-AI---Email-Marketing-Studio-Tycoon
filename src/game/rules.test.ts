import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDeliverabilityScore,
  calculateScore,
  evaluateSpamCollision,
  getWaveParameters,
  checkWinCondition,
  checkGameOverCondition
} from './rules.ts';

test('calculateDeliverabilityScore stays at 100 on clean deliveries', () => {
  assert.equal(calculateDeliverabilityScore(100, 0, 0), 100);
});

test('calculateDeliverabilityScore drops with bounces and spam traps', () => {
  const score = calculateDeliverabilityScore(50, 10, 5);
  assert.ok(score < 90, 'Score should be penalized');
  assert.ok(score > 0, 'Score should remain non-negative');
});

test('calculateScore scales with deliveries and combo tier', () => {
  const lowComboScore = calculateScore(10, 0, 2);
  const highComboScore = calculateScore(10, 20, 2);
  assert.ok(highComboScore > lowComboScore, 'Higher combo should yield higher score');
});

test('evaluateSpamCollision absorbs damage when shield is active', () => {
  const result = evaluateSpamCollision(3, 1);
  assert.equal(result.shieldConsumed, 1);
  assert.equal(result.remainingShield, 2);
  assert.equal(result.damage, 0);
});

test('evaluateSpamCollision inflicts damage and bounce when shield is depleted', () => {
  const result = evaluateSpamCollision(0, 2);
  assert.equal(result.shieldConsumed, 0);
  assert.equal(result.remainingShield, 0);
  assert.equal(result.damage, 2);
  assert.equal(result.bounceAdded, 4);
});

test('getWaveParameters increases challenge with wave number', () => {
  const wave1 = getWaveParameters(1);
  const wave3 = getWaveParameters(3);
  assert.ok(wave3.enemySpeed > wave1.enemySpeed, 'Wave 3 enemy speed should be faster');
  assert.ok(wave3.targetDeliveries > wave1.targetDeliveries, 'Wave 3 requires more deliveries');
});

test('checkWinCondition and checkGameOverCondition accurately gate state', () => {
  assert.equal(checkWinCondition(20, 20), true);
  assert.equal(checkWinCondition(19, 20), false);

  assert.equal(checkGameOverCondition(55, 3), true, 'Below 60% deliverability triggers game over');
  assert.equal(checkGameOverCondition(90, 0), true, '0 shield pips triggers game over');
  assert.equal(checkGameOverCondition(95, 2), false, 'Healthy stats allow play to continue');
});
