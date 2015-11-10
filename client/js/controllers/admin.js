angular
  .module('app')
  .controller('AdminController', ['$scope', '$state', '$http', 'Contact', function($scope,
      $state, $http, Contact) {

        $scope.contactRequests = {};

        function getContactRequest() {
          var qs = {};
          if($state.params.id)
            qs = {'filter':{'where':{id:$state.params.id}}};

          Contact
            .find(qs)
            .$promise
            .then(function(results) {
              if($state.params.id){
                $scope.contactRequests = results[0];
                //update background to static map of users location
                $(".cardheader").css('background-image', "url(https://maps.googleapis.com/maps/api/staticmap?center="+$scope.contactRequests.location.lat+","+$scope.contactRequests.location.lng+"&zoom=10&size=300x150&maptype=terrain&markers=color:blue%7C"+$scope.contactRequests.location.lat+","+$scope.contactRequests.location.lng+")");
              } else {
                $scope.contactRequests = results;
              }
            });
        }

      getContactRequest();

      $scope.removeContactRequest = function(item) {
        if(confirm('Are you sure you want to cancel your request?')){
          Contact
            .deleteById(item)
            .$promise
            .then(function() {
              return $state.go('signup');
            });
        }
      };

      $scope.SendMessage = function() {
        if(confirm('Are you sure you want to send this message?')){
          Contact
            .sendNotifyMessage({'message':$scope.message})
            .$promise
            .then(function(results) {

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

      $scope.getPopulationClass = function(shelter){
        if(shelter.population/shelter.capacity >= .85)
          return 'btn-danger';
        else if(shelter.population/shelter.capacity >= .6 && shelter.population/shelter.capacity < .85)
          return 'btn-warning';
        else
          return 'btn-success';
      };

      $('[data-toggle="tooltip"]').tooltip();
      $("#message").characterCounter();
}]);
