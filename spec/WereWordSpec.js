var mocket = require('mocket-io')
var server = new mocket.Server();
var client = new mocket.Client(server);


var clientSocket, serverSocket;
server.on("connection", function (socket) {
  console.log('a player connected');
  serverSocket = socket
  socket.join(socket.id)
  socket.join("everyone")
  socket.broadcast = {
    to: socket.to.bind(socket),
    emit: function () {
      socket.in("everyone").emit.apply(socket, arguments)
    }
  }
  // socket.on('join',(p)=>game.joinSkt())
});
/**
 * clientSocket = client.connect();
clientSocket.on('gameKilling',()=> console.log('OK++++++++++'))


var curEmit = server.emit;
server.emit = function(){
  server.sockets.adapter.broadcast("everyone").emit.apply(server, arguments)
}
 */
var Game = require('../game.js');
var game = new Game(server);

describe("WereWord", function () {
  var baseSetup = {
    players: 8,
    watchwords: ['A', 'E', 'B', 'C', 'A', 'D', 'E'],
    wwtimeout: 10,
    killTimeout: .2,
    auto: true,
  };

  beforeEach(function () {
  });

  it("rejects invalid setup", function () {
    function bindSetup(setupOveride) {
      var newSetup = Object.assign({}, baseSetup, setupOveride)
      return game.setup.bind(game, newSetup);
    }
    // missing players
    expect(bindSetup({ players: 0 })).toThrow({ code: 400, msg: 'playersReq' })
    // insuffPlayers
    expect(bindSetup({ players: 3 })).toThrow({ code: 400, msg: 'insuffPlayers' })
    // invalid watchword
    expect(bindSetup({ watchwords: 'bla' })).toThrow({ code: 400, msg: 'watchwordsReq' })
  });

  it("manages watchwords", function () {
    game.setup(baseSetup)
    // removes duplicates?
    expect(game.watchwords.length).toBe(5);
    // choose watchword?
    expect(game.watchwords.indexOf(game.watchword)).toBeGreaterThan(-1)
    // werewolf cannot see watchword?
    game.players.forEach((p) => {
      var ww = game.watchword(p).watchword
      if (p.role == 'werewolf') {
        expect(game.watchwords.indexOf(ww)).toBe(-1)
      }
    })
  });

  it("handles joins and votes", function (done) {
    game.setup(baseSetup)
    for (i = 0; i < baseSetup.players; i++)
      game.join({ name: 'Player' + i })
    // detects correct number of joins
    expect(() => game.join({ name: 'PlayerX' })).toThrow({ code: 400, msg: 'gameLocked' })
    // Sends message when game is locked
    server.once('gameLocked', (resp) => { 

    })
  })

  it("handles joins and votes", function (done) {
    game.setup(baseSetup)
    for (i = 0; i < baseSetup.players; i++)
      game.join({ name: 'Player' + i })
    // detects correct number of joins
    expect(() => game.join({ name: 'PlayerX' })).toThrow({ code: 400, msg: 'gameLocked' })

    // everyone knows his role
    var villagers = 0, werewolfs = 0, theWolf = 0
    game.players.forEach((p) => {
      var role = game.whois(p.id).role
      role == 'villager' && villagers++
      role == 'werewolf' && (theWolf = p.id) && werewolfs++
    })
    expect(villagers + werewolfs).toBe(baseSetup.players)
    expect(werewolfs).toBe(1)
    expect(theWolf).not.toBe(0)

    var villagers = game.players.filter((p) => p.role != 'werewolf')
    var rnd = Math.floor(Math.random() * 100 % villagers.length)
    var wwVote = villagers[villagers.length - 1].id

    game.vote({ id: theWolf, chosen: wwVote })

    // two villagers get voted two times 
    var condemn = [villagers[0].id, villagers[1].id]
    game.vote({ id: villagers[1].id, chosen: condemn[0] })
    game.vote({ id: villagers[2].id, chosen: condemn[0] })
    game.vote({ id: villagers[3].id, chosen: condemn[1] })
    game.vote({ id: villagers[4].id, chosen: condemn[1] })
    game.vote({ id: villagers[5].id, chosen: villagers[2].id })
    game.vote({ id: villagers[6].id, chosen: villagers[5].id })
    game.vote({ id: villagers[0].id, chosen: theWolf })

    // Everyone voted
    expect(game.players.some((p) => !p.chosen)).toBeFalsy()

    // Listen the kill
    server.once('gameKilling', (resp) => {
      console.log('gameKilling')
      var killed = game.players.filter((p) => p.killed).map((p) => p.id)
      expect(killed.length).toBe(2)
      expect(killed.length).toBe(resp.chosen.length)
      expect(resp.chosen.some((p) => killed.indexOf(p.id) < 0)).toBeFalsy()
      // only top score may be killed, majority 
      expect(condemn.some((p) => killed.indexOf(p.id) < 0)).toBeTruthy()
      // werewolf vote is always killed
      expect(killed.indexOf(wwVote)).not.toBe(-1)
      done()
    })
  });

  describe("internals", function () {
    it("werewolfs kills only when they agreed", function () {
      // one of three werewolfs vote for different person
      var players = [
        { id: 9, role: 'werewolf', chosen: 12 },
        { id: 10, role: 'werewolf', chosen: 12 },
        { id: 11, role: 'werewolf', chosen: 13 },
        { id: 12, role: 'villager', chosen: 10 },
        { id: 13, role: 'villager', chosen: 10 },
      ]
      var chosen = Game.execution(players)
      // no agreement on werewolf so no one else killed
      expect(chosen.length).toBe(1);
      // werewolf 10 must die
      expect(chosen.some((p) => p.id == 10)).toBeGreaterThan(-1);
    });

    it("only votes from alive are taken into account", function () {
      // one of three werewolfs vote for different person
      var players = [
        { id: 9, role: 'werewolf', chosen: 12 },
        { id: 10, role: 'werewolf', chosen: 12 },
        { id: 11, role: 'werewolf', chosen: 13, killed: true },
        { id: 12, role: 'villager', chosen: 10 },
        { id: 13, role: 'villager', chosen: 11, killed: true },
      ]
      var chosen = Game.execution(players)
      // werewolf agreement 
      expect(chosen.length).toBe(1);
      // werewolfs have majority
      expect(chosen.some((p) => p.id == 12)).toBeGreaterThan(-1);
    })

    it("gameOver conditions", function () {
      // one of three werewolfs vote for different person
      var players = [
        { id: 10, role: 'werewolf', killed: true },
        { id: 11, role: 'werewolf', killed: true },
        { id: 12, role: 'villager' },
        { id: 13, role: 'villager', killed: true },
      ]
      var won = Game.gameOver(players)
      // werewolf loses 
      expect(won).toBe('villager');

      // werewolfs majority
      var players = [
        { id: 10, role: 'werewolf', killed: true },
        { id: 11, role: 'werewolf' },
        { id: 12, role: 'villager' },
        { id: 13, role: 'villager', killed: true },
        { id: 14, role: 'villager', killed: true },
        { id: 15, role: 'werewolf' },
        { id: 16, role: 'villager' },
      ]
      won = Game.gameOver(players)
      // werewolf win 
      expect(won).toBe('werewolf');
    })
  })

});
