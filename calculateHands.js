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
          'ranknum': ranknum,
          'cardString': cardString
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

    tripRanks.sort((a, b) => 'AKQJT98765432'.indexOf(a) - 'AKQJT98765432'.indexOf(b));

    // If there are 2 separate 3 of a kinds on the board then we need to treat the lower one as a pair
    if (tripRanks.length > 1) {
      pairRanks.push(tripRanks[1]);
    }
    pairRanks.sort((a, b) => 'AKQJT98765432'.indexOf(a) - 'AKQJT98765432'.indexOf(b));

    return {
      hand: mb.FULL_HOUSE,
      handRanks: [tripRanks[0], pairRanks[0]],
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
    pairRanks = pairRanks.slice(0,2);

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

function compareHands(hand1, hand2, board) {
  var hand1Results = myPokerHand(hand1, board);
  var hand2Results = myPokerHand(hand2, board);

  const handsInOrder = [
    mb.HIGH_CARD,
    mb.PAIR,
    mb.TWO_PAIR,
    mb.THREE_OF_A_KIND,
    mb.STRAIGHT, mb.FLUSH,
    mb.FULL_HOUSE,
    mb.FOUR_OF_A_KIND,
    mb.STRAIGHT_FLUSH
  ]

  var diff = handsInOrder.indexOf(hand1Results.hand) - handsInOrder.indexOf(hand2Results.hand)

  if (diff > 0) {
    return "win";
  } else if (diff < 0) {
    return "lose";
  }

  for (var i = 0; i < hand1Results.handRanks.length; i++) {
    diff = '23456789TJQKA'.indexOf(hand1Results.handRanks[i]) - '23456789TJQKA'.indexOf(hand2Results.handRanks[i]);
    if (diff > 0) {
      return "win";
    } else if (diff < 0) {
      return "lose";
    }
  }

  for (var i = 0; i < hand1Results.kickers.length; i++) {
    diff = '23456789TJQKA'.indexOf(hand1Results.kickers[i]) - '23456789TJQKA'.indexOf(hand2Results.kickers[i]);
    if (diff > 0) {
      return "win";
    } else if (diff < 0) {
      return "lose";
    }
  }

  return "draw";
}

const ALL_CARD_STRINGS = [
  "2D",
  "2C",
  "2H",
  "2S",
  "3D",
  "3C",
  "3H",
  "3S",
  "4D",
  "4C",
  "4H",
  "4S",
  "5D",
  "5C",
  "5H",
  "5S",
  "6D",
  "6C",
  "6H",
  "6S",
  "7D",
  "7C",
  "7H",
  "7S",
  "8D",
  "8C",
  "8H",
  "8S",
  "9D",
  "9C",
  "9H",
  "9S",
  "TD",
  "TC",
  "TH",
  "TS",
  "JD",
  "JC",
  "JH",
  "JS",
  "QD",
  "QC",
  "QH",
  "QS",
  "KD",
  "KC",
  "KH",
  "KS",
  "AD",
  "AC",
  "AH",
  "AS"
]

function winAgainstPercent(hand, board) {
  const exceptCards = new Set([
    ...hand.map(handCard => handCard.cardString),
    ...board.map(boardCard => boardCard.cardString)
  ])

  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (let i = 0; i < ALL_CARD_STRINGS.length; i++) {
    if (exceptCards.has(ALL_CARD_STRINGS[i])) {
      continue;
    }
    for (let j = i + 1; j < ALL_CARD_STRINGS.length; j++) {
      if (exceptCards.has(ALL_CARD_STRINGS[j])) {
        continue;
      }
      const otherHand = cardStringToObj(`${ALL_CARD_STRINGS[i]}?${ALL_CARD_STRINGS[j]}?`);
      const result = compareHands(hand, otherHand, board);
      if (result === "win") {
        wins++;
      } else if (result === "lose") {
        losses++;
      } else if (result === "draw") {
        draws++;
      }
    }
  }

  console.log("wins: " + wins);
  console.log("losses: " + losses);
  console.log("draws: " + draws);
  return (wins / (wins + losses))
}