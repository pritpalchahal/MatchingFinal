angular.module('starter.services', [])

.factory('Exercises', function ($http) {
  var data = [];
  var words = [];
  // var collos = [];

  //actual path does work in browser but in phone (via phonegap or ionicview, so always keep the $http.get path form index.html)
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
      return $http.get(url).then(function(response){
        var x2js = new X2JS();
        var jsonData = x2js.xml_str2json(response.data);
        data = jsonData.response.categoryList.category.exercise;
        return data;
      });
    },

    getSingleEx: function(exId){
      var collos = [{"left":[],"right":[]},{"left":[],"right":[]}];
      var array = {"l1":[],"r1":[],"l2":[],"r2":[]};
      var coll = ["l1","l2","r1","r2"];
      for(var i= 0 ; i<data.length; i++){
        if(data[i]._id == parseInt(exId)){
          return $http.get("templates/"+data[i].url).then(function(response){
            var x2js = new X2JS();
            var jsonData = x2js.xml_str2json(response.data);
            words = jsonData.response.player.word;
            for(var j=0; j<words.length; j++){
              var collo = words[j].collo;
              for(var k=0; k<collo.length; k++){
                var text = collo[k].__text;
                collos[j].left.push(getLeft(text));
                collos[j].right.push(getRight(text));

                // if(j==0){

                //   array.l1.push(getLeft(text));
                //   array.r1.push(getRight(text));
                // }
                // else{
                //   array.l2.push(getLeft(text));
                //   array.r2.push(getRight(text));
                // }
              };
            };
            // console.log(array);
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
})

.factory('DroppedData', function(){
  var dropObjects1 = [];
  var dropObjects2 = [];

  var add1 = function(obj,n){
    dropObjects1[n].push(obj);
  };

  var add2 = function(obj,n){
    dropObjects2[n].push(obj);
  };

  var get1 = function(n){
    return dropObjects1[n];
  };

  var get2 = function(n){
    return dropObjects2[n];
  };

  var empty1 = function(n){
    dropObjects1[n] = [];
  }

  var empty2 = function(n){
    dropObjects2[n] = [];
  }

  var create1 = function(n){
    dropObjects1[n] = [];
  }

  var create2 = function(n){
    dropObjects2[n] = [];
  }

  var getAll1 = function(){
    return dropObjects1;
  }

  var getAll2 = function(){
    return dropObjects2;
  }

  return {
    add1: add1,
    add2: add2,
    get1: get1,
    get2: get2,
    empty1: empty1,
    empty2: empty2,
    create1: create1,
    create2: create2,
    getAll1: getAll1,
    getAll2: getAll2
  };
});
