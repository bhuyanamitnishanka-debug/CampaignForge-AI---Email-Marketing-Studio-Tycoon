import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSpamScore, estimateOpenRate } from './spam-score.ts';

test('analyzeSpamScore flags high-risk spam keywords', () => {
  const result = analyzeSpamScore('GET FREE MONEY NOW! Click here for 100% free miracle cure!!!');
  assert.ok(result.score > 40, 'Should have high spam penalty');
  assert.ok(result.flaggedWords.length >= 2, 'Should flag multiple spam phrases');
  assert.ok(result.issues.length > 0, 'Should list specific deliverability issues');
});

test('analyzeSpamScore passes clean, professional copy', () => {
  const result = analyzeSpamScore('Your quarterly marketing metrics and Q3 product updates');
  assert.equal(result.score, 0, 'Clean copy should have 0 penalty');
  assert.equal(result.rating, 'Clean');
  assert.equal(result.flaggedWords.length, 0);
});

test('analyzeSpamScore penalizes all-caps and excessive punctuation', () => {
  const result = analyzeSpamScore('URGENT NOTICE ATTENTION PLEASE READ NOW!!! $$$');
  assert.ok(result.issues.some(i => i.includes('ALL CAPS')), 'Should detect ALL CAPS');
  assert.ok(result.issues.some(i => i.includes('exclamation')), 'Should detect exclamation marks');
  assert.ok(result.issues.some(i => i.includes('currency symbols')), 'Should detect dollar signs');
});

test('estimateOpenRate rewards curiosity and penalizes spam score', () => {
  const cleanRate = estimateOpenRate('The real reason 82% of email campaigns fail', 'curiosity', 5);
  const spammyRate = estimateOpenRate('FREE CASH FOR YOU NOW!!!', 'urgency', 85);
  assert.ok(cleanRate > spammyRate, 'Clean curiosity subject should have higher predicted open rate');
  assert.ok(cleanRate >= 35, 'Clean curiosity subject should predict strong open rate');
});
