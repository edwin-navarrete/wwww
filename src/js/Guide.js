angular.module('Werewolf')
  .controller('Guide', function ($rootScope, $scope, $http, $timeout, $location, $translate, $cookies, socket) {
    var lng = $cookies.get('langPref') || 'es'
    $translate.use(lng)
    console.log('Cur Lang', lng);
    $scope.langLbl = (lng === 'en') ? 'Español' : 'English'

    $scope.changeLang = function () {
      var lang = $translate.use() === 'en'? 'es':'en'
      $scope.langLbl = lang == 'en' ? 'Español' : 'English'
      $translate.use(lang)
      $cookies.put('langPref', lang)
    }
 
  });