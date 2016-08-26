angular.module('collocationmatching.services', [])

.factory('Exercises', function ($http) {
  var mainUrl = "http://collections.flax.nzdl.org/greenstone3/flax";
  var subUrl = "?a=pr&o=xml&ro=1&rt=r&s=SSSS&c=CCCC&s1.service=11";
  var service = 100;
  var collname = "&s1.collname=collocations";
  //to get url replace CCCC with collection name (e.g. collocations) & SSSS with activity name (e.g. CollocationMatching)
  var thisCollection = "collocations";
  var thisActivity = "CollocationMatching";

  subUrl = subUrl.replace("SSSS",thisActivity);
  subUrl = subUrl.replace("CCCC",thisCollection);
  var singleSubUrl = subUrl.replace("11",service) + collname;
  var exUrl = mainUrl + subUrl;

  var data = [];
  var words = [];
  var slides = 0;

  //actual path does work in browser but not in phone (via phonegap or ionicview, so always keep the $http.get path form index.html)
  var url = "templates/default_exercises/default_exercise_list.xml";

  var getLeft = function(word){
    // return word.split(" ")[0];
    return word.substr(0,word.indexOf(" "));
  };

  var getRight = function(word){
    return word.substr(word.indexOf(" ")+1);
  };

  return {
    getAll: function(){
      return $http.get(exUrl).then(function(response){
        var x2js = new X2JS();
        var jsonData = x2js.xml_str2json(response.data);
        data = jsonData.response.categoryList.category.exercise;
        return data;
      });
    },

    getSingleEx: function(exId){
      var collos = [];
      for(var i= 0 ; i<data.length; i++){
        if(data[i]._id == parseInt(exId)){
          var thisUrl = data[i].url;
          var newUrl = thisUrl.substr(thisUrl.indexOf("&s1.params"));
          newUrl = mainUrl + singleSubUrl + newUrl;
          // return $http.get("templates/"+data[i].url).then(function(response){
          return $http.get(newUrl).then(function(response){
            var x2js = new X2JS();
            var jsonData = x2js.xml_str2json(response.data);
            words = jsonData.response.player.word;
            for(var j=0; j<words.length; j++){
              var collo = words[j].collo;
              collos[j] = [];
              slides = collo.length;
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

    getSlidesCount: function(exId){
      return slides;
    },

    remove: function(ex) {
      data.splice(data.indexOf(ex), 1);
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
});
