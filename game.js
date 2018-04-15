var _ = require("lodash");

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

function killing(players) {
  if (players.some((p) => !p.chosen)) {
    console.error("Some players without vote")
    return {}
  }
  // Werewolf agreed?
  const wwPrechosen = players
    .map((p) => p.role == 'werewolf' ? p.chosen : null)
    .filter((p) => p)
  let wwChosen = wwPrechosen.length ?
    wwPrechosen.reduce(function(pre, cur) { return (pre === cur) ? pre : NaN; }) : NaN
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

Game.prototype.setup = function(setup) {
  const playersCnt = Number(setup.players);
  if (!playersCnt) throw "players required";

  // watchwords
  const watchwords = setup.watchwords;
  if (!Array.isArray(watchwords) || !watchwords.length)
    throw "watchwords required";
  this.wwtimeout = Math.max(10, Number(setup.wwtimeout) || 0)
  this.limit = playersCnt
  this.players = []
  this.watchwords = watchwords;
  var i = Math.round(Math.random() * (watchwords.length - 1))
  this.watchword = String(watchwords[i]).toLowerCase()
  if (playersCnt <= 8) this.werewolfs = 1
  else if (playersCnt <= 11) this.werewolfs = 2
  else if (playersCnt <= 15) this.werewolfs = 3

  this.auto = setup.auto
  this.setup = {
    werewolf: this.werewolfs,
    limit: this.limit,
    auto: this.auto,
    wwtimeout: this.wwtimeout
  }
  console.log("gameConfigured", gameconfig)
  process.nextTick(() => io.emit("gameConfigured", gameconfig))
  return this.setup;
};

Game.prototype.join = function(join) {
  if (this.remaining === 0)
    return "game locked";

  if (this.werewolfs < 0)
    throw "invalid game";

  const name = (whois.name || "").trim()
  if (!this.limit) throw "Game setup required";
  if ((this.limit - this.players.length) <= 0) throw "Limit reached";
  if (!name) throw "Name required";
  const found = this.players.filter((p) => p.name == name)
  if (found.length) throw "Duplicated name";

  const newPlayer = {
    id: Math.floor(1e8 + Math.random() * 9e8),
    name: whois.name
  }

  this.players.push(newPlayer)
  this.remaining = this.limit - this.players.length
  console.log("gameWaiting" + this.remaining)
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
    this.remaining = 0
  }
  return newPlayer;
}

Game.prototype.whois = function(whois) {
  const werewolf = Number(whois.id);
  if (!werewolf) throw ("werewolf id required");
  const found = this.players.filter((p) => p.id == werewolf)
  if (!found.length) throw ("werewolf not found");
  if (!found[0].role == "werewolf") this.werewolfs--
  found[0].role = "werewolf"

  if (this.werewolfs == 0) throw ("more werewolfs than expected");
  return found;
}

Game.prototype.watchword = function(player) {
  const aPlayer = Number(player.id);
  if (this.werewolfs < 0 || !this.watchword) throw ("invalid game");
  if (this.werewolfs > 0) throw ("Werewolf is missing");
  if (!aPlayer) throw ("Player id required");

  const found = this.players.filter((p) => p.id == aPlayer)
  if (!found.length) throw ("player not found");

  if (found[0].role == "werewolf") {
    return res.end(JSON.stringify({
      watchword: randomstring.generate({
        length: 20,
        charset: " abcdefghijk lmnopqrst uvwxyz"
      }).trim()
    }));
  }
  found[0].peek = true
  let pendingPeek = this.players.reduce(
    (prev, cur) => cur.peek || cur.role == 'werewolf' || cur.killed ? prev - 1 : prev, this.limit)
  if (!pendingPeek) {
    // Reset peek watchword and start poll after some timeout
    setTimeout(() => {
      this.players.forEach((p) => delete p.peek)
      this.io.emit("gamePolling")
    }, this.wwtimeout * 1000)
  }
  return this.watchword
}

Game.prototype.players = function(player) {
  return this.players.filter((p) => !p.killed).map((p) => _.pick(p, ["id", "name"]))
}

Game.prototype.voteList = function() {
  const list = {}
  this.players.forEach((p) => p.chosen ? (list[chosen] = true) : null)
  return this.players.filter((p) => list[p.id])
}

Game.prototype.vote = function(vote) {
  const voterId = Number(vote.id);
  const chosenId = Number(vote.chosen);
  let voter = this.players.filter((p) => p.id == voterId)
  if (!voter.length) throw ("id not found");
  voter = voter[0]
  let chosen = this.players.filter((p) => p.id == chosenId)
  if (!chosen.length) throw ("chosen not found");
  chosen = chosen[0]
  voter.chosen = chosenId
  if (this.werewolfs < 0 || !this.watchword) throw ("invalid game");

  const votesRemaining = this.players.reduce((prev, cur) => cur.chosen ? prev - 1 : prev, this.players.length)
  if (!votesRemaining) {
    // Voting ended
    setTimeout(() => {
      const kill = killing(this.players)
      const won = gameOver(this.players)
      //reset watchword after a killing
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
