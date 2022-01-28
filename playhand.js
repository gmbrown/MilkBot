goAllIn = function() {
    console.log("Going all in!");
}

fold = function() {
    console.log("Folding :(");
}

playhand = function(handString) {
    cards = [];
    for (const cardString in handString.split("?")) {
        suit = cardString[cardString.length - 1];
        if (cardString.length > 2) {
            rank = "10"
        }
        else {
            rank = cardString[0]
        }
        console.log("rank: " + rank)
        console.log("suit: " + suit)
        
        ranknum = 0
        switch(rank) {
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
        ranknum -= 2

        card = {
            'suit': suit,
            'rank': rank,
            'ranknum': ranknum
        }
        cards.append(card)
    }
    cards.sort((a,b) => (a.ranknum - b.ranknum))

    handRanksString = card[0].rank + card[1].rank

    // On these hands go all in
    allInRanks = ["AA", "KK", "QQ", "JJ" "1010", "99", "88", "77", "66", "55", "44", "33", "22", "AK", "AQ", "AJ"]
    if (allInRanks.includes(handRanksString)) {
        goAllIn()
    } else {
        fold()
    }

}