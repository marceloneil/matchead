var app = angular.module('flapperNews', ['ui.router']);
app.factory('posts', ['$http', 'auth', function($http, auth){
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
    return $http.post('/posts', post, {
      //pass auth JWT token as an Authorization header
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    }).success(function(data){
      o.posts.push(data);
    });
  };
  //query to upvote post route
  o.upvote = function(post){
    return $http.put('/posts/' + post._id + '/upvote', null, {
      //pass auth JWT token as an Authorization header
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    }).success(function(data){
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
    return $http.post('/posts/' + id + '/comments', comment, {
      //pass auth JWT token as an Authorization header
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    });
  };
  //upvote comments
  o.upvoteComment = function(post, comment){
    return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
      //pass auth JWT token as an Authorization header
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    }).success(function(data){
      comment.upvotes += 1;
    });
  };
  
  return o;
}]);

app.factory('auth', ['$http', '$window', function($http, $window){
  var auth = {};
  
  //save the login token into localStorage
  auth.saveToken = function(token){
    $window.localStorage['flapper-news-token'] = token;
  };
  
  //get token from localStorage
  auth.getToken = function(){
    return $window.localStorage['flapper-news-token'];
  };
  
  //check if user is logged in(token exists and isn't expired)
  auth.isLoggedIn = function(){
    var token = auth.getToken();
    if(token){ //check if token exists
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000; //check for expiration
    } else {
      return false; //user is logged out
    }
  };
  
  //return username of user that's logged in
  auth.currentUser = function(){
    if(auth.isLoggedIn()){
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.username;
    }
  };
  
  //register the user and save the token returned
  auth.register = function(user){
    console.log(user);
    return $http.post('/register', user).success(function(data){
      auth.saveToken(data.token);
      console.log(user);
    });
  };
  
  //login the user and save the token returned
  auth.logIn = function(user){
    return $http.post('/login', user).success(function(data){
      auth.saveToken(data.token);
    });
  };
  
  //logout by removing token from localStorage
  auth.logOut = function(){
    $window.localStorage.removeItem('flapper-news-token');
  };
  return auth;
}]);

//controls posts
app.controller('MainCtrl', [
    '$scope',
    'posts',
    'auth',
    function($scope, posts, auth){
        $scope.posts = posts.posts;
        $scope.isLoggedIn = auth.isLoggedIn;
        
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

app.controller('TextCtrl', [
    '$scope',
    'auth',
    '$http',
    function($scope, auth, $http){

        $scope.isLoggedIn = auth.isLoggedIn;
        
        $scope.analyze = function(){
          console.log($scope.person);
          console.log($scope.company);
          
          $http.post('/analyze', {company: $scope.company}).then(function(data) {
            
            console.log(data);
            
            $scope.companySentiment = data.data.csent;
            $scope.companyPolitical = data.data.cpolitical;
            $scope.companyPersonality = data.data.cpersonality;
            
            $scope.personalSentiment = data.data.psent;
            $scope.personalPolitical = data.data.ppolitical;
            $scope.personalPersonality = data.data.ppersonality;
          });
        };
        
    }
]);

//will control a post's comments
app.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
function($scope, posts, post, auth){ //has access to posts factory
    $scope.post = post; //$scope.post two way binding to the frontend ng-repeat=post in posts
    $scope.isLoggedIn = auth.isLoggedIn;
    
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

//controller for navbar
app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  //expose methods from auth factory
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);

app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};
  
  //calls the register method in auth factory
  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){ //if no errors, promise the user home
      $state.go('home');
    });
  };
  
  //calls the login method in auth factory
  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){ //if no errors, promise the user home
      $state.go('home');
    });
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
    
    $stateProvider.state('texts', {
      url: '/texts',
      templateUrl: '/text.html',
      controller: 'TextCtrl'
    });

    //posts and comments
    $stateProvider.state('posts', {
      url: '/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostsCtrl', //posts will be controlled with PostCtrl
      resolve: {
        post: ['$stateParams', 'posts', function($stateParams, posts){
          return posts.get($stateParams.id);
        }]
      }
    });
    
    //login state (accessible once logged in)
    $stateProvider.state('login', {
      url: '/login',
      templateUrl: '/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          //if logged in then proceed to home
          $state.go('home');
        }
      }]
    });
    
    //register state (accessible once logged in)
    $stateProvider.state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    });

    $urlRouterProvider.otherwise('home');

}]);
