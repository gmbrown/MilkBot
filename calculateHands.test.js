import { winAgainstPercent } from './calculateHands';
import { cardStringToObj } from './util';

test('pocket aces', () => {
  const hand = cardStringToObj('AH?AD?');
  const board = cardStringToObj('AS?AC?4D?');
  const percent = winAgainstPercent(hand, board);
  expect(percent).toBeGreaterThan(0.999);
});
