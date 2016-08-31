angular.module('collocationmatching.controllers', [])
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

.controller('BackButtonController', function($scope,$ionicHistory,$stateParams,$filter,
  Exercises,StateData,SummaryData,AnswerData,DropData,Ids){
  $scope.customGoBack = function(){
    var exId = $stateParams.exId;
    var name = $stateParams.collectionName;
    var id = Ids.get(name);

    $ionicHistory.goBack();
    var currentState = $ionicHistory.currentStateName();

    if(currentState != "exercise"){
      return;
    }

    //update end time
    if(StateData.getSingleState(id,exId) != "Complete"){
      var time = new Date();
      var timeNow = $filter('date')(time,'medium');
      SummaryData.updateEndTime(id,exId,timeNow);
    }

    var totalSlides = Exercises.getSlidesCount();
    var j = 0;
    var values = AnswerData.getValues(id,exId);
    for(i=0;i<values.length;i++){
      if(values[i]){
        j++;
      }
    }
    if(j == totalSlides){
      StateData.updateState(id,exId,"Complete");
    }
    else{
      StateData.updateState(id,exId,"Incomplete");
    }
  }
})

.controller('CollectionsCtrl', function($scope,Exercises,$timeout,$ionicLoading,$state,$ionicPopover,$ionicPopup){

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

  $ionicPopover.fromTemplateUrl("templates/collections-popover.html",{
    scope: $scope
  }).then(function(popover){
    $scope.popover = popover;
  });

  $scope.openPopover = function($event){
    $scope.popover.show($event);
  };

  $scope.showAbout = function(){
    var alertPopup = $ionicPopup.alert({
      scope: $scope,
      title: 'About Flax',
      templateUrl: 'templates/aboutFlax.html'
    });

    alertPopup.then(function(response){
      //custom functionality
    });
  }

  $scope.showHelp = function(){
    var alertPopup = $ionicPopup.alert({
      scope: $scope,
      title: 'How to Play',
      templateUrl: 'templates/howToPlay.html'
    });

    alertPopup.then(function(response){
      //custom functionality
    });
  }
})

.controller('ExsCtrl', function($scope, Exercises, $timeout,$stateParams,Ids, StateData,
  DropData, AnswerData, SummaryData, $ionicPopup, $ionicPopover) {
  var name = $stateParams.collectionName;
  $scope.collectionName = name;

  //create a unique id for each collection
  Ids.create($scope.collectionName);
  var id = Ids.get($scope.collectionName);
  console.log("id: "+id);

  //create new data for this collection
  if(!StateData.isCreated(id)){
    StateData.createColl(id);
  }
  if(!DropData.isCreated(id)){
    DropData.createColl(id);
  }
  if(!AnswerData.isCreated(id)){
    AnswerData.createColl(id);
  }
  if(!SummaryData.isCreated(id)){
    SummaryData.createColl(id);
  }

  Exercises.getAll(name).then(function(response){
    $scope.exercises = response;
    for(var i=0;i<$scope.exercises.length;i++){
      var exId = $scope.exercises[i]._id;
      if(!StateData.getSingleState(id,exId)){
        StateData.updateState(id,exId,"New");
      }
    }
    $scope.states = StateData.getAllStates(id);
  });

  $scope.remove = function(ex) {
    Exercises.remove(ex);
  };

  //use this method to refresh data
  $scope.$on('$ionicView.enter',function(e){
    $scope.states = StateData.getAllStates(id);//refresh states
  });

  $scope.doRefresh = function(){
    // $timeout(function(){
      Exercises.getAll(name).then(function(response){
        $scope.exercises = response;
        for(var i=0;i<$scope.exercises.length;i++){
          var currentState = StateData.getSingleState(id,$scope.exercises[i]._id);
          if(currentState){
            StateData.updateState(id,$scope.exercises[i]._id,currentState);
          }
          else{
            StateData.updateState(id,$scope.exercises[i]._id,"New");
          }
        }
        $scope.states = StateData.getAllStates(id);
        $scope.$broadcast('scroll.refreshComplete');
      });
    // },1000);
  };

  $ionicPopover.fromTemplateUrl("templates/exercises-popover.html",{
    scope: $scope
  }).then(function(popover){
    $scope.popover = popover;
  });

  $scope.openPopover = function($event){
    $scope.popover.show($event);
  };

  $scope.showAbout = function(){
    var alertPopup = $ionicPopup.alert({
      scope: $scope,
      title: 'About Flax',
      templateUrl: 'templates/aboutFlax.html'
    });

    alertPopup.then(function(response){
      //custom functionality
    });
  }

  $scope.showHelp = function(){
    var alertPopup = $ionicPopup.alert({
      scope: $scope,
      title: 'How to Play',
      templateUrl: 'templates/howToPlay.html'
    });

    alertPopup.then(function(response){
      //custom functionality
    });
  }
})

.controller('ExerciseCtrl', function($scope, $stateParams, Exercises, $ionicPopup, $ionicPopover,$filter,
  $timeout,ionicToast,Ids,AnswerData,DropData,SummaryData) {
  var exId = $stateParams.exId;
  var collectionName = $stateParams.collectionName;
  var id = Ids.get(collectionName);

  if(!AnswerData.getValues(id,exId)){
    AnswerData.createValue(id,exId);
  }

  if(!SummaryData.getSummary(id,exId)){
    SummaryData.createSummary(id,exId);
    var time = new Date();
    var timeNow = $filter('date')(time,'medium');//angularjs date format
    SummaryData.updateStartTime(id,exId,timeNow);
  }

  $scope.myValue = AnswerData.getValues(id,exId);
  $scope.summary = SummaryData.getSummary(id,exId);

  var oldData = DropData.getWord(id,exId);

  $scope.draggableObjects = [];
  $scope.dropped = [];

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
      DropData.createEx(id,exId);
      for(var i=0;i<$scope.words.length;i++){
        DropData.createWord(id,exId,i);
      }
    }
  });

  $scope.title = Exercises.getExTitle($stateParams.exId);

  $scope.options = {
    pagination: '.swiper-pagination',
    // freeMode: true,
    loop: false,
    spaceBetween: 10,
    initialSlide: 0,
    effect: 'flip',//fade,slide,cube,coverflow,flip (http://idangero.us/swiper/api)
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
    DropData.clearValue(id,exId,wordIndex,slideId);
    // console.log("onDragSuccess", "",wordIndex,"", data);
  }
  $scope.onDropComplete = function(data,evt,wordIndex){
    var slideId = $scope.slider.activeIndex;
    var value = DropData.getValue(id,exId,wordIndex,slideId);
    if(value != data){
      DropData.add(id,exId,wordIndex,slideId,data);
      $scope.dropped = DropData.getWord(id,exId);
    }
    // console.log("onDropComplete", "", wordIndex,"", data);
    Check(slideId);
  }

  $ionicPopover.fromTemplateUrl("templates/ex-detail-popover.html",{
    scope: $scope
  }).then(function(popover){
    $scope.popover = popover;
  });

  $scope.openPopover = function($event){
    $scope.popover.show($event);
  }

  $scope.showSummary = function(){
    var values = AnswerData.getValues(id,exId);
    var i = 0;
    for(var j=0;j<values.length;j++){
      if(values[j]){
        i++;
      }
    }
    SummaryData.updateScore(id,exId,i);
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
        DropData.clear(id,exId);
        AnswerData.clearValues(id,exId);
        SummaryData.clearSummary(id,exId);
        SummaryData.createSummary(id,exId);

        var time = new Date();
        var timeNow = $filter('date')(time,'medium');//angularjs date format
        SummaryData.updateEndTime(id,exId,timeNow);

        //clear view
        $scope.myValue = AnswerData.getValues(id,exId);
        $scope.dropped = [];

        //update summary
        $scope.summary = SummaryData.getSummary(id,exId);
      }
      else{
        // console.log("no");
      }
    });
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
      AnswerData.updateValue(id,exId,true,slideId);//update show/hide values
      return true;
    }
    return false;
  }

  var LoadState = function(){
    if(oldData){
      $scope.dropped = oldData;
    }
  }
});
