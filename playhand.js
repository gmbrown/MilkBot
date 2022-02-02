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


async function checkIfTurnAndPlay () {
    if (!game.action_widget || !game.players[game.client_perspective].cards.card_str) {
        // seems like sometimes action_widget will be truthy but there are no cards... skip
        return
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    const holeCards = game.players[game.client_perspective].cards.card_str;
    const boardCards = game.board.card_str;
    const boardCardsLogMsg = boardCards ? ` and the board shows ${boardCards}.` : '.';
    console.log(`My hole cards are ${holeCards}${boardCardsLogMsg}`)
    playHand(holeCards, boardCards)
}

function showCardsAtEndOfHand() {
    if (game.game_options_widget.allow_easy_reveal && !game.game_options_widget.easy_reveal.is_checked()) {
        game.game_options_widget.easy_reveal.make_selected()
    }
}

function checkOrFold() {
    if (game.action_widget.to_call === 0) {
        checkOrCall()
    } else {
        game.action_widget.execute_fold()
    }
}

function checkOrCall() {
    game.action_widget.execute_check_call()
}

function makeBetOfSize(callToLimit, raiseToLimit) { // TODO later on, take in increment size so we can do smaller raises
    const betInFront = game.action_widget.bet_in_front;
    const betSizeIfCall = betInFront + (game.action_widget.to_call / 100);
    const betSizeIfAllIn = betInFront + game.action_widget.stack_size;
    const minBet = game.action_widget.threshold_values.length ? game.action_widget.threshold_values[0] : undefined;
    console.info(`Raise to limit: ${raiseToLimit}. Min bet: ${minBet}. Call to limit: ${callToLimit}. Bet size if call: ${betSizeIfCall}.`)
    if (game.action_widget.bet_button || game.action_widget.raise_button) {
        if (minBet <= raiseToLimit) {
            console.log(raiseToLimit === betSizeIfAllIn ? 'Going all in.' : `Raising to ${raiseToLimit}.`)
            game.action_widget.update_slider_by_value(raiseToLimit);
            game.action_widget.sizing_input.value = raiseToLimit;
            game.action_widget.execute_bet_raise();
            return
        }
    }
    // If we get here, either raising wasn't an option in the game or the min bet was too high for us.
    if (game.action_widget.all_in && betSizeIfAllIn <= raiseToLimit) {
        console.log("Can't/won't raise; going all in instead.")
        game.action_widget.all_in.execute()
    } else if (game.action_widget.call_button && betSizeIfCall < callToLimit) {
        console.log("Can't/won't raise; calling instead.")
        checkOrCall()
    } else {
        console.log('Checking/folding.')
        checkOrFold()
    }
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
    const betInFront = game.action_widget.bet_in_front;
    const betSizeIfAllIn = betInFront + game.action_widget.stack_size;
    makeBetOfSize(betSizeIfAllIn, betSizeIfAllIn);
}

function playHand(handString, boardString) {
    if (game.ruleset_name !== 'NL Texas Holdem') {
        console.log(`Folding/checking because we aren't playing 'NL Texas Holdem'. The game is ${game.ruleset_name}.`)
        checkOrFold()
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
        console.log('Checking or folding.')
        checkOrFold()
        return
    }

    const [callToMult, raiseToMult] = betMultipliers;
    const betSizeIfAllIn = game.action_widget.stack_size + game.action_widget.bet_in_front;
    const callToLimit = callToMult === mb.ALL ? betSizeIfAllIn : callToMult * mb.BIG_BLIND;
    const raiseToLimit = raiseToMult === mb.ALL ? betSizeIfAllIn : raiseToMult * mb.BIG_BLIND;
    makeBetOfSize(callToLimit, raiseToLimit);
}

function postflopNew(cardsString, boardCardsString, playersInHand, potSizeAtStartOfRound) {
    // pass
}

function postflop(cardsString, boardCardsString) {    
    var cards = cardStringToObj(cardsString)
    var boardCards = cardStringToObj(boardCardsString)

    console.log(myPokerHand(cards, boardCards))

    if (cards[0].rank === cards[1].rank) {
        // Pocket pairs
        // Will go all in with trips or fold
        var hitTrips = false;
        boardCards.forEach((boardCard) => {
            if (boardCard.rank === cards[0].rank) {
                hitTrips = true
            }
        });
        if (hitTrips) {
            console.log('Going all in.')
            goAllIn()
            return
        }
    }

    var hitPair = false
    boardCards.forEach((boardCard) => {
        if (boardCard.rank === cards[0].rank || boardCard.rank === cards[1].rank) {
            hitPair = true;
        } 
    })
    if (hitPair) {
        console.log('Making pot-sized bet.')
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
        console.log('Going all in.')
        goAllIn()
        return
    }
    
    console.log('Checking or folding.')
    checkOrFold()
}

function handleShowdown() {
    const seat = game.client_perspective
    if (game.n_players_in_hand > 1 && game.players[seat].is_sitting_in && !game.players[seat].is_folded) {
        console.log('SHOWDOWN WITH ME IN IT')
        console.log('# players in showdown:', game.n_players_in_hand)
        tauntOpportunity = Object.entries(game.players).some(([i, player]) => 
            player.is_sitting_in && !player.is_folded && player.chips === 0 && i !== seat + ''
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
    // will do this later

    // Check 4 of a kind
    if (highestCount === 4) {
        return "FOUR OF A KIND";
    }

    // Check full house
    if (highestCount === 3 && secondHighestCount >= 2) {
        return "FULL HOUSE"
    }

    // Check flush
    const maxOfOneSuit = Math.max(...Object.values(suitToCount))
    if (maxOfOneSuit >= 5) {
        return "FLUSH"
    }

    // Check straight
    const sortedRanks = allCards.sort((a, b) => a.ranknum - b.ranknum).map(c => c.rank)
    let uniqueRanksInOrder = [... new Set(sortedRanks)].join('')
    if (uniqueRanksInOrder.endsWith("A")) {
        uniqueRanksInOrder = "A" + uniqueRanksInOrder
    }

    for (i = 0; i <= uniqueRanksInOrder.length - 5; i++) {
        subStringToCheck = uniqueRanksInOrder.slice(i, i + 5)
        if ("A23456789TJQKA".indexOf(subStringToCheck) !== -1) {
            return "STRAIGHT"
        }
    }

    // Check 3 of a kind
    if (highestCount === 3) {
        return "THREE OF A KIND"
    }

    // Check 2 pair
    if (highestCount === 2 && secondHighestCount === 2) {
        return "TWO PAIR"
    }

    // Check pair
    if (highestCount === 2) {
        return "PAIR"
    }

    return "HIGH CARD"
}