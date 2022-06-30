import {
  checkIfTurnAndPlay,
  handleShowdown,
  handlePotDistribution,
} from './playhand';

setInterval(play, 2500);
socket.on('is in showdown', handleShowdown);
socket.on('distributing pot', handlePotDistribution);

let isPlayingNow = false;
async function play() {
  try {
    if (!isPlayingNow) {
      isPlayingNow = true;
      await checkIfTurnAndPlay();
    }
  } finally {
    isPlayingNow = false;
  }
}
