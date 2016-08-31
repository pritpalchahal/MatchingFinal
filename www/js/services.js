angular.module('collocationmatching.services', [])

.factory('Exercises', function ($http) {
  const AllCollectionsUrl = "http://collections.flax.nzdl.org/greenstone3/flax?a=fp&sa=library&o=xml";

  const url_part_1 = "http://collections.flax.nzdl.org/greenstone3/flax";
  var url_part_2 = "?a=pr&o=xml&ro=1&rt=r&s=SSSS&c=CCCC&s1.service=11";

  const service = 100;
  var collname = "&s1.collname=CCCC";

  //to get url replace CCCC with collection name (e.g. collocations) & SSSS with activity name (e.g. CollocationMatching)
  //flaxc252,flaxc408,flaxc407 returns error
  //lawcorpus empty
  // var thisCollection = "flaxc383";//"collocations",flaxc383,flaxc158,flaxc404
  const thisActivity = "CollocationMatching";

  // collname = collname.replace("CCCC",thisCollection);
  url_part_2 = url_part_2.replace("SSSS",thisActivity);
  // url_part_2 = url_part_2.replace("CCCC",thisCollection);

  const exercisesUrl = url_part_1 + url_part_2;
  const singleExerciseUrl = url_part_2.replace("11",service) + collname;

  var data = [];
  var words = [];
  var slides = 0;
  var slidesCount = [];
  var collections = [];
  var names = [];

  //actual path does work in browser but not in phone (via phonegap or ionicview, so always keep the $http.get path form index.html)
  var url = "templates/default_exercises/default_exercise_list.xml";

  var newList = function(){
    collections = [];
  }

  var getAllColls = function(){
    //for "collocations", it does not have "flaxmobile","true" in metadataList, so manually add it
    collections.push("collocations");
    return $http.get(AllCollectionsUrl).then(function(response){
      var x2js = new X2JS();
      var jsonData = x2js.xml_str2json(response.data);
      var collectionList = jsonData.page.pageResponse.collectionList.collection;
      // console.log(collectionList);
      for(var i=0; i<collectionList.length;i++){
        var serviceList = collectionList[i].serviceList.service;
        var metadataList = collectionList[i].metadataList.metadata;
        // console.log(metadataList);
        for(var j=0 ; j<metadataList.length; j++){
          var obj = metadataList[j];
          for(var k=0;k<serviceList.length;k++){
            var sObj = serviceList[k];
            if(obj._name == "flaxmobile" && obj.__text == "true" && sObj._name == thisActivity){
              var name = collectionList[i]._name;
              var url_part_2_2 = url_part_2.replace("CCCC",name);
              var url = url_part_1 + url_part_2_2;
              check(url).then(function(res){
                var n = res.response._from;

                //only "password" has more than one category
                var ex = res.response.categoryList.category;
                if(ex.length > 0 || ex.exercise){
                  collections.push(n);
                }
              });
            }
          }
        }
      }
      return collections;
    });
  };

  var check = function(url){
    return $http.get(url).then(function(res){
      var x2js = new X2JS();
      var data = x2js.xml_str2json(res.data);
      return data;
    });
  }

  var getLeft = function(word){
    // return word.split(" ")[0];
    return word.substr(0,word.indexOf(" "));
  };

  var getRight = function(word){
    return word.substr(word.indexOf(" ")+1);
  };

  return {
    newList: newList,
    getAllColls: getAllColls,
    getAll: function(collectionName){
      var url_part_2_2 = url_part_2.replace("CCCC",collectionName);
      var url = url_part_1 + url_part_2_2;
      // console.log(url);
      return $http.get(url).then(function(response){
        var x2js = new X2JS();
        var jsonData = x2js.xml_str2json(response.data);
        var category = jsonData.response.categoryList.category;
        if(category.length > 0){
          for(var i=0; i<category.length; i++){
            var array = category[i].exercise;
            if(array.length > 0){
              data = [].concat(array);
            }
            else{
              data.push(array);
            }
          }
        }
        else{
          data = [].concat(jsonData.response.categoryList.category.exercise);
        }
        return data;
      });
    },

    getSingleEx: function(exId,collectionName){
      var url_part_2_2 = url_part_2.replace("CCCC",collectionName);
      var url_part_3 = collname.replace("CCCC",collectionName);
      const url_2 = url_part_2_2.replace("11",service) + url_part_3;
      slidesCount = [];
      var collos = [];
      for(var i= 0 ; i<data.length; i++){
        if(data[i]._id == parseInt(exId)){
          var thisUrl = data[i].url;
          var paramsUrl = thisUrl.substr(thisUrl.indexOf("&s1.params"));
          paramsUrl = url_part_1 + url_2 + paramsUrl;
          // console.log(paramsUrl);
          // return $http.get("templates/"+data[i].url).then(function(response){
          return $http.get(paramsUrl).then(function(response){
            var x2js = new X2JS();
            var jsonData = x2js.xml_str2json(response.data);
            // console.log(jsonData);
            words = jsonData.response.player.word;
            for(var j=0; j<words.length; j++){
              var collo = words[j].collo;
              collos[j] = [];
              slidesCount.push(collo.length);
              // slides = collo.length;
              for(var k=0; k<collo.length; k++){
                var text = collo[k].__text;
                var left = getLeft(text);
                var right = getRight(text);
                var obj = {"left":left,"right":right};
                collos[j].push(obj);
              };
            };
            return collos;
          });
        }
      }
      return null;
    },

    getExTitle: function(exId){
      for(var i= 0 ; i<data.length; i++){
        if(data[i]._id == parseInt(exId)){
          return data[i]._name;
        }
      }
      return null;
    },

    getSlidesCount: function(){
      // console.log(slidesCount);
      // return slides;
      // return Math.min.apply(Math,slidesCount);
      return Math.max.apply(Math,slidesCount);
    },

    remove: function(ex) {
      data.splice(data.indexOf(ex), 1);
    },

    removeColl: function(coll){
      collections.splice(collections.indexOf(coll),1);
    }
  };
})

.factory('DropData',function(){
  var dropped = [];

  var createEx = function(exId){
    dropped[exId] = [];
  }

  var createWord = function(exId,wordId){
    dropped[exId][wordId] = [];
  }

  var add = function(exId,wordId,slideId,value){
    dropped[exId][wordId][slideId] = value;
  }

  var clearValue = function(exId,wordId,slideId){
    dropped[exId][wordId][slideId] = null;
  }

  var getWord = function(exId){
    return dropped[exId];
  }

  var getValue = function(exId,wordId,slideId){
    return dropped[exId][wordId][slideId];
  }

  var clear = function(exId){
    dropped[exId] = [];
  }

  return{
    createEx: createEx,
    createWord: createWord,
    add: add,
    clearValue: clearValue,
    getWord: getWord,
    getValue: getValue,
    clear: clear
  };
})

.factory('AnswerData', function () {
  var myValues = [];

  var updateValue = function(exId,value,n){
    myValues[exId][n] = value;
  }

  var createValue = function(exId){
    myValues[exId] = [];
  }

  var getValues = function(exId){
    return myValues[exId];
  }

  var clearValues = function(exId){
    myValues[exId] = [];
  }

  return {
    updateValue: updateValue,
    createValue: createValue,
    getValues: getValues,
    clearValues: clearValues
  };
})

.factory('SummaryData', function () {
  var summary = [];

  var updateStartTime = function(exId,s){
    summary[exId].sTime = s;
  }

  var updateEndTime = function(exId,e){
    summary[exId].eTime = e;
  }

  var updateScore = function(exId,score){
    if(summary[exId]){
      summary[exId].score = score;
    }
  }

  var createSummary = function(exId){
    summary[exId] = {sTime:"n/a",eTime:"n/a",score:"0"};
  }

  var clearSummary = function(exId){
    summary.splice(exId,1);
  }

  var getSummary = function(exId){
    return summary[exId];
  }
  

  return {
    updateStartTime: updateStartTime,
    updateEndTime: updateEndTime,
    updateScore: updateScore,
    createSummary: createSummary,
    getSummary: getSummary,
    clearSummary: clearSummary
  };
})

.factory('StateData', function () {
  var states = [];

  var updateState = function(exId,state){
    states[exId] = state;
  }

  var getSingleState = function(exId){
    return states[exId];
  }

  var getAllStates = function(){
    return states;
  }
  
  return {
    updateState: updateState,
    getSingleState: getSingleState,
    getAllStates: getAllStates
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
});
