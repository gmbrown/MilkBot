setInterval(checkIfTurnAndPlay, 1000)

const checkIfTurnAndPlay = () => {
    if (!game.action_widget) {
        return
    }
    playhand(game.players[game.action_widget.seat].cards.card_str)
}

const fold = () => {
    if (game.action_widget.to_call === 0) {
        game.action_widget.execute_check_call()
    } else {
        game.action_widget.execute_fold()
    }
}

const goAllIn = () => {
    game.action_widget.update_sizing_input_by_position(
        game.action_widget.x_values[game.action_widget.x_values.length - 1]
    )
    game.action_widget.execute_bet_raise()
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
    allInRanks = ["AA", "KK", "QQ", "JJ", "1010", "99", "88", "77", "66", "55", "44", "33", "22", "AK", "AQ", "AJ"]
    if (allInRanks.includes(handRanksString)) {
        goAllIn()
    } else {
        fold()
    }

}