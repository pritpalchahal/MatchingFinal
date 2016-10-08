angular.module('collocationmatching.services', [])

//Data factory is responsible for fetching data from FLAX server,
//save this data locally and provide controllers with suitable response
.factory('Data', function ($http, $cordovaNetwork, ionicToast, Ids, $rootScope, $q) {
  //Name of this Activity
  const THIS_ACTIVITY = "CollocationMatching";
  //Nice name, for displaying only
  const NICE_TITLE = "Collocation Matching";

  const ALL_COLLECTIONS_URL = "http://collections.flax.nzdl.org/greenstone3/flax?a=fp&sa=library&o=xml";

  const PREFIX_URL = "http://collections.flax.nzdl.org/greenstone3/flax";
  const TEMPLATE_URL = "?a=pr&o=xml&ro=1&rt=r&s=SSSS&c=CCCC&s1.service=11";

  //To get url replace CCCC with collection name (e.g. collocations) & SSSS with activity name (e.g. CollocationMatching)
  const TEMPLATE_URL_WITH_ACTIVITY = TEMPLATE_URL.replace("SSSS",THIS_ACTIVITY);

  const SERVICE_NUMBER = 100;
  const TEMPLATE_COLLNAME = "&s1.collname=CCCC";

  //List of possible collections for this activity
  var collections = [];
  //List of name,description for each collection
  var descriptions = [];
  //List of possible exercises for this activity
  var exercises = [];
  var slidesCount = [];
  //List of words for each game
  var words = [];

  //Function retrieves all collection names from FLAX server
  var getAll = function(){
    var temp_collections = [];
    var promise = $http.get(ALL_COLLECTIONS_URL,{timeout:$rootScope.timeout}).then(function(response){
      var x2js = new X2JS();
      var jsonData = x2js.xml_str2json(response.data);
      var collectionList = jsonData.page.pageResponse.collectionList.collection;
      for(var i=0; i<collectionList.length;i++){
        var serviceList = collectionList[i].serviceList.service;
        var metadataList = collectionList[i].metadataList.metadata;
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
    },function(error){
      return error;
    });
    return promise;
  }

  //Function to fetch all data and return suitable response to Collections controller
  var getAllColls = function(isRefreshing){
    promises = [];

    return getAll().then(function(response){
      if(response.status == 404 || response.status == -1){
        return response;
      }
      var temp_collections = [];
      response.forEach(function(collectionName){
        //For each collection name, check if it contains any exercises or not
        promises.push(checkIfEmpty(collectionName));
      });
      return $q.all(promises).then(function(values) {
        values.forEach(function(value){
          //Ignore erroneous values
          if(value && value.status != 404 && value.status != -1){
            temp_collections.push(value);
          }
        });
        //if user if refreshing and due to server error, new collections retrieved
        //are less than previously retrieved, then simply return previously retrieved
        if(isRefreshing){
          if(collections.length <= temp_collections.length){
            //Otherwise return newly retrieved
            collections = temp_collections;
          }
        }
        else if(temp_collections.length == 0){
          //If no collection retrieved, return custom 404 error
          return {"status":404};
        }
        else{
          //If all okay, return retrieved collections
          collections = temp_collections;
        }
        return collections;
      });
    });
  }

  //Function to check if given collection is empty or not
  var checkIfEmpty = function(collectionName){
    var suffix_url = TEMPLATE_URL_WITH_ACTIVITY.replace("CCCC",collectionName);
    var coll_url = PREFIX_URL + suffix_url;

    return $http.get(coll_url,{timeout:$rootScope.timeout}).then(function(res){
      var x2js = new X2JS();
      var data = x2js.xml_str2json(res.data);
      if(!data || !data.response){return;}
      var collection_name = data.response._from;

      /*only "password" has more than one category*/
      var ex = data.response.categoryList.category;
      if(ex.length > 0 || ex.exercise){
        return collection_name;
      }
    },function(error){
      return error;
    });
  }

  //Function fetch all exercises for given collection and return
  //suitable response to Exercises controller
  var getAllEx = function(collId,isRefreshing){
    if(exercises[collId] && !isRefreshing){
      return new Promise(function(resolve){
        return resolve(exercises[collId]);
      });
    }
    if(!$rootScope.online){
      ionicToast.show(getErrorMsg(),'middle',false,3000);
      return new Promise(function(resolve){
        return resolve([]);
      });
    }
    if(!isRefreshing){
      //If not refreshing, Initiate all sub arrays
      exercises[collId] = [];
      words[collId] = [];
      slidesCount[collId] = [];
    }

    var collectionName = Ids.getCollName(collId);
    var suffix_url = TEMPLATE_URL_WITH_ACTIVITY.replace("CCCC",collectionName);
    var coll_url = PREFIX_URL + suffix_url;

    return $http.get(coll_url,{timeout:$rootScope.timeout}).then(function(response){
      var x2js = new X2JS();
      var jsonData = x2js.xml_str2json(response.data);
      /* if(!jsonData.response){return;}*/
      var category = jsonData.response.categoryList.category;
      if(category.length > 0){
        for(var i=0; i<category.length; i++){
          var array = category[i].exercise;
          //Check if array is defined or not
          if(array){
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
    },function(error){
      return error;
    });
  }

  //Function fetch game data and return suitable response to Exercise Controller
  getSingleEx = function(collId,exId){
    if(words[collId][exId]){
      return new Promise(function(resolve){
        return resolve(words[collId][exId]);
      });
    }
    if(!$rootScope.online){
      ionicToast.show(getErrorMsg(),'middle',false,3000);
      return new Promise(function(resolve){
        return resolve([]);
      });
    }
    //Initiate data arrays
    words[collId][exId] = [];
    slidesCount[collId][exId] = [];

    var exerciseId = Ids.getExerciseId(collId,exId);
    var collectionName = Ids.getCollName(collId);

    var temp_url = TEMPLATE_URL_WITH_ACTIVITY.replace("CCCC",collectionName);
    var collname_url= TEMPLATE_COLLNAME.replace("CCCC",collectionName);
    var middle_url = temp_url.replace("11",SERVICE_NUMBER) + collname_url;

    var temp_words = [];

    for(var i= 0 ; i<exercises[collId].length; i++){
      if(exercises[collId][i]._id == parseInt(exerciseId)){
        var contained_url = exercises[collId][i].url;
        var params_url = contained_url.substr(contained_url.indexOf("&s1.params"));
        var final_url = PREFIX_URL + middle_url + params_url;

        return $http.get(final_url,{timeout:$rootScope.timeout}).then(function(response){
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
              var obj = {"left":left,"right":right,"drop":"","id":uniqueId,"isDraggable":true,get isCorrect(){return (this.right == this.drop);}};
              uniqueId++;
              words[collId][exId][j].push(obj);
            };
          };
          return words[collId][exId];
        },function(error){
          return error;
        });
      }
    }
  }

  //Function to get Exercise title
  getExTitle = function(collId,exId){
    for(var i= 0 ; i<exercises[collId].length; i++){
      if(exercises[collId][i]._id == parseInt(exId)){
        return exercises[collId][i]._name;
      }
    }
    return null;
  }

  //Function to get slides count
  getSlidesCount = function(collId,exId){
    if(!slidesCount[collId][exId]){
      return 0;
    }
    /* return Math.min.apply(Math,slidesCount[collId][exId]);*/
    return Math.max.apply(Math,slidesCount[collId][exId]);
  }

  //Function return minimum slides count
  getMinSlidesCount = function(collId,exId){
    if(!slidesCount[collId][exId]){
      return 0;
    }
    return Math.min.apply(Math,slidesCount[collId][exId]);
  }

  //Function to remove an Exercise from list
  removeEx = function(collId,ex) {
    exercises[collId].splice(exercises[collId].indexOf(ex), 1);
  }

  //Function to restart an Exercise
  restartEx = function(collId,ex){
    exercises[collId][exercises.indexOf(ex)] = [];
  }

  //Function to remove an collection from list
  removeColl = function(coll){
    collections.splice(collections.indexOf(coll),1);
  }

  //Function returns previously fetched words for given collection and exercise
  var getWords = function(collId,exId){
    if(words[collId][exId]){
      return words[collId][exId];
    }
    return null;
  }

  //Function to get description
  var getDesc = function(){
    return descriptions;
  }

  //Function to get left word
  var getLeft = function(word){
    /* return word.split(" ")[0]; */
    return word.substr(0,word.indexOf(" "));
  }

  //Function to get Right word
  var getRight = function(word){
    return word.substr(word.indexOf(" ")+1);
  }

  //Function to get timeout msg
  var getTimeoutMsg = function(){
    return "Request timed out. Try again later!";
  }

  //Function return error msg
  var getErrorMsg = function(){
    return "No Internet connection available!";
  }

  //Function return 404 msg
  var get404Msg = function(msg){
    return "Error at server, try again later! " + (msg ? msg : "");
  }

  //Function returns exercises title
  var getTitle = function(){
    return NICE_TITLE;
  }

  return {
    getWords: getWords,
    getAllColls: getAllColls,
    getDesc: getDesc,

    getAllEx: getAllEx,
    getSingleEx: getSingleEx,

    getExTitle: getExTitle,
    getSlidesCount: getSlidesCount,
    getMinSlidesCount: getMinSlidesCount,

    removeEx: removeEx,
    removeColl: removeColl,
    restartEx: restartEx,

    getTimeoutMsg: getTimeoutMsg,
    getErrorMsg: getErrorMsg,
    get404Msg: get404Msg,
    getTitle: getTitle
  };
})

//SummartData factory stores summary data for each exercise
.factory('SummaryData', function () {
  var summary = [];

  //Function to update start time
  var updateStartTime = function(collId,exId,s){
    summary[collId][exId].sTime = s;
  }

  //Function to update end time
  var updateEndTime = function(collId,exId,e){
    summary[collId][exId].eTime = e;
  }

  //Function to update score
  var updateScore = function(collId,exId,slideIndex){
    if(summary[collId][exId]){
      summary[collId][exId].scores[slideIndex] = true;
    }
  }

  //Function to create an entry for summary for given collection and exercise
  var createSummary = function(collId,exId){
    if(!summary[collId][exId]){
      summary[collId][exId] = {sTime:"n/a",eTime:"n/a",scores:[],get score(){
        var s = 0;
        for(var i=0;i<this.scores.length;i++){
          if(this.scores[i]){
            s++;
          }
        }
        return s;
      }};
    }
  }

  //Function to clear summary for given collection and exercise
  var clearSummary = function(collId,exId){
    summary[collId].splice(exId,1);
  }

  //Function to return summary for given collection and exercise
  var getSummary = function(collId,exId){
    if(summary[collId][exId]){
      return summary[collId][exId];
    }
  }

  //Function to create a new summary entry for given collection
  var createColl = function(collId){
    summary[collId] = [];
  }

  //Function returns whether a summary entry is created for given collection
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

//StateData factory stores data related to state of each exercise ('New','Incomplete' or 'Complete')
.factory('StateData', function () {
  var states = [];

  //Function to update state
  var updateState = function(collId,exId,state){
    states[collId][exId] = state;
  }

  //Function to return state for given collectiona and exercise
  var getSingleState = function(collId,exId){
    return states[collId][exId];
  }

  //Function to return state for all exercises for given collection
  var getAllStates = function(collId){
    return states[collId];
  }

  //Function to create a state entry for given collection
  var createColl = function(collId){
    states[collId] = [];
  }

  //Function returns a state is created for given collection
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

//Ids factory generates and stores unique ids for each collection and exercise
.factory('Ids',function($cordovaNetwork,$rootScope){
  var collIds = [];
  var exIds = [];

  //Function to return exercise id for given collection and exercise
  //Function asscertains that a new entry been created for exercise if not already exists
  var getExId = function(collId,exerciseId){
    var exId = exIds[collId].indexOf(exerciseId);
    if(exId == -1){
      exIds[collId].push(exerciseId);
      exId = exIds[collId].indexOf(exerciseId);
    }
    return exId;
  }

  //Function return original exercise Id
  var getExerciseId = function(collId,exId){
    return exIds[collId][exId];
  }

  //Function to return collection id for given collection
  //Function asscertains that a new entry been created for collection if not already exists
  var getCollId = function(name){
    var collId = collIds.indexOf(name);
    if(collId == -1){
      collIds.push(name);
      collId = collIds.indexOf(name);
    }
    //Also, Initiate exIds if not already done
    if(!exIds[collId]){
      exIds[collId] = [];
    }
    return collId;
  }

  //Function return collection name based on collection Id
  var getCollName = function(collId){
    return collIds[collId];
  }

  return{
    getCollId: getCollId,
    getCollName: getCollName,

    getExId: getExId,
    getExerciseId: getExerciseId
  };
});
