import { HANDS } from './constants';
import { checkStraightOrDrawOfLength, myPokerHand } from './handUtils';
import { cardStringToObj } from './util';

describe('checkStraightOrDrawOfLength', () => {
  test('finds straight of 5', () => {
    const cards = cardStringToObj('3C?2D?4C?5H?6S?');
    const topRankInStraight = checkStraightOrDrawOfLength(cards, 5);
    expect(topRankInStraight).toBe('6');
  });

  test('finds straight of 5 with gap', () => {
    const cards = cardStringToObj('3C?2D?4C?5H?6S?8S?');
    const topRankInStraight = checkStraightOrDrawOfLength(cards, 5);
    expect(topRankInStraight).toBe('6');
  });

  test('finds straight of 5 with A low', () => {
    const cards = cardStringToObj('3C?2D?4C?5H?AS?');
    const topRankInStraight = checkStraightOrDrawOfLength(cards, 5);
    expect(topRankInStraight).toBe('5');
  });

  test('finds straight of 5 with A high', () => {
    const cards = cardStringToObj('TC?QD?JC?AS?KH?');
    const topRankInStraight = checkStraightOrDrawOfLength(cards, 5);
    expect(topRankInStraight).toBe('A');
  });

  test('picks highest rank if multiple straights', () => {
    const cards = cardStringToObj('3C?2D?4C?5H?6S?8S?7S?');
    const topRankInStraight = checkStraightOrDrawOfLength(cards, 5);
    expect(topRankInStraight).toBe('8');
  });

  test('returns undefined for no straight', () => {
    const cards = cardStringToObj('6C?8D?9C?JH?7S?');
    const topRankInStraight = checkStraightOrDrawOfLength(cards, 5);
    expect(topRankInStraight).toBe(undefined);
  });

  //TODO: test draws??
});

describe('myPokerHand', () => {
  test('finds straight flush', () => {
    const handCards = cardStringToObj('9H?5H?');
    const boardCards = cardStringToObj('7H?8H?JH?6H?4H?');
    const hand = myPokerHand(handCards, boardCards);
    expect(hand).toStrictEqual({
      hand: HANDS.STRAIGHT_FLUSH,
      handRanks: ['9'],
      kickers: [],
    });
  });

  test('finds four of a kind', () => {
    const handCards = cardStringToObj('TH?TC');
    const boardCards = cardStringToObj('7H?8H?TS?6H?TD?');
    const hand = myPokerHand(handCards, boardCards);
    expect(hand).toStrictEqual({
      hand: HANDS.FOUR_OF_A_KIND,
      handRanks: ['T'],
      kickers: ['8'],
    });
  });

  describe('full house', () => {
    test('finds full house', () => {
      const handCards = cardStringToObj('JH?6C');
      const boardCards = cardStringToObj('6S?8H?JS?6H?3C?');
      const hand = myPokerHand(handCards, boardCards);
      expect(hand).toStrictEqual({
        hand: HANDS.FULL_HOUSE,
        handRanks: ['6', 'J'],
        kickers: [],
      });
    });

    test('finds full house from 2 trips', () => {
      const handCards = cardStringToObj('JH?6C');
      const boardCards = cardStringToObj('6S?8H?JS?6H?JC?');
      const hand = myPokerHand(handCards, boardCards);
      expect(hand).toStrictEqual({
        hand: HANDS.FULL_HOUSE,
        handRanks: ['J', '6'],
        kickers: [],
      });
    });

    test('finds best full house with 2 pairs', () => {
      const handCards = cardStringToObj('JH?6C');
      const boardCards = cardStringToObj('6S?8H?JS?8D?JC?');
      const hand = myPokerHand(handCards, boardCards);
      expect(hand).toStrictEqual({
        hand: HANDS.FULL_HOUSE,
        handRanks: ['J', '8'],
        kickers: [],
      });
    });
  });

  test('finds flush', () => {
    const handCards = cardStringToObj('3H?TH');
    const boardCards = cardStringToObj('6H?8H?JH?4H?QH?');
    const hand = myPokerHand(handCards, boardCards);
    expect(hand).toStrictEqual({
      hand: HANDS.FLUSH,
      handRanks: ['Q', 'J', 'T', '8', '6'],
      kickers: [],
    });
  });

  test('finds straight', () => {
    const handCards = cardStringToObj('9H?5D?');
    const boardCards = cardStringToObj('7H?8S?JC?6C?4D?');
    const hand = myPokerHand(handCards, boardCards);
    expect(hand).toStrictEqual({
      hand: HANDS.STRAIGHT,
      handRanks: ['9'],
      kickers: [],
    });
  });

  test('finds 3 of a kind', () => {
    const handCards = cardStringToObj('3H?3D?');
    const boardCards = cardStringToObj('AH?TS?JC?3C?8D?');
    const hand = myPokerHand(handCards, boardCards);
    expect(hand).toStrictEqual({
      hand: HANDS.THREE_OF_A_KIND,
      handRanks: ['3'],
      kickers: ['A', 'J'],
    });
  });

  test('finds 2 pair', () => {
    const handCards = cardStringToObj('9H?5D?');
    const boardCards = cardStringToObj('5H?9S?6C?QC?4D?');
    const hand = myPokerHand(handCards, boardCards);
    expect(hand).toStrictEqual({
      hand: HANDS.TWO_PAIR,
      handRanks: ['9', '5'],
      kickers: ['Q'],
    });
  });

  test('finds pair', () => {
    const handCards = cardStringToObj('9H?5D?');
    const boardCards = cardStringToObj('5H?TS?6C?QC?4D?');
    const hand = myPokerHand(handCards, boardCards);
    expect(hand).toStrictEqual({
      hand: HANDS.PAIR,
      handRanks: ['5'],
      kickers: ['Q', 'T', '9'],
    });
  });

  test('finds high card', () => {
    const handCards = cardStringToObj('9H?5D?');
    const boardCards = cardStringToObj('3H?AS?6C?QC?4D?');
    const hand = myPokerHand(handCards, boardCards);
    expect(hand).toStrictEqual({
      hand: HANDS.HIGH_CARD,
      handRanks: [],
      kickers: ['A', 'Q', '9', '6', '5'],
    });
  });
});
