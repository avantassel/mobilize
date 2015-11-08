angular
  .module('app')
  .controller('ConfirmationController', ['$scope', '$state', '$http', 'Contact', function($scope,
      $state, $http, Contact) {

        if(!$state.params.id)
          return $state.go('contact');

        $scope.contactRequest = {};

        function getContactRequest() {
          Contact
            .find({'filter':{'where':{id:$state.params.id}}})
            .$promise
            .then(function(result) {
              $scope.contactRequest = result;
            });
        }

      getContactRequest();
}]);
