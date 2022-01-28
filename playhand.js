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
}

function cardStringToObj(cardsString) {
    var cards = [];
    cardsString.split("?").forEach(cardString => {
        if (cardString === "") {
            return;
        }
        var suit = cardString[cardString.length - 1];
        if (cardString.length > 2) {
            var rank = "10"
        }
        else {
            var rank = cardString[0]
        }
        
        var ranknum = 0;
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

function preflop(cardsString) {
    var cards = cardStringToObj(cardsString)
    var handRanksString = cards[0].rank + cards[1].rank

    // On these hands go all in
    var allInRanks = ["72", "AA", "KK", "QQ", "JJ", "1010", "99", "88", "AK", "AQ", "AJ"];
    if (allInRanks.includes(handRanksString)) {
        console.log(`My hand is ${cardsString} pre-flop. Going all in.`)
        goAllIn()
        return
    }

    var preflopBetRanks = ["KQ", "KJ", "A10"];
    if (preflopBetRanks.includes(handRanksString)) {
        console.log(`My hand is ${cardsString} pre-flop. Making pot-sized bet.`)
        makePotSizeBet()
        return
    }

    var preflopCallRanks = ["77", "66", "55", "44", "33", "22", "A9", "A8"];
    if (preflopCallRanks.includes(handRanksString)) {
        console.log(`My hand is ${cardsString} pre-flop. Calling or checking.`)
        callOrCheck()
        return
    }

    console.log(`My hand is ${cardsString} pre-flop. Folding.`)
    fold()
}

function postflop(cardsString, boardCardsString) {
    var cards = cardStringToObj(cardsString)
    var boardCards = cardStringToObj(boardCardsString)

    if (cards[0].rank === cards[1].rank) {
        // Pocket pairs
        // Will go all in with trips or fold
        boardCards.forEach((boardCard) => {
            if (boardCard.rank === cards[0].rank) {
                // hit trips
                console.log("we hit trips")
                console.log(`My hand is ${cardsString} and the board shows ${boardCardsString}. Going all in.`)
                goAllIn()
                return
            }
        });
    }

    boardCards.forEach((boardCard) => {
        if (boardCard.rank === cards[0].rank || boardCard.rank === cards[1].rank) {
            // paired up
            console.log("we hit a pair")
            console.log(`My hand is ${cardsString} and the board shows ${boardCardsString}. Making pot-sized bet.`)
            makePotSizeBet()
            return
        } 
    })

    // See if we have a flush
    var suitFreqWithBoard = {"d": 0, "h": 0, "c": 0, "s": 0}
    cards.forEach( (card) => {
        suitFreqWithBoard[card.suit] += 1
    })
    boardCards.forEach( (card) => {
        suitFreqWithBoard[card.suit] += 1
    })
    if (Math.max(...Object.values(suitFreqWithBoard)) >= 5) {
        console.log("we have a flush")
        console.log(`My hand is ${cardsString} and the board shows ${boardCardsString}. Going all in.`)
        goAllIn()
        return
    }
    
    fold()
}