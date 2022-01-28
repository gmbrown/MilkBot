setInterval(checkIfTurnAndPlay, 2500)
socket.on('distributing pot', checkWhoWonAndMaybeTaunt)

function checkIfTurnAndPlay () {
    if (!game.action_widget || !game.players[game.client_perspective].cards.card_str) {
        // seems like sometimes action_widget will be truthy but there are no cards... skip
        return
    }
    playhand(game.players[game.client_perspective].cards.card_str, game.board.card_str)
}

function showCardsAtEndOfHand() {
    if (game.game_options_widget.allow_easy_reveal && !game.game_options_widget.easy_reveal.is_checked()) {
        game.game_options_widget.easy_reveal.make_selected()
    }
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

function makePotSizedBet() {
    const minIndex = game.action_widget.threshold_tags.indexOf('min');
    const potThresholdIndex = game.action_widget.threshold_tags.indexOf('pot') - minIndex;
    const numXValues = game.action_widget.x_values.length;
    const shouldUseAllInXValue = potThresholdIndex === -1 || potThresholdIndex + 1 > numXValues
    const xValueIndex = shouldUseAllInXValue ? numXValues - 1 : potThresholdIndex
    try {
        game.action_widget.update_sizing_input_by_position(game.action_widget.x_values[xValueIndex])
        game.action_widget.execute_bet_raise();
    } catch (e) {
        console.error(e); // probably this will only throw if there is no option to raise
        console.log(`Expecting bet_button to be falsy and it is: ${game.action_widget.bet_button}`)
        console.log(`Expecting raise_button to be falsy and it is: ${game.action_widget.raise_button}`)
        if (game.action_widget.all_in) {
            console.log('Seems like the all-in button is visible. Going all in.')
            game.action_widget.all_in.execute()
        } else if (game.action_widget.call_button) {
            console.log('Seems like the call button is visible, but not all-in. Calling.')
            game.action_widget.call_button.execute()
        } else {
            console.error('Not sure what to do. HELP.')
        }
    }
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
    showCardsAtEndOfHand()

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

function preflop(cardsString) {
    var cards = cardStringToObj(cardsString)
    var handRanksString = cards[0].rank + cards[1].rank

    // On these hands go all in
    var allInRanks = ["72", "AA", "KK", "QQ", "JJ", "TT", "99", "88", "AK", "AQ", "AJ"];
    if (allInRanks.includes(handRanksString)) {
        console.log(`My hand is ${cardsString} pre-flop. Going all in.`)
        goAllIn()
        return
    }

    var preflopBetRanks = ["KQ", "KJ", "AT"];
    if (preflopBetRanks.includes(handRanksString)) {
        console.log(`My hand is ${cardsString} pre-flop. Making pot-sized bet.`)
        makePotSizedBet()
        return
    }

    var preflopCallRanks = ["77", "66", "55", "44", "33", "22", "A9", "A8"];
    if (preflopCallRanks.includes(handRanksString)) {
        console.log(`My hand is ${cardsString} pre-flop. Calling or checking.`)
        callOrCheck()
        return
    }

    console.log(`My hand is ${cardsString} pre-flop. Folding or checking.`)
    fold()
}

function postflop(cardsString, boardCardsString) {    
    var cards = cardStringToObj(cardsString)
    var boardCards = cardStringToObj(boardCardsString)

    if (cards[0].rank === cards[1].rank) {
        // Pocket pairs
        // Will go all in with trips or fold
        var hitTrips = false;
        boardCards.forEach((boardCard) => {
            if (boardCard.rank === cards[0].rank) {
                hitTrips = true
                console.log("we hit trips")
            }
        });
        if (hitTrips) {
            console.log(`My hand is ${cardsString} and the board shows ${boardCardsString}. Going all in.`)
            goAllIn()
            return
        }
    }

    var hitPair = false
    boardCards.forEach((boardCard) => {
        if (boardCard.rank === cards[0].rank || boardCard.rank === cards[1].rank) {
            hitPair = true;
            console.log("we hit a pair")
        } 
    })
    if (hitPair) {
        console.log(`My hand is ${cardsString} and the board shows ${boardCardsString}. Making pot-sized bet.`)
        makePotSizedBet()
        return
    }

    // See if we have a flush
    var suitFreqWithBoard = {"D": 0, "H": 0, "C": 0, "S": 0}
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
    
    console.log(`My hand is ${cardsString} and the board shows ${boardCardsString}. Folding or checking.`)
    fold()
}

function checkWhoWonAndMaybeTaunt(potData) {
    const seat = game.client_perspective;
    if (potData.winners.length > 1 || !potData.winners[seat]) {
        // either there is more than one winner or someone other than the bot won. do nothing
        return;
    }
    const knockedSomeoneOut = Object.keys(potData.stack_consistency_check)
        .some(key => key !== seat && potData.stack_consistency_check[key] === 0)
    // TODO if someone was knocked out a while ago would they show up here?
    // or does it only include people from that hand?

    if (knockedSomeoneOut) {
        console.log(`I think I knocked someone out. Btw my seat number is ${seat}. Pot data:`)
        console.dir(potData)
        socket.emit('taunt', {taunt: 16, id: game.table_id, group_id: game.group_id})
    }
}