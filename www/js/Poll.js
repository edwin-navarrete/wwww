angular.module('Werewolf')
    .controller('Poll', function ($rootScope, $scope, $http, $timeout, $location, socket) {
        $scope.players = []

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

        $scope.letsContinue= function(){
            $location.path("/join")
        }

        $scope.sendVote = function () {
            $http.post("/vote", $scope.myself)
                .catch(function (err) {
                    $scope.error = err.data
                })
        }

        $scope.$on("gameKilling", function (ev, msg) { 
            $timeout(function(){
                $scope.chosen = msg.chosen
                var myId = $rootScope.myself().id
                var killedMe = msg.chosen.filter(function(p){
                    return p.id == myId
                })
                if(killedMe.length)
                    $location.path("/join")
            })
        })

        $scope.$on("gameOver", function (ev, msg) { 
            console.info("WINNERS",msg) 
        })

        $scope.$on("gameVote", function (ev, msg) { 
             $scope.waiting = msg.remaining
        })

        $http.get("players").then(function (resp) {
            $scope.players = (resp.data.list || []).filter(function (p) { return p.id != $scope.myself.id })
        }).catch(function (err) {
            $scope.error = err.data
        })
    });