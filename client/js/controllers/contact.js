angular
  .module('app')
  .controller('ContactController', ['$scope', '$state', '$http', 'Contact', 'geolocation', function($scope,
      $state, $http, Contact, geolocation) {

    $scope.requests = [];
    $scope.shelters = [];
    $scope.recognizing = false;
    $scope.newContactRequest = {
      comments: ""
      ,location: {}
      ,shelter: {}
    };

    function getShelters() {
      var redCrossUrl = 'http://redcross.mybluemix.net/redcross/shelters/';
      if($scope.newContactRequest.location.lat)
        redCrossUrl += $scope.newContactRequest.location.lat+'/'+$scope.newContactRequest.location.lng;
      $http.get(redCrossUrl,{params: {active:true}}).then(function(response){
        if(response.data){
          $scope.shelters = response.data;
        }
      });
    }

    function getContactRequests() {
      Contact
        .find()
        .$promise
        .then(function(results) {
          $scope.requests = results;
        });
    }

    //get user location
    geolocation.getLocation().then(function success(data){
      $scope.newContactRequest.location = {lat:data.coords.latitude, lng:data.coords.longitude};
      getShelters();
    },function error(err){
      //could not get user location
      getShelters();
    });

    getContactRequests();

    $scope.addContactRequest = function() {
      Contact
        .create($scope.newContactRequest)
        .$promise
        .then(function(request) {
          return $state.go('confirmation',{id:request.id});
        });
    };

    $scope.removeContactRequest = function(item) {
      Contact
        .deleteById(item)
        .$promise
        .then(function() {
          getContactRequests();
        });
    };

    $scope.chooseShelter = function(shelter){
        if($scope.newContactRequest.shelter['_id'] && $scope.newContactRequest.shelter['_id'] == shelter['_id']){
          $scope.newContactRequest.shelter = {};
          $('.list-group-item').fadeIn();
        } else {
          $scope.newContactRequest.shelter = shelter;
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

      var recognition = new webkitSpeechRecognition()
        , final_transcript = '';

      if ($scope.recognizing) {
        recognition.stop();
        $scope.recognizing = false;
        return;
      } else {
        $scope.recognizing = true;
      }

      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onerror = function(e) {
        if (e.error == 'no-speech') {
          $scope.error = "No speech";
        }
        if (e.error == 'audio-capture') {
          $scope.error = "No microphone found";
        }
        if (e.error == 'not-allowed') {
          $scope.error = "Mic blocked";
        }
      };

      recognition.onstart = function() {
        // $scope.recognizing = true;
      };
      recognition.onend = function () {
          // $scope.recognizing = false;
          if (!final_transcript) {
              return;
          }
      };

      recognition.onresult = function (e) {
        var interim_transcript = '';
        for (var i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) {
                final_transcript += e.results[i][0].transcript;
            } else {
                interim_transcript += e.results[i][0].transcript;
            }
        }
        // console.log(format(interim_transcript));
        $scope.newContactRequest.comments = format(final_transcript);
      }
      function linebreak(s) {
          return s.replace(/\n\n/g, '<p></p>').replace(/\n/g, '<br>');
      }

      function capitalize(s) {
          return s.replace(/\S/, function (m) {
              return m.toUpperCase();
          });
      }
      function format(s) {
          return linebreak(capitalize(s));
      }
      // start listening
      recognition.start();
    };

  }])
  .filter('ago', function() {
    return function(lastUpdated){
      return moment(lastUpdated).fromNow();
  };
});
