// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services','ngDraggable','ionic-toast'])

.run(function($ionicPlatform,$ionicHistory,$stateParams,Exercises,DroppedData,$filter) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  })

  //override default android back button behavior 
  $ionicPlatform.onHardwareBackButton(function(){
    // console.log($ionicHistory.currentStateName());
    if($ionicHistory.currentStateName() == 'tab.exercise'){
      var exId = $stateParams.exId;

      //update end time
      if(DroppedData.getSingleState(exId) != "Complete"){
        var time = new Date();
        var timeNow = $filter('date')(time,'medium');
        DroppedData.updateSummaryEtime(exId,timeNow);
      }
      
      var totalSlides = Exercises.getSlidesCount();
      var time = new Date();
      var timeNow = $filter('date')(time,'medium');
      DroppedData.updateSummaryEtime(exId,timeNow);
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
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  //to override default behaviors of specific platforms (android,ios etc)
  //e.g. android align its titles to left by default, so needs to change it here
  //refer to docs http://ionicframework.com/docs/api/provider/$ionicConfigProvider/
  $ionicConfigProvider.navBar.alignTitle('center');

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.about', {
    url: '/about',
    views: {
      'tab-about': {
        templateUrl: 'templates/tab-about.html',
        controller: 'SummaryCtrl'
      }
    }
  })

  .state('tab.exs', {
      url: '/exs',
      views: {
        'tab-exs': {
          templateUrl: 'templates/tab-exercises.html',
          controller: 'ExsCtrl'
        }
      }
    })
    .state('tab.exercise', {
      url: '/exs/:exId',
      views: {
        'tab-exs': {
          templateUrl: 'templates/ex-detail.html',
          controller: 'ExerciseCtrl'
        }
      }
    })

  .state('tab.howtoplay', {
    url: '/howtoplay',
    views: {
      'tab-howtoplay': {
        templateUrl: 'templates/tab-howtoplay.html',
        controller: 'HowToPlayCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/exs');

});
