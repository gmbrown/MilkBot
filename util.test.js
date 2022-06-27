import { cardStringToObj } from './util';

describe('cardStringToObj', () => {
  test('converts 2-card hand', () => {
    const hand = '2C?3C';
    const expected = [
      { suit: 'C', rank: '3', ranknum: 1, cardString: '3C' },
      { suit: 'C', rank: '2', ranknum: 0, cardString: '2C' },
    ];
    expect(cardStringToObj(hand)).toEqual(expected);
  });

  test('converts face cards', () => {
    const hand = 'TD?QS';
    const expected = [
      { suit: 'S', rank: 'Q', ranknum: 10, cardString: 'QS' },
      { suit: 'D', rank: 'T', ranknum: 8, cardString: 'TD' },
    ];
    expect(cardStringToObj(hand)).toEqual(expected);
  });

  test('handles trailing question mark', () => {
    const hand = '2C?';
    const expected = [{ suit: 'C', rank: '2', ranknum: 0, cardString: '2C' }];
    expect(cardStringToObj(hand)).toEqual(expected);
  });
});
