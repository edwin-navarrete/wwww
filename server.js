/**
 * WWWW Werewolf with watchword 
 */
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const Game = require('./game.js')
const hostname = '127.0.0.1';
const port = 80;

app.use(express.static('dist'));
// parse application/json 
app.use(bodyParser.json())

var game = new Game(io)

io.on('connection', function (socket) {
    console.log('a user connected');
    // FIXME implement join of players for multi werewolf game
    socket.on('join', function (inf) {
        game.joinSkt(inf, socket)
    });
    socket.on('disconnect', function () {
        game.removeSkt(socket)
        console.log('user disconnected');
    });
});

app.get('/setup', function (req, res) {
    if (!game.players.length)
        return res.end("{}");
    res.end(JSON.stringify(game.setup));
})

/**
 * Number of players, automatic selection of werewolfs, watchwords list
 * {players:#, auto:tf, watchwords=[] }
 */
app.post('/setup', function (req, res) {
    console.log('setup', req.body)
    res.end(JSON.stringify(game.setup(req.body)));
})

app.post('/join', function (req, res) {
    console.log('join', req.body)
    res.end(JSON.stringify(game.join(req.body)));
})

app.get('/whoiam', function (req, res) {
    console.log('whoiam', req.query)
    res.end(JSON.stringify(game.whois(req.query.id)));
})

app.post('/werewolf', function (req, res) {
    console.log('werewolf', req.body)
    res.end(JSON.stringify(game.setWerewolf(req.query.id)));
})

app.get('/watchword', function (req, res) {
    console.log('watchword', req.query.id)
    res.end(JSON.stringify(game.getWatchword(req.query.id)));
})


app.get('/players', function (req, res) {
    res.end(JSON.stringify({
        list: game.getPlayers()
    }));
})

app.get('/vote', function (req, res) {
    res.end(JSON.stringify({
        list: game.chosen()
    }));
})

app.post('/vote', function (req, res) {
    console.log('vote', req.body)
    res.end(JSON.stringify(game.vote(req.body)));
})

var server = http.listen(port, hostname, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Werewolf app listening at http://%s:%s", host, port)
});

app.use(clientErrorHandler)

function clientErrorHandler(err, req, res, next) {
    if (err && err.code)
        res.status(err.code).send(err.msg)
    else
        next(err)
}