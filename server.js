/**
 * WWWW Werewolf with watchword 
 */
var express = require('express');
var bodyParser = require('body-parser');
var randomstring = require("randomstring");
var _ = require("lodash");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('www'));
// parse application/json 
app.use(bodyParser.json())

let _players = []
let _watchwords = []
let _limit = 0
let _watchword = ""

// expected number of werewolfs
let _werewolfs = -1;
let _auto = false
let _wwtimeout = 10

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('join', function (inf) {
        const found = _players.filter((p) => p.id == inf.id)
        if (!found.length) return;
        player = found[0]
        player.socket = socker.id;
        (player.role == 'werewolf') && socket.join('werewolf')
    });
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

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

var testPlayers = [{
    id: 1,
    role: "villager",
    killed: true
}, {
    id: 2,
    role: "villager",
    killed: true
}, {
    id: 3,
    role: "villager",
}, {
    id: 4,
    role: "villager",
}, {
    id: 5,
    role: "werewolf",
}, {
    id: 6,
    role: "werewolf",
}]
var testRet = gameOver(testPlayers)

app.get('/setup', function (req, res) {
    if (!_players.length)
        return res.end("{}");
    const gameconfig = {
        werewolf: _werewolfs,
        limit: _limit,
        auto: _auto,
        wwtimeout: _wwtimeout
    }
    res.end(JSON.stringify(gameconfig));

})
/**
 * Number of players, automatic selection of werewolfs, watchwords list
 * {players:#, auto:tf, watchwords=[] }
 */
app.post('/setup', function (req, res) {
    console.log(req.body)
    const playersCnt = Number(req.body.players);
    if (!playersCnt) return res.status(400).send("players required");

    const watchwords = req.body.watchwords;
    if (!Array.isArray(watchwords) || !watchwords.length) return res.status(400).send("watchwords required");

    _wwtimeout = Math.max(10, Number(req.body.wwtimeout) || 0)
    _limit = playersCnt
    _players = []
    _watchwords = watchwords;
    var i = Math.round(Math.random() * (watchwords.length - 1))
    _watchword = String(watchwords[i]).toLowerCase()
    if (playersCnt <= 8) _werewolfs = 1
    else if (playersCnt <= 11) _werewolfs = 2
    else if (playersCnt <= 15) _werewolfs = 3

    _auto = req.body.auto
    res.status(200);
    const gameconfig = {
        werewolf: _werewolfs,
        limit: _limit,
        auto: _auto,
        wwtimeout: _wwtimeout
    }
    res.end(JSON.stringify(gameconfig));
    console.log("gameConfigured", gameconfig)
    process.nextTick(() => io.emit("gameConfigured", gameconfig))
})

app.post('/join', function (req, res) {
    if (_werewolfs < 0) {
        return res.status(400).send("invalid game");
    }
    const name = (req.body.name || "").trim()
    if (!_limit) return res.status(400).send("Game setup required");
    if ((_limit - _players.length) <= 0) return res.status(400).send("Limit reached");
    if (!name) return res.status(400).send("Name required");
    const found = _players.filter((p) => p.name == name)
    if (found.length) return res.status(400).send("Duplicated name");

    const newPlayer = {
        id: Math.floor(1e8 + Math.random() * 9e8),
        name: req.body.name
    }

    _players.push(newPlayer)
    var remaining = _limit - _players.length
    console.log("gameWaiting" + remaining)
    process.nextTick(() => io.emit("gameWaiting", { for: remaining }))
    if (remaining <= 0) {
        if (_auto) {
            _players.forEach((p) => p.role = "villager");
            while (_werewolfs > 0) {
                var i = Math.round(Math.random() * (_players.length - 1))
                let player = _players[i];
                player.role != "werewolf" && (player.role = "werewolf") && _werewolfs--
            }
        }
        console.log("gameLocked")
        process.nextTick(() => io.emit("gameLocked", { werewolfs: _werewolfs }))
    }
    res.end(JSON.stringify(newPlayer));
})

app.get('/whoiam', function (req, res) {
    const id = req.query.id
    if (!id) return res.status(400).send("id required");
    const found = _players.filter((p) => p.id == id)
    if (!found.length) {
        console.log("cur players", _players)
        return res.status(404).send("not found:" + id);
    }
    res.end(JSON.stringify(found[0]));
})

app.post('/werewolf', function (req, res) {
    const werewolf = Number(req.body.id);
    if (!werewolf) return res.status(400).send("werewolf id required");
    const found = _players.filter((p) => p.id == werewolf)
    if (!found.length) return res.status(400).send("werewolf not found");
    if (!found[0].role == "werewolf") _werewolfs--
    found[0].role = "werewolf"

    if (_werewolfs == 0) return res.status(400).send("more werewolfs than expected");
    res.end(JSON.stringify(found));
})

app.get('/watchword', function (req, res) {
    const aPlayer = Number(req.query.id);
    if (_werewolfs < 0 || !_watchword) return res.status(400).send("invalid game");
    if (_werewolfs > 0) return res.status(400).send("Werewolf is missing");
    if (!aPlayer) return res.status(400).send("Player id required");

    const found = _players.filter((p) => p.id == aPlayer)
    if (!found.length) return res.status(400).send("player not found");

    if (found[0].role == "werewolf") {
        return res.end(JSON.stringify({
            watchword: randomstring.generate({
                length: 20,
                charset: " abcdefghijk lmnopqrst uvwxyz"
            }).trim()
        }));
    }
    found[0].peek = true
    let pendingPeek = _players.reduce(
        (prev, cur) => cur.peek || cur.role == 'werewolf' || cur.killed ? prev - 1 : prev, _limit)
    if (!pendingPeek) {
        // Reset peek watchword and start poll after some timeout
        setTimeout(() => {
            _players.forEach((p) => delete p.peek)
            io.emit("gamePolling")
        }, _wwtimeout * 1000)
    }
    res.end(JSON.stringify({
        watchword: _watchword
    }));
})


app.get('/players', function (req, res) {
    res.end(JSON.stringify({
        list: _players.filter((p) => !p.killed).map((p) => _.pick(p, ["id", "name"]))
    }));
})

app.get('/vote', function (req, res) {
    const list = {}
    _players.forEach((p) => p.chosen ? (list[chosen] = true) : null)
    res.end(JSON.stringify({
        list: _players.filter((p) => list[p.id])
    }));
})

app.post('/vote', function (req, res) {
    const voterId = Number(req.body.id);
    const chosenId = Number(req.body.chosen);
    let voter = _players.filter((p) => p.id == voterId)
    if (!voter.length) return res.status(403).send("id not found");
    voter = voter[0]
    let chosen = _players.filter((p) => p.id == chosenId)
    if (!chosen.length) return res.status(403).send("chosen not found");
    chosen = chosen[0]
    voter.chosen = chosenId
    if (_werewolfs < 0 || !_watchword) return res.status(400).send("invalid game");

    const votesRemaining = _players.reduce((prev, cur) => cur.chosen ? prev - 1 : prev, _players.length)
    if (!votesRemaining) {
        // Voting ended
        setTimeout(() => {
            const kill = killing(_players)
            const won = gameOver(_players)
            //reset watchword after a killing
            var i = Math.round(Math.random() * (_watchwords.length - 1))
            _watchword = String(_watchwords[i]).toLowerCase()
            io.emit("gameKilling", { chosen: kill })
            if (won) {
                setTimeout(() => io.emit("gameOver", won),4000)
            }
        }, 3000)
    }
    process.nextTick(() => io.emit("gameVote", { remaining: votesRemaining }));

    (voter.role == "werewolf") && process.nextTick(() => {
        const werewolfs = _players.filter((p) => p.role == 'werewolf' && !p.killed)
        if (werewolfs > 1)
            io.to("werewolf").emit("wwVote", { chosen: chosenId })
        else {
            _players.forEach((p) => {
                // Random chosen!
                var i = Math.round(Math.random() * (_players.length - 1))
                if (!p.killed && p.role != "werewolf" && p.socket)
                    io.to(`#${p.socket}`).emit("wwVote", { chosen: _players[i].id })
            })
        }
    })

    res.end(JSON.stringify({ chosen: chosen.id }));
})

var server = http.listen(80, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Werewolf app listening at http://%s:%s", host, port)
});
