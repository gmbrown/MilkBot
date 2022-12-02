import { cardStringToObj } from './util';
import { calculateWinAgainstPercent } from './calculateHands';

let tauntOpportunity = false; // set to true if I'm in a showdown and someone else is all-in

const mb = {
  // constants
  BIG_BLIND: game.big_blind / 100, // not accounting for someone changing BB mid-game
  ALL: 'all',
};

const preFlopHandsToBetMultipliers = {
  // hand_ranks: [call_to, raise_to]
  // call_to and raise_to are multipliers of the big blind
  AA: [mb.ALL, mb.ALL],
  72: [0, mb.ALL],
  KK: [mb.ALL, mb.ALL],
  QQ: [mb.ALL, mb.ALL],
  JJ: [mb.ALL, mb.ALL],
  TT: [mb.ALL, mb.ALL],
  99: [10, 3],
  88: [10, 3],
  AK: [mb.ALL, mb.ALL],
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
  77: [3, 1],
  66: [3, 1],
  55: [3, 1],
  44: [3, 1],
  33: [3, 1],
  22: [3, 1],
};

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
  T7: [1, 1],
  98: [5, 1],
  97: [1, 1],
  87: [5, 1],
  86: [1, 1],
  76: [1, 1],
  75: [1, 1],
  65: [1, 1],
  64: [1, 1],
  54: [1, 1],
  43: [1, 1],
  32: [1, 1],
};

export async function checkIfTurnAndPlay() {
  if (
    !game.action_widget ||
    !game.players[game.client_perspective].cards.card_str
  ) {
    // seems like sometimes action_widget will be truthy but there are no cards... skip
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 1000)); // attempt to fix stack size mismatch error - unclear if helpful
  const holeCards = game.players[game.client_perspective].cards.card_str;
  const boardCards = game.board.card_str;
  const boardCardsLogMsg = boardCards
    ? ` and the board shows ${boardCards}.`
    : '.';
  console.log(`My hole cards are ${holeCards}${boardCardsLogMsg}`);
  playHand(holeCards, boardCards);
}

function setDefaultGameOptions() {
  if (
    game.game_options_widget.allow_easy_reveal &&
    !game.game_options_widget.easy_reveal.is_checked()
  ) {
    game.game_options_widget.easy_reveal.clicked();
  }
  if (
    game.game_options_widget.bomb_pot_value &&
    !game.game_options_widget.bomb_pot.is_checked()
  ) {
    game.game_options_widget.bomb_pot.clicked();
  }
}

function checkOrFold() {
  if (game.action_widget.to_call === 0) {
    checkOrCall();
  } else {
    game.action_widget.execute_fold();
  }
}

function checkOrCall() {
  game.action_widget.execute_check_call();
}

function makeBetOfSize(callToLimit, raiseToLimit) {
  // TODO later on, take in increment size so we can do smaller raises
  const betInFront = game.action_widget.bet_in_front;
  const betSizeIfCall = betInFront + game.action_widget.to_call / 100;
  const betSizeIfAllIn = betInFront + game.action_widget.stack_size;
  const minBet = game.action_widget.threshold_values.length
    ? game.action_widget.threshold_values[0]
    : undefined;
  console.info(
    `Raise to limit: ${raiseToLimit}. Min bet: ${minBet}. Call to limit: ${callToLimit}. Bet size if call: ${betSizeIfCall}.`
  );
  if (game.action_widget.bet_button || game.action_widget.raise_button) {
    if (minBet <= raiseToLimit) {
      console.log(
        raiseToLimit === betSizeIfAllIn
          ? 'Going all in.'
          : `Raising to ${raiseToLimit}.`
      );
      game.action_widget.update_slider_by_value(raiseToLimit);
      game.action_widget.sizing_input.value = raiseToLimit;
      game.action_widget.execute_bet_raise();
      return;
    }
  }
  // If we get here, either raising wasn't an option in the game or the min bet was too high for us.
  if (game.action_widget.all_in && betSizeIfAllIn <= raiseToLimit) {
    console.log("Can't/won't raise; going all in instead.");
    game.action_widget.all_in.execute();
  } else if (game.action_widget.call_button && betSizeIfCall <= callToLimit) {
    console.log("Can't/won't raise; calling instead.");
    checkOrCall();
  } else {
    console.log('Checking/folding.');
    checkOrFold();
  }
}

function makeBetUsingMultipliers(callToMult, raiseToMult) {
  const betSizeIfAllIn =
    game.action_widget.stack_size + game.action_widget.bet_in_front;
  const callToLimit =
    callToMult === mb.ALL ? betSizeIfAllIn : callToMult * mb.BIG_BLIND;
  const raiseToLimit =
    raiseToMult === mb.ALL ? betSizeIfAllIn : raiseToMult * mb.BIG_BLIND;
  makeBetOfSize(callToLimit, raiseToLimit);
}

function playHand(handString, boardString) {
  if (game.ruleset_name !== 'NL Texas Holdem') {
    console.log(
      `Folding/checking because we aren't playing 'NL Texas Holdem'. The game is ${game.ruleset_name}.`
    );
    checkOrFold();
    return;
  }
  try {
    setDefaultGameOptions();
  } catch (e) {
    // we don't really care
  }

  if (boardString === '') {
    preflop(handString);
  } else {
    postflop(handString, boardString, game.n_players_in_hand);
  }
}

function preflop(cardsString) {
  const [card1, card2] = cardStringToObj(cardsString);
  const handRanksString = card1.rank + card2.rank;

  if (card1.suit === card2.suit) {
    const suitedBetMultipliers =
      suitedPreFlopHandsToBetMultipliers[handRanksString];
    if (suitedBetMultipliers) {
      console.log(
        'Preflop cards are suited, and match one of the suited starting hands'
      );
      const [callToMult, raiseToMult] = suitedBetMultipliers;
      preflopBettingRandomization(callToMult, raiseToMult);
      return;
    }
  }

  const betMultipliers = preFlopHandsToBetMultipliers[handRanksString];
  if (!betMultipliers) {
    if (Math.random() > 0.9) {
      // 10% of the time we will randomly limp in
      console.log(
        "Even though this isn't a hand we usually play, randomly limping in if it's cheap."
      );
      makeBetUsingMultipliers(3, 1);
      return;
    }

    console.log('Checking or folding.');
    checkOrFold();
    return;
  }

  const [callToMult, raiseToMult] = betMultipliers;
  preflopBettingRandomization(callToMult, raiseToMult);
}

function preflopBettingRandomization(callToMult, raiseToMult) {
  if (raiseToMult === mb.ALL) {
    rand = Math.random();
    if (rand < 0.2) {
      makeBetUsingMultipliers(callToMult, 3);
    } else if (rand < 0.4) {
      makeBetUsingMultipliers(callToMult, 5);
    } else if (rand < 0.6) {
      makeBetUsingMultipliers(callToMult, 10);
    } else {
      makeBetUsingMultipliers(callToMult, mb.ALL);
    }
  } else {
    makeBetUsingMultipliers(callToMult, raiseToMult);
  }
}

function postflop(handString, boardString, playersInHand) {
  const holeCards = cardStringToObj(handString);
  const boardCards = cardStringToObj(boardString);

  // TODO let's add some light memoization to remember just the last winAgainstPercent for same hand & board cards
  const winAgainstPercent = calculateWinAgainstPercent(holeCards, boardCards);
  console.log(
    `Chances of winning against a random hand: ${winAgainstPercent}.`
  );
  console.log(`Number of players in hand: ${playersInHand}.`);

  // winAgainstPercent thresholds for betting are based on the number of players in the hand
  bigBetThreshold = 0.8;
  smallBetThreshold = 0.65;
  if (playersInHand == 2) {
    bigBetThreshold = 0.65;
    smallBetThreshold = 0.5;
  } else if ((playersInHand = 3)) {
    bigBetThreshold = 0.7;
    smallBetThreshold = 0.55;
  }

  const shouldBluffRandomly = Math.random() > 0.95;
  console.log(
    `Small bet threshold: ${smallBetThreshold}, Big bet threshold: ${bigBetThreshold}, random bluff: ${shouldBluffRandomly}`
  );

  const totalPotSize = game.action_widget.pot_size;
  if (winAgainstPercent > 0.9) {
    const betSizeIfAllIn =
      game.action_widget.bet_in_front + game.action_widget.stack_size;
    // 1/3 of the time, if it's not the last round, we set raiseTo to 0 so that we check if possible
    // TODO let's do this if there's 5 board cards AND we're last to act
    const shouldCheck = Math.random() * 3 > 2 && boardCards.length < 5;
    const raiseTo = shouldCheck ? 0 : Math.random() * betSizeIfAllIn;
    return makeBetOfSize(betSizeIfAllIn, raiseTo);
  } else if (winAgainstPercent > bigBetThreshold) {
    const scaledWinAgainstPercent = (winAgainstPercent - 0.65) / (0.9 - 0.65);
    return makeBetOfSize(
      Math.max(3 * mb.BIG_BLIND, totalPotSize * 2 * scaledWinAgainstPercent),
      totalPotSize * scaledWinAgainstPercent
    );
  } else if (winAgainstPercent > smallBetThreshold) {
    return makeBetOfSize(Math.max(3 * mb.BIG_BLIND, totalPotSize / 10), 0);
  } else if (shouldBluffRandomly) {
    console.log("I'm just bluffing!");
    return makeBetUsingMultipliers(0, mb.ALL);
  }
  console.log('Checking or folding.');
  checkOrFold();
}

export function handleShowdown() {
  const seat = game.client_perspective;
  if (
    game.n_players_in_hand > 1 &&
    game.players[seat].is_sitting_in &&
    !game.players[seat].is_folded
  ) {
    console.log('SHOWDOWN WITH ME IN IT');
    console.log('# players in showdown:', game.n_players_in_hand);
    tauntOpportunity = Object.entries(game.players).some(
      ([i, player]) =>
        player.is_sitting_in &&
        !player.is_folded &&
        player.chips === 0 &&
        i !== seat + ''
    );
    console.log('tauntOpportunity', tauntOpportunity);
  }
}

export async function handlePotDistribution(potData) {
  const seat = game.client_perspective;
  if (
    tauntOpportunity &&
    potData.winners[seat] &&
    Object.keys(potData.winners).length === 1
  ) {
    // Waiting 3s so we don't taunt before animations finish.
    console.log('Will taunt in 3 seconds because I knocked someone out!');
    setTimeout(() => {
      console.log('Taunting because I knocked someone out!');
      socket.emit('taunt', {
        taunt: 16,
        id: game.table_id,
        group_id: game.group_id,
      });
    }, 3000);
  }
  tauntOpportunity = false;
}
