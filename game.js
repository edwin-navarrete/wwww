var _ = require('lodash');
var randomstring = require('randomstring');

function cliErr(str) {
  return {
    code: 400,
    msg: str
  }
}

function Game(io) {
  this.io = io || { emit: () => null }
  this.players = []
  this.watchwords = []
  this.limit = 0
  this.watchword = ''

  // expected number of werewolfs
  this.werewolfs = -1;
  this.auto = false
  this.wwtimeout = 10
}

Game.execution = function (players) {
  players = players.filter((p) => !p.killed)
  if (players.some((p) => !p.chosen)) {
    console.error('Some players without vote')
    return []
  }
  // Werewolf agreed?
  const wwPrechosen = players
    .filter((p) => p.role == 'werewolf')
    .map((p) => p.chosen)
  let wwChosen = wwPrechosen.length ?
    wwPrechosen.reduce(function (pre, cur) { return (pre === cur) ? pre : NaN; }) : NaN
  // Villager's favorite
  let top = 0
  let topChosen = null
  let chosen = {}
  players.map((p) => p.chosen)
    .reduce((accum, cur) => {
      accum[cur] = (accum[cur] + 1) || 1;
      (top < accum[cur]) && (top = accum[cur]) && (topChosen = cur);
      return accum
    }, {})
  topChosen && (chosen[topChosen] = true)
  wwChosen && (chosen[wwChosen] = true)
  players.forEach((p) => delete p.chosen)
  return players.map((p) => {
    if (chosen[p.id]) {
      p.killed = true
      return _.pick(p, ['id', 'name', 'role', 'killed'])
    }
  }).filter((p) => p)
}

Game.gameOver = function (players) {
  // No werewolfs are alive
  const werewolfs = players.filter((p) => !p.killed && p.role == 'werewolf')
  if (!werewolfs.length)
    return 'villager';
  // Alive werewolfs are equal or superior to villagers
  const villagers = players.filter((p) => !p.killed && p.role != 'werewolf')
  if (villagers.length <= werewolfs.length)
    return 'werewolf';
  return null;
}

Game.prototype.joinSkt = function (inf, socket) {
  const found = game.players.filter((p) => p.id == inf.id)
  if (!found.length) return;
  player = found[0]
  player.socket = socket.id;
  (player.role == 'werewolf') && socket.join('werewolf')
}

Game.prototype.removeSkt = function (skt) {
  this.players = this.players.filter((p) => p.socket != skt)
}

Game.prototype.setup = function (setup) {
  const playersCnt = Number(setup.players);
  if (!playersCnt) throw cliErr('playersReq');
  if (playersCnt < 4) throw cliErr('insuffPlayers');
  // watchwords
  var watchwords = setup.watchwords;
  if (!Array.isArray(watchwords) || !watchwords.length)
    throw cliErr('watchwordsReq');

  // remove duplicates
  var uniqWW = {}
  watchwords.forEach((w) => uniqWW[w.toLowerCase()] = 1);
  watchwords = Object.keys(uniqWW);

  // TODO min 10s? Math.max(10, Number(setup.wwtimeout) || 0)
  this.wwtimeout = Number(setup.wwtimeout) || 10
  this.killTimeout = Number(setup.killTimeout) || 3
  this.endTimeout = Number(setup.endTimeout) || 4

  this.limit = playersCnt
  this.players = []
  this.watchwords = watchwords
  this.remaining = playersCnt
  var i = Math.round(Math.random() * (watchwords.length - 1))
  this.watchword = String(watchwords[i]).toLowerCase()
  // FIXME currently more than one werewolf is not supported yet
  if (playersCnt > 8) throw cliErr('notImplemented');
  if (playersCnt <= 8) this.werewolfs = 1
  else if (playersCnt <= 11) this.werewolfs = 2
  else if (playersCnt <= 15) this.werewolfs = 3

  this.auto = setup.auto
  this.config = {
    werewolf: this.werewolfs,
    limit: this.limit,
    auto: this.auto,
    wwtimeout: this.wwtimeout
  }
  console.log('gameConfigured', this.config)
  process.nextTick(() => this.io.emit('gameConfigured', this.config))
  return this.config;
};

Game.prototype.join = function (toJoin) {
  if (this.remaining === 0)
    throw cliErr('gameLocked');

  if (this.werewolfs < 0)
    throw cliErr('invalidGame');

  const name = (toJoin.name || '').trim()
  if (!this.limit) throw cliErr('invalidGame');
  if ((this.limit - this.players.length) <= 0) throw cliErr('gameLocked');
  if (!name) throw cliErr('nameReq');
  const found = this.players.filter((p) => p.name == name)
  if (found.length) throw cliErr('dupName');

  const newPlayer = {
    id: Math.floor(1e8 + Math.random() * 9e8),
    name: toJoin.name
  }

  this.players.push(newPlayer)
  this.remaining = this.limit - this.players.length
  console.log('gameWaiting' + this.remaining)
  process.nextTick(() => this.io.emit('gameWaiting', { for: this.remaining }))
  if (this.remaining <= 0) {
    if (this.auto) {
      this.players.forEach((p) => p.role = 'villager');
      while (this.werewolfs > 0) {
        var i = Math.round(Math.random() * (this.players.length - 1))
        let player = this.players[i];
        player.role != 'werewolf' && (player.role = 'werewolf') && this.werewolfs--
      }
    }
    console.log('gameLocked')
    process.nextTick(() => this.io.emit('gameLocked', { werewolfs: this.werewolfs }))
    this.remaining = 0
  }
  return newPlayer;
}

Game.prototype.whois = function (whois) {
  const id = Number(whois);
  if (!id) throw cliErr('idReq');
  const found = this.players.filter((p) => p.id == id)
  if (!found.length) {
    console.log('not found in ', this.players, id)
    throw cliErr('notFound');
  }
  return found[0];
}

/**
 * Convert into werewolf a player 
 * @param {Number} id 
 */
Game.prototype.setWerewolf = function (id) {
  const werewolf = Number(id);
  if (!werewolf) throw cliErr('idReq');
  const found = this.players.filter((p) => p.id == werewolf)
  if (!found.length) throw cliErr('notFound');
  if (!found[0].role == 'werewolf') this.werewolfs--
  found[0].role = 'werewolf'

  if (this.werewolfs == 0) throw cliErr('tooMany');
  return found;
}

/**
 * Return the watchword for the given player (werewolf receives random text)
 * @param {Number} player 
 */
Game.prototype.getWatchword = function (player) {
  const aPlayer = Number(player);
  if (this.werewolfs < 0 || !this.watchword) throw cliErr('invalidGame');
  if (this.werewolfs > 0) throw cliErr('werewolfsReq');
  if (!aPlayer) throw cliErr('idReq');

  const found = this.players.filter((p) => p.id == aPlayer)
  if (!found.length) throw cliErr('notFound');

  if (found[0].role == 'werewolf') {
    return {
      watchword: randomstring.generate({
        length: 20,
        charset: ' abcdefghijk lmnopqrst uvwxyz'
      }).trim()
    };
  }
  found[0].peek = true
  let pendingPeek = this.players.reduce(
    (prev, cur) => cur.peek || cur.role == 'werewolf' || cur.killed ? prev - 1 : prev, this.limit)
  if (!pendingPeek) {
    this.io.emit('endPeek', { timeout: this.wwtimeout })
    // Reset peek watchword and start poll after some timeout
    setTimeout(() => {
      this.players.forEach((p) => delete p.peek)
      this.io.emit('gamePolling')
    }, this.wwtimeout * 1000)
  }
  return {
    watchword: this.watchword
  }
}

/**
 * Return list of alive players 
 */
Game.prototype.getPlayers = function () {
  return this.players.filter((p) => !p.killed).map((p) => _.pick(p, ['id', 'name']))
}

/**
 * List of chosen after voting
 */
Game.prototype.chosen = function () {
  const list = {}
  this.players.forEach((p) => p.chosen ? (list[chosen] = true) : null)
  return this.players.filter((p) => list[p.id])
}

/**
 * adds a vote from player
 */
Game.prototype.vote = function (vote) {
  const voterId = Number(vote.id);
  const chosenId = Number(vote.chosen);
  let voter = this.players.filter((p) => p.id == voterId)
  console.log('Voting:', vote)
  if (!voter.length) throw cliErr('notFound');
  voter = voter[0]
  if (voter.killed) throw cliErr('isDeath');
  let chosen = this.players.filter((p) => p.id == chosenId)
  if (!chosen.length) throw cliErr('chosenNotFound');
  chosen = chosen[0]
  voter.chosen = chosenId
  if (this.werewolfs < 0 || !this.watchword) throw cliErr('invalidGame');

  const alive = this.players.filter((p) => !p.killed)
  const votesRemaining = this.players.reduce((prev, cur) => cur.chosen ? prev - 1 : prev, alive.length)
  if (!votesRemaining) {
    // Voting ended
    setTimeout(() => {
      const kill = Game.execution(this.players)
      const won = Game.gameOver(this.players)
      //reset watchword after a execution
      var i = Math.round(Math.random() * (this.watchwords.length - 1))
      this.watchword = String(this.watchwords[i]).toLowerCase()
      console.log('gameKilling', kill, won)
      // all death excluding new deaths
      let death = this.players.filter((p) => {
        return p.killed && !kill.some((k) => k.id == p.id)
      })
      this.io.emit('gameKilling', { chosen: kill, death: death })
      if (won) {
        setTimeout(() => this.io.emit('gameOver', won), this.endTimeout)
      }
    }, this.killTimeout * 1000)
  }
  process.nextTick(() => this.io.emit('gameVote', { remaining: votesRemaining }));

  (voter.role == 'werewolf') && process.nextTick(() => {
    const werewolfs = this.players.filter((p) => p.role == 'werewolf' && !p.killed)
    if (werewolfs > 1)
      io.to('werewolf').emit('wwVote', { chosen: chosenId })
    else {
      this.players.forEach((p) => {
        // Random chosen!
        var i = Math.round(Math.random() * (this.players.length - 1))
        if (!p.killed && p.role != 'werewolf' && p.socket)
          io.to(`#${p.socket}`).emit('wwVote', { chosen: this.players[i].id })
      })
    }
  })

  return { chosen: chosen.id };
}

module.exports = Game;
