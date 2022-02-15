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
    JJ: [mb.ALL, 3],
    TT: [mb.ALL, 3],
    99: [10, 3],
    88: [10, 3],
    AK: [mb.ALL, 3],
    AQ: [30, 3],
    AJ: [30, 3],
    A5: [3, 1],
    AT: [8, 3],
    A9: [1, 1],
    A8: [1, 1],
    KQ: [8, 3],
    KJ: [8, 3],
    KT: [3, 3],
    K9: [1, 1],
    QJ: [3, 1],
    QT: [3, 1],
    Q9: [1, 1],
    Q8: [1, 1],
    JT: [3, 1],
    J9: [1, 1],
    J8: [1, 1],
    J7: [1, 1],
    T9: [1, 1],
    77: [8, 1],
    66: [8, 1],
    55: [8, 1],
    44: [8, 1],
    33: [8, 1],
    22: [8, 1]
}

const suitedPreFlopHandsToBetMultipliers = {
    AK: [mb.ALL, mb.ALL],
    AQ: [mb.ALL, mb.ALL],
    AJ: [30, 5],
    AT: [10, 5],
    A9: [10, 3],
    A8: [8, 3],
    A7: [6, 1],
    A6: [6, 1],
    A5: [8, 3],
    A4: [5, 1],
    A3: [5, 1],
    A2: [5, 1],
    KQ: [10, 5],
    KJ: [10, 5],
    KT: [8, 3],
    K9: [6, 3],
    K8: [1, 3],
    QJ: [10, 5],
    QT: [8, 1],
    Q9: [3, 1],
    Q8: [3, 1],
    JT: [10, 3],
    J9: [3, 1],
    J8: [3, 1],
    J7: [3, 1],
    T9: [6, 3],
    T8: [1, 1],
    98: [6, 1],
    87: [5, 1],
    76: [5, 1],
    65: [5, 1],
    54: [3, 1],
    43: [3, 1],
    32: [3, 1]
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

function setDefaultGameOptions() {
    if (game.game_options_widget.allow_easy_reveal && !game.game_options_widget.easy_reveal.is_checked()) {
        game.game_options_widget.easy_reveal.clicked()
    }
    if (game.game_options_widget.bomb_pot_value && !game.game_options_widget.bomb_pot.is_checked()) {
        game.game_options_widget.bomb_pot.clicked()
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
    } else if (game.action_widget.call_button && betSizeIfCall <= callToLimit) {
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
    try {
        setDefaultGameOptions()
    } catch (e) {
        // we don't really care
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

    if (card1.suit === card2.suit) {
        const suitedBetMultipliers = suitedPreFlopHandsToBetMultipliers[handRanksString]
        if (suitedBetMultipliers) {
            console.log("Preflop cards are suited, and match one of the suited starting hands")
            const [callToMult, raiseToMult] = suitedBetMultipliers;
            makeBetUsingMultipliers(callToMult, raiseToMult)
            return
        }
    }

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

    const myhand = myPokerHand(cards, boardCards)
    const usedHoleCards = getHoleCardsUsed(cards, boardCards)

    const betOptions = []

    if (myhand === mb.STRAIGHT_FLUSH && usedHoleCards.length > 0) {
        betOptions.push({
            message: "Straight flush!",
            callTo: mb.ALL,
            raiseTo: 4 * boardCards.length
        })
    }

    if (myhand === mb.FOUR_OF_A_KIND && usedHoleCards.length > 0) {
        betOptions.push({
            message: "Four of a kind",
            callTo: mb.ALL,
            raiseTo: 4 * boardCards.length
        })
    }

    // full houses
    if (myhand === mb.FULL_HOUSE && usedHoleCards.length > 0) {
        if (usedHoleCards === 2) {
            if (myPokerHand([], boardCards) === mb.THREE_OF_A_KIND) {
                if (boardCards.every(c => c.ranknum < cards[0].ranknum)) {
                    betOptions.push({
                        message: "Three of a kind on the board and we have a pocket overpair",
                        callTo: mb.ALL,
                        raiseTo: 4 * boardCards.length
                    })
                } else {
                    betOptions.push({
                        message: "Three of a kind on the board and we have a pocket pair (not overpair)",
                        callTo: 10,
                        raiseTo: 3
                    })
                }
            } else {
                betOptions.push({
                    message: "Full house using at least both hole cards",
                    callTo: mb.ALL,
                    raiseTo: 4 * boardCards.length
                })
            }
        } else if (myPokerHand([], boardCards) === mb.THREE_OF_A_KIND) {
            betOptions.push({
                message: "Full house using 1 hole card, but trips on the board",
                callTo: 5,
                raiseTo: 5
            })
        } else {
            betOptions.push({
                message: "Full house using 1 hole card, no trips on the board",
                callTo: mb.ALL,
                raiseTo: 8
            })
        }
    }

    // flushes
    if (myhand === mb.FLUSH) {
        if (usedHoleCards.length === 2) {
            betOptions.push({
                message: "Flush using both our hole cards",
                callTo: mb.ALL,
                raiseTo: 7
            })
        } else if (usedHoleCards.length === 1) {
            if (["A", "K"].includes(usedHoleCards[0].rank)) {
                betOptions.push({
                    message: "Flush using 1 hole card (A or K)",
                    callTo: mb.ALL,
                    raiseTo: 4
                })
            }

            betOptions.push({
                message: "Flush using 1 hole card (not A or K)",
                callTo: 5,
                raiseTo: 0
            })
        } else {
            // Flush on the board
            // Check if we beat the board and have A or K
            const hasHighCardInSuit = handCards
                .some(card => ["A", "K"]
                .includes(card.rank) && card.suit === boardCards[0].suit)

            if (hasHighCardInSuit) {
                betOptions.push({
                    message: "Flush using 1 hole card (A or K)",
                    callTo: mb.ALL,
                    raiseTo: 4
                })
            } else {
                // Right now this is just for logging
                betOptions.push({
                    message: "Flush on the board",
                    callTo: 0,
                    raiseTo: 0
                })
            }
        }
    }

    // straights
    if (myhand === mb.STRAIGHT) {
        if (usedHoleCards.length === 2) {
            if (fourToFlush(boardCards)) {
                betOptions.push({
                    message: "Straight using both hole cards, but 4 to flush on the board",
                    callTo: 5,
                    raiseTo: 5
                })
            } else {
                betOptions.push({
                    message: "Straight using both hole cards",
                    callTo: mb.ALL,
                    raiseTo: 7
                })
            }
        } else if (usedHoleCards.length === 1) {
            if (fourToFlush(boardCards)) {
                betOptions.push({
                    message: "Straight using 1 hole card, but 4 to flush on the board",
                    callTo: 3,
                    raiseTo: 3
                })
            } else {
                betOptions.push({
                    message: "Straight using only 1 hole card",
                    callTo: 20,
                    raiseTo: 3
                })
            }
        }
        // Straight on the board
        // TODO: we might beat the board!
        // Right now this is just for logging
        betOptions.push({
            message: "Straight on the board",
            callTo: 0,
            raiseTo: 0
        })
    }

    // trips (only using one card in hand)
    if (myhand == mb.THREE_OF_A_KIND && usedHoleCards.length >= 1) {
        if (fourToFlushOrStraight(boardCards)) {
            betOptions.push({
                message: "Trips using at least 1 hole card, but 4 to flush/straight on the board",
                callTo: 3,
                raiseTo: 3
            })
        } else if (usedHoleCards === 2) {
            betOptions.push({
                message: "Pocket pair that hit trips or better",
                callTo: mb.ALL,
                raiseTo: 3 * boardCards.length
            })
        } else {
            betOptions.push({
                message: "Trips using 1 hole card",
                callTo: 25,
                raiseTo: 3 * boardCards.length
            })
        }
    }

    // two pair (using both hole cards)
    if (myhand == mb.TWO_PAIR && usedHoleCards.length == 2) {
        if (fourToFlushOrStraight(boardCards)) {
            betOptions.push({
                message: "Two pair using both hole cards but 4 to flush/straight on the board",
                callTo: 3,
                raiseTo: 3
            })
        } else {
            if (cards[0].rank === cards[1].rank) {
                if (boardCards.every(c => c.ranknum < cards[0].ranknum)) {
                    betOptions.push({
                        message: "Pair on the board and pocket pair overpair",
                        callTo: 15,
                        raiseTo: 3
                    })
                } else {
                    betOptions.push({
                        message: "Pair on the board and pocket pair (not overpair)",
                        callTo: 5,
                        raiseTo: 1
                    })
                }
            } else {
                betOptions.push({
                    message: "Two pair using both hole cards",
                    callTo: 25,
                    raiseTo: 2 * boardCards.length
                })
            }
        }
    }

    // pair (possible 2 pair with one pair on the board)
    if ([mb.PAIR, mb.TWO_PAIR].includes(myhand) && usedHoleCards.length == 1) {
        boardCardRankNumDescending = boardCards.map(c => c.ranknum).sort((a, b) => b - a)
        if (usedHoleCards[0].ranknum === boardCardRankNumDescending[0]) {
            if (boardCards.length === 3) {
                betOptions.push({
                    message: "Top pair",
                    callTo: 10,
                    raiseTo: 3
                })
            } else if (boardCards.length === 4) {
                betOptions.push({
                    message: "Top pair",
                    callTo: 20,
                    raiseTo: 0
                })
            } else {
                betOptions.push({
                    message: "Top pair",
                    callTo: 30,
                    raiseTo: 10
                })
            }
        } else if (usedHoleCards[0].ranknum === boardCardRankNumDescending[1]) {
            if (boardCards.length === 3) {
                betOptions.push({
                    message: "Second pair",
                    callTo: 5,
                    raiseTo: 2
                })
            } else {
                betOptions.push({
                    message: "Second pair",
                    callTo: 5,
                    raiseTo: 0
                })
            }
        }
        betOptions.push({
            message: "low pair",
            callTo: 3,
            raiseTo: 0
        })
    }

    // pocket pairs
    if (myhand === mb.PAIR && usedHoleCards === 2) {
        if (boardCards.every(c => c.ranknum < cards[0].ranknum)) {
            betOptions.push({
                message: "Pocket pair overpair",
                callTo: mb.ALL,
                raiseTo: 5
            })
        } else if (cards[0].ranknum > 9) {
            betOptions.push({
                message: "Pocket pair isn't top pair but it's high",
                callTo: 5,
                raiseTo: 0
            })
        }
    }

    // Flush Draw
    if (hasFlushDraw(cards, boardCards) && boardCards.length !== 5) {
        betOptions.push({
            message: "flush draw using both hole cards",
            callTo: 10,
            raiseTo: 10
        })
    }

    // Open ended straight draw
    if (checkStraightOrDrawOfLength(cards.concat(boardCards), 4) && !checkStraightOrDrawOfLength(boardCards, 4)) {
        if (boardCards.length === 3) {
            betOptions.push({
                message: "open ended straight draw using at least 1 hole card",
                callTo: 12,
                raiseTo: 12
            })
        } else if (boardCards.length === 4) {
            betOptions.push({
                message: "open ended straight draw using at least 1 hole card",
                callTo: 10,
                raiseTo: 10
            })
        }
    }

    if (betOptions.length === 0) {
        console.log("Nothing interesting going on with our hand. Check/folding")
        checkOrFold()
        return
    }

    highestCallTo = 0
    highestRaiseTo = 0
    console.log("Considering betting based on these things:")
    betOptions.forEach(betOption => {
        console.log("callTo: " + betOption.callTo + ", raiseTo: " + betOption.raiseTo + ", " + betOption.message)
        if (highestCallTo === mb.ALL || betOption.callTo === mb.ALL) {
            highestCallTo = mb.ALL
        } else {
            highestCallTo = Math.max(highestCallTo, betOption.callTo)
        }
        if (highestRaiseTo === mb.ALL || betOption.RaiseTo === mb.ALL) {
            highestRaiseTo = mb.ALL
        } else {
            highestRaiseTo = Math.max(highestRaiseTo, betOption.raiseTo)
        }
    })

    console.log("Will call to: " + highestCallTo + " or raise to: " + highestRaiseTo)
    makeBetUsingMultipliers(highestCallTo, highestRaiseTo)

    return
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

function checkStraightOrDrawOfLength(allCards, lengthOfDraw) {
    const sortedRanks = allCards.sort((a, b) => a.ranknum - b.ranknum).map(c => c.rank)
    let uniqueRanksInOrder = [... new Set(sortedRanks)].join('')
    if (uniqueRanksInOrder.endsWith("A")) {
        uniqueRanksInOrder = "A" + uniqueRanksInOrder
    }

    for (i = 0; i <= uniqueRanksInOrder.length - lengthOfDraw; i++) {
        subStringToCheck = uniqueRanksInOrder.slice(i, i + lengthOfDraw)
        if ("A23456789TJQKA".indexOf(subStringToCheck) !== -1) {
            return mb.STRAIGHT;
        }
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
    var hasFlush = false
    var hasStraightFlush = false
    Object.entries(suitToCount).forEach(([suit, count]) => {
        if (count >= 5) {
            hasFlush = true
            const cardsOfSuit = allCards.filter(card => card.suit === suit)
            if (checkStraightOrDrawOfLength(cardsOfSuit, 5)) {
                hasStraightFlush = true
            }
        }
    })
    if (hasStraightFlush) {
        return mb.STRAIGHT_FLUSH
    }

    // Check 4 of a kind
    if (highestCount === 4) {
        return mb.FOUR_OF_A_KIND;
    }

    // Check full house
    if (highestCount === 3 && secondHighestCount >= 2) {
        return mb.FULL_HOUSE;
    }

    // Check flush
    if (hasFlush) {
        return mb.FLUSH;
    }

    // Check straight
    if (checkStraightOrDrawOfLength(allCards, 5)) {
        return mb.STRAIGHT
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

function fourToFlushOrStraight(allCards) {
    return fourToFlush(allCards) || checkStraightOrDrawOfLength(allCards, 4)
}

// Some duplicated work here that we could clean up
function fourToFlush(allCards) {
    const suitToCount = {};
    allCards.forEach(card => {
        const currentSuitCount = suitToCount[card.suit] || 0;
        suitToCount[card.suit] = currentSuitCount + 1;
    });

    return Object.values(suitToCount).some((count) => {
        return count === 4
    })
}

// For now we are only considering flush draws that use both hole cards
function hasFlushDraw(handCards, boardCards) {
    const suitToCount = {};
    const allCards = handCards.concat(boardCards);
    allCards.forEach(card => {
        const currentSuitCount = suitToCount[card.suit] || 0;
        suitToCount[card.suit] = currentSuitCount + 1;
    });

    return Object.entries(suitToCount).some(([suit, count]) => {
        return count === 4 && handCards.every(c => c.suit === suit)
    })
}
