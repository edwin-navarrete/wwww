angular.module('Werewolf')
  .controller('Setup', function ($rootScope, $scope, $http, $timeout, $location, $translate, $cookies, socket) {
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

    $rootScope.waiting = null
    $scope.players = 4
    $scope.wwtimeout = 10
    $scope.wwsamples = {
      'frutas': ['banano', 'cereza', 'fresa', 'kiwi', 'limón', 'mandarina', 'manzana', 'naranja', 'pera', 'piña', 'uva', 'durazno'],
      'animales': ['león', 'chimpancé', 'caballo', 'delfín', 'tiburón', 'elefante', 'jirafa', 'canario', 'pato', 'camaleón', 'tucán', 'tortuga'],
      'personajes': ['Gandhi', 'Buda', 'Mahoma', 'Einstein', 'Hawkins', 'Messi', 'Muhamed Alí', 'Jobs', 'Mandela', 'Woody Allen', 'Chaplin', 'Hitler'],
      'deportes': ['futbol', 'béisbol', 'karate', 'ajedrez', 'golf', 'vóleibol', 'esquí', 'ciclismo', 'pesas', 'lucha', 'patinaje', 'gimnasia'],
      'insectos': ['mariposa', 'mosca', 'avispa', 'abeja', 'cienpiés', 'oruga', 'araña', 'hormiga', 'libélula', 'pulga', 'cucarrón', 'cucaracha'],
      'herramientas': ['alicates', 'martillo', 'lupa', 'navaja', 'tijeras', 'torno', 'metro', 'termómetro', 'computador', 'cinta', 'esfero', 'jeringa'],
      'vehiculos': ['tren', 'avión', 'carro', 'camión', 'grua', 'velero', 'bicicleta', 'moto', 'bus', 'flota', 'taxi', 'barco'],
      'alimentos': ['pollo', 'arroz', 'pasta', 'papa', 'lenteja', 'garbanzo', 'ensalada', 'carne', 'postre', 'sopa', 'jugo', ''],
      'películas': ['Harry Potter', 'Piratas del Caribe', 'Avengers', 'Toy Story', 'El señor de los anillos', 'Mundo Jurásico', 'Star Wars', 'Frozen', 'Despicable Me', 'Buscando a Nemo', 'El Rey León', 'Shrek'],
    }
    $scope.categs = Object.keys($scope.wwsamples);
    $scope.watchwords = ['Harry Potter', 'Piratas del Caribe', 'Avengers', 'Toy Story', 'El señor de los anillos', 'Mundo Jurásico', 'Star Wars', 'Frozen', 'Despicable Me', 'Buscando a Nemo', 'El Rey León', 'Shrek'];
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