import { HANDS, RANK_TO_NUMRANK } from './constants';

export function checkStraightOrDrawOfLength(allCards, lengthOfDraw) {
  const sortedRanks = allCards
    .sort((a, b) => b.ranknum - a.ranknum)
    .map((c) => c.rank);
  let uniqueRanksInOrder = [...new Set(sortedRanks)].join('');
  if (uniqueRanksInOrder.startsWith('A')) {
    uniqueRanksInOrder = uniqueRanksInOrder + 'A';
  }

  for (let i = 0; i <= uniqueRanksInOrder.length - lengthOfDraw; i++) {
    const subStringToCheck = uniqueRanksInOrder.slice(i, i + lengthOfDraw);
    if ('AKQJT98765432A'.includes(subStringToCheck)) {
      return subStringToCheck[0];
    }
  }
}

export function myPokerHand(handCards, boardCards) {
  const rankToCount = new Map();
  const suitToCount = new Map();
  const allCards = handCards.concat(boardCards);
  allCards.sort((a, b) => b.ranknum - a.ranknum);
  allCards.forEach((card) => {
    rankToCount.set(card.rank, (rankToCount.get(card.rank) || 0) + 1);
    suitToCount.set(card.suit, (suitToCount.get(card.suit) || 0) + 1);
  });

  let highestRankAndCount = { count: 0 };
  let secondHighestRankAndCount = { count: 0 };
  rankToCount.forEach((count, rank) => {
    // maps preserve insertion order, so we know higher ranks always come first
    if (count > highestRankAndCount.count) {
      secondHighestRankAndCount = highestRankAndCount;
      highestRankAndCount = { rank, count };
    } else if (count > secondHighestRankAndCount.count) {
      secondHighestRankAndCount = { rank, count };
    }
  });

  // Check straight flush
  let flushRanks;
  let straightFlushTopRank;
  suitToCount.forEach((count, suit) => {
    if (count >= 5) {
      const cardsOfSuit = allCards.filter((card) => card.suit === suit);
      flushRanks = cardsOfSuit.map((card) => card.rank).slice(0, 5);
      straightFlushTopRank = checkStraightOrDrawOfLength(cardsOfSuit, 5);
    }
  });

  if (straightFlushTopRank) {
    return {
      hand: HANDS.STRAIGHT_FLUSH,
      handRanks: [straightFlushTopRank],
      kickers: [],
    };
  }

  // Check 4 of a kind
  if (highestRankAndCount.count === 4) {
    const fourOfAKindRank = highestRankAndCount.rank;
    const cardsMinusFourOfAKind = allCards.filter(
      (card) => card.rank != fourOfAKindRank
    );

    return {
      hand: HANDS.FOUR_OF_A_KIND,
      handRanks: [fourOfAKindRank],
      kickers: getTopNRanks(cardsMinusFourOfAKind, 1),
    };
  }

  // Check full house
  if (highestRankAndCount.count === 3 && secondHighestRankAndCount.count >= 2) {
    const tripRank = highestRankAndCount.rank;
    const pairRank = secondHighestRankAndCount.rank;

    return {
      hand: HANDS.FULL_HOUSE,
      handRanks: [tripRank, pairRank],
      kickers: [],
    };
  }

  // Check flush
  if (flushRanks) {
    return {
      hand: HANDS.FLUSH,
      handRanks: flushRanks,
      kickers: [],
    };
  }

  // Check straight
  const topRankInStraight = checkStraightOrDrawOfLength(allCards, 5);
  if (topRankInStraight) {
    return {
      hand: HANDS.STRAIGHT,
      handRanks: [topRankInStraight],
      kickers: [],
    };
  }

  // Check 3 of a kind
  if (highestRankAndCount.count === 3) {
    const tripRank = highestRankAndCount.rank;
    var cardsMinusTrips = allCards.filter((card) => card.rank != tripRank);

    return {
      hand: HANDS.THREE_OF_A_KIND,
      handRanks: [tripRank],
      kickers: getTopNRanks(cardsMinusTrips, 2),
    };
  }

  // Check 2 pair
  if (
    highestRankAndCount.count === 2 &&
    secondHighestRankAndCount.count === 2
  ) {
    const pairRanks = [
      highestRankAndCount.rank,
      secondHighestRankAndCount.rank,
    ];

    var cardsMinusPairs = allCards.filter(
      (card) => !pairRanks.includes(card.rank)
    );

    return {
      hand: HANDS.TWO_PAIR,
      handRanks: pairRanks,
      kickers: getTopNRanks(cardsMinusPairs, 1),
    };
  }

  // Check pair
  if (highestRankAndCount.count === 2) {
    const pairRank = highestRankAndCount.rank;
    var cardsMinusPair = allCards.filter((card) => card.rank != pairRank);

    return {
      hand: HANDS.PAIR,
      handRanks: [pairRank],
      kickers: getTopNRanks(cardsMinusPair, 3),
    };
  }

  return {
    hand: HANDS.HIGH_CARD,
    handRanks: [],
    kickers: getTopNRanks(allCards, 5),
  };
}

// We're not sorting because we're assuming the cards are already sorted (beginning of myPokerHand)
export function getTopNRanks(cards, n) {
  return cards.map((card) => card.rank).slice(0, n);
}
