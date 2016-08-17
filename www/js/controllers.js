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
    // $scope.ex = response[0];
    // console.log(response);
    $scope.left1 = response[0].left;
    $scope.left2 = response[1].left;
    $scope.right1 = response[0].right;
    $scope.right2 = response[1].right;
  });

  $scope.title = Exercises.getExTitle($stateParams.exId);

  $scope.options = {
    initialSlide: 0,
    loop: true,
    effect: 'none',
    speed: 500,
  };

  $scope.$on("$ionicSlides.sliderInitialized", function(event, data){
    // data.slider is the instance of Swiper
    $scope.slider = data.slider;
  });

  $scope.$on("$ionicSlides.slideChangeStart", function(event, data){
    console.log('Slide change is beginning');
  });

  $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
    // note: the indexes are 0-based
    $scope.activeIndex = data.activeIndex;
    $scope.previousIndex = data.previousIndex;
    console.log($scope.activeIndex);
  });
})

.controller('HowToPlayCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
