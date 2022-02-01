setInterval(checkIfTurnAndPlay, 2500)
socket.on('is in showdown', handleShowdown)
socket.on('distributing pot', handlePotDistribution)
let tauntOpportunity = false; // set to true if I'm in a showdown and someone else is all-in

const mb = { // constants
    BIG_BLIND: game.big_blind/100, // not accounting for someone changing BB mid-game
    ALL: 'all'
}

const preFlopHandsToBetMultipliers = {
    // hand_ranks: [call_to, raise_to]
    // call_to and raise_to are multipliers of the big blind
    AA: [mb.ALL, mb.ALL],
    72: [mb.ALL, mb.ALL],
    KK: [mb.ALL, mb.ALL],
    QQ: [mb.ALL, mb.ALL],
    JJ: [mb.ALL, mb.ALL],
    TT: [mb.ALL, mb.ALL],
    99: [mb.ALL, mb.ALL],
    88: [mb.ALL, mb.ALL],
    AK: [mb.ALL, mb.ALL],
    AQ: [mb.ALL, mb.ALL],
    AJ: [mb.ALL, mb.ALL],
    KQ: [8, 3],
    KJ: [8, 3],
    AT: [8, 3],
    77: [8, 1],
    66: [8, 1],
    55: [8, 1],
    44: [8, 1],
    33: [8, 1],
    22: [8, 1],
    A9: [8, 1],
    A8: [8, 1]
}


function checkIfTurnAndPlay () {
    if (!game.action_widget || !game.players[game.client_perspective].cards.card_str) {
        // seems like sometimes action_widget will be truthy but there are no cards... skip
        return
    }
    playHand(game.players[game.client_perspective].cards.card_str, game.board.card_str)
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
        // TODO if someone else went all in, you can't raise. Doesn't mean we should go all in though.
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
    if (!game.action_widget.bet_button && !game.action_widget.raise_button) {
        console.log("Wanted to go all in, but it looks like there's no bet or raise button, so I'll call")
        callOrCheck()
        return;
    }
    const numXValues = game.action_widget.x_values.length;
    const xValueForAllIn = game.action_widget.x_values[numXValues - 1]
    game.action_widget.update_sizing_input_by_position(xValueForAllIn)
    game.action_widget.execute_bet_raise()
}

playHand = function(handString, boardString) {
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
    const [card1, card2] = cardStringToObj(cardsString)
    const handRanksString = card1.rank + card2.rank
    const betMultipliers = preFlopHandsToBetMultipliers[handRanksString]
    
    if (!betMultipliers) {
        console.log(`My hand is ${cardsString} pre-flop. Folding or checking.`)
        fold()
        return
    }

    const [callToMult, raiseToMult] = betMultipliers;
    const betInFront = game.action_widget.bet_in_front;
    const toCall = game.action_widget.to_call / 100;
    const betSizeIfCall = betInFront + toCall;
    if (raiseToMult === mb.ALL) {
        console.log(`My hand is ${cardsString} pre-flop. Going all in.`)
        goAllIn()
    } else if (betSizeIfCall < raiseToMult * mb.BIG_BLIND) {
        const betSize = raiseToMult * mb.BIG_BLIND;
        if (betSize >= game.action_widget.next_legal_raise) {
            // the bet we want to make is greater than our min bet, so we're good to go
            console.log(`My hand is ${cardsString} pre-flop. Raising to ${betSize}.`)
            game.action_widget.update_slider_by_value(betSize);
            game.action_widget.sizing_input.value = betSize;
            game.action_widget.execute_bet_raise()
        } else if (betSizeIfCall <= callToMult * mb.BIG_BLIND) {
            // we wanted to raise by too small of an amount, so check if our call limit allows calling
            console.log(`My hand is ${cardsString} pre-flop. I wanted to raise to ${betSize} but ` +
                `the minimum bet was higher so I'm calling at ${betSizeIfCall}.`)
            callOrCheck()
        } else {
            console.log(`My hand is ${cardsString} pre-flop. I wanted to raise to ${betSize} but ` +
                `the minimum bet was higher. I could've called at ${betSizeIfCall} but the call ` +
                `limit for this hand was ${callToMult * mb.BIG_BLIND} so I'm folding.`)
            fold()
        }
    } else if (callToMult === mb.ALL || betSizeIfCall <= callToMult * mb.BIG_BLIND) {
        console.log(`My hand is ${cardsString} pre-flop. Calling at ${betSizeIfCall}.`)
        callOrCheck()
    } else {
        console.log(`My hand is ${cardsString} pre-flop. I'd have to bet ${betSizeIfCall} ` +
            `to call but my raise limit is ${raiseToMult * mb.BIG_BLIND} and call limit is ` +
            `${callToMult * mb.BIG_BLIND} so I'm folding.`)
        fold()
    }  
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

function handleShowdown() {
    const seat = game.client_perspective
    if (game.n_players_in_hand > 1 && game.players[seat].is_sitting_in && !game.players[seat].is_folded) {
        console.log('SHOWDOWN WITH ME IN IT')
        tauntOpportunity = Object.entries(game.players).some(([i, player]) => 
            player.is_sitting_in && !player.is_folded && player.chips === 0 && i !== seat
        )
        console.log('tauntOpportunity', tauntOpportunity)
    }
}

function handlePotDistribution(potData) {
    const seat = game.client_perspective;
    if (tauntOpportunity && potData.winners[seat] && Object.keys(potData.winners).length === 1) {
        // TODO will taunt before animations finish. eventually, add a delay or wait for some event
        // indicating animations are done
        console.log('Taunting because I knocked someone out!')
        socket.emit('taunt', {taunt: 16, id: game.table_id, group_id: game.group_id})
    }
    tauntOpportunity = false
}