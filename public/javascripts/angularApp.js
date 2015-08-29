var app = angular.module('flapperNews', ['ui.router']);
app.factory('posts', ['$http', function($http){
  var o = {
    posts: []
  };
  //query to get('/posts') route to load all posts
  o.getAll = function(){
    return $http.get('/posts').success(function(data){
      angular.copy(data, o.posts); //copy returned data to the client side posts list
    });
  };
  //query to post('/posts') route to create post
  o.create = function(post){
    return $http.post('/posts', post).success(function(data){
      o.posts.push(data);
    });
  };
  return o;
}]);

//controls posts
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

          posts.create({
            title: $scope.title,
            link: $scope.link
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

//will control a post's comments
app.controller('PostsCtrl', [
'$scope',
'$stateParams',
'posts',
function($scope, $stateParams, posts){ //has access to posts factory
    $scope.post = posts.posts[$stateParams.id];

    //add a comment to a post
    $scope.addComment = function(){
      if($scope.body === '') {
        return;
      }
      $scope.post.comments.push({
        body: $scope.body,
        author: 'user',
        upvotes: 0
      });
      $scope.body = '';
    };
    
    //upvote a comment
    $scope.incrementUpvotes = function(comment){
      comment.upvotes += 1;
    };
    
}]);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider){

    //home state
    $stateProvider.state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      //query all posts every time home state is entered
      resolve: {
        postPromise: ['posts', function(posts){
          return posts.getAll();
        }]
      }
    });

    //posts and comments
    $stateProvider.state('posts', {
      url: '/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostsCtrl'
    });

    $urlRouterProvider.otherwise('home');

}]);
