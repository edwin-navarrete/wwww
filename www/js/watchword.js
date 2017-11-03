angular.module('Werewolf')
    .controller('Watchword', function ($scope, socket) {
        $scope.visibleWW = false
        $scope.watchword = 'hello world';
        $scope.showW = function (val) {
            $scope.visibleWW = val
        }
    });