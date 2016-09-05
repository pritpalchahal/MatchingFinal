angular.module('collocationmatching.services', [])

.factory('Exercises', function ($http,$cordovaNetwork,$rootScope,ionicToast,Ids) {
  const THIS_ACTIVITY = "CollocationMatching";

  const ALL_COLLECTIONS_URL = "http://collections.flax.nzdl.org/greenstone3/flax?a=fp&sa=library&o=xml";

  const PREFIX_URL = "http://collections.flax.nzdl.org/greenstone3/flax";
  const TEMPLATE_URL = "?a=pr&o=xml&ro=1&rt=r&s=SSSS&c=CCCC&s1.service=11";

  //to get url replace CCCC with collection name (e.g. collocations) & SSSS with activity name (e.g. CollocationMatching)
  const TEMPLATE_URL_WITH_ACTIVITY = TEMPLATE_URL.replace("SSSS",THIS_ACTIVITY);

  const SERVICE_NUMBER = 100;
  const TEMPLATE_COLLNAME = "&s1.collname=CCCC";

  var collections = [];//list of possible collections for this activity
  var descriptions = [];//list of name,description for each collection

  var exercises = [];//list of possible exercises for this activity
  var slidesCount = [];

  var words = [];

  //actual path does work in browser but not in phone (via phonegap or ionicview, so always keep the $http.get path form index.html)
  // var url = "templates/default_exercises/default_exercise_list.xml";

  var getAllColls = function(isRefreshing){
    if(collections.length > 0 && !isRefreshing){
      return new Promise((resolve,reject) => resolve(collections));
    }
    if(!Ids.getStatus()){
      ionicToast.show(Ids.getErrorMsg(),'middle',false,3000);
      return new Promise((resolve,reject) => resolve(collections));
    }
    var temp_collections = [];
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
    collections = [];
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

  var getAllEx = function(collId,isRefreshing){
    if(exercises[collId] && !isRefreshing){
      return new Promise((resolve,reject) => resolve(exercises[collId]));
    }
    if(!Ids.getStatus()){
      ionicToast.show(Ids.getErrorMsg(),'middle',false,3000);
      return new Promise((resolve,reject) => resolve(exercises[collId]));
    }
    //initiate all sub arrays
    exercises[collId] = [];
    words[collId] = [];
    slidesCount[collId] = [];

    var collectionName = Ids.getName(collId);
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
              exercises[collId] = [].concat(array);
            }
            else{
              exercises[collId].push(array);
            }
          }
        }
      }
      else{
        exercises[collId] = [].concat(jsonData.response.categoryList.category.exercise);
      }
      return exercises[collId];
    });
  };

  getSingleEx = function(collId,exId){
    if(words[collId][exId]){
      return new Promise((resolve,reject) => resolve(words[collId][exId]));
    }
    if(!Ids.getStatus()){
      ionicToast.show(Ids.getErrorMsg(),'middle',false,3000);
      return new Promise((resolve,reject) => resolve(words[collId][exId]));
    }
    //initiate
    words[collId][exId] = [];
    slidesCount[collId][exId] = [];

    var exerciseId = Ids.getExerciseId(collId,exId);
    var collectionName = Ids.getName(collId);

    var temp_url = TEMPLATE_URL_WITH_ACTIVITY.replace("CCCC",collectionName);
    var collname_url= TEMPLATE_COLLNAME.replace("CCCC",collectionName);
    var middle_url = temp_url.replace("11",SERVICE_NUMBER) + collname_url;

    // var words = [];
    var temp_words = [];

    for(var i= 0 ; i<exercises[collId].length; i++){
      if(exercises[collId][i]._id == parseInt(exerciseId)){
        var contained_url = exercises[collId][i].url;
        var params_url = contained_url.substr(contained_url.indexOf("&s1.params"));
        var final_url = PREFIX_URL + middle_url + params_url;

        return $http.get(final_url).then(function(response){
          var x2js = new X2JS();
          var jsonData = x2js.xml_str2json(response.data);
          temp_words = jsonData.response.player.word;
          var uniqueId = 0;
          for(var j=0; j<temp_words.length; j++){
            var collo = temp_words[j].collo;
            words[collId][exId][j] = [];
            slidesCount[collId][exId].push(collo.length);
            for(var k=0; k<collo.length; k++){
              var text = collo[k].__text;
              var left = getLeft(text);
              var right = getRight(text);
              var obj = {"left":left,"right":right,"drop":"","id":uniqueId,get isCorrect(){return (this.right == this.drop);}};
              uniqueId++;
              words[collId][exId][j].push(obj);
            };
          };
          return words[collId][exId];
        });
      }
    }
  };

  getExTitle = function(collId,exId){
    for(var i= 0 ; i<exercises[collId].length; i++){
      if(exercises[collId][i]._id == parseInt(exId)){
        return exercises[collId][i]._name;
      }
    }
    return null;
  };

  getSlidesCount = function(collId,exId){
    if(!slidesCount[collId][exId]){
      return 0;
    }
    // return Math.min.apply(Math,slidesCount);
    return Math.max.apply(Math,slidesCount[collId][exId]);
  };

  removeEx = function(collId,ex) {
    exercises[collId].splice(exercises[collId].indexOf(ex), 1);
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

.factory('Ids',function($cordovaNetwork,$rootScope){
  var ids = [];
  var exIds = [];
  var online = true;

  var createExId = function(collId,exerciseId){
    var index = exIds[collId].indexOf(exerciseId);
    if(index == -1){
      exIds[collId].push(exerciseId);
    }
  }

  var getExId = function(collId,exerciseId){
    return exIds[collId].indexOf(exerciseId);
  }

  var getExerciseId = function(collId,exId){
    return exIds[collId][exId];
  }

  var createId = function(name){
    var index = ids.indexOf(name);
    if(index == -1){
      ids.push(name);
    }
    var collId = ids.indexOf(name);
    //also initiate exIds if not already done
    if(!exIds[collId]){
      exIds[collId] = [];
    }
  }

  var getId = function(name){
    return ids.indexOf(name);
  }

  var getName = function(collId){
    return ids[collId];
  }

  var getStatus = function(){
    return online;
  }

  var watchStatus = function(){
    document.addEventListener("deviceready",function(){
      online = $cordovaNetwork.isOnline();

      $rootScope.$on('$cordovaNetwork:online',function(event,state){
        online = true;
      })
      $rootScope.$on('$cordovaNetwork:offline',function(event,state){
        online = false;
      })
    });
  }

  var msg = "No Internet connection available!";
  var getErrorMsg = function(){
    return msg;
  }

  return{
    createId: createId,
    getId: getId,
    getName: getName,

    getStatus: getStatus,
    watchStatus: watchStatus,
    getErrorMsg: getErrorMsg,

    createExId: createExId,
    getExId: getExId,
    getExerciseId: getExerciseId
  };
});
