(()=>{let e=!1;const a={BIG_BLIND:game.big_blind/100,ALL:"all",HIGH_CARD:"HIGH CARD",PAIR:"PAIR",TWO_PAIR:"TWO PAIR",THREE_OF_A_KIND:"THREE OF A KIND",STRAIGHT:"STRAIGHT",FLUSH:"FLUSH",FULL_HOUSE:"FULL HOUSE",FOUR_OF_A_KIND:"FOUR OF A KIND",STRAIGHT_FLUSH:"STRAIGHT FLUSH"},o={AA:[a.ALL,a.ALL],72:[a.ALL,a.ALL],KK:[a.ALL,a.ALL],QQ:[a.ALL,a.ALL],JJ:[a.ALL,a.ALL],TT:[a.ALL,a.ALL],99:[10,3],88:[10,3],AK:[a.ALL,a.ALL],AQ:[30,3],AJ:[30,3],A5:[3,1],AT:[8,3],A9:[1,1],A8:[1,1],KQ:[8,3],KJ:[8,3],KT:[3,3],K9:[1,1],QJ:[3,1],QT:[3,1],Q9:[1,1],Q8:[1,1],JT:[3,1],J9:[1,1],J8:[1,1],J7:[1,1],T9:[1,1],77:[3,1],66:[3,1],55:[3,1],44:[3,1],33:[3,1],22:[3,1]},s={AK:[a.ALL,a.ALL],AQ:[a.ALL,a.ALL],AJ:[30,5],AT:[10,5],A9:[10,3],A8:[8,3],A7:[6,1],A6:[6,1],A5:[8,3],A4:[5,1],A3:[5,1],A2:[5,1],KQ:[10,5],KJ:[10,5],KT:[8,3],K9:[6,3],K8:[1,3],QJ:[10,5],QT:[8,1],Q9:[3,1],Q8:[3,1],JT:[10,3],J9:[3,1],J8:[3,1],J7:[3,1],T9:[6,3],T8:[1,1],T7:[1,1],98:[5,1],97:[1,1],87:[5,1],86:[1,1],76:[1,1],75:[1,1],65:[1,1],64:[1,1],54:[1,1],43:[1,1],32:[1,1]};function t(){0===game.action_widget.to_call?n():game.action_widget.execute_fold()}function n(){game.action_widget.execute_check_call()}function l(e,o){const s=game.action_widget.stack_size+game.action_widget.bet_in_front;!function(e,a){const o=game.action_widget.bet_in_front,s=o+game.action_widget.to_call/100,i=o+game.action_widget.stack_size,l=game.action_widget.threshold_values.length?game.action_widget.threshold_values[0]:void 0;if(console.info(`Raise to limit: ${a}. Min bet: ${l}. Call to limit: ${e}. Bet size if call: ${s}.`),(game.action_widget.bet_button||game.action_widget.raise_button)&&l<=a)return console.log(a===i?"Going all in.":`Raising to ${a}.`),game.action_widget.update_slider_by_value(a),game.action_widget.sizing_input.value=a,void game.action_widget.execute_bet_raise();game.action_widget.all_in&&i<=a?(console.log("Can't/won't raise; going all in instead."),game.action_widget.all_in.execute()):game.action_widget.call_button&&s<=e?(console.log("Can't/won't raise; calling instead."),n()):(console.log("Checking/folding."),t())}(e===a.ALL?s:e*a.BIG_BLIND,o===a.ALL?s:o*a.BIG_BLIND)}const r={T:10,J:11,Q:12,K:13,A:14};function h(e){const a=e.split("?").filter((e=>""!==e)).map((e=>{const a=e[0],o=e[1];let s=r[a]||parseInt(a);return s-=2,{suit:o,rank:a,ranknum:s}}));return a.sort(((e,a)=>a.ranknum-e.ranknum)),a}function g(e,o){const s=e.sort(((e,a)=>e.ranknum-a.ranknum)).map((e=>e.rank));let t=[...new Set(s)].join("");for(t.endsWith("A")&&(t="A"+t),i=0;i<=t.length-o;i++)if(subStringToCheck=t.slice(i,i+o),-1!=="A23456789TJQKA".indexOf(subStringToCheck))return a.STRAIGHT}function c(e,o){const s={},t={},n=e.concat(o);n.forEach((e=>{const a=s[e.rank]||0;s[e.rank]=a+1;const o=t[e.suit]||0;t[e.suit]=o+1}));let i=0,l=0;Object.entries(s).forEach((([e,a])=>{a>i?(l=i,i=a):a>l&&(l=a)}));var r=!1,h=!1;return Object.entries(t).forEach((([e,a])=>{if(a>=5){r=!0;g(n.filter((a=>a.suit===e)),5)&&(h=!0)}})),h?a.STRAIGHT_FLUSH:4===i?a.FOUR_OF_A_KIND:3===i&&l>=2?a.FULL_HOUSE:r?a.FLUSH:g(n,5)?a.STRAIGHT:3===i?a.THREE_OF_A_KIND:2===i&&2===l?a.TWO_PAIR:2===i?a.PAIR:a.HIGH_CARD}function u(e){return T(e)||g(e,4)}function T(e){const a={};return e.forEach((e=>{const o=a[e.suit]||0;a[e.suit]=o+1})),Object.values(a).some((e=>4===e))}setInterval((async function(){if(!game.action_widget||!game.players[game.client_perspective].cards.card_str)return;await new Promise((e=>setTimeout(e,1e3)));const e=game.players[game.client_perspective].cards.card_str,n=game.board.card_str,i=n?` and the board shows ${n}.`:".";console.log(`My hole cards are ${e}${i}`),function(e,n){if("NL Texas Holdem"!==game.ruleset_name)return console.log(`Folding/checking because we aren't playing 'NL Texas Holdem'. The game is ${game.ruleset_name}.`),void t();try{!function(){game.game_options_widget.allow_easy_reveal&&!game.game_options_widget.easy_reveal.is_checked()&&game.game_options_widget.easy_reveal.clicked();game.game_options_widget.bomb_pot_value&&!game.game_options_widget.bomb_pot.is_checked()&&game.game_options_widget.bomb_pot.clicked()}()}catch(e){}""===n?function(e){const[a,n]=h(e),i=a.rank+n.rank;if(a.suit===n.suit){const e=s[i];if(e){console.log("Preflop cards are suited, and match one of the suited starting hands");const[a,o]=e;return void l(a,o)}}const r=o[i];if(!r)return Math.random()>.95?(console.log("Even though this isn't a hand we usually play, randomly limping in if it's cheap."),void l(3,1)):(console.log("Checking or folding."),void t());const[g,c]=r;l(g,c)}(e):function(e,o,s,n){var i=h(e),r=h(o);const d=c(i,r),m=function(e,a){const o=c(e,a),s=c([],a);if(o===s)return[];const[t,n]=e.map((e=>c([e],a)));return t===o&&n===o?e[0].rankNum>e[1].rankNum?[e[0]]:[e[1]]:o===t?[e[0]]:o===n?[e[1]]:e}(i,r),p=[];d===a.STRAIGHT_FLUSH&&m.length>0&&p.push({message:"Straight flush!",callTo:a.ALL,raiseTo:4*r.length});d===a.FOUR_OF_A_KIND&&m.length>0&&p.push({message:"Four of a kind",callTo:a.ALL,raiseTo:4*r.length});d===a.FULL_HOUSE&&m.length>0&&(2===m?c([],r)===a.THREE_OF_A_KIND?r.every((e=>e.ranknum<i[0].ranknum))?p.push({message:"Three of a kind on the board and we have a pocket overpair",callTo:a.ALL,raiseTo:4*r.length}):p.push({message:"Three of a kind on the board and we have a pocket pair (not overpair)",callTo:10,raiseTo:3}):p.push({message:"Full house using at least both hole cards",callTo:a.ALL,raiseTo:4*r.length}):c([],r)===a.THREE_OF_A_KIND?p.push({message:"Full house using 1 hole card, but trips on the board",callTo:5,raiseTo:5}):p.push({message:"Full house using 1 hole card, no trips on the board",callTo:a.ALL,raiseTo:8}));if(d===a.FLUSH)if(2===m.length)p.push({message:"Flush using both our hole cards",callTo:a.ALL,raiseTo:7});else if(1===m.length)["A","K"].includes(m[0].rank)&&p.push({message:"Flush using 1 hole card (A or K)",callTo:a.ALL,raiseTo:4}),p.push({message:"Flush using 1 hole card (not A or K)",callTo:5,raiseTo:0});else{i.some((e=>["A","K"].includes(e.rank)&&e.suit===r[0].suit))?p.push({message:"Flush using 1 hole card (A or K)",callTo:a.ALL,raiseTo:4}):Math.random()>.9?p.push({message:"Flush on the board, but randomly bluffing 10% of the time",callTo:0,raiseTo:a.ALL}):p.push({message:"Flush on the board",callTo:0,raiseTo:0})}d===a.STRAIGHT&&(2===m.length?T(r)?p.push({message:"Straight using both hole cards, but 4 to flush on the board",callTo:5,raiseTo:5}):p.push({message:"Straight using both hole cards, wahoo!",callTo:a.ALL,raiseTo:7}):1===m.length?T(r)?p.push({message:"Straight using 1 hole card, but 4 to flush on the board",callTo:3,raiseTo:3}):p.push({message:"Straight using only 1 hole card",callTo:20,raiseTo:3}):(highestBoardCardRankNum=Math.max(...r.map((e=>e.rankNum))),i.some((e=>e.rankNum===highestBoardCardRankNum+1))?T(r)?p.push({message:"We beat the straight on the board, but there are 4 to a flush",callTo:0,raiseTo:0}):p.push({message:"Straight on the board, but we have a better straight",callTo:a.ALL,raiseTo:5}):p.push({message:"Straight on the board",callTo:0,raiseTo:0})));d==a.THREE_OF_A_KIND&&m.length>=1&&(u(r)?p.push({message:"Trips using at least 1 hole card, but 4 to flush/straight on the board",callTo:3,raiseTo:3}):2===m?p.push({message:"Pocket pair that hit trips or better",callTo:a.ALL,raiseTo:3*r.length}):p.push({message:"Trips using 1 hole card",callTo:25,raiseTo:3*r.length}));d==a.TWO_PAIR&&2==m.length&&(u(r)?p.push({message:"Two pair using both hole cards but 4 to flush/straight on the board",callTo:3,raiseTo:3}):i[0].rank===i[1].rank?r.every((e=>e.ranknum<i[0].ranknum))?p.push({message:"Pair on the board and pocket pair overpair",callTo:15,raiseTo:3}):p.push({message:"Pair on the board and pocket pair (not overpair)",callTo:5,raiseTo:1}):p.push({message:"Two pair using both hole cards",callTo:25,raiseTo:2*r.length}));[a.PAIR,a.TWO_PAIR].includes(d)&&1==m.length&&(u(r)?p.push({message:"Pair, but 4 to flush/straight on the board",callTo:3,raiseTo:3}):(boardCardRankNumDescending=r.map((e=>e.ranknum)).sort(((e,a)=>a-e)),m[0].ranknum===boardCardRankNumDescending[0]?3===r.length?2===s?p.push({message:"Top pair (only 1 other player in hand)",callTo:20,raiseTo:5}):p.push({message:"Top pair",callTo:10,raiseTo:3}):4===r.length?2===s?p.push({message:"Top pair (only 1 other player in hand)",callTo:20,raiseTo:10}):p.push({message:"Top pair",callTo:10,raiseTo:0}):2===s?p.push({message:"Top pair (only 1 other player in hand)",callTo:30,raiseTo:10}):p.push({message:"Top pair",callTo:10,raiseTo:0}):m[0].ranknum===boardCardRankNumDescending[1]&&(3===r.length?p.push({message:"Second pair",callTo:5,raiseTo:2}):p.push({message:"Second pair",callTo:5,raiseTo:0})),p.push({message:"low pair",callTo:3,raiseTo:0})));d===a.PAIR&&2===m&&(u(r)?p.push({message:"Pocket pair, but 4 to flush/straight on the board",callTo:3,raiseTo:3}):r.every((e=>e.ranknum<i[0].ranknum))?p.push({message:"Pocket pair overpair",callTo:a.ALL,raiseTo:5}):i[0].ranknum>9&&2==s&&p.push({message:"Pocket pair isn't top pair but it's high, and only 1 other player",callTo:10,raiseTo:5}));(function(e,a){const o={};return e.concat(a).forEach((e=>{const a=o[e.suit]||0;o[e.suit]=a+1})),Object.entries(o).some((([a,o])=>4===o&&e.every((e=>e.suit===a))))})(i,r)&&(3===r.length&&2===s&&Math.random>.5?p.push({message:"flush draw using both hole cards (3 cards on board), only 1 other player in hand, randomly going all in half the time",callTo:10,raiseTo:a.ALL}):5!==r.length&&p.push({message:"flush draw using both hole cards",callTo:10,raiseTo:0}));g(i.concat(r),4)&&!g(r,4)&&(3===r.length&&2===s?Math.random>.7?p.push({message:"straight draw, randomly going all in 30% of the time",callTo:12,raiseTo:a.ALL}):p.push({message:"open ended straight draw using at least 1 hole card",callTo:12,raiseTo:12}):5!==r.length&&p.push({message:"open ended straight draw using at least 1 hole card",callTo:10,raiseTo:10}));if(0===p.length&&2===s)return Math.random()>.97&&p.push({message:"Random bluff 3% of the time against 1 other player",callTo:0,raiseTo:a.ALL}),console.log("Nothing interesting going on with our hand. Check/folding"),void t();highestCallTo=0,highestRaiseTo=0,console.log("Considering betting based on these things:"),p.forEach((e=>{console.log("callTo: "+e.callTo+", raiseTo: "+e.raiseTo+", "+e.message),highestCallTo===a.ALL||e.callTo===a.ALL?highestCallTo=a.ALL:highestCallTo=Math.max(highestCallTo,e.callTo),highestRaiseTo===a.ALL||e.RaiseTo===a.ALL?highestRaiseTo=a.ALL:highestRaiseTo=Math.max(highestRaiseTo,e.raiseTo)})),console.log("Will call to: "+highestCallTo+" or raise to: "+highestRaiseTo),l(highestCallTo,highestRaiseTo)}(e,n,game.n_players_in_hand)}(e,n)}),2500),socket.on("is in showdown",(function(){const a=game.client_perspective;game.n_players_in_hand>1&&game.players[a].is_sitting_in&&!game.players[a].is_folded&&(console.log("SHOWDOWN WITH ME IN IT"),console.log("# players in showdown:",game.n_players_in_hand),e=Object.entries(game.players).some((([e,o])=>o.is_sitting_in&&!o.is_folded&&0===o.chips&&e!==a+"")),console.log("tauntOpportunity",e))})),socket.on("distributing pot",(function(a){const o=game.client_perspective;e&&a.winners[o]&&1===Object.keys(a.winners).length&&(console.log("Taunting because I knocked someone out!"),socket.emit("taunt",{taunt:16,id:game.table_id,group_id:game.group_id})),e=!1}))})();
//# sourceMappingURL=index.js.map
