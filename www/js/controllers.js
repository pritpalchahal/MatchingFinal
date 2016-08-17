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

.controller('ExerciseCtrl', function($scope, $stateParams, Exercises, DroppedData) {
  $scope.droppedObjects1 = [];
  $scope.droppedObjects2 = [];

  $scope.draggableObjects = [];

  Exercises.getSingleEx($stateParams.exId).then(function(response){
    $scope.left1 = response[0].left;
    $scope.left2 = response[1].left;
    $scope.right1 = response[0].right;
    $scope.right2 = response[1].right;

    for(var i=0;i<$scope.right1.length;i++){
        $scope.draggableObjects[i] = new Array(2);
        $scope.draggableObjects[i][0] = $scope.right1[i];
        $scope.draggableObjects[i][1] = $scope.right2[i];
    }
  });

  $scope.title = Exercises.getExTitle($stateParams.exId);

  $scope.options = {
    loop: false,
    initialSlide: 0,
    effect: 'slide',//fade,slide,cube,coverflow,flip (http://idangero.us/swiper/api)
    speed: 500
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
  });


  $scope.onDragSuccess1=function(data,evt){
    var n = $scope.slider.activeIndex;
    DroppedData.create1(n);
    console.log("133","$scope","onDragSuccess1", "", evt);
    var index = DroppedData.get1(n).indexOf(data);
    console.log("indexS1 : "+index);
    if (index > -1) {
        DroppedData.get1(n).splice(index,1);
    }
  }
  $scope.onDropComplete1=function(data,evt){
    var n = $scope.slider.activeIndex;
    console.log("133","$scope","onDropComplete1", "", n, evt);
    DroppedData.create1(n);
    console.log(DroppedData.get1(n));
    var index = DroppedData.get1(n).indexOf(data);
    // console.log("indexC1 : "+index);
    if (index == -1){
      DroppedData.empty1(n);
      DroppedData.add1(data,n);
      $scope.droppedObjects1 = DroppedData.get1(n);
    }
    // $scope.checkAnswer($scope.exercise,$scope.droppedObjects1,$scope.droppedObjects2);
  }
  $scope.onDragSuccess2=function(data,evt){
    var n = $scope.slider.activeIndex;
    DroppedData.create1(n);
    console.log("133","$scope","onDragSuccess2", "", evt);
    var index = DroppedData.get2(n).indexOf(data);
    console.log("indexS2 : "+index);
    if (index > -1) {
        DroppedData.get2(n).splice(index,1);
    }
  }
  $scope.onDropComplete2=function(data,evt){
    var n = $scope.slider.activeIndex;
    DroppedData.create1(n);
    console.log("133","$scope","onDropComplete2", "", evt);
    var index = DroppedData.get1(n).indexOf(data);
    console.log("indexC2 : "+index);
    if (index == -1) {
      DroppedData.empty2(n);
      DroppedData.add2(data,n);
      $scope.droppedObjects2 = DroppedData.get2(n);
    }
    // $scope.checkAnswer($scope.exercise,$scope.droppedObjects1,$scope.droppedObjects2);
  }
})

.controller('HowToPlayCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
