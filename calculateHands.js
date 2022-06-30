import { ALL_CARD_STRINGS, RANK_TO_NUMRANK, RANKED_HANDS } from './constants';
import { cardStringToObj } from './util';
import { myPokerHand } from './handUtils';

function compareHands(hand1Results, hand2Results) {
  var diff = RANKED_HANDS[hand1Results.hand] - RANKED_HANDS[hand2Results.hand];

  if (diff > 0) {
    return 'win';
  } else if (diff < 0) {
    return 'lose';
  }

  for (const [i, handRank] of hand1Results.handRanks.entries()) {
    diff =
      RANK_TO_NUMRANK[handRank] - RANK_TO_NUMRANK[hand2Results.handRanks[i]];
    if (diff > 0) {
      return 'win';
    } else if (diff < 0) {
      return 'lose';
    }
  }

  for (const [i, kicker] of hand1Results.kickers.entries()) {
    diff = RANK_TO_NUMRANK[kicker] - RANK_TO_NUMRANK[hand2Results.kickers[i]];
    if (diff > 0) {
      return 'win';
    } else if (diff < 0) {
      return 'lose';
    }
  }

  return 'draw';
}

export function calculateWinAgainstPercent(hand, board) {
  const exceptCards = new Set([
    ...hand.map((handCard) => handCard.cardString),
    ...board.map((boardCard) => boardCard.cardString),
  ]);
  if (board.length === 5) {
    return winAgainstPercentFullBoard(hand, board, exceptCards);
  } else if (board.length === 4) {
    const allOtherCards = ALL_CARD_STRINGS.filter(
      (card) => !exceptCards.has(card)
    );
    const percentTotal = allOtherCards.reduce((acc, card) => {
      const boardWithCard = [...board, ...cardStringToObj(card)];
      exceptCards.add(card);
      acc += winAgainstPercentFullBoard(hand, boardWithCard, exceptCards);
      exceptCards.delete(card);
      return acc;
    }, 0);
    return percentTotal / allOtherCards.length;
  } else if (board.length === 3) {
    const allOtherCards = ALL_CARD_STRINGS.filter(
      (card) => !exceptCards.has(card)
    );
    let percentTotal = 0;
    for (let i = 0; i < allOtherCards.length; i++) {
      exceptCards.add(allOtherCards[i]);
      for (let j = i + 1; j < allOtherCards.length; j++) {
        exceptCards.add(allOtherCards[j]);
        const boardWithCards = [
          ...board,
          ...cardStringToObj(allOtherCards[i]),
          ...cardStringToObj(allOtherCards[j]),
        ];
        percentTotal += winAgainstPercentFullBoard(
          hand,
          boardWithCards,
          exceptCards
        );
        exceptCards.delete(allOtherCards[j]);
      }
      exceptCards.delete(allOtherCards[i]);
    }
    return (
      percentTotal / ((allOtherCards.length * (allOtherCards.length - 1)) / 2)
    );
  }
}

function winAgainstPercentFullBoard(hand, board, exceptCards) {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  const allOtherCards = ALL_CARD_STRINGS.filter(
    (card) => !exceptCards.has(card)
  );
  const myHandResults = myPokerHand(hand, board);
  for (let i = 0; i < allOtherCards.length; i++) {
    for (let j = i + 1; j < allOtherCards.length; j++) {
      const otherHand = cardStringToObj(
        `${allOtherCards[i]}?${allOtherCards[j]}?`
      );
      const otherHandResults = myPokerHand(otherHand, board);
      const result = compareHands(myHandResults, otherHandResults);
      if (result === 'win') {
        wins++;
      } else if (result === 'lose') {
        losses++;
      } else if (result === 'draw') {
        draws++;
      }
    }
  }
  return wins / (wins + losses);
}
