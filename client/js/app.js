angular
  .module('app', [
    'lbServices',
    'ui.router',
    'geolocation'
  ])
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
      $urlRouterProvider) {
    $stateProvider
      .state('contact', {
        url: '',
        templateUrl: 'views/contact.html',
        controller: 'ContactController'
      })
      .state('confirmation', {
        url: '/conf/:id',
        templateUrl: 'views/confirmation.html',
        controller: 'ConfirmationController'
      });

    $urlRouterProvider.otherwise('contact');
  }]);
