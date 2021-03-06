/**
import 'bootstrap/dist/css/bootstrap.css';
import 'socket.io-client'
import angular from 'angular'
import 'angular-route'
import 'ngtouch'
import 'angular-toggle-switch'
*/
require('bootstrap/dist/css/bootstrap.css')
require('angular-toggle-switch/angular-toggle-switch-bootstrap.css')
require('bootstrap-toggle/css/bootstrap-toggle.min.css')
const io = require('socket.io-client')
const angular = require('angular')
require('angular-route')
require('ngtouch')
require('angular-cookies')
require('angular-toggle-switch')
require('angular-translate')
require('angular-translate-loader-static-files')

String.prototype.sprintf = function () {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};

var app = angular.module('Werewolf', ['ngRoute', 'ngTouch', 'ngCookies', 'pascalprecht.translate', 'toggle-switch']);
app.config(function ($routeProvider, $translateProvider) {
  $routeProvider
    .when('/setup', {
      templateUrl: 'setup.htm'
    })
    .when('/guide', {
      templateUrl: 'guide.htm'
    })
    .when('/join', {
      templateUrl: 'join.htm'
    })
    .when('/watchword', {
      templateUrl: 'watchword.htm'
    })
    .when('/poll', {
      templateUrl: 'poll.htm'
    })
    .when('/gameOver/:winner', {
      templateUrl: 'gameOver.htm'
    })

  $translateProvider.useStaticFilesLoader({
    prefix: '/i18n/',
    suffix: '.json'
  })
  $translateProvider.preferredLanguage('es');
});

app.filter('sprintf', function () {
  return function () {
    var theFormat = arguments[0]
    return theFormat.sprintf ? theFormat.sprintf.apply(theFormat, Array.prototype.slice.call(arguments, 1)) : theFormat;
  };
})

app.factory('socket', function ($rootScope, $window, $http, $location, $timeout) {

  $rootScope.myself = function (val) {
    val && sessionStorage.setItem('myself', JSON.stringify(val));
    const myself = JSON.parse(sessionStorage.getItem('myself') || '{}');
    return myself
  }
  $rootScope.whoIAm = function () {
    return $http.get('whoiam', {
      params: { id: $rootScope.myself().id }
    }).then(function (resp) {
      console.log('whoiam', resp.data)
      const myself = $rootScope.myself()
      $rootScope.myself(Object.assign(myself, resp.data))
      return $rootScope.myself()
    }).catch(function (err) {
      console.error(err)
      $location.path('/setup')
    })
  }

  $http.get('setup').then(function (resp) {
    if (!resp.data.limit || !$rootScope.myself().id)
      $location.path('/setup')
  }).catch(function (err) {
    $scope.error = err.data
  })

  var fs_socket = io()
  fs_socket.on('connect', function () {
    console.log('Connected to "/main"')
  })

  fs_socket.on('gameConfigured', function (msg) {
    console.log('event gameConfigured:', msg)
    $rootScope.myself({})
    $timeout(function () {
      $location.path('/join')
      $timeout(function () {
        $rootScope.$broadcast('gameConfigured', msg)
      })
    })
  });

  fs_socket.on('gameLocked', function (msg) {
    console.log('event gameLocked:', msg)
    $rootScope.$broadcast('gameLocked', msg)
  });

  fs_socket.on('watchwordReset', function (msg) {
    console.log('event watchwordReset:', msg)
    $rootScope.$broadcast('watchwordReset', msg)
  });

  fs_socket.on('gameWaiting', function (msg) {
    console.log('event gameWaiting:', msg)
    $rootScope.$broadcast('gameWaiting', msg)
  });

  fs_socket.on('gameKilling', function (msg) {
    console.log('event gameKilling:', msg)
    var myself = $rootScope.myself()
    myself.watchword = ""
    $rootScope.myself(myself)

    $rootScope.$broadcast('gameKilling', msg)
  });

  fs_socket.on('gameWon', function (msg) {
    console.log('event gameWon:', msg)
    $rootScope.$broadcast('gameWon', msg)
  });

  fs_socket.on('endPeek', function (msg) {
    console.log('event endPeek:', msg)
    $rootScope.$broadcast('endPeek', msg)
  });

  fs_socket.on('gamePolling', function (msg) {
    console.log('event gamePolling:', msg)
    if (!$rootScope.myself().killed) {
      $timeout(function () {
        $location.path('/poll')
      })
    }
  });

  fs_socket.on('gameVote', function (msg) {
    console.log('event gameVote:', msg)
    $rootScope.$broadcast('gameVote', msg)
  });

  fs_socket.on('gameOver', function (msg) {
    console.log('event gameOver:', msg)
    $timeout(function () {
      $location.path('/gameOver/' + msg)
    })
  });
  return fs_socket;
})

//pads right
String.prototype.rpad = function (padString, length) {
  var str = this;
  while (str.length < length)
    str = str + padString;
  return str;
}