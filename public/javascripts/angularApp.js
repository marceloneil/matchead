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
  //query to upvote post route
  o.upvote = function(post){
    return $http.put('/posts/' + post._id + '/upvote').success(function(data){
      post.upvotes += 1;
    });
  };
  //retrieve a single post
  o.get = function(id){
    return $http.get('/posts/' + id).then(function(res){
      return res.data;
    });
  };
  //adding comments
  o.addComment = function(id, comment){
    return $http.post('/posts/' + id + '/comments', comment);
  };
  //upvote comments
  o.upvoteComment = function(post, comment){
    return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote').success(function(data){
      comment.upvotes += 1;
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
          posts.upvote(post);
        };
    }
]);

//will control a post's comments
app.controller('PostsCtrl', [
'$scope',
'posts',
'post',
function($scope, posts, post){ //has access to posts factory
    $scope.post = post;

    //add a comment to a post
    $scope.addComment = function(){
      if($scope.body === '') {
        return;
      }
      posts.addComment(post._id, {
        body: $scope.body,
        author: 'user',
      }).success(function(comment){
        $scope.post.comments.push(comment);
      });
      $scope.body = '';
    };
    
    //upvote a comment
    $scope.incrementUpvotes = function(comment){
      posts.upvoteComment(post, comment);
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
      controller: 'PostsCtrl',
      resolve: {
        post: ['$stateParams', 'posts', function($stateParams, posts){
          return posts.get($stateParams.id);
        }]
      }
    });

    $urlRouterProvider.otherwise('home');

}]);
