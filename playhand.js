setInterval(checkIfTurnAndPlay, 1000)

function checkIfTurnAndPlay () {
    if (!game.action_widget) {
        return
    }
    playhand(game.players[game.action_widget.seat].cards.card_str, game.board.card_str)
}

function fold() {
    if (game.action_widget.to_call === 0) {
        callOrCheck()
    } else {
        game.action_widget.execute_fold()
    }
}

function callOrCheck() {
    game.action_widget.execute_check_call()
}

function makePotSizeBet() {
    const potSizeIfCall = game.action_widget.pot_size - game.action_widget.bet_in_front + game.action_widget.last_bet;
    game.action_widget.update_slider_by_value(potSizeIfCall + game.action_widget.last_bet);
    game.action_widget.execute_bet_raise();
}

function goAllIn() {
    const numXValues = game.action_widget.x_values.length;
    const xValueForAllIn = game.action_widget.x_values[numXValues - 1]
    game.action_widget.update_sizing_input_by_position(xValueForAllIn)
    game.action_widget.execute_bet_raise()
}

playhand = function(handString, boardString) {
    if (game.ruleset_name !== 'NL Texas Holdem') {
        console.log(`Folding/checking because we aren't playing 'NL Texas Holdem'. The game is ${game.ruleset_name}.`)
        fold()
        return;
    }

    if (boardString === "") {
        preflop(handString)
    }
    else {
        postflop(handString, boardString)
    }

    handRanksString = cards[0].rank + cards[1].rank

    // On these hands go all in
    allInRanks = ["72", "AA", "KK", "QQ", "JJ", "1010", "99", "88", "77", "66", "55", "44", "33", "22", "AK", "AQ", "AJ"]
    if (allInRanks.includes(handRanksString)) {
        goAllIn()
    } else {
        fold()
    }

    preflopCallRanks = ["77", "66", "55", "44", "33", "22"]
    if (preflopCallRanks)
}

function cardStringToObj(cardsString) {
    cards = [];
    cardsString.split("?").forEach(cardString => {
        if (cardString === "") {
            return;
        }
        suit = cardString[cardString.length - 1];
        if (cardString.length > 2) {
            rank = "10"
        }
        else {
            rank = cardString[0]
        }
        console.log("rank: " + rank);
        console.log("suit: " + suit);
        
        ranknum = 0;
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
        ranknum -= 2;

        card = {
            'suit': suit,
            'rank': rank,
            'ranknum': ranknum
        };
        cards.push(card);
    })
    cards.sort((a,b) => (b.ranknum - a.ranknum));
    return cards
}

function preflop(cardsString) {
    cards = cardStringToObj(cardsString)
    handRanksString = cards[0].rank + cards[1].rank

    // On these hands go all in
    allInRanks = ["72", "AA", "KK", "QQ", "JJ", "1010", "99", "88", "AK", "AQ", "AJ"];
    if (allInRanks.includes(handRanksString)) {
        goAllIn()
        return
    }

    preflopBetRanks = ["KQ", "KJ", "A10"];
    if (preflopBetRanks.includes(handRanksString)) {
        makePotSizeBet()
        return
    }

    preflopCallRanks = ["77", "66", "55", "44", "33", "22", "A9", "A8"];
    if (preflopCallRanks.includes(handRanksString)) {
        callOrCheck()
        return
    }

    fold()
}

function postflop(cardsString, boardCardsString) {
    cards = cardStringToObj(cardsString)
    boardCards = cardStringToObj(boardCardsString)

    if (cards[0].rank === cards[1].rank) {
        // Pocket pairs
        // Will go all in with trips or fold
        boardCards.forEach((boardCard) => {
            if (boardCard.rank === cards[0].rank) {
                // hit trips
                console.log("we hit trips")
                goAllIn()
                return
            }
        });
    }

    boardCards.forEach((boardCard) => {
        if (boardCard.rank === cards[0].rank || boardCard.rank === cards[1].rank) {
            // paired up
            console.log("we hit a pair")
            makePotSizeBet()
            return
        } 
    })

    // See if we have a flush
    suitFreqWithBoard = {"d": 0, "h": 0, "c": 0, "s": 0}
    cards.forEach( (card) => {
        suitFreqWithBoard[card.suit] += 1
    })
    boardCards.forEach( (card) => {
        suitFreqWithBoard[card.suit] += 1
    })
    if (Math.max(...Object.values(suitFreqWithBoard) >= 5)) {
        console.log("we have a flush")
        goAllIn()
        return
    }
    
    fold()
}