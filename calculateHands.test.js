import { calculateWinAgainstPercent } from './calculateHands';
import { cardStringToObj } from './util';

test('pocket aces', () => {
  const hand = cardStringToObj('AH?AD?');
  const board = cardStringToObj('AS?AC?4D?');
  const percent = calculateWinAgainstPercent(hand, board);
  expect(percent).toBeGreaterThan(0.999);
});

test('two seven', () => {
  const hand = cardStringToObj('2C?7S?');
  const board = cardStringToObj('3S?9C?KD?');
  const percent = calculateWinAgainstPercent(hand, board);
  expect(percent).toBeCloseTo(0.21, 2);
});

test('unbeatable board', () => {
  const hand = cardStringToObj('7D?5C?');
  const board = cardStringToObj('TS?QC?KH?JD?AD?');
  const percent = calculateWinAgainstPercent(hand, board);
  expect(percent).toBe(1);
});
