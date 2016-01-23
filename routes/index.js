var express = require('express');
var router = express.Router();
var indico = require('indico.io');
indico.apiKey = process.env.indico;

var Twitter = require('twitter');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var jwt = require('express-jwt');
var passport = require('passport');
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var Company = mongoose.model('Company');

//middleware for authenticating jwt tokens
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});



router.post('/analyze', function(req,res,next){
   console.log("text analysis");
   /*indico.personas("I only stay home on Saturday nights to read.")
      .then(function(response){
         console.log(response);
      });*/
      
    
    //get company tweets
    var params = {screen_name: req.body.company, trim_user: 0, exclude_replies: 1};
    client.get('statuses/user_timeline', params, function(error, tweets, response){
        if (!error) {
          var companyPosts = [];
          for(var i = 0; i < tweets.length; i++){
             companyPosts.push(tweets[i].text);
          }
          
          indico.analyzeText(companyPosts,{apis: ['sentiment_hq','political','personality']}).then(function(result) {
             console.log("Company Tweet Analysis");
             var averageCompanySentiment = 0
             for(var i = 0; i < result.sentiment_hq.length; i++){
               averageCompanySentiment += result.sentiment_hq[i];
             }
             averageCompanySentiment /= result.sentiment_hq.length;
             console.log(averageCompanySentiment);
             //console.log(result);
             var co = new Company();
             co.twittername = req.body.company;
             co.political = result.political;
             co.sentiment = averageCompanySentiment;
             co.personality = result.personality;
             //co.persona = result.personas;
             //console.log(co);
             
             co.save(function(err, comp){
                //console.log(err);
               if(err){
                  return next(err); 
                  
               } 
               params = {screen_name: req.body.person, trim_user: 0, exclude_replies: 1};
                  client.get('statuses/user_timeline', params, function(error, tweets, response){
                     if(!error){
                        var personalPosts = [];
                         for(var i = 0; i < tweets.length; i++){
                            personalPosts.push(tweets[i].text);
                         }
                        //personal tweets
                        indico.analyzeText(personalPosts,{apis: ['sentiment_hq','political','personality']}).then(function(result2) {
                           console.log("Personal Tweets analysis");
                           //console.log(result2);
                           var averagePersonalSentiment = 0
                           for(var i = 0; i < result2.sentiment_hq.length; i++){
                              averagePersonalSentiment += result2.sentiment_hq[i];
                           }
                           averagePersonalSentiment /= result2.sentiment_hq.length;
                           console.log(averagePersonalSentiment);
                           console.log(Math.abs(averageCompanySentiment-averagePersonalSentiment));
                           
                           res.json(comp);
                           
                        });
                     }
               
               });

             });
             
          }).catch(function(err) {
            console.warn(err);
          });
        }
    });
   

});

//GET all posts
router.get('/posts', function(req,res,next){
    //retrieve all posts in JSON format
   Post.find(function(err, posts){
     if(err){ return next(err); }
     
     res.json(posts);
   });
});

//POST create a post
router.post('/posts', auth, function(req, res, next){
   var post = new Post(req.body); //create a new post with user input info
   post.author = req.payload.username; //authenticated user
   
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
router.put('/posts/:post/upvote', auth, function(req,res,next){
   req.post.upvote(function(err, post){
      if(err){
          return next(err);
      }
      res.json(post);
   });
});

//create comment route for a post
router.post('/posts/:post/comments', auth, function(req, res, next){
   var comment = new Comment(req.body);
   comment.post = req.post; //set the Comment Schema's post field to the selected post
   comment.author = req.payload.username; //authenticated user
   
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
router.put('/posts/:post/comments/:comment/upvote', auth, function(req,res,next){
   //call Comment schema's upvote method on :comment
   req.comment.upvote(function(err, comment){
      if(err){
          return next(err);
      }
      res.json(comment);
   });
});

//passport register route
router.post('/register', function(req, res, next){
   if(!req.body.username || !req.body.password){
      return res.status(400).json({message: 'Please fill out all fields'});
   }
   
   var user = new User();
   
   user.username = req.body.username;
   user.setPassword(req.body.password);
   
   user.save(function(err){
      if(err){
         return next(err);
      }
      //if registration is successful then return a JWT token to client
      return res.json({token: user.generateJWT()});
   });
   
});

//passport login route
router.post('/login', function(req,res,next){
   if(!req.body.username || !req.body.password){
      return res.status(400).json({message: 'please fill out all fields'});
   }
   
   passport.authenticate('local', function(err, user, info){
      if(err){
         return next(err);
      }
      if(user){
         //if authentication is successful return a JWT token to client
         return res.json({token: user.generateJWT()});
      } else{
         return res.status(401).json(info);
      }
   })(req,res,next);
});

module.exports = router;

