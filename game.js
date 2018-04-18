var _ = require("lodash");
var randomstring = require("randomstring");

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
  this.watchword = ""

  // expected number of werewolfs
  this.werewolfs = -1;
  this.auto = false
  this.wwtimeout = 10
}

function execution(players) {
  if (players.some((p) => !p.chosen)) {
    console.error("Some players without vote")
    return {}
  }
  // Werewolf agreed?
  const wwPrechosen = players
    .map((p) => p.role == 'werewolf' ? p.chosen : null)
    .filter((p) => p)
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
      return _.pick(p, ["id", "name", "role", "killed"])
    }
  }).filter((p) => p)
}

function gameOver(players) {
  // No werewolfs are alive
  const werewolfs = players.filter((p) => !p.killed && p.role == 'werewolf')
  if (!werewolfs.length)
    return "villager";
  // Alive werewolfs are equal or superior to villagers
  const villagers = players.filter((p) => !p.killed && p.role != 'werewolf')
  if (villagers.length <= werewolfs.length + 1)
    return "werewolf";
}
Game.prototype.joinSkt = function (inf, socket) {
  const found = game.players.filter((p) => p.id == inf.id)
  if (!found.length) return;
  player = found[0]
  player.socket = socket.id;
  (player.role == 'werewolf') && socket.join('werewolf')
}

Game.prototype.setup = function (setup) {
  const playersCnt = Number(setup.players);
  if (!playersCnt) throw cliErr("players required");
  // if (playersCnt < 4) throw cliErr("insufficient players");
  // watchwords
  var watchwords = setup.watchwords;
  if (!Array.isArray(watchwords) || !watchwords.length)
    throw cliErr("watchwords required");

  // remove duplicates
  var uniqWW = {}
  watchwords.forEach((w) => uniqWW[w.toLowerCase()] = 1);
  watchwords = Object.keys(uniqWW);

  this.wwtimeout = Math.max(10, Number(setup.wwtimeout) || 0)
  this.limit = playersCnt
  this.players = []
  this.watchwords = watchwords
  this.remaining = playersCnt
  var i = Math.round(Math.random() * (watchwords.length - 1))
  this.watchword = String(watchwords[i]).toLowerCase()
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
  console.log("gameConfigured", this.config)
  process.nextTick(() => this.io.emit("gameConfigured", this.config))
  return this.config;
};

Game.prototype.join = function (toJoin) {
  if (this.remaining === 0)
    return "game locked";

  if (this.werewolfs < 0)
    throw cliErr("invalid game");

  const name = (toJoin.name || "").trim()
  if (!this.limit) throw cliErr("Game setup required");
  if ((this.limit - this.players.length) <= 0) throw cliErr("Limit reached");
  if (!name) throw "Name required";
  const found = this.players.filter((p) => p.name == name)
  if (found.length) throw cliErr("Duplicated name");

  const newPlayer = {
    id: Math.floor(1e8 + Math.random() * 9e8),
    name: toJoin.name
  }

  this.players.push(newPlayer)
  this.remaining = this.limit - this.players.length
  console.log("gameWaiting" + this.remaining)
  process.nextTick(() => this.io.emit("gameWaiting", { for: this.remaining }))
  if (this.remaining <= 0) {
    if (this.auto) {
      this.players.forEach((p) => p.role = "villager");
      while (this.werewolfs > 0) {
        var i = Math.round(Math.random() * (this.players.length - 1))
        let player = this.players[i];
        player.role != "werewolf" && (player.role = "werewolf") && this.werewolfs--
      }
    }
    console.log("gameLocked")
    process.nextTick(() => this.io.emit("gameLocked", { werewolfs: this.werewolfs }))
    this.remaining = 0
  }
  return newPlayer;
}

Game.prototype.whois = function (whois) {
  const id = Number(whois);
  if (!id) throw cliErr("id required");
  const found = this.players.filter((p) => p.id == id)
  if (!found.length) {
    console.log("cur players", this.players)
    throw cliErr("not found:" + id);
  }
  return found[0];
}

/**
 * Convert into werewolf a player 
 * @param {Number} id 
 */
Game.prototype.setWerewolf = function (id) {
  const werewolf = Number(id);
  if (!werewolf) throw cliErr("werewolf id required");
  const found = this.players.filter((p) => p.id == werewolf)
  if (!found.length) throw cliErr("werewolf not found");
  if (!found[0].role == "werewolf") this.werewolfs--
  found[0].role = "werewolf"

  if (this.werewolfs == 0) throw cliErr("more werewolfs than expected");
  return found;
}

/**
 * Return the watchword for the given player (werewolf receives random text)
 * @param {Number} player 
 */
Game.prototype.getWatchword = function (player) {
  const aPlayer = Number(player);
  if (this.werewolfs < 0 || !this.watchword) throw cliErr("invalid game");
  if (this.werewolfs > 0) throw cliErr("Werewolf is missing");
  if (!aPlayer) throw cliErr("Player id required");

  const found = this.players.filter((p) => p.id == aPlayer)
  if (!found.length) throw cliErr("player not found");

  if (found[0].role == "werewolf") {
    return {
      watchword: randomstring.generate({
        length: 20,
        charset: " abcdefghijk lmnopqrst uvwxyz"
      }).trim()
    };
  }
  found[0].peek = true
  let pendingPeek = this.players.reduce(
    (prev, cur) => cur.peek || cur.role == 'werewolf' || cur.killed ? prev - 1 : prev, this.limit)
  if (!pendingPeek) {
    this.io.emit("endPeek", { timeout: this.wwtimeout })
    // Reset peek watchword and start poll after some timeout
    setTimeout(() => {
      this.players.forEach((p) => delete p.peek)
      this.io.emit("gamePolling")
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
  return this.players.filter((p) => !p.killed).map((p) => _.pick(p, ["id", "name"]))
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
  if (!voter.length) throw cliErr("id not found");
  voter = voter[0]
  let chosen = this.players.filter((p) => p.id == chosenId)
  if (!chosen.length) throw cliErr("chosen not found");
  chosen = chosen[0]
  voter.chosen = chosenId
  if (this.werewolfs < 0 || !this.watchword) throw cliErr("invalid game");

  const votesRemaining = this.players.reduce((prev, cur) => cur.chosen ? prev - 1 : prev, this.players.length)
  if (!votesRemaining) {
    // Voting ended
    setTimeout(() => {
      const kill = execution(this.players)
      const won = gameOver(this.players)
      //reset watchword after a execution
      var i = Math.round(Math.random() * (this.watchwords.length - 1))
      this.watchword = String(this.watchwords[i]).toLowerCase()
      this.io.emit("gameKilling", { chosen: kill })
      if (won) {
        setTimeout(() => this.io.emit("gameOver", won), 4000)
      }
    }, 3000)
  }
  process.nextTick(() => this.io.emit("gameVote", { remaining: votesRemaining }));

  (voter.role == "werewolf") && process.nextTick(() => {
    const werewolfs = this.players.filter((p) => p.role == 'werewolf' && !p.killed)
    if (werewolfs > 1)
      io.to("werewolf").emit("wwVote", { chosen: chosenId })
    else {
      this.players.forEach((p) => {
        // Random chosen!
        var i = Math.round(Math.random() * (this.players.length - 1))
        if (!p.killed && p.role != "werewolf" && p.socket)
          io.to(`#${p.socket}`).emit("wwVote", { chosen: this.players[i].id })
      })
    }
  })

  return { chosen: chosen.id };
}

module.exports = Game;
