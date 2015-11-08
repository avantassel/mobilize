angular
  .module('app')
  .controller('ListController', ['$scope', '$state', '$http', 'Contact', function($scope,
      $state, $http, Contact) {

        $scope.contactRequests = {};

        function getContactRequest() {
          var qs = {};
          if($state.params.id)
            qs = {'filter':{'where':{id:$state.params.id}}};

          Contact
            .find(qs)
            .$promise
            .then(function(result) {
              $scope.contactRequests = result[0];
            });
        }

      getContactRequest();

      $scope.removeContactRequest = function(item) {
        if(confirm('Are you sure you want to cancel your request?')){
          Contact
            .deleteById(item)
            .$promise
            .then(function() {
              return $state.go('contact');
            });
        }
      };

      $scope.getSentimentClass = function(contact,fa){
        if(!contact.sentiment)
          return fa?'fa-question-circle':'btn-info';
        if(contact.sentiment.type=='positive')
          return fa?'fa-check-circle-o':'btn-success';
        else if(contact.sentiment.type=='negative')
          return fa?'fa-exclamation-circle':'btn-danger';
        else
          return fa?'fa-question-circle':'btn-info';
      };

      $('[data-toggle="tooltip"]').tooltip()
}]);
