angular.module('Werewolf')
    .controller('Poll', function ($rootScope, $scope, $http, $timeout, $location, socket) {
        $scope.players = []
        const myself = $rootScope.myself()
        $rootScope.myself(Object.assign(myself, { watchword: null, chosen: null }))

        $rootScope.waiting = null
        if ($rootScope.myself().id) {
            $rootScope.whoIAm()
                .then(function (myself) {
                    $scope.myself = myself
                })
                .catch(function (err) {
                    console.error(err)
                    $location.path("/setup")
                })
        }
        $scope.isChosen = function (player) {
            return $scope.myself.chosen == player.id
        }

        $scope.select = function (player) {
            $scope.myself.chosen = player.id
            $rootScope.myself($scope.myself)
            /*
            if ($scope.myself.role == 'werewolf') {
                // send vote immediatelly so werewolfs can agree
                $scope.sendVote()
            } // */
        }

        $scope.letsContinue = function () {
            $location.path("/join")
        }

        $scope.sendVote = function () {
            $http.post("/vote", $scope.myself)
                .catch(function (err) {
                    $scope.error = err.data
                })
        }

        $scope.$on("gameKilling", function (ev, msg) {
            $scope.waitingVote = null
            $timeout(function () {
                $scope.chosen = msg.chosen
                $scope.chosen.forEach(function (k) {
                    k.justKilled = true
                });
                if (msg.death) {
                    $scope.chosen = $scope.chosen.concat(msg.death)
                }
                var myId = $rootScope.myself().id
                var killedMe = msg.chosen.filter(function (p) {
                    return p.id == myId
                })
                if (killedMe.length)
                    $location.path("/join")
            })
        })

        $scope.$on("gameOver", function (ev, msg) {
            console.info("WINNERS", msg)
        })

        $scope.waitingVote = null
        $scope.$on("gameVote", function (ev, msg) {
            console.log('gameVote:', msg)
            $scope.waitingVote = msg.remaining
            $scope.$digest()
        })

        $http.get("players").then(function (resp) {
            $scope.players = (resp.data.list || []).filter(function (p) { return p.id != $scope.myself.id })
        }).catch(function (err) {
            $scope.error = err.data
        })
    });