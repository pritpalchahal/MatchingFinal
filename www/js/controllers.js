angular.module('starter.controllers', [])
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

.controller('SummaryCtrl', function($scope) {

})

.controller('ExsCtrl', function($scope, Exercises) {

  Exercises.getAll().then(function(response){
      $scope.exercises = response;
      console.log(response);
  });

  $scope.remove = function(ex) {
    Exercises.remove(ex);
  };
})

.controller('ExerciseCtrl', function($scope, $stateParams, Exercises) {
  Exercises.getSingleEx($stateParams.exId).then(function(response){
    $scope.ex = response[0];
    console.log(response);
  });

  $scope.title = Exercises.getExTitle($stateParams.exId);
})

.controller('HowToPlayCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
