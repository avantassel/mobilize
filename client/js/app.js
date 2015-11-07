angular
  .module('app', [
    'lbServices',
    'ui.router',
    'geolocation'
  ])
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
      $urlRouterProvider) {
    $stateProvider
      .state('request', {
        url: '',
        templateUrl: 'views/request.html',
        controller: 'RequestController'
      })
      .state('confirmation', {
        url: '/confirmation/:requestId',
        templateUrl: 'views/confirmation.html',
        controller: 'ConfirmationController'
      });

    $urlRouterProvider.otherwise('request');
  }]);
