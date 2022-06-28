export const HANDS = {
  HIGH_CARD: 'HIGH CARD',
  PAIR: 'PAIR',
  TWO_PAIR: 'TWO PAIR',
  THREE_OF_A_KIND: 'THREE OF A KIND',
  STRAIGHT: 'STRAIGHT',
  FLUSH: 'FLUSH',
  FULL_HOUSE: 'FULL HOUSE',
  FOUR_OF_A_KIND: 'FOUR OF A KIND',
  STRAIGHT_FLUSH: 'STRAIGHT FLUSH',
};

export const RANKED_HANDS = {
  [HANDS.HIGH_CARD]: 1,
  [HANDS.PAIR]: 2,
  [HANDS.TWO_PAIR]: 3,
  [HANDS.THREE_OF_A_KIND]: 4,
  [HANDS.STRAIGHT]: 5,
  [HANDS.FLUSH]: 6,
  [HANDS.FULL_HOUSE]: 7,
  [HANDS.FOUR_OF_A_KIND]: 8,
  [HANDS.STRAIGHT_FLUSH]: 9,
};

export const RANK_TO_NUMRANK = {
  A: 12,
  K: 11,
  Q: 10,
  J: 9,
  T: 8,
  9: 7,
  8: 6,
  7: 5,
  6: 4,
  5: 3,
  4: 2,
  3: 1,
  2: 0,
};

export const ALL_CARD_STRINGS = [
  '2D',
  '2C',
  '2H',
  '2S',
  '3D',
  '3C',
  '3H',
  '3S',
  '4D',
  '4C',
  '4H',
  '4S',
  '5D',
  '5C',
  '5H',
  '5S',
  '6D',
  '6C',
  '6H',
  '6S',
  '7D',
  '7C',
  '7H',
  '7S',
  '8D',
  '8C',
  '8H',
  '8S',
  '9D',
  '9C',
  '9H',
  '9S',
  'TD',
  'TC',
  'TH',
  'TS',
  'JD',
  'JC',
  'JH',
  'JS',
  'QD',
  'QC',
  'QH',
  'QS',
  'KD',
  'KC',
  'KH',
  'KS',
  'AD',
  'AC',
  'AH',
  'AS',
];
