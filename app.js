var app = angular.module('flapperNews', ['ui.router']);
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
          
          $scope.posts.push({title: $scope.title, link: $scope.link, upvotes: 0,
            comments: [
              {author: 'Joe', body: 'Cool post!', upvotes: 0},
              {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
            ]
          });  
          $scope.title = "";
          $scope.link = "";
        };
        
        //upvote a post
        $scope.incrementUpvotes = function(post){
          post.upvotes += 1;  
        };
    }
]);

//will control posts and comments
app.controller('PostsCtrl', [
'$scope',
'$stateParams',
'posts',
function($scope, $stateParams, posts){ //has acces to posts factory
    $scope.posts = posts.posts[$stateParams.id];
    
}]);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider){
    
    //home state
    $stateProvider.state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl'
    });
    
    //posts and comments
    $stateProvider.state('posts', {
      url: '/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostsCtrl'
    });
    
    $urlRouterProvider.otherwise('home');
    
}]);