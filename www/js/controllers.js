angular.module('collocationmatching.controllers', [])
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

.controller('BackButtonController', function($scope, $ionicHistory, $stateParams, $filter,
  Exercises, StateData, SummaryData, AnswerData, DropData, Ids){
  $scope.customGoBack = function(){
    var exerciseId = $stateParams.exerciseId;
    var name = $stateParams.collectionName;
    var collId = Ids.getId(name);
    var exId = Ids.getExId(collId,exerciseId);

    $ionicHistory.goBack();
    var currentState = $ionicHistory.currentStateName();

    if(currentState != "exercise"){
      return;
    }

    //update end time
    if(StateData.getSingleState(collId,exId) != "Complete"){
      var time = new Date();
      var timeNow = $filter('date')(time,'medium');
      SummaryData.updateEndTime(collId,exId,timeNow);
    }

    var totalSlides = Exercises.getSlidesCount(collId,exId);
    var j = 0;
    var values = AnswerData.getValues(collId,exId);
    for(i=0;i<values.length;i++){
      if(values[i]){
        j++;
      }
    }
    if(j == totalSlides){
      StateData.updateState(collId,exId,"Complete");
    }
    else{
      StateData.updateState(collId,exId,"Incomplete");
    }
  }
})

.controller('CollectionsCtrl', function($scope, $timeout, $ionicLoading, $state, $ionicPopover, $ionicPopup, Exercises, 
  $cordovaNetwork, $rootScope, Ids){

  Exercises.getAllColls().then(function(response){
    $ionicLoading.show();

    response.forEach(function(collectionName){
      Exercises.check(collectionName).then(function(res){

        // $timeout(function(){
          $scope.collections = res;
          $ionicLoading.hide();
        // }, 400);
      });
    });
  });

  $scope.doRefresh = function(){
    //to remove duplicacy always remember to empty previous data before refreshing
    Exercises.newList();
    Exercises.getAllColls().then(function(response){
      response.forEach(function(collectionName){
        Exercises.check(collectionName).then(function(res){

          // $timeout(function(){
            $scope.collections = res; 
          // }, 400);
        });
      });
      $scope.$broadcast('scroll.refreshComplete'); 
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

.controller('ExsCtrl', function($scope, $timeout, $stateParams, $ionicPopup, $ionicPopover, 
  Ids, StateData, DropData, AnswerData, SummaryData, Exercises) {
  
  var name = $stateParams.collectionName;
  $scope.collectionName = name;

  //create a unique id for each collection
  Ids.createId($scope.collectionName);
  var collId = Ids.getId($scope.collectionName);
  console.log("collId: "+collId);

  var desc = Exercises.getDesc();
  desc.forEach(function(val){
    if(val.key == name){
      $scope.collDesc = val.desc;
      $scope.collName = val.name;
    }
  });

  if(!$scope.collDesc){
    $scope.collDesc = "n/a";
    $scope.collName = "n/a";
  }

  //create new data for this collection
  if(!StateData.isCreated(collId)){
    StateData.createColl(collId);
  }
  if(!DropData.isCreated(collId)){
    DropData.createColl(collId);
  }
  if(!AnswerData.isCreated(collId)){
    AnswerData.createColl(collId);
  }
  if(!SummaryData.isCreated(collId)){
    SummaryData.createColl(collId);
  }

  Exercises.getAllEx(collId).then(function(response){
    $scope.exercises = response;
    for(var i=0;i<$scope.exercises.length;i++){
      var exerciseId = $scope.exercises[i]._id;
      Ids.createExId(collId,exerciseId);
      var exId = Ids.getExId(collId,exerciseId);
      if(!StateData.getSingleState(collId,exId)){
        StateData.updateState(collId,exId,"New");
      }
    }
    $scope.states = StateData.getAllStates(collId);
  });

  $scope.getId = function(exerciseId){
    return Ids.getExId(collId,exerciseId);
  }

  $scope.remove = function(collId,ex) {
    Exercises.removeEx(collId,ex);
  };

  //use this method to refresh data
  $scope.$on('$ionicView.enter',function(e){
    $scope.states = StateData.getAllStates(collId);//refresh states
  });

  $scope.doRefresh = function(){
    // $timeout(function(){
      Exercises.getAllEx(name).then(function(response){
        $scope.exercises = response;
        for(var i=0;i<$scope.exercises.length;i++){
          var currentState = StateData.getSingleState(collId,$scope.exercises[i]._id);
          if(currentState){
            StateData.updateState(collId,$scope.exercises[i]._id,currentState);
          }
          else{
            StateData.updateState(collId,$scope.exercises[i]._id,"New");
          }
        }
        $scope.states = StateData.getAllStates(collId);
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
      title: 'About '+name,
      templateUrl: 'templates/aboutCollection.html'
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

.controller('ExerciseCtrl', function($scope, $stateParams, $ionicLoading, $ionicPopup, $ionicPopover,$filter, $timeout,
  ionicToast, Ids, AnswerData, DropData, SummaryData, Exercises) {
  $ionicLoading.show();
  var exerciseId = $stateParams.exerciseId;
  var collectionName = $stateParams.collectionName;
  var collId = Ids.getId(collectionName);

  //exIds already created in 'ExsCtrl'
  var exId = Ids.getExId(collId,exerciseId);

  if(!AnswerData.getValues(collId,exId)){
    AnswerData.createValue(collId,exId);
  }

  if(!SummaryData.getSummary(collId,exId)){
    SummaryData.createSummary(collId,exId);
    var time = new Date();
    var timeNow = $filter('date')(time,'medium');//angularjs date format
    SummaryData.updateStartTime(collId,exId,timeNow);
  }

  $scope.myValue = AnswerData.getValues(collId,exId);
  $scope.summary = SummaryData.getSummary(collId,exId);

  var oldData = DropData.getWord(collId,exId);

  $scope.draggableObjects = [];
  $scope.dropped = [];

  Exercises.getSingleEx(collId,exId).then(function(response){
    $scope.words = response;
    $scope.slides = Exercises.getSlidesCount(collId,exId);
    $scope.slideCount = new Array($scope.slides);

    for(var i=0;i<$scope.slides;i++){
        $scope.draggableObjects[i] = new Array($scope.words.length);
        for(var j=0 ; j<$scope.words.length; j++){
          if($scope.words[j][i]){
            $scope.draggableObjects[i][j] = $scope.words[j][i].right;
          }
        }
        //shuffle words
        $scope.draggableObjects[i] = shuffle($scope.draggableObjects[i]);
    }

    if(!oldData){
      DropData.createEx(collId,exId);
      for(var i=0;i<$scope.words.length;i++){
        DropData.createWord(collId,exId,i);
      }
    }
    $ionicLoading.hide();
  });

  var shuffle = function(array) {
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);

      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  }

  $scope.title = Exercises.getExTitle(collId,$stateParams.exerciseId);

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
    DropData.clearValue(collId,exId,wordIndex,slideId);
    // console.log("onDragSuccess", "",wordIndex,"", data);
  }
  $scope.onDropComplete = function(data,evt,wordIndex){
    var slideId = $scope.slider.activeIndex;
    var value = DropData.getValue(collId,exId,wordIndex,slideId);
    if(value != data){
      DropData.add(collId,exId,wordIndex,slideId,data);
      $scope.dropped = DropData.getWord(collId,exId);
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
    var values = AnswerData.getValues(collId,exId);
    var i = 0;
    for(var j=0;j<values.length;j++){
      if(values[j]){
        i++;
      }
    }
    SummaryData.updateScore(collId,exId,i);
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
        DropData.clear(collId,exId);
        AnswerData.clearValues(collId,exId);
        SummaryData.clearSummary(collId,exId);
        SummaryData.createSummary(collId,exId);

        var time = new Date();
        var timeNow = $filter('date')(time,'medium');//angularjs date format
        SummaryData.updateStartTime(collId,exId,timeNow);

        //clear view
        $scope.myValue = AnswerData.getValues(collId,exId);
        $scope.dropped = [];

        //update summary
        $scope.summary = SummaryData.getSummary(collId,exId);
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
      AnswerData.updateValue(collId,exId,true,slideId);//update show/hide values
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
