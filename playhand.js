setInterval(checkIfTurnAndPlay, 2500)
socket.on('is in showdown', handleShowdown)
socket.on('distributing pot', handlePotDistribution)
let tauntOpportunity = false; // set to true if I'm in a showdown and someone else is all-in

const mb = { // constants
    BIG_BLIND: game.big_blind/100, // not accounting for someone changing BB mid-game
    ALL: 'all',
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

const preFlopHandsToBetMultipliers = {
    // hand_ranks: [call_to, raise_to]
    // call_to and raise_to are multipliers of the big blind
    AA: [mb.ALL, mb.ALL],
    72: [mb.ALL, mb.ALL],
    KK: [mb.ALL, mb.ALL],
    QQ: [mb.ALL, mb.ALL],
    JJ: [mb.ALL, 6],
    TT: [mb.ALL, 5],
    99: [10, 3],
    88: [10, 3],
    AK: [mb.ALL, 10],
    AQ: [20, 10],
    AJ: [20, 10],
    KQ: [8, 3],
    KJ: [8, 3],
    AT: [8, 3],
    KT: [3, 3],
    QT: [3, 3],
    JT: [3, 3],
    T9: [3, 3],
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

function makeBetUsingMultipliers(callToMult, raiseToMult) {
    const betSizeIfAllIn = game.action_widget.stack_size + game.action_widget.bet_in_front;
    const callToLimit = callToMult === mb.ALL ? betSizeIfAllIn : callToMult * mb.BIG_BLIND;
    const raiseToLimit = raiseToMult === mb.ALL ? betSizeIfAllIn : raiseToMult * mb.BIG_BLIND;
    makeBetOfSize(callToLimit, raiseToLimit);
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
    makeBetUsingMultipliers(callToMult, raiseToMult)
}

function postflop(cardsString, boardCardsString, playersInHand, potSizeAtStartOfRound) {
    var cards = cardStringToObj(cardsString)
    var boardCards = cardStringToObj(boardCardsString)

    myhand = myPokerHand(cards, boardCards)
    usedHoleCards = getHoleCardsUsed(cards, boardCards)

    // pocket pairs
    if (cards[0].rank === cards[1].rank) {
        // TODO: for full house check if my pocket pair is used for the 3 of a kind part
        if ([mb.THREE_OF_A_KIND, mb.FULL_HOUSE, mb.FOUR_OF_A_KIND].includes(myhand) && usedHoleCards.length === 2) {
            console.log("Our pocket pair hit something!")
            makeBetUsingMultipliers(mb.ALL, 3 * boardCards.length)
        } else if (boardCards.every(c => c.ranknum < cards[0].ranknum)) {
            console.log("Our pocket pair is top pair!")
            makeBetUsingMultipliers(mb.ALL, 5)
        } else if (cards[0].ranknum > 9) {
            console.log("Even though our pocket pair isn't the top pair it's still high")
            makeBetUsingMultipliers(5, 0)
        }
        // TODO: technically we could have a flush using one hole card and maybe not want to fold.
        console.log("Our pocket pair seems weak, check/folding")
        checkOrFold()
        return
    }

    // full houses
    if (myhand === mb.FULL_HOUSE && usedHoleCards.length > 0) {
        console.log("we have a full house and it's not on the board")
        makeBetUsingMultipliers(mb.ALL, 8)
        return
    }

    // flushes
    if (myhand === mb.FLUSH) {
        if (usedHoleCards.length === 2) {
            console.log("we have a flush using both our hole cards")
            makeBetUsingMultipliers(mb.ALL, 7)
        } else if (usedHoleCards.length === 1) {
            // TODO: it matters what card we have
            console.log("we have a flush using only 1 hole card")
            makeBetUsingMultipliers(5, 0)
        }
        // TODO: we might beat the board!
        console.log("flush on the board")
        checkOrFold()
        return
    }

    // straights
    if (myhand === mb.STRAIGHT) {
        if (usedHoleCards.length === 2) {
            // TODO: see if there is 4 to a flush
            console.log("we have a straight using both our hole cards")
            makeBetUsingMultipliers(mb.ALL, 7)
        } else if (usedHoleCards.length === 1) {
            console.log("we have a straight using only 1 hole card")
            makeBetUsingMultipliers(15, 3)
        }
        // TODO: we might beat the board!
        console.log("straight on the board")
        checkOrFold()
        return
    }

    // trips (only using one card in hand)
    if (myhand == mb.THREE_OF_A_KIND && usedHoleCards.length == 1) {
        // TOOD: if there are 4 to a flush or straight on the board, this is actually pretty weak
        console.log("We have 3 of a kind using 1 hole card")
        makeBetUsingMultipliers(25, 3 * boardCards.length)
        return
    }

    // two pair (using both) (and not pocket pair)
    if (myhand == mb.TWO_PAIR && usedHoleCards.length == 2) {
        // TOOD: if there are 4 to a flush or straight on the board, this is actually pretty weak
        console.log("We have two pair using both hole cards")
        makeBetUsingMultipliers(25, 2 * boardCards.length)
        return
    }

    // pair (possible 2 pair with one pair on the board)
    if ([mb.PAIR, mb.TWO_PAIR].includes(myhand) && usedHoleCards.length == 1) {
        boardCardRankNumDescending = boardCards.map(c => c.ranknum).sort((a, b) => b - a)
        if (usedHoleCards[0].ranknum === boardCardRankNumDescending[0]) {
            console.log("We have top pair")
            if (boardCards.length === 3) {
                makeBetUsingMultipliers(10, 3)
            } else if (boardCards.length === 4) {
                makeBetUsingMultipliers(20, 0)
            } else {
                makeBetUsingMultipliers(30, 10)
            }
            return
        } else if (usedHoleCards[0].ranknum === boardCardRankNumDecending[1]) {
            console.log("we have second pair")
            if (boardCards.length === 3) {
                makeBetUsingMultipliers(5, 1)
            } else {
                makeBetUsingMultipliers(5, 0)
            }
            return
        }
        console.log("we have a pair, but it's low")
        makeBetUsingMultipliers(3, 0)
        return
    }

    console.log("Doesn't look like I have anything interesting. check/folding")
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

function getHoleCardsUsed(holeCards, boardCards) {
    const withBoth = myPokerHand(holeCards, boardCards);
    const noHoleCards = myPokerHand([], boardCards);
    if (withBoth === noHoleCards) {
        return []
    }
    const [withFirst, withSecond] = holeCards.map(holeCard => myPokerHand([holeCard], boardCards))
    if (withFirst === withBoth && withSecond === withBoth) {
        // either card gets you just as good a hand as with both of them. return the one with higher rank
        return holeCards[0].rankNum > holeCards[1].rankNum ? [holeCards[0]] : [holeCards[1]]
    } else if (withBoth === withFirst) {
        return [holeCards[0]]
    } else if (withBoth === withSecond) {
        return [holeCards[1]]
    } else {
        return holeCards
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
    // will do this later

    // Check 4 of a kind
    if (highestCount === 4) {
        return mb.FOUR_OF_A_KIND;
    }

    // Check full house
    if (highestCount === 3 && secondHighestCount >= 2) {
        return mb.FULL_HOUSE;
    }

    // Check flush
    const maxOfOneSuit = Math.max(...Object.values(suitToCount))
    if (maxOfOneSuit >= 5) {
        return mb.FLUSH;
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
            return mb.STRAIGHT;
        }
    }

    // Check 3 of a kind
    if (highestCount === 3) {
        return mb.THREE_OF_A_KIND;
    }

    // Check 2 pair
    if (highestCount === 2 && secondHighestCount === 2) {
        return mb.TWO_PAIR;
    }

    // Check pair
    if (highestCount === 2) {
        return mb.PAIR;
    }

    return mb.HIGH_CARD;
}
