angular.module('starter.services', [])

.factory('Exercises', function ($http) {
  var data = [];
  var words = [];
  var url = "../templates/default_exercises/default_exercise_list.xml";

  return {
    getAll: function(){
      return $http.get(url).then(function(response){
        var x2js = new X2JS();
        var jsonData = x2js.xml_str2json(response.data);
        data = jsonData.response.categoryList.category.exercise;
        return data;
      });
    },

    getSingleEx: function(exId){
      for(var i= 0 ; i<data.length; i++){
        if(data[i]._id == parseInt(exId)){
          return $http.get("../templates/"+data[i].url).then(function(response){
            var x2js = new X2JS();
            var jsonData = x2js.xml_str2json(response.data);
            words = jsonData.response.player.word;
            return words;
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

    remove: function(ex) {
      data.splice(data.indexOf(ex), 1);
    }
  };
});
