angular.module('Werewolf')
    .controller('Setup', function ($scope, $http, $timeout, $location, socket) {
        $scope.players = 3
        $scope.wwtimeout = 10
        $scope.watchwords = ["Piratas del caribe", "Spyfall"];
        $scope.auto = true;
        $scope.joinGame = function () {
            $http.post("setup", {
                players: $scope.players,
                watchwords: $scope.watchwords,
                auto: $scope.auto,
                wwtimeout: $scope.wwtimeout
            }).then(function (resp) {
                $scope.werewolfs = resp.data
            }).catch(function (err) {
                $scope.error = err.data
            })
        };
        $scope.auto = true
        $scope.$on('gameConfigured', function (ev, msg) {
            $timeout(function () { $location.path('/join') })
        })
    });