var app = angular.module('flapperNews', []);
app.factory('posts', [function(){
  var o = {
    posts: []
  };
  return o;
}]);

app.controller('MainCtrl', [
    '$scope',
    'posts',
    function($scope, posts){
        $scope.posts = posts.posts;
        
        //add a new post (link is optional)
        $scope.addPost = function(){
          //prevent user from entering blank title
          if(!$scope.title || $scope.title === "") {
              return;
          }
          
          $scope.posts.push({title: $scope.title, link: $scope.link, upvotes: 0});  
          $scope.title = "";
          $scope.link = "";
        };
        
        //upvote a post
        $scope.incrementUpvotes = function(post){
          post.upvotes += 1;  
        };
    }
]);