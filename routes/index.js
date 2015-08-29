var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

//Note: Use this url for curl instead of localhost:3000: https://mean-news-app-kshen3778.c9.io/
//GET all posts
router.get('/posts', function(req,res,next){
    //retrieve all posts in JSON format
   Post.find(function(err, posts){
     if(err){ return next(err); }
     
     res.json(posts);
   });
});

//POST create a post
router.post('/posts', function(req, res, next){
   var post = new Post(req.body); //create a new post with user input info
   
   post.save(function(err, post){
      if(err){ return next(err); } 
      
      res.json(post);
   });
   
});

//preload posts
router.param('post', function(req,res,next,id){
   var query = Post.findById(id); //find the post
   
   // try to get the post details from the Posts model and attach it to the request object
   query.exec(function(err, post){
      if(err){
          return next(err);
      }
      if(!post){
          return next(new Error('can\'t find post'));
      }
      
      req.post = post;
      return next();
   });
});

//retrieve a specific post along with its comments
router.get('/posts/:post', function(req,res,next){
   req.post.populate('comments', function(err, post){
      if(err) { return next(err); }
      res.json(req.post); 
   });
});

//upvote a post
router.put('/posts/:post/upvote', function(req,res,next){
   req.post.upvote(function(err, post){
      if(err){
          return next(err);
      }
      res.json(post);
   });
});

//create comment route for a post
router.post('/posts/:post/comments', function(req, res, next){
   var comment = new Comment(req.body);
   comment.post = req.post; //set the Comment Schema's post field to the selected post
   
   comment.save(function(err, comment){
      if(err){
         return next(err);
      }
      req.post.comments.push(comment); //push the comment into the Post Schema's comments field
      req.post.save(function(err,post){
         if(err){
            return next(err);
         }
         res.json(comment);
      });
      
   });
});

//preload comment specified by any :comment route parameters
router.param('comment', function(req,res,next,id){
   var query = Comment.findById(id); //find the comment
   
   // try to get the post details from the Posts model and attach it to the request object
   query.exec(function(err, comment){
      if(err){
          return next(err);
      }
      if(!comment){
          return next(new Error('can\'t find comment'));
      }
      
      req.comment = comment;
      return next();
   });
});

//upvote a comment
router.put('/posts/:post/comments/:comment/upvote', function(req,res,next){
   //call Comment schema's upvote method on :comment
   req.comment.upvote(function(err, comment){
      if(err){
          return next(err);
      }
      res.json(comment);
   });
});


module.exports = router;

