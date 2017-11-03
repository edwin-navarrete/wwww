angular.module('Werewolf')
    .controller('Join', function ($scope, $rootScope, $http, $timeout, $location, socket) {

        function whoIAm() {
            $http.get("whoiam", {
                params: { id: $rootScope.myself().id }
            }).then(function (resp) {
                console.log("whoiam", resp.data)
                const myself = $rootScope.myself()
                $rootScope.myself(Object.assign(myself, resp.data))
                $scope.joined = true
                $scope.error = ""
                $scope.name = $rootScope.myself().name
            }).catch(function (err) {
                $scope.error = err.data
            })
        }

        $scope.visibleRole = false
        $scope.showRole = function (val) {
            return $scope.visibleRole = val
        }
        if ($rootScope.myself().id) {
            whoIAm()
        }

        $scope.readWW = function () {
            $http.get("watchword", {
                params: { id: $rootScope.myself().id }
            }).then(function (resp) {
                var myself = $rootScope.myself()
                myself.watchword = resp.data.watchword
                myself.watchword = myself.watchword.rpad(' ', 50)
                $rootScope.myself(myself)
            }).catch(function (err) {
                $scope.error = err.data
            })
        }
        $scope.$on('gamePolling', function (ev) {
            var myself = $rootScope.myself()
            myself.watchword = ""
            $rootScope.myself(myself)
            $location.path("/poll")
        });

        $scope.visibleWW = false
        $scope.showW = function (val) {
            $scope.visibleWW = val
        }

        $scope.$on('gameWaiting', function (ev, msg) {
            $rootScope.waiting = msg.for
            $timeout(function () { $scope.$apply() })
        });

        $scope.joinNow = function () {
            $scope.joined = true
            $scope.error = ""
            $http.post("join", {
                name: $scope.name
            }).then(function (resp) {
                console.log("join", resp.data)
                $rootScope.myself(resp.data)
            }).catch(function (err) {
                $scope.joined = false
                $scope.name = ""
                $scope.error = err.data
            })
        }
        $scope.$on("gameConfigured", function (ev, msg) {
            $scope.joined = false
            $scope.$apply()
        })

        $scope.$on("gameLocked", function (ev, msg) {
            $timeout(function () {
                $http.get("whoiam", {
                    params: { id: $rootScope.myself().id }
                }).then(function (resp) {
                    $rootScope.myself(resp.data)
                }).catch(function (err) {
                    $scope.error = err.data
                })
            })
        })
    });