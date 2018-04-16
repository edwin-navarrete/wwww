describe("WereWord", function() {
  var Game = require('../../game.js');
  var game;
  var setup = {
    players: 9,
    watchwords: ['A', 'E', 'B', 'C', 'A', 'D', 'E'],
    wwtimeout: 10,
    auto: true,
  };
  beforeEach(function() {
    game = new Game();
  });

  it("rejects invalid setup", function() {
    function bindSetup(setupOveride) {
      return ((setup) => game.setup(setup)).bind(setupGame, Object.assign(setup, setupOveride));
    }
    // missing players
    expect(bindSetup({ players: 0 }).toThrow('players required');
    // insufficient players
    expect(bindSetup({ players: 3 })).toThrow('insufficient players');
    // invalid watchword
    expect(bindSetup({ watchwords: 'bla' })).toThrow('watchwords required');
  });

  it("manages watchwords", function() {
    game.setup(setup)
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

  it("detects correct number of joins", function() {
  });

  it("allows to vote everyone", function() {
  });

  it("allows win werewolfs", function() {
  });

  it("allows win villagers", function() {
  });

  /*     hggw1
  describe("when song has been paused", function() {
    beforeEach(function() {
      player.play(song);
      player.pause();
    });

    it("should indicate that the song is currently paused", function() {
      expect(player.isPlaying).toBeFalsy();

      // demonstrates use of 'not' with a custom matcher
      expect(player).not.toBePlaying(song);
    });

    it("should be possible to resume", function() {
      player.resume();
      expect(player.isPlaying).toBeTruthy();
      expect(player.currentlyPlayingSong).toEqual(song);
    });
  }); // */

  // demonstrates use of spies to intercept and test method calls
  it("tells the current song if the user has made it a favorite", function() {
    spyOn(song, 'persistFavoriteStatus');

    player.play(song);
    player.makeFavorite();

    expect(song.persistFavoriteStatus).toHaveBeenCalledWith(true);
  });

  //demonstrates use of expected exceptions
  describe("#resume", function() {
    it("should throw an exception if song is already playing", function() {
      player.play(song);

      expect(function() {
        player.resume();
      }).toThrowError("song is already playing");
    });
  });
});
