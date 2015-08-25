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


module.exports = router;

