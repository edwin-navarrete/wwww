angular.module('Werewolf')
    .controller('GameOver', function ($scope, $rootScope, $http, $timeout, $location, socket) {
        if ($rootScope.myself().id) {
            $rootScope.whoIAm()
                .catch(function (err) {
                    console.error(err)
                    $location.path("/setup")
                })
        }

        $scope.$on("gameOver", function (ev, winner) {
            $timeout(function () {
                $scope.winner = winner
            })
        })
        $scope.gotoSetup = function () {
            $location.path("/setup")
        }
    })