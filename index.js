import {checkIfTurnAndPlay, handleShowdown, handlePotDistribution} from './playhand'

setInterval(checkIfTurnAndPlay, 2500)
socket.on('is in showdown', handleShowdown)
socket.on('distributing pot', handlePotDistribution)