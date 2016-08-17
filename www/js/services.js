angular.module('starter.services', [])

.factory('Exercises', function ($http) {
  var data = [];
  var words = [];
  // var collos = [];
  var url = "../templates/default_exercises/default_exercise_list.xml";

  var getLeft = function(word){
    // return word.split(" ")[0];
    return word.substr(0,word.indexOf(" "));
  };

  var getRight = function(word){
    return word.substr(word.indexOf(" ")+1);
  };

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
      var collos = [{"left":[],"right":[]},{"left":[],"right":[]}];
      for(var i= 0 ; i<data.length; i++){
        if(data[i]._id == parseInt(exId)){
          return $http.get("../templates/"+data[i].url).then(function(response){
            var x2js = new X2JS();
            var jsonData = x2js.xml_str2json(response.data);
            words = jsonData.response.player.word;
            for(var j=0; j<words.length; j++){
              var collo = words[j].collo;
              for(var k=0; k<collo.length; k++){
                var text = collo[k].__text;
                collos[j].left.push(getLeft(text));
                collos[j].right.push(getRight(text));
              };
            };
            // for(var j=0 ; j<collos.length; j++){
            //   for(var k=0; k<collos[j].left.length; k++){
            //     console.log(collos[j].left[k]);
            //   }
            //   for(var k=0; k<collos[j].right.length; k++){
            //     console.log(collos[j].right[k]);
            //   }
            // };
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

    remove: function(ex) {
      data.splice(data.indexOf(ex), 1);
    }
  };
});
