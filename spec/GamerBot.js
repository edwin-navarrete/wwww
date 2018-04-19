/**
 * Random Gamer bot
 */
var seq = 0;

function GamerBot(game, io) {
    var self = this
    self.socket = io.connect()
    self.game = game
    self.id = game.join('Player' + seq++)
    self.events = ['gameLocked', 'gamePolling', 'gameKilling', 'gameOver']
    self.events = this.events.map((e) => { return { name: e, handler: socket.on(e, self[e]) } })
}

// Read role when finished joining and ask for watchword
GamerBot.prototype.gameLocked =
    () => (this.role = game.whois(this.id)) && game.getWatchword(this.id)

//on end Polling, choose a victim
GamerBot.prototype.gamePolling =
    () => {
        var chosen = null
        while (!chosen) {
            var alive = this.game.players.filter((p) => !p.killed)
            chosen = alive[Math.floor(Math.random() * 1e5 % alive.length)]
            chosen = this.role == chosen.role == 'werewolf' ? null : chosen
        }
        game.vote({ id: this.id, chosen: chosen })
    }
    
GamerBot.prototype.gameOver =
    () => this.events.forEach((e) => this.socket.off(e.name, e.handler) )

module.exports = GamerBot