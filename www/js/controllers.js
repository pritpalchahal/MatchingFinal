angular.module('collocationmatching.controllers', [])
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event.
  /*
  $scope.$on('$ionicView.enter', function(e) {
  });*/

//Override default back button behavior in this controller
.controller('BackButtonController', function($scope, $ionicHistory, $stateParams,
  Data, StateData, SummaryData, Ids){
  $scope.customGoBack = function(){

    //Execute normal back button behavior
    $ionicHistory.goBack();

    //Execute additional functionality e.g. Update exercise state
    var currentState = $ionicHistory.currentStateName();

    if(currentState != "exercise"){
      return;
    }

    var exerciseId = $stateParams.exerciseId;
    var name = $stateParams.collectionName;
    var collId = Ids.getCollId(name);
    var exId = Ids.getExId(collId,exerciseId);

    //Update end time
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

//Controller for Collections View page
.controller('CollectionsCtrl', function($scope, $timeout, $ionicLoading, $state, $ionicPopover, $ionicPopup, Data, 
  $cordovaNetwork, $rootScope, Ids, ionicToast){
  $scope.title = Data.getTitle();
  $scope.collections = [];

  //Request for data from Services.js
  var getData = function(isRefreshing){
    //Show the loading animation
    $rootScope.show();
    Data.getAllColls(isRefreshing).then(function(response){
      //Check if response is a 404 error
      if(response && response.status == 404){
        ionicToast.show(Data.get404Msg(),'middle',true);
        return;
      }
      //Check if response is a timeout error
      if(response && response.status == -1){
        ionicToast.show(Data.getTimeoutMsg(),'middle',true);
        return;
      }
      //Otherwise; Set model to response
      $scope.collections = response;
      return response;
    }).then(function(res){
      //Finally, hide loading animation
      $rootScope.hide();
    });
  }

  //If device online, fetch data
  if($rootScope.online){
    getData(false);
  }
  else{
    ionicToast.show(Data.getErrorMsg(),'bottom',false,2500);
  }

  //Function to refresh data
  $scope.doRefresh = function(){
    if($rootScope.online){
      getData(true);
    }
    else{
    ionicToast.show(Data.getErrorMsg(),'bottom',false,2500);
    }
    $scope.$broadcast('scroll.refreshComplete'); 
  };

  $ionicPopover.fromTemplateUrl("templates/collections-popover.html",{
    scope: $scope
  }).then(function(popover){
    $scope.popover = popover;
  });

  //Function to open popover
  $scope.openPopover = function($event){
    $scope.popover.show($event);
  };

  //Function to show 'About' popup
  $scope.showAbout = function(){
    var alertPopup = $ionicPopup.alert({
      scope: $scope,
      title: 'About Flax',
      templateUrl: 'templates/aboutFlax.html'
    });

    alertPopup.then(function(response){
      /*custom functionality*/
    });
  }

  //Function to show 'HowToPlay' popup
  $scope.showHelp = function(){
    var alertPopup = $ionicPopup.alert({
      scope: $scope,
      title: 'How to Play',
      templateUrl: 'templates/howToPlay.html'
    });

    alertPopup.then(function(response){
      /*custom functionality*/
    });
  }
})

//Controller for Exercises View page
.controller('ExsCtrl', function($scope, $timeout, $stateParams, $ionicPopup, $ionicPopover, $rootScope,
  Ids, StateData, SummaryData, Data, ionicToast,$ionicLoading,$ionicListDelegate) {
  
  var name = $stateParams.collectionName;
  $scope.collectionName = name;

  var collId = Ids.getCollId($scope.collectionName);

  //Get description for each Collection from Data factory in Services.js
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

  //Create new data for this collection if not already created
  if(!StateData.isCreated(collId)){
    StateData.createColl(collId);
  }
  if(!SummaryData.isCreated(collId)){
    SummaryData.createColl(collId);
  }

  //Function to fetch data from Services.js
  var getData = function(collId,isRefreshing){
    //Show loading animation
    $rootScope.show();
    Data.getAllEx(collId,isRefreshing).then(function(response){
      //Check 404 error
      if(response.status && response.status == 404){
        ionicToast.show(Data.get404Msg(),'middle',true);
        return;
      }
      //Check timeout error
      if(response && response.status == -1){
        ionicToast.show(Data.getTimeoutMsg(),'middle',true);
        return;
      }
      //Otherwise; set exercises model to response
      $scope.exercises = response;

      //Setup starting state if not already exist
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

      //Get states model from StateData factory in Services.js
      $scope.states = StateData.getAllStates(collId);
    }).then(function(){
      //Finally hide the loading animation
      $rootScope.hide();
    });
  }

  //Execute fetch data function
  getData(collId,false);

  //Function to Refresh Exercises View page
  $scope.doRefresh = function(){
    if($rootScope.online){
      getData(collId,true); 
    }
    else{
      ionicToast.show(Data.getErrorMsg(),'middle');
    }
    //Notify the controller that refreshing is complete
    $scope.$broadcast('scroll.refreshComplete'); 
  };

  //Function to get Exercise Id
  $scope.getId = function(exerciseId){
    return Ids.getExId(collId,exerciseId);
  }

  //Function to Restart the game
  $scope.doRestart = function(ex){
    var exId = Ids.getExId(collId,ex);
    SummaryData.clearSummary(collId,exId);
    StateData.updateState(collId,exId,"New");
    $ionicListDelegate.closeOptionButtons();
    var words = Data.getWords(collId,exId);
    for(var i=0;i<words.length;i++){
      var word = words[i];
      for(var j=0;j<word.length;j++){
        word[j].drop = "";
        word[j].isDraggable = true;
      }
    }
  }

  //Use this method to refresh states based on data saved in StateData factory
  //each time Exercise View is activated.
  $scope.$on('$ionicView.enter',function(e){
    $scope.states = StateData.getAllStates(collId);//refresh states
  });

  //Create Popover and bind it with local model
  $ionicPopover.fromTemplateUrl("templates/exercises-popover.html",{
    scope: $scope
  }).then(function(popover){
    $scope.popover = popover;
  });

  //Function to open popover
  $scope.openPopover = function($event){
    $scope.popover.show($event);
  };

  //Function to show 'About' popup
  $scope.showAbout = function(){
    var alertPopup = $ionicPopup.alert({
      scope: $scope,
      title: 'About '+name,
      templateUrl: 'templates/aboutCollection.html'
    });

    alertPopup.then(function(response){
      /*custom functionality*/
    });
  }

  //Function to show 'HowToPlay' popup
  $scope.showHelp = function(){
    var alertPopup = $ionicPopup.alert({
      scope: $scope,
      title: 'How to Play',
      templateUrl: 'templates/howToPlay.html'
    });

    alertPopup.then(function(response){
      /*custom functionality*/
    });
  }
})

//Controller for Game View page
.controller('ExerciseCtrl', function($scope, $stateParams, $ionicLoading, $ionicPopup, $ionicPopover,$filter, $timeout,
  ionicToast, Ids, SummaryData, Data, $rootScope) {
  //Index of initial slide
  $scope.slideIndex = 0;
  $scope.hide = false;

  //Show loading animation
  $rootScope.show();
  var exerciseId = $stateParams.exerciseId;
  var collectionName = $stateParams.collectionName;
  var collId = Ids.getCollId(collectionName);

  //Fetch exId from Ids factory as exIds are already created in 'ExsCtrl'
  var exId = Ids.getExId(collId,exerciseId);
  if(!SummaryData.getSummary(collId,exId)){
    SummaryData.createSummary(collId,exId);
    var time = new Date();
    var timeNow = $filter('date')(time,'medium');//angularjs date format
    SummaryData.updateStartTime(collId,exId,timeNow);
  }

  //Fisher-Yates shuffle
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

  //Update summary model
  $scope.summary = SummaryData.getSummary(collId,exId);
  //Initialize drags model
  $scope.drags = [];

  //Fetch Game data from Data Factory in Services.js
  Data.getSingleEx(collId,exId).then(function(response){
    //Check 404 error
    if(response.status == 404){
      ionicToast.show(Data.get404Msg(),'middle',true);
      return;
    }
    //Check timeout error
    if(response && response.status == -1){
      ionicToast.show(Data.getTimeoutMsg(),'middle',true);
      return;
    }
    //Otherwise set words model to response
    $scope.words = response;
    $scope.slides = Data.getSlidesCount(collId,exId);
    $scope.slideCount = new Array($scope.slides);

    //Shuffle slides keeping local words unshuffled
    var N = Data.getMinSlidesCount(collId,exId);
    var temp = Array.apply(null, {length: N}).map(Number.call,Number);
    var shuffled = shuffle(temp);//[].concat(shuffle(temp));
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

    /*Shuffle without maintaining order
     for(var j=0 ; j<$scope.words.length; j++){
       $scope.words[j] = shuffle($scope.words[j]);
     }*/

    //Create a shuffled array for shuffling partial phrases
    var count = $scope.words.length;
    var tmp = Array.apply(null, {length: count}).map(Number.call,Number);
    /* $scope.drags = [].concat(shuffle(tmp)); */
    $scope.drags = shuffle(tmp);

  }).then(function(){
    //Finally hide loading animation
    $rootScope.hide();
  });

  //Get Game title from Data factory
  $scope.title = Data.getExTitle(collId,$stateParams.exerciseId);

  //Generate options for slides
  $scope.options = {
    pagination: '.swiper-pagination',
    loop: false,
    spaceBetween: 10,
    initialSlide: $scope.slideIndex,
    effect: 'slide'//fade,slide,cube,coverflow,flip (http://idangero.us/swiper/api)
    /* freeModeSticky: true, 
    speed: 500 */
  };

  //Function to Check answer on button click
  $scope.checkAnswer = function(){
    if(!checkAll()){
      ionicToast.show('Answer Incorrect!','middle',false,2500);
    }
  }

  //Function check answer 
  checkAll = function(){
    if(!$scope.words || $scope.words.length == 0){
      return $scope.hide;
    }
    var all_words = 0, correct_words = 0;
    for(var i=0; i<$scope.words.length;i++){
      var word = $scope.words[i];
      if(word[$scope.slideIndex]){//critical check
        all_words++;
        SummaryData.createSummary(collId,exId);
        $scope.hide = false;
        if(word[$scope.slideIndex].isCorrect){
          correct_words++;
        }
      }
    }
    if(all_words == correct_words){
      SummaryData.updateScore(collId,exId,$scope.slideIndex);
      $scope.hide = true;
      ionicToast.show('Well done!','bottom',false,2000);
    }
    else{
      $scope.hide = false;
    }
    return $scope.hide;
  }

  //Refresh data each time game starts and slides initialized
  $scope.$on("$ionicSlides.sliderInitialized", function(event, data){
    // data.slider is the instance of Swiper
    $scope.slideIndex = data.slider.activeIndex;
    checkAll();
    //Update the view by calling $scope.$apply()
    $scope.$apply();
  });

  //Refresh data each time slide change starts.
  $scope.$on("$ionicSlides.slideChangeStart", function(event, data){
    $scope.slideIndex = data.slider.activeIndex;
    checkAll();
    //Update the view by calling $scope.$apply()
    $scope.$apply();
  });

  //Functionality when slide change ends.
  $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
    /* note: the indexes are 0-based
     $scope.activeIndex = data.activeIndex;
     $scope.previousIndex = data.previousIndex;*/
  });

  //Function to implement on successful dragging a draggable text from top
  $scope.dragSuccess = function(data,evt,index,slideIndex){
    $scope.words[index][slideIndex].isDraggable = false;
  }

  //Function to implement after Successful dragging an in-game text
  $scope.onDragSuccess = function(data,evt,wordId,slideIndex){
    for(var i=0;i<$scope.words.length;i++){
      var word = $scope.words[i];
      if(word[slideIndex] && (word[slideIndex].id == wordId)){
        $scope.words[i][slideIndex].drop = "";
      }
    }
  }

  //Function to implement after successful dropping an item
  $scope.onDropComplete = function(data,evt,wordId,slideIndex){
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

  //Initialize ionic popover and bind to model
  $ionicPopover.fromTemplateUrl("templates/ex-detail-popover.html",{
    scope: $scope
  }).then(function(popover){
    $scope.popover = popover;
  });

  //Function to open popover
  $scope.openPopover = function($event){
    $scope.popover.show($event);
  }

  //Function to show summary popup
  $scope.showSummary = function(){
    var alertPopup = $ionicPopup.alert({
      scope: $scope,
      title: 'Summary report',
      templateUrl: 'templates/summary.html'
    });

    alertPopup.then(function(response){
      /*custom functionality*/
    });

    /*close popup after 3 seconds
     $timeout(function(){
       alertPopup.close();
     }, 5000);*/
  }

  //Funciton to show restart game popup
  $scope.restartGame = function(){
    var confirmPopup = $ionicPopup.confirm({
      title: 'Restart this Game!',
      template: 'Would you like to restart this game?'
    });

    confirmPopup.then(function(response){
      if(response){
        //Clear model
        SummaryData.clearSummary(collId,exId);
        SummaryData.createSummary(collId,exId);
        $scope.hide = false;

        var time = new Date();
        var timeNow = $filter('date')(time,'medium');//angularjs date format
        SummaryData.updateStartTime(collId,exId,timeNow);

        //Clear view
        for(var i=0;i<$scope.words.length;i++){
          var word = $scope.words[i];
          for(var j=0;j<word.length;j++){
            word[j].drop = "";
            word[j].isDraggable = true;
          }
        }

        //Update summary
        $scope.summary = SummaryData.getSummary(collId,exId);
      }
      else{
        /* console.log("no");*/
      }
    });
  }
});
