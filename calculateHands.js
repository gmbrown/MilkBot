const mb = { // constants
  HIGH_CARD: 'HIGH CARD',
  PAIR: 'PAIR',
  TWO_PAIR: 'TWO PAIR',
  THREE_OF_A_KIND: 'THREE OF A KIND',
  STRAIGHT: 'STRAIGHT',
  FLUSH: 'FLUSH',
  FULL_HOUSE: 'FULL HOUSE',
  FOUR_OF_A_KIND: 'FOUR OF A KIND',
  STRAIGHT_FLUSH: 'STRAIGHT FLUSH'
}

function cardStringToObj(cardsString) {
  var cards = [];
  cardsString.split("?").forEach(cardString => {
      if (cardString === "") {
          return;
      }
      var rank = cardString[0];
      var suit = cardString[1];

      var ranknum = 0;
      switch(rank) {
          case 'T':
              ranknum = 10;
              break;
          case 'J':
              ranknum = 11;
              break;
          case 'Q':
              ranknum = 12;
              break;
          case 'K':
              ranknum = 13;
              break;
          case 'A':
              ranknum = 14;
              break;
          default:
              ranknum = parseInt(rank)
      }
      // Rank number should go 0 - 12
      ranknum -= 2;

      var card = {
          'suit': suit,
          'rank': rank,
          'ranknum': ranknum
      };
      cards.push(card);
  })
  cards.sort((a,b) => (b.ranknum - a.ranknum));
  return cards
}

function checkStraightOrDrawOfLength(allCards, lengthOfDraw) {
  const sortedRanks = allCards.sort((a, b) => a.ranknum - b.ranknum).map(c => c.rank)
  let uniqueRanksInOrder = [... new Set(sortedRanks)].join('')
  if (uniqueRanksInOrder.endsWith("A")) {
      uniqueRanksInOrder = "A" + uniqueRanksInOrder
  }

  for (i = 0; i <= uniqueRanksInOrder.length - lengthOfDraw; i++) {
      subStringToCheck = uniqueRanksInOrder.slice(i, i + lengthOfDraw)
      if ("A23456789TJQKA".indexOf(subStringToCheck) !== -1) {
          return subStringToCheck[lengthOfDraw - 1]
      }
  }
}

function myPokerHand(handCards, boardCards) {
  const rankToCount = {};
  const suitToCount = {};
  const allCards = handCards.concat(boardCards);
  allCards.forEach(card => {
      const currentRankCount = rankToCount[card.rank] || 0;
      rankToCount[card.rank] = currentRankCount + 1;

      const currentSuitCount = suitToCount[card.suit] || 0;
      suitToCount[card.suit] = currentSuitCount + 1;
  });

  let highestCount = 0
  let secondHighestCount = 0
  Object.entries(rankToCount).forEach(([rank, count]) => {
      if (count > highestCount) {
          secondHighestCount = highestCount
          highestCount = count
      }
      else if (count > secondHighestCount) {
          secondHighestCount = count
      }
  });

  // Check straight flush
  var hasFlush = false;
  var flushRanks = [];
  var staightFlushTopRank;
  Object.entries(suitToCount).forEach(([suit, count]) => {
      if (count >= 5) {
          hasFlush = true
          const cardsOfSuit = allCards.filter(card => card.suit === suit)
          flushRanks = cardsOfSuit.sort((a, b) => b.ranknum - a.ranknum).map(card => card.rank).slice(0, 5);
          staightFlushTopRank = checkStraightOrDrawOfLength(cardsOfSuit, 5)
      }
  })

  if (staightFlushTopRank) {
    return {
      hand: mb.STRAIGHT_FLUSH,
      handRanks: [staightFlushTopRank],
      kickers: []
    }
  }

  // Check 4 of a kind
  if (highestCount === 4) {
    var fourOfAKindRank = [];
    for (rank in rankToCount) {
      if (rankToCount[rank] == 4) {
        fourOfAKindRank.push(rank);
      }
    }

    var cardsMinusFourOfAKind = allCards.filter(card => card.rank != fourOfAKindRank[0]);

    return {
      hand: mb.FOUR_OF_A_KIND,
      handRanks: fourOfAKindRank,
      kickers: getTopNRanks(cardsMinusFourOfAKind, 1)
    }
  }

  // Check full house
  if (highestCount === 3 && secondHighestCount >= 2) {
    var tripRanks = [];
    var pairRanks = [];
    for (rank in rankToCount) {
      if (rankToCount[rank] == 3) {
        tripRanks.push(rank);
      } else if (rankToCount[rank] == 2) {
        pairRanks.push(rank);
      }

    }
    return {
      hand: mb.FULL_HOUSE,
      handRanks: [tripRank, pairRank],
      kickers: []
    }
  }

  // Check flush
  if (hasFlush) {
    return {
      hand: mb.FLUSH,
      handRanks: flushRanks,
      kickers: []
    }
  }

  // Check straight
  const topRankInStraight = checkStraightOrDrawOfLength(allCards, 5);
  if (topRankInStraight) {
    return {
      hand: mb.STRAIGHT,
      handRanks: [topRankInStraight],
      kickers: []
    }
  }

  // Check 3 of a kind
  if (highestCount === 3) {
    var tripRank = [];
    for (rank in rankToCount) {
      if (rankToCount[rank] == 3) {
        tripRank.push(rank);
      }
    }

    var cardsMinusTrips = allCards.filter(card => card.rank != tripRank[0]);

    return {
      hand: mb.THREE_OF_A_KIND,
      handRanks: tripRank,
      kickers: getTopNRanks(cardsMinusTrips, 2)
    }
  }

  // Check 2 pair
  if (highestCount === 2 && secondHighestCount === 2) {
    var pairRanks = []
    for (rank in rankToCount) {
      if (rankToCount[rank] == 2) {
        pairRanks.push(rank);
      }
    }

    pairRanks.sort((a, b) => 'AKQJT98765432'.indexOf(a) - 'AKQJT98765432'.indexOf(b));

    var cardsMinusPairs = allCards.filter(card => !pairRanks.includes(card.rank));

    return {
      hand: mb.TWO_PAIR,
      handRanks: pairRanks,
      kickers: getTopNRanks(cardsMinusPairs, 1)
    }
  }

  // Check pair
  if (highestCount === 2) {
    var pairRank = [];
    for (rank in rankToCount) {
      if (rankToCount[rank] == 2) {
        pairRank.push(rank);
      }
    }

    var cardsMinusPair = allCards.filter(card => card.rank != pairRank);

    return {
      hand: mb.PAIR,
      handRanks: pairRank,
      kickers: getTopNRanks(cardsMinusPair, 3)
    }
  }

  return {
    hand: mb.HIGH_CARD,
    handRanks: [],
    kickers: getTopNRanks(allCards, 5)
  }
}

function getTopNRanks(cards, n) {
  var ranksInCards = cards.map(card => card.rank);

  var topNRanks = [];
  const ranks = 'AKQJT98765432'
  for (var i = 0; i < ranks.length; i++) {
    if (ranksInCards.includes(ranks[i])) {
      topNRanks.push(ranks[i]);
      if (topNRanks.length == n) {
        return topNRanks;
      }
    }
  }
  return topNRanks;
}