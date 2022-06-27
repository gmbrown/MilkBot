const nonNumericRankToNum = {
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export function cardStringToObj(cardsString) {
  const cards = cardsString
    .split('?')
    .filter((card) => card !== '')
    .map((cardString) => {
      const rank = cardString[0];
      const suit = cardString[1];

      let ranknum = nonNumericRankToNum[rank] || parseInt(rank);
      // Rank number should go 0 - 12
      ranknum -= 2;

      return {
        suit,
        rank,
        ranknum,
        cardString,
      };
    });
  cards.sort((a, b) => b.ranknum - a.ranknum);
  return cards;
}
