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

.controller('CustomBackController', function($scope,$ionicHistory,$stateParams,DroppedData,$filter,Exercises){
  $scope.myGoBack = function(){
    var exId = $stateParams.exId;
    $ionicHistory.goBack();

    //update end time
    if(DroppedData.getSingleState(exId) != "Complete"){
      var time = new Date();
      var timeNow = $filter('date')(time,'medium');
      DroppedData.updateSummaryEtime(exId,timeNow);
    }

    var totalSlides = Exercises.getSlidesCount();
    if((DroppedData.getEx1(exId).length > 0) || (DroppedData.getEx2(exId).length > 0)){
      var j = 0;
      var values = DroppedData.getValues(exId);
      for(i=0;i<values.length;i++){
        if(values[i]){
          j++;
        }
      }
      if(j == totalSlides){
        DroppedData.updateState(exId,"Complete");
      }
      else{
        DroppedData.updateState(exId,"Incomplete");
      }
    }
    else{
      DroppedData.updateState(exId,"New");
    }
    // $scope.$boradcast("myEvent",{state: "haha"});
  }
})

.controller('ExsCtrl', function($scope, Exercises, DroppedData,$timeout) {

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

  $scope.doRefresh = function(){
    // $timeout(function(){
      Exercises.getAll().then(function(response){
        $scope.exercises = response;
        for(var i=0;i<$scope.exercises.length;i++){
          var currentState = DroppedData.getSingleState($scope.exercises[i]._id);
          if(currentState){
            DroppedData.updateState($scope.exercises[i]._id,currentState);
          }
          else{
            DroppedData.updateState($scope.exercises[i]._id,"New");
          }
        }
        $scope.states = DroppedData.getAllStates();
        $scope.$broadcast('scroll.refreshComplete');
      });
    // },1000);
  };
})

.controller('ExerciseCtrl', function($scope, $stateParams, Exercises, DroppedData, $ionicPopup, $ionicPopover,$filter,
  $timeout,ionicToast) {
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
    $scope.slides = Exercises.getSlidesCount();

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
    var values = DroppedData.getValues(exId);
    var i = 0;
    for(var j=0;j<values.length;j++){
      if(values[j]){
        i++;
      }
    }
    DroppedData.updateSummaryScore(exId,i);
    var alertPopup = $ionicPopup.alert({
      scope: $scope,
      title: 'Summary report',
      templateUrl: 'templates/summary.html'
    });

    alertPopup.then(function(response){
      //custom functionality
    });

    //close popup after 3 seconds
    // $timeout(function(){
    //   alertPopup.close();
    // }, 5000);
  }

  $scope.restartGame = function(){
    var confirmPopup = $ionicPopup.confirm({
      title: 'Restart this Game!',
      template: 'Would you like to restart this game?'
    });

    confirmPopup.then(function(response){
      if(response){
        //clear model
        DroppedData.clear(exId);
        DroppedData.clearValues(exId);
        DroppedData.clearSummary(exId);
        DroppedData.createSummary(exId);
        var time = new Date();
        var timeNow = $filter('date')(time,'medium');//angularjs date format
        DroppedData.updateSummaryStime(exId,timeNow);

        //clear view
        $scope.myValue = DroppedData.getValues(exId);
        $scope.droppedObjects1 = [];
        $scope.droppedObjects2 = [];

        //update summary
        $scope.summary = DroppedData.getSummary(exId);
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
      ionicToast.show('Answer Incorrect!','middle',false,2500);
      // var errorPopup = $ionicPopup.alert({
      //   template: 'Incorrect',
      //   title: 'Try again'
      // });
    }
  }

  var Check = function(n){
    var value1 = $scope.droppedObjects1[n];
    var value2 = $scope.droppedObjects2[n];

    if(value1 == $scope.right1[n] && value2 == $scope.right2[n]){
      ionicToast.show('Correct Answer.','middle',false,2500);
      // var myPopup = $ionicPopup.alert({
      //   template: 'Well  done!',
      //   title: 'Correct Answer.'
      // });

      // myPopup.then(function(res){
      //   //custom functionality
      // });
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
