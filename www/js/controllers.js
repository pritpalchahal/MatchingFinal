angular.module('collocationmatching.controllers', [])
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

.controller('SummaryCtrl', function($scope) {

})

.controller('CustomBackController', function($scope,$ionicHistory,$stateParams,$filter,Exercises,StateData,SummaryData,AnswerData,DropData){
  $scope.myGoBack = function(){
    var exId = $stateParams.exId;
    $ionicHistory.goBack();

    if($ionicHistory.currentStateName != "tab.exercise"){
      return;
    }

    //update end time
    if(StateData.getSingleState(exId) != "Complete"){
      var time = new Date();
      var timeNow = $filter('date')(time,'medium');
      SummaryData.updateEndTime(exId,timeNow);
    }

    var totalSlides = Exercises.getSlidesCount();
    var j = 0;
    var values = AnswerData.getValues(exId);
    for(i=0;i<values.length;i++){
      if(values[i]){
        j++;
      }
    }
    if(j == totalSlides){
      StateData.updateState(exId,"Complete");
    }
    else{
      StateData.updateState(exId,"Incomplete");
    }
  }
})

.controller('CollectionsCtrl', function($scope,Exercises,$timeout,$ionicLoading,$state){

  Exercises.getAllColls().then(function(response){
    $scope.collections = [];
    $ionicLoading.show();

    //wait untill all data is received
    $timeout(function(){
      $ionicLoading.hide();
      $scope.collections = response;
      console.log($scope.collections); 
    }, 200);
  });

  $scope.doRefresh = function(){
    //to remove duplicacy always remember to empty previous data before refreshing
    Exercises.newList();
    Exercises.getAllColls().then(function(response){

      //wait untill all data is received
      $timeout(function(){
        $scope.collections = response;
        console.log($scope.collections); 
        $scope.$broadcast('scroll.refreshComplete');
      }, 200);
    });
  };

  $scope.remove = function(ex) {
    Exercises.removeColl(ex);
  };

  // $scope.click = function(coll){
  //   $state.go('collections-exs',{collectionName: coll});
  // }
})

.controller('ExsCtrl', function($scope, Exercises, $timeout,$stateParams,Ids, StateData) {
  var name = $stateParams.collectionName;
  $scope.collectionName = name;
  Ids.create($scope.collectionName);
  var id = Ids.get($scope.collectionName);
  console.log("id: "+id);

  Exercises.getAll(name).then(function(response){
    $scope.exercises = response;
    for(var i=0;i<$scope.exercises.length;i++){
      StateData.updateState($scope.exercises[i]._id,"New");
    }
    $scope.states = StateData.getAllStates();
  });

  $scope.remove = function(ex) {
    Exercises.remove(ex);
  };

  //use this method to refresh data
  $scope.$on('$ionicView.enter',function(e){
    $scope.states = StateData.getAllStates();//refresh states
  });

  // $scope.$on("myEvent",function(event,args){
  //   $scope.state = args.state;
  //   console.log($scope.state);
  // });

  $scope.doRefresh = function(){
    // $timeout(function(){
      Exercises.getAll(name).then(function(response){
        $scope.exercises = response;
        for(var i=0;i<$scope.exercises.length;i++){
          var currentState = StateData.getSingleState($scope.exercises[i]._id);
          if(currentState){
            StateData.updateState($scope.exercises[i]._id,currentState);
          }
          else{
            StateData.updateState($scope.exercises[i]._id,"New");
          }
        }
        $scope.states = StateData.getAllStates();
        $scope.$broadcast('scroll.refreshComplete');
      });
    // },1000);
  };
})

.controller('ExerciseCtrl', function($scope, $stateParams, Exercises, $ionicPopup, $ionicPopover,$filter,
  $timeout,ionicToast,Ids,AnswerData,DropData,SummaryData) {
  var exId = $stateParams.exId;
  var collectionName = $stateParams.collectionName;
  var id = Ids.get(collectionName);

  if(!AnswerData.getValues(exId)){
    AnswerData.createValue(exId);
  }

  if(!SummaryData.getSummary(exId)){
    SummaryData.createSummary(exId);
    var time = new Date();
    var timeNow = $filter('date')(time,'medium');//angularjs date format
    SummaryData.updateStartTime(exId,timeNow);
  }

  $scope.myValue = AnswerData.getValues(exId);
  $scope.summary = SummaryData.getSummary(exId);

  var oldData = DropData.getWord(exId);

  var drags = [];
  var drops = [];

  drags[id] = [];
  drops[id] = [];

  $scope.draggableObjects = drags[id];
  $scope.dropped = drops[id];

  Exercises.getSingleEx(exId,collectionName).then(function(response){
    $scope.words = response;
    $scope.slides = Exercises.getSlidesCount();
    $scope.slideCount = new Array($scope.slides);

    for(var i=0;i<$scope.slides;i++){
        $scope.draggableObjects[i] = new Array($scope.words.length);
        for(var j=0 ; j<$scope.words.length; j++){
          if($scope.words[j][i]){
            $scope.draggableObjects[i][j] = $scope.words[j][i].right;
          }
        }
    }

    if(!oldData){
      DropData.createEx(exId);
      for(var i=0;i<$scope.words.length;i++){
        DropData.createWord(exId,i);
      }
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
    // console.log('Slide change is beginning');
  });

  $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
    // note: the indexes are 0-based
    $scope.activeIndex = data.activeIndex;
    $scope.previousIndex = data.previousIndex;
  });

  $scope.onDragSuccess = function(data,evt,wordIndex){
    var slideId = $scope.slider.activeIndex;
    DropData.clearValue(exId,wordIndex,slideId);
    // console.log("onDragSuccess", "",wordIndex,"", data);
  }
  $scope.onDropComplete = function(data,evt,wordIndex){
    var slideId = $scope.slider.activeIndex;
    var value = DropData.getValue(exId,wordIndex,slideId);
    if(value != data){
      DropData.add(exId,wordIndex,slideId,data);
      $scope.dropped = DropData.getWord(exId);
    }
    // console.log("onDropComplete", "", wordIndex,"", data);
    Check(slideId);
  }

  $ionicPopover.fromTemplateUrl("templates/ex-detail-popover.html",{
    scope: $scope
  }).then(function(popover){
    $scope.popover = popover;
  });

  $scope.showSummary = function(){
    var values = AnswerData.getValues(exId);
    var i = 0;
    for(var j=0;j<values.length;j++){
      if(values[j]){
        i++;
      }
    }
    SummaryData.updateScore(exId,i);
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
        DropData.clear(exId);
        AnswerData.clearValues(exId);
        SummaryData.clearSummary(exId);
        SummaryData.createSummary(exId);

        var time = new Date();
        var timeNow = $filter('date')(time,'medium');//angularjs date format
        SummaryData.updateEndTime(exId,timeNow);

        //clear view
        $scope.myValue = AnswerData.getValues(exId);
        $scope.dropped = [];

        //update summary
        $scope.summary = SummaryData.getSummary(exId);
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

  var Check = function(slideId){
    var count = 0;
    var countSet = 0;
    var wordsCount = $scope.words.length;

    for(var i=0;i<wordsCount;i++){
      if($scope.dropped[i]){
        if($scope.words[i][slideId]){
          countSet++;
          if($scope.dropped[i][slideId] == $scope.words[i][slideId].right){
            count++;
          }
        }
      }
    }

    if(count == countSet){
      AnswerData.updateValue(exId,true,slideId);//update show/hide values
      return true;
    }
    return false;
  }

  var LoadState = function(){
    if(oldData){
      $scope.dropped = oldData;
    }
  }
})

.controller('HowToPlayCtrl', function($scope) {
  $scope.settings = {
    enableHelp: true
  };
});
