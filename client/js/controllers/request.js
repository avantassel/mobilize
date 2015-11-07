angular
  .module('app')
  .controller('RequestController', ['$scope', '$state', '$http', 'Request', 'geolocation', function($scope,
      $state, $http, Request, geolocation) {

    var recognition = new webkitSpeechRecognition();

    $scope.requests = [];
    $scope.shelters = [];
    $scope.recognizing = false;
    $scope.newRequest = {
      comments: ""
      ,location: {}
      ,shelter: {}
    };

    function getShelters() {
      var redCrossUrl = 'http://redcross.mybluemix.net/redcross/shelters/';
      if($scope.newRequest.location.lat)
        redCrossUrl += $scope.newRequest.location.lat+'/'+$scope.newRequest.location.long;
      $http.get(redCrossUrl,{params: {active:true}}).then(function(response){
        if(response.data){
          $scope.shelters = response.data;
        }
      });
    }

    function getRequests() {
      Request
        .find()
        .$promise
        .then(function(results) {
          $scope.requests = results;
        });
    }

    //get user location
    geolocation.getLocation().then(function success(data){
      $scope.newRequest.location = {lat:data.coords.latitude, long:data.coords.longitude};
      getShelters();
    },function error(err){
      //could not get user location
      getShelters();
    });

    getRequests();

    $scope.addRequest = function() {
      Request
        .create($scope.newRequest)
        .$promise
        .then(function(request) {
          $scope.newRequest = {};
          $scope.requestForm.content.$setPristine();
          $('.focus').focus();
          getRequests();
        });
    };

    $scope.removeRequest = function(item) {
      Request
        .deleteById(item)
        .$promise
        .then(function() {
          getRequests();
        });
    };

    $scope.chooseShelter = function(shelter){
        if($scope.newRequest.shelter['_id'] && $scope.newRequest.shelter['_id'] == shelter['_id']){
          $scope.newRequest.shelter = {};
          $('.list-group-item').fadeIn();
        } else {
          $scope.newRequest.shelter = shelter;
          $('.list-group-item').fadeOut(function(){
            $('.list-group-item.active').show();
          });
        }
    };

    $scope.getPopulationClass = function(shelter){
      if(shelter.population/shelter.capacity >= .85)
        return 'btn-danger';
      else if(shelter.population/shelter.capacity >= .6 && shelter.population/shelter.capacity < .85)
        return 'btn-warning';
      else
        return 'btn-success';
    };

    $scope.listen = function(){
      if ($scope.recognizing) {
        recognition.stop();
        return;
      }

      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onerror = function(event) {
        if (event.error == 'no-speech') {
          $scope.error = "No speech";
        }
        if (event.error == 'audio-capture') {
          $scope.error = "No microphone found";
        }
        if (event.error == 'not-allowed') {
          $scope.error = "Mic blocked";
        }
      };

      recognition.onstart = function() {
        $scope.recognizing = true;
        $scope.progress = 'Speak now';
      };

      recognition.onresult = function (e) {
          for (var i = e.resultIndex; i < e.results.length; ++i) {
              $scope.newRequest.comments += e.results[i][0].transcript;
          }
      }
      // start listening
      recognition.start();
    };
  }]);
