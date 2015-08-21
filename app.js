var app = angular.module('flapperNews', []);
app.controller('MainCtrl', [
    '$scope',
    function($scope){
        $scope.posts = [
          {title: 'post 1', upvotes: 5},
          {title: 'post 2', upvotes: 2},
          {title: 'post 3', upvotes: 15},
          {title: 'post 4', upvotes: 9},
          {title: 'post 5', upvotes: 4}
        ];
        
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