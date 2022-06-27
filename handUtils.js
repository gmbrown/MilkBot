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
    if ('AKQJT98765432A'.indexOf(subStringToCheck) !== -1) {
      return subStringToCheck[0];
    }
  }
}

export function myPokerHand(handCards, boardCards) {
  const rankToCount = {};
  const suitToCount = {};
  const allCards = handCards.concat(boardCards);
  allCards.forEach((card) => {
    const currentRankCount = rankToCount[card.rank] || 0;
    rankToCount[card.rank] = currentRankCount + 1;

    const currentSuitCount = suitToCount[card.suit] || 0;
    suitToCount[card.suit] = currentSuitCount + 1;
  });

  let highestCount = 0;
  let secondHighestCount = 0;
  Object.entries(rankToCount).forEach(([_, count]) => {
    if (count > highestCount) {
      secondHighestCount = highestCount;
      highestCount = count;
    } else if (count > secondHighestCount) {
      secondHighestCount = count;
    }
  });

  // Check straight flush
  var hasFlush = false;
  var flushRanks = [];
  var staightFlushTopRank;
  Object.entries(suitToCount).forEach(([suit, count]) => {
    if (count >= 5) {
      hasFlush = true;
      const cardsOfSuit = allCards.filter((card) => card.suit === suit);
      flushRanks = cardsOfSuit
        .sort((a, b) => b.ranknum - a.ranknum)
        .map((card) => card.rank)
        .slice(0, 5);
      staightFlushTopRank = checkStraightOrDrawOfLength(cardsOfSuit, 5);
    }
  });

  if (staightFlushTopRank) {
    return {
      hand: HANDS.STRAIGHT_FLUSH,
      handRanks: [staightFlushTopRank],
      kickers: [],
    };
  }

  // Check 4 of a kind
  if (highestCount === 4) {
    const fourOfAKindRank = Object.entries(rankToCount).filter(
      ([, count]) => count === 4
    )[0][0];

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
  if (highestCount === 3 && secondHighestCount >= 2) {
    var tripRanks = [];
    var pairRanks = [];
    for (let rank in rankToCount) {
      if (rankToCount[rank] == 3) {
        tripRanks.push(rank);
      } else if (rankToCount[rank] == 2) {
        pairRanks.push(rank);
      }
    }

    tripRanks.sort((a, b) => RANK_TO_NUMRANK[b] - RANK_TO_NUMRANK[a]);

    // If there are 2 separate 3 of a kinds on the board then we need to treat the lower one as a pair
    if (tripRanks.length > 1) {
      pairRanks.push(tripRanks[1]);
    }
    pairRanks.sort((a, b) => RANK_TO_NUMRANK[b] - RANK_TO_NUMRANK[a]);

    return {
      hand: HANDS.FULL_HOUSE,
      handRanks: [tripRanks[0], pairRanks[0]],
      kickers: [],
    };
  }

  // Check flush
  if (hasFlush) {
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
  if (highestCount === 3) {
    const tripRank = Object.entries(rankToCount).filter(
      ([, count]) => count === 3
    )[0][0];

    var cardsMinusTrips = allCards.filter((card) => card.rank != tripRank);

    return {
      hand: HANDS.THREE_OF_A_KIND,
      handRanks: [tripRank],
      kickers: getTopNRanks(cardsMinusTrips, 2),
    };
  }

  // Check 2 pair
  if (highestCount === 2 && secondHighestCount === 2) {
    const pairRanks = Object.entries(rankToCount)
      .filter(([, count]) => count === 2)
      .map(([rank]) => rank)
      .sort((a, b) => RANK_TO_NUMRANK[b] - RANK_TO_NUMRANK[a])
      .slice(0, 2);

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
  if (highestCount === 2) {
    const pairRank = Object.entries(rankToCount).filter(
      ([, count]) => count === 2
    )[0][0];

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

export function getTopNRanks(cards, n) {
  return cards
    .map((card) => card.rank)
    .sort((a, b) => RANK_TO_NUMRANK[b] - RANK_TO_NUMRANK[a])
    .slice(0, n);
}
