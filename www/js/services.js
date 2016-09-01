angular.module('collocationmatching.services', [])

.factory('Exercises', function ($http,$cordovaNetwork,$rootScope,ionicToast,Monitor) {
  const THIS_ACTIVITY = "CollocationMatching";

  const ALL_COLLECTIONS_URL = "http://collections.flax.nzdl.org/greenstone3/flax?a=fp&sa=library&o=xml";

  const PREFIX_URL = "http://collections.flax.nzdl.org/greenstone3/flax";
  const TEMPLATE_URL = "?a=pr&o=xml&ro=1&rt=r&s=SSSS&c=CCCC&s1.service=11";

  //to get url replace CCCC with collection name (e.g. collocations) & SSSS with activity name (e.g. CollocationMatching)
  const TEMPLATE_URL_WITH_ACTIVITY = TEMPLATE_URL.replace("SSSS",THIS_ACTIVITY);

  const SERVICE_NUMBER = 100;
  const TEMPLATE_COLLNAME = "&s1.collname=CCCC";

  var temp_collections = [];
  var collections = [];//list of possible collections for this activity
  var descriptions = [];//list of name,description for each collection

  var exercises = [];//list of possible exercises for this activity
  var slidesCount = [];

  //actual path does work in browser but not in phone (via phonegap or ionicview, so always keep the $http.get path form index.html)
  // var url = "templates/default_exercises/default_exercise_list.xml";

  var getAllColls = function(){
    if(Monitor.isOffline()){
      return collections;
    }
    return $http.get(ALL_COLLECTIONS_URL).then(function(response){
      var x2js = new X2JS();
      var jsonData = x2js.xml_str2json(response.data);
      var collectionList = jsonData.page.pageResponse.collectionList.collection;
      for(var i=0; i<collectionList.length;i++){
        var serviceList = collectionList[i].serviceList.service;
        var metadataList = collectionList[i].metadataList.metadata;
        // console.log(metadataList);
        for(var j=0 ; j<metadataList.length; j++){
          var obj = metadataList[j];
          for(var k=0;k<serviceList.length;k++){
            var sObj = serviceList[k];
            if(obj._name == "flaxmobile" && obj.__text == "true" && sObj._name == THIS_ACTIVITY){
              var coll = collectionList[i];
              var name = coll._name;
              temp_collections.push(name);
              var d = coll.displayItem[0].__text;
              if(!d){
                d = "";
                var arr = coll.displayItem[0].p;
                arr.forEach(function(val){
                  d += val;
                });
              }
              var n = coll.displayItem[1].__text;
              var obj = {key:name,name:n,desc:d};
              descriptions.push(obj);
            }
          }
        }
      }
      return temp_collections;
    });
  };

  var check = function(collectionName){
    var suffix_url = TEMPLATE_URL_WITH_ACTIVITY.replace("CCCC",collectionName);
    var coll_url = PREFIX_URL + suffix_url;

    return $http.get(coll_url).then(function(res){
      var x2js = new X2JS();
      var data = x2js.xml_str2json(res.data);
      if(!data || !data.response){return;}
      var collection_name = data.response._from;

      //only "password" has more than one category
      var ex = data.response.categoryList.category;
      if(ex.length > 0 || ex.exercise){
        collections.push(collection_name);
      }
      return collections;
    });
  };

  var getAllEx = function(collectionName){
    var suffix_url = TEMPLATE_URL_WITH_ACTIVITY.replace("CCCC",collectionName);
    var coll_url = PREFIX_URL + suffix_url;

    return $http.get(coll_url).then(function(response){
      var x2js = new X2JS();
      var jsonData = x2js.xml_str2json(response.data);
      // if(!jsonData.response){return;}
      var category = jsonData.response.categoryList.category;
      if(category.length > 0){
        for(var i=0; i<category.length; i++){
          var array = category[i].exercise;
          if(array){//check if array is defined or not
            if(array.length > 0){
              exercises = [].concat(array);
            }
            else{
              exercises.push(array);
            }
          }
        }
      }
      else{
        exercises = [].concat(jsonData.response.categoryList.category.exercise);
      }
      return exercises;
    });
  };

  getSingleEx = function(exId,collectionName){
    var temp_url = TEMPLATE_URL_WITH_ACTIVITY.replace("CCCC",collectionName);
    var collname_url= TEMPLATE_COLLNAME.replace("CCCC",collectionName);
    var middle_url = temp_url.replace("11",SERVICE_NUMBER) + collname_url;

    slidesCount = [];
    var words = [];
    var temp_words = [];

    for(var i= 0 ; i<exercises.length; i++){
      if(exercises[i]._id == parseInt(exId)){
        var contained_url = exercises[i].url;
        var params_url = contained_url.substr(contained_url.indexOf("&s1.params"));
        var final_url = PREFIX_URL + middle_url + params_url;

        return $http.get(final_url).then(function(response){
          var x2js = new X2JS();
          var jsonData = x2js.xml_str2json(response.data);
          temp_words = jsonData.response.player.word;
          for(var j=0; j<temp_words.length; j++){
            var collo = temp_words[j].collo;
            words[j] = [];
            slidesCount.push(collo.length);
            for(var k=0; k<collo.length; k++){
              var text = collo[k].__text;
              var left = getLeft(text);
              var right = getRight(text);
              var obj = {"left":left,"right":right};
              words[j].push(obj);
            };
          };
          return words;
        });
      }
    }
  };

  getExTitle = function(exId){
    for(var i= 0 ; i<exercises.length; i++){
      if(exercises[i]._id == parseInt(exId)){
        return exercises[i]._name;
      }
    }
    return null;
  };

  getSlidesCount = function(){
    // return Math.min.apply(Math,slidesCount);
    return Math.max.apply(Math,slidesCount);
  };

  removeEx = function(ex) {
    exercises.splice(exercises.indexOf(ex), 1);
  };

  removeColl = function(coll){
    collections.splice(collections.indexOf(coll),1);
  };

  var getDesc = function(){
    return descriptions;
  };

  var newList = function(){
    temp_collections = [];
    collections = [];
    descriptions = [];
  };

  var getLeft = function(word){
    // return word.split(" ")[0];
    return word.substr(0,word.indexOf(" "));
  };

  var getRight = function(word){
    return word.substr(word.indexOf(" ")+1);
  };

  return {
    getAllColls: getAllColls,
    check: check,

    getDesc: getDesc,
    newList: newList,

    getAllEx: getAllEx,
    getSingleEx: getSingleEx,

    getExTitle: getExTitle,
    getSlidesCount: getSlidesCount,

    removeEx: removeEx,
    removeColl: removeColl
  };
})

.factory('DropData',function(){
  var dropped = [];

  var createEx = function(collId,exId){
    dropped[collId][exId] = [];
  }

  var createWord = function(collId,exId,wordId){
    dropped[collId][exId][wordId] = [];
  }

  var add = function(collId,exId,wordId,slideId,value){
    dropped[collId][exId][wordId][slideId] = value;
  }

  var clearValue = function(collId,exId,wordId,slideId){
    dropped[collId][exId][wordId][slideId] = null;
  }

  var getWord = function(collId,exId){
    return dropped[collId][exId];
  }

  var getValue = function(collId,exId,wordId,slideId){
    return dropped[collId][exId][wordId][slideId];
  }

  var clear = function(collId,exId){
    dropped[collId][exId] = [];
  }

  var createColl = function(collId){
    dropped[collId] = [];
  }

  var isCreated = function(collId){
    if(dropped[collId]){
      return true;
    }
    return false;
  }

  return{
    createEx: createEx,
    createWord: createWord,
    add: add,
    clearValue: clearValue,
    getWord: getWord,
    getValue: getValue,
    clear: clear,
    createColl: createColl,
    isCreated: isCreated
  };
})

.factory('AnswerData', function () {
  var myValues = [];

  var updateValue = function(collId,exId,value,n){
    myValues[collId][exId][n] = value;
  }

  var createValue = function(collId,exId){
    myValues[collId][exId] = [];
  }

  var getValues = function(collId,exId){
    return myValues[collId][exId];
  }

  var clearValues = function(collId,exId){
    myValues[collId][exId] = [];
  }

  var createColl = function(collId){
    myValues[collId] = [];
  }

  var isCreated = function(collId){
    if(myValues[collId]){
      return true;
    }
    return false;
  }

  return {
    updateValue: updateValue,
    createValue: createValue,
    getValues: getValues,
    clearValues: clearValues,
    createColl: createColl,
    isCreated: isCreated
  };
})

.factory('SummaryData', function () {
  var summary = [];

  var updateStartTime = function(collId,exId,s){
    summary[collId][exId].sTime = s;
  }

  var updateEndTime = function(collId,exId,e){
    summary[collId][exId].eTime = e;
  }

  var updateScore = function(collId,exId,score){
    if(summary[collId][exId]){
      summary[collId][exId].score = score;
    }
  }

  var createSummary = function(collId,exId){
    summary[collId][exId] = {sTime:"n/a",eTime:"n/a",score:"0"};
  }

  var clearSummary = function(collId,exId){
    summary[collId].splice(exId,1);
  }

  var getSummary = function(collId,exId){
    return summary[collId][exId];
  }

  var createColl = function(collId){
    summary[collId] = [];
  }

  var isCreated = function(collId){
    if(summary[collId]){
      return true;
    }
    return false;
  }
  
  return {
    updateStartTime: updateStartTime,
    updateEndTime: updateEndTime,
    updateScore: updateScore,
    createSummary: createSummary,
    getSummary: getSummary,
    clearSummary: clearSummary,
    createColl: createColl,
    isCreated: isCreated
  };
})

.factory('StateData', function () {
  var states = [];

  var updateState = function(collId,exId,state){
    states[collId][exId] = state;
  }

  var getSingleState = function(collId,exId){
    return states[collId][exId];
  }

  var getAllStates = function(collId){
    return states[collId];
  }

  var createColl = function(collId){
    states[collId] = [];
  }

  var isCreated = function(collId){
    if(states[collId]){
      return true;
    }
    return false;
  }
  
  return {
    updateState: updateState,
    getSingleState: getSingleState,
    getAllStates: getAllStates,
    createColl: createColl,
    isCreated: isCreated
  };
})

.factory('Ids',function(){
  var ids = [];

  var create = function(name){
    var index = ids.indexOf(name);
    if(index == -1){
      ids.push(name);
    }
  }

  var get = function(name){
    return ids.indexOf(name);
  }

  return{
    create: create,
    get: get
  };
})

.factory('Monitor', function($rootScope, $cordovaNetwork){
 
  return {
    isOnline: function(){
      if(ionic.Platform.android){
        return $cordovaNetwork.isOnline();    
      } else {
        return navigator.onLine;
      }
    },
    isOffline: function(){
      if(ionic.Platform.isWebView()){
        return !$cordovaNetwork.isOnline();    
      } else {
        return !navigator.onLine;
      }
    },
    startWatching: function(){
        if(ionic.Platform.isWebView()){
 
          $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
            console.log("went online");
          });
 
          $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
            console.log("went offline");
          });
 
        }
        else {
 
          window.addEventListener("online", function(e) {
            console.log("went online");
          }, false);    
 
          window.addEventListener("offline", function(e) {
            console.log("went offline");
          }, false);  
        }       
    }
  }
});
