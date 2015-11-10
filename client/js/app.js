angular
  .module('app', [
    'lbServices',
    'ui.router',
    'geolocation'
  ])
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
      $urlRouterProvider) {
    $stateProvider
      .state('signup', {
        url: '/signup',
        templateUrl: 'views/signup.html',
        controller: 'SignupController'
      })
      .state('confirmation', {
        url: '/conf/:id',
        templateUrl: 'views/confirmation.html',
        controller: 'AdminController'
      })
      .state('admin', {
        url: '/admin',
        templateUrl: 'views/admin.html',
        controller: 'AdminController'
      });

    $urlRouterProvider.otherwise('signup');
  }])
  .filter('ago', function() {
    return function(lastUpdated){
      return moment(lastUpdated).fromNow();
    }
  })
  .filter('address', ['$sce', function($sce) {
    return function(address){
      if(address)
        return $sce.trustAs('html',address.replace(',','<br>'));
      else
        return address;
    }
  }])
  .filter('escape', function() {
          return window.escape;
  });
