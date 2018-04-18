angular.module('Werewolf')
    .controller('GameOver', function ($scope, $rootScope, $http, $timeout, $location, $routeParams, socket) {
        if ($rootScope.myself().id) {
            $rootScope.whoIAm()
                .catch(function (err) {
                    console.error(err)
                    $location.path("/setup")
                })
        }
        $scope.winner = $routeParams.winner
        $scope.gotoSetup = function () {
            $location.path("/setup")
        }
    })