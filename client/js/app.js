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
      .state('list', {
        url: '/list',
        templateUrl: 'views/list.html',
        controller: 'ListController'
      })
      .state('confirmation', {
        url: '/conf/:id',
        templateUrl: 'views/confirmation.html',
        controller: 'ListController'
      });

    $urlRouterProvider.otherwise('contact');
  }]);
