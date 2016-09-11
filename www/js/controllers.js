angular.module('collocationmatching.controllers', [])
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

.controller('BackButtonController', function($scope, $ionicHistory, $stateParams, $filter,
  Data, StateData, SummaryData, Ids){
  $scope.customGoBack = function(){

    $ionicHistory.goBack();
    var currentState = $ionicHistory.currentStateName();

    if(currentState != "exercise"){
      return;
    }

    var exerciseId = $stateParams.exerciseId;
    var name = $stateParams.collectionName;
    var collId = Ids.getCollId(name);
    var exId = Ids.getExId(collId,exerciseId);

    //update end time
    if(StateData.getSingleState(collId,exId) != "Complete"){
      var time = new Date();
      var timeNow = $filter('date')(time,'medium');
      SummaryData.updateEndTime(collId,exId,timeNow);
    }

    var totalSlides = Data.getSlidesCount(collId,exId);
    if(totalSlides == 0){return;}

    if(SummaryData.getSummary(collId,exId).score == totalSlides){
      StateData.updateState(collId,exId,"Complete");
    }
    else{
      StateData.updateState(collId,exId,"Incomplete");
    }
  }
})

.controller('CollectionsCtrl', function($scope, $timeout, $ionicLoading, $state, $ionicPopover, $ionicPopup, Data, 
  $cordovaNetwork, $rootScope, Ids, ionicToast){
  $scope.collections = [];

  var getData = function(isRefreshing){
    Data.getAllColls(isRefreshing).then(function(response){
      if(response.status && response.status == 404){
        ionicToast.show(Data.get404Msg(),'middle',true);
        return;
      }
      if(!(response instanceof Array) || response.length == 0){
        return;
      }
      $ionicLoading.show();

      response.forEach(function(collectionName){
        Data.check(collectionName).then(function(res){
          if(res.status && res.status == 404){
            ionicToast.show(Data.get404Msg("Unable to retrieve some collections."),'middle',true);
            $ionicLoading.hide();
            return;
          }

          // $timeout(function(){
            $scope.collections = res;
            $ionicLoading.hide();
          // }, 400);
        });
      });
    });
  }

  if($rootScope.online){
    getData(false);
  }
  else{
    ionicToast.show("Not online",'middle',false,2500);
  }

  $scope.doRefresh = function(){
    if($rootScope.online){
      getData(true);
    }
    else{
      ionicToast.show("Not online",'middle',false,2500);
    }
    $scope.$broadcast('scroll.refreshComplete'); 
  };

  $scope.remove = function(coll) {
    Data.removeColl(coll);
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

.controller('ExsCtrl', function($scope, $timeout, $stateParams, $ionicPopup, $ionicPopover, $rootScope,
  Ids, StateData, SummaryData, Data, ionicToast,$ionicLoading) {
  
  var name = $stateParams.collectionName;
  $scope.collectionName = name;

  var collId = Ids.getCollId($scope.collectionName);
  console.log("collId: "+collId);

  var desc = Data.getDesc();
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
  if(!SummaryData.isCreated(collId)){
    SummaryData.createColl(collId);
  }

  var getData = function(collId,isRefreshing){
    $ionicLoading.show();
    Data.getAllEx(collId,isRefreshing).then(function(response){
      if(response.status && response.status == 404){
        ionicToast.show(Data.get404Msg(),'middle',true);
        $ionicLoading.hide();
        return;
      }
      $scope.exercises = response;
      for(var i=0;i<$scope.exercises.length;i++){
        var exerciseId = $scope.exercises[i]._id;
        var exId = Ids.getExId(collId,exerciseId);
        var currentState = StateData.getSingleState(collId,exId);
        if(currentState){
          StateData.updateState(collId,exId,currentState);
        }
        else{
          StateData.updateState(collId,exId,"New");
        }
      }
      $scope.states = StateData.getAllStates(collId);
      $ionicLoading.hide();
    });
  }

  //fetch the data
  getData(collId,false);

  $scope.doRefresh = function(){
    if($rootScope.online){
      getData(collId,true); 
    }
    else{
      ionicToast.show(Data.getErrorMsg(),'middle');
    }
    $scope.$broadcast('scroll.refreshComplete'); 
  };

  $scope.getId = function(exerciseId){
    return Ids.getExId(collId,exerciseId);
  }

  $scope.remove = function(ex) {
    Data.removeEx(collId,ex);
  };

  //use this method to refresh data
  $scope.$on('$ionicView.enter',function(e){
    $scope.states = StateData.getAllStates(collId);//refresh states
  });

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
  ionicToast, Ids, SummaryData, Data) {
  $scope.slideIndex = 0;//index of initial slide

  $ionicLoading.show();
  var exerciseId = $stateParams.exerciseId;
  var collectionName = $stateParams.collectionName;
  var collId = Ids.getCollId(collectionName);

  //exIds already created in 'ExsCtrl'
  var exId = Ids.getExId(collId,exerciseId);

  if(!SummaryData.getSummary(collId,exId)){
    SummaryData.createSummary(collId,exId);
    var time = new Date();
    var timeNow = $filter('date')(time,'medium');//angularjs date format
    SummaryData.updateStartTime(collId,exId,timeNow);
  }

  $scope.summary = SummaryData.getSummary(collId,exId);
  $scope.drags = [];

  Data.getSingleEx(collId,exId).then(function(response){
    if(response.status == 404){
      ionicToast.show(Data.get404Msg(),'middle',true);
      $ionicLoading.hide();
      return;
    }
    $ionicLoading.hide();
    $scope.words = response;
    $scope.slides = Data.getSlidesCount(collId,exId);
    $scope.slideCount = new Array($scope.slides);

    //shuffle slides keepig local words same
    var N = Data.getMinSlidesCount(collId,exId);
    var temp = Array.apply(null, {length: N}).map(Number.call,Number);
    var shuffled = [].concat(shuffle(temp));
    for(var i=0; i<$scope.words.length;i++){
      var arr = [];
      for(var j=0;j<$scope.words[i].length;j++){
        if(j >= shuffled.length){
          arr[j] = $scope.words[i][j];
        }
        else{
          var val = shuffled[j];
          arr[j] = $scope.words[i][val];
        }
      }
      $scope.words[i] = arr;
    }
    var count = $scope.words.length;
    var tmp = Array.apply(null, {length: count}).map(Number.call,Number);
    $scope.drags = [].concat(shuffle(tmp));
    // for(var i=0;i<$scope.words.length;i++){
    //   var word = $scope.words[i];
    //   for(var j=0;j<word.length;j++){

    //   }
    // }

    //shuffle without maintaining order
    // for(var j=0 ; j<$scope.words.length; j++){
    //   $scope.words[j] = shuffle($scope.words[j]);
    // }

    // for(var i=0;i<$scope.slides;i++){
    //     if(!$scope.drags[i]){
    //       $scope.drags[i] = new Array($scope.words.length);
    //     }
    //     for(var j=0 ; j<$scope.words.length; j++){
    //       if($scope.words[j][i]){
    //         var word = $scope.words[j][i];
    //         var value = word.right;
    //         if($scope.drags[i][j] && $scope.drags[i][j].id == word.id){
    //           var isDrag = $scopw.words[i][j].isDraggable;
    //           $scope.drags[i][j] = {"value":value,"id":word.id,"isDraggable":isDrag};
    //         }
    //         else{
    //           $scope.drags[i][j] = {"value":value,"id":word.id,"isDraggable":true};
    //         }
    //       }
    //     }
    //     $scope.drags[i] = shuffle($scope.drags[i]);
    // }
  });

  var shuffle = function(array) {
    var m = array.length, t, i;

    // While there remain elements to shuffle
    while (m) {

      // Pick a remaining element
      i = Math.floor(Math.random() * m--);

      // And swap it with the current element
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  }

  $scope.title = Data.getExTitle(collId,$stateParams.exerciseId);

  $scope.options = {
    pagination: '.swiper-pagination',
    // freeMode: true,
    loop: false,
    spaceBetween: 10,
    initialSlide: $scope.slideIndex,
    effect: 'flip',//fade,slide,cube,coverflow,flip (http://idangero.us/swiper/api)
    speed: 500
  };

  $scope.checkAnswer = function(){
    if(!checkAll()){
      ionicToast.show('Answer Incorrect!','middle',false,2500);
    }
  }

  checkAll = function(){
    var all_words = 0, correct_words = 0;
    for(var i=0; i<$scope.words.length;i++){
      var word = $scope.words[i];
      if(word[$scope.slideIndex]){
        all_words++;
        //it is critical to check for word[slideIndex]
        //because slideIndex can be different 
        if(word[$scope.slideIndex] && word[$scope.slideIndex].isCorrect){
          correct_words++;
        }
      }
    }
    if(all_words == correct_words){
      $scope.hide = true;
      return true;
    }
    $scope.hide = false;
    return false;
  }

  $scope.$on("$ionicSlides.sliderInitialized", function(event, data){
    // data.slider is the instance of Swiper
    // var element = angular.element(document.querySelector('#ulid'));
    // console.log(element);
    $scope.slideIndex = data.slider.activeIndex;
    if($scope.words){
      checkAll();
      $scope.$apply();//required to update the view
    }
  });

  $scope.$on("$ionicSlides.slideChangeStart", function(event, data){
    // console.log('Slide change is beginning');
    $scope.slideIndex = data.slider.activeIndex;
    checkAll();
    $scope.$apply();//required to update the view
  });

  $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
    // note: the indexes are 0-based
    // $scope.activeIndex = data.activeIndex;
    // $scope.previousIndex = data.previousIndex;
  });
  $scope.dragSuccess = function(data,evt,index,slideIndex){
    // $scope.drags[slideIndex][index].isDraggable = false;
    $scope.words[index][slideIndex].isDraggable = false;
    console.log(index);
  }
  $scope.onDragSuccess = function(data,evt,wordId,slideIndex){
    for(var i=0;i<$scope.words.length;i++){
      var word = $scope.words[i];
      if(word[slideIndex] && (word[slideIndex].id == wordId)){
        $scope.words[i][slideIndex].drop = "";
      }
    }
  }
  $scope.onDropComplete = function(data,evt,wordId,slideIndex){
    console.log("Dropped");
    var done = null;
    for(var i=0;i<$scope.words.length;i++){
      var word = $scope.words[i];
      if(word[slideIndex] && (word[slideIndex].id == wordId)){
        var value = $scope.words[i][slideIndex].drop;
        if(value != data){
          $scope.words[i][slideIndex].drop = data;
          done = value;
        }
      }
    }
    if(done){
      for(var i=0;i<$scope.words.length;i++){
        var word = $scope.words[i];
        if(word[slideIndex] && (word[slideIndex].right == done)){
          word[slideIndex].isDraggable = true;
        }
      }
    }
    checkAll();
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
    var score = 0;
    for(var i=0;i<$scope.slides;i++){
      var all_words = 0, correct_words=0;
      for(var j=0;j<$scope.words.length;j++){
        var word = $scope.words[j];
        if(word[i]){
          all_words++;
          if(word[i].isCorrect){
            correct_words++;
          }
        }
      }
      if(all_words == correct_words){
        score++;
      }
    }

    SummaryData.updateScore(collId,exId,score);
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
        SummaryData.clearSummary(collId,exId);
        SummaryData.createSummary(collId,exId);
        $scope.hide = false;

        var time = new Date();
        var timeNow = $filter('date')(time,'medium');//angularjs date format
        SummaryData.updateStartTime(collId,exId,timeNow);

        //clear view
        for(var i=0;i<$scope.words.length;i++){
          var word = $scope.words[i];
          for(var j=0;j<word.length;j++){
            word[j].drop = "";
          }
        }

        //update summary
        $scope.summary = SummaryData.getSummary(collId,exId);
      }
      else{
        // console.log("no");
      }
    });
  }
});
