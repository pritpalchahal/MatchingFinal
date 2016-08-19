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

.controller('CustomBackController', function($scope,$ionicHistory,$stateParams,DroppedData,$filter){
  $scope.myGoBack = function(){
    var exId = $stateParams.exId;
    $ionicHistory.goBack();
    var time = new Date();
    var timeNow = $filter('date')(time,'medium');
    DroppedData.updateSummaryEtime(exId,timeNow);
    if((DroppedData.getEx1(exId).length > 0) || (DroppedData.getEx2(exId).length > 0)){
      DroppedData.updateState(exId,"Incomplete");
    }
    else{
      DroppedData.updateState(exId,"New");
    }
    // $scope.$boradcast("myEvent",{state: "haha"});
  }
})

.controller('ExsCtrl', function($scope, Exercises, DroppedData) {

  Exercises.getAll().then(function(response){
    $scope.exercises = response;
    for(var i=0;i<$scope.exercises.length;i++){
      DroppedData.updateState($scope.exercises[i]._id,"New");
    }
    $scope.states = DroppedData.getAllStates();
  });

  $scope.remove = function(ex) {
    Exercises.remove(ex);
  };

  //use this method to refresh data
  $scope.$on('$ionicView.enter',function(e){
    $scope.states = DroppedData.getAllStates();//refresh states
  });

  // $scope.$on("myEvent",function(event,args){
  //   $scope.state = args.state;
  //   console.log($scope.state);
  // });
})

.controller('ExerciseCtrl', function($scope, $stateParams, Exercises, DroppedData, $ionicPopup, $ionicPopover,$filter) {
  var exId = $stateParams.exId;
  if(!DroppedData.getValues(exId)){
    DroppedData.createValue(exId);
  }
  if(!DroppedData.getSummary(exId)){
    DroppedData.createSummary(exId);
    var time = new Date();
    var timeNow = $filter('date')(time,'medium');//angularjs date format
    DroppedData.updateSummaryStime(exId,timeNow);
  }

  $scope.myValue = DroppedData.getValues(exId);
  $scope.summary = DroppedData.getSummary(exId);

  if(!DroppedData.getEx1(exId)){
    DroppedData.createEx1(exId);
  }
  if(!DroppedData.getEx2(exId)){
    DroppedData.createEx2(exId);
  }
  var oldRight1 = DroppedData.getEx1(exId);
  var oldRight2 = DroppedData.getEx2(exId);

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
    var n = $scope.slider.activeIndex;
    LoadState();
    // var element = angular.element(document.querySelector('#r1'));
    // element.text = "a";
    // console.log(element);
  });

  $scope.$on("$ionicSlides.slideChangeStart", function(event, data){
    console.log('Slide change is beginning');
  });

  $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
    // note: the indexes are 0-based
    $scope.activeIndex = data.activeIndex;
    $scope.previousIndex = data.previousIndex;
  });

  $scope.onDragSuccess1 = function(data,evt){
    var n = $scope.slider.activeIndex;
    if(!DroppedData.get1(exId,n)){
      DroppedData.create1(exId,n);return;
    }
    var index = DroppedData.get1(exId,n).indexOf(data);
    if (index > -1) {
        DroppedData.get1(exId,n).splice(index,1);
    }
    console.log("onDragSuccess1", "",index,"", evt);
  }
  $scope.onDropComplete1 = function(data,evt){
    var n = $scope.slider.activeIndex;
    DroppedData.create1(exId,n);
    var index = DroppedData.get1(exId,n).indexOf(data);
    if (index == -1){
      DroppedData.empty1(exId,n);
      DroppedData.add1(exId,data,n);
      $scope.droppedObjects1[n] = [];
      $scope.droppedObjects1[n] = DroppedData.get1(exId,n);
    }
    console.log("onDropComplete1", "", index,"", evt);
    Check(n);
  }

  $scope.onDragSuccess2 = function(data,evt){
    var n = $scope.slider.activeIndex;
    if(!DroppedData.get2(exId,n)){
      DroppedData.create2(exId,n);return;
    }
    var index = DroppedData.get2(exId,n).indexOf(data);
    if (index > -1) {
        DroppedData.get2(exId,n).splice(index,1);
    }
    console.log("onDragSuccess2", "",index,"", evt);
  }
  $scope.onDropComplete2 = function(data,evt){
    var n = $scope.slider.activeIndex;
    DroppedData.create2(exId,n);
    var index = DroppedData.get2(exId,n).indexOf(data);
    if (index == -1){
      DroppedData.empty2(exId,n);
      DroppedData.add2(exId,data,n);
      $scope.droppedObjects2[n] = [];
      $scope.droppedObjects2[n] = DroppedData.get2(exId,n);
    }
    console.log("onDropComplete2", "", index,"", evt);
    Check(n);
  }

  $ionicPopover.fromTemplateUrl("templates/ex-detail-popover.html",{
    scope: $scope
  }).then(function(popover){
    $scope.popover = popover;
  });

  $scope.showSummary = function(){
    var alertPopup = $ionicPopup.alert({
      title: 'Summary',
      subTitle: 'StartTime: '+$scope.summary.sTime+'\nEndTime: '+$scope.summary.eTime,
      // templateUrl: 'templates/summary.html',
      scope: $scope
    });

    alertPopup.then(function(response){
      //custom functionality
    });
  }

  $scope.restartGame = function(){
    var confirmPopup = $ionicPopup.confirm({
      title: 'Restart this Game!',
      template: 'Are you sure?'
    });

    confirmPopup.then(function(response){
      if(response){
        //clear model
        DroppedData.clear(exId);
        DroppedData.clearValues(exId);
        //clear view
        $scope.myValue = DroppedData.getValues(exId);
        $scope.droppedObjects1 = [];
        $scope.droppedObjects2 = [];
      }
      else{
        // console.log("no");
      }
    });
  }

  $scope.openPopover = function($event){
    $scope.popover.show($event);
  }

  $scope.checkAnswer = function(n){
    if(!Check(n)){
      var errorPopup = $ionicPopup.alert({
        template: 'Incorrect',
        title: 'Try again'
      });
    }
  }

  var Check = function(n){
    var value1 = $scope.droppedObjects1[n];
    var value2 = $scope.droppedObjects2[n];
    console.log(value1+"-"+value2);

    if(value1 == $scope.right1[n] && value2 == $scope.right2[n]){
      var myPopup = $ionicPopup.alert({
        template: 'Well  done!',
        title: 'Correct Answer.'
      });

      myPopup.then(function(res){
        //custom functionality
      });
      DroppedData.updateValue(exId,true,n);//update show/hide values
      return true;
    }
    return false;
  }

  var LoadState = function(){
    if(oldRight1){
      for(var i = 0;i<oldRight1.length;i++){
        $scope.droppedObjects1[i] = [];
        if(oldRight1[i]){
          for(var j=0;j<oldRight1[i].length;j++){
            $scope.droppedObjects1[i][j] = [];
            $scope.droppedObjects1[i][j] = oldRight1[i][j];
          }
        }
      }
    }
    if(oldRight2){
      for(var i = 0;i<oldRight2.length;i++){
        $scope.droppedObjects2[i] = [];
        if(oldRight2[i]){
          for(var j=0;j<oldRight2[i].length;j++){
            $scope.droppedObjects2[i][j] = [];
            $scope.droppedObjects2[i][j] = oldRight2[i][j];
          }
        }
      }
    }
  }
})

.controller('HowToPlayCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
