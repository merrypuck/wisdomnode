/**
 * Copyright (c) 2013 Wisdomly Inc.
 * This code is the property of Wisdomly Inc. and can not be copied
 * or redistributed without permission.
 *
 * Author(s): 
 * -------
 *	Aaron Landy (aaron@wisdom.ly)
 * 	Kevin Miller (kevin@wisdom.ly)
 *	Mukund Jha (mj@wisdom.ly)
 * 
 * Description:
 * ------------
 * This is the main server code for wisdom.ly platform.

 */

// Required dependencies. 

var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var mongoose = require('mongoose');
var mime  = require('mime');
var io = require('socket.io');
var parseCookie = require('connect').utils.parseCookie;
var flash = require('connect-flash');
var groupchat = require('./lib/groupchat');
var notes = require('./lib/notes');
var agenda = require('./lib/agenda');
var profile = require('./lib/profile')
var mongooseWrapper = require('./lib/mongooseWrapper');
var authentication = require('./lib/authentication');
var qnaModule = require('./lib/QnAModule');
var nodestatic = require('node-static');
var passport = require('passport');
var util = require('util');
var LinkedInStrategy = require('passport-linkedin').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var LocalStrategy = require('passport-local').Strategy;

// Configuration settings.
var app = express();

var server = http.createServer(app);
var port = 8002;
var serverAddr = "http://127.0.0.1";

app.engine('html', require('ejs').renderFile);

app.configure(function(){
  app.set('port', process.env.PORT || port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.set('view options', {layout: false});
  app.use(express.favicon());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
   // Remember Me middleware
  app.use( function (req, res, next) {
    if ( req.method == 'POST' && req.url == '/login' ) {
      if ( req.body.rememberme ) {
        req.session.cookie.maxAge = 2592000000; // 30*24*60*60*1000 Rememeber 'me' for 30 days
      } else {
        req.session.cookie.expires = false;
      }
    }
    next();
  });
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  done(null, obj);
});



//Linkedin Passport

var LINKEDIN_API_KEY = "8rwv6azucv8a";
var LINKEDIN_SECRET_KEY = "EmxI0a4AIIP9Pwjj";

passport.use(new LinkedInStrategy({
    consumerKey: LINKEDIN_API_KEY,
    consumerSecret: LINKEDIN_SECRET_KEY,
    callbackURL: serverAddr + ":" + port+ "/auth/linkedin/callback",
    profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline','picture-url'] 
  },
  function(token, tokenSecret, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      // To keep the example simple, the user's LinkedIn profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the LinkedIn account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

//Twitter Passport

var TWITTER_CONSUMER_KEY = "HBM4WcoQALBZKS3kGj4A";
var TWITTER_CONSUMER_SECRET = "xImFOpHBteRDlmPnmTByKCJtVCGktc8OwTnb10Enlk";

passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: "http://127.0.0.1:8002/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Twitter profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Twitter account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

app.configure('development', function(){
  app.use(express.errorHandler());
});

var fileServer = new nodestatic.Server(__dirname + '/public/static');

var options = {
	key: fs.readFileSync('livewisdomlykey.key'),
	cert: fs.readFileSync('livewisdomly.crt'),
	ca: fs.readFileSync('livewisdomlyca.pem')
};


//----------------------------------------------

	//Mongoose 8/12/13
	//Connection to: 
		//db-wastewise
		//collection-users

//----------------------------------------------
mongoose.connect('mongodb://localhost/wastewise');

var Schema = mongoose.Schema;

var userSchema = new Schema({
	firstName : { type: String },
	lastName : { type: String},
	profilePic : { type: String },
	email : { type: String},
	password : { type: String},
	accessToken: { type: String } // Used for Remember Me
}, {collection : 'users'});

User = mongoose.model('User', userSchema);


// Bcrypt middleware
userSchema.pre('save', function(next) {
	var user = this;

	if(!user.isModified('password')) return next();

	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if(err) return next(err);

		bcrypt.hash(user.password, salt, function(err, hash) {
			if(err) return next(err);
			user.password = hash;
			next();
		});
	});
});

/*
// Password verification
userSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if(err) return cb(err);
		cb(null, isMatch);
	});
};
*/

// Remember Me implementation helper method
userSchema.methods.generateRandomToken = function () {
  var user = this,
      chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      token = new Date().getTime() + '_';
  for ( var x = 0; x < 16; x++ ) {
    var i = Math.floor( Math.random() * 62 );
    token += chars.charAt( i );
  }
  return token;
};

//--------------------------------------------

	//Socket.io 8/12/13
	//Initializing socket.io

//--------------------------------------------
var io = require('socket.io').listen(server);

//--------------------------------------------

  //routing 8/12/13s

//--------------------------------------------

//Get home
app.get('/', function(req, res) {
   if(!req.session.userId) {
    console.log('nonnnne');
  }
  else {
    console.log(req.session.userId);
  }
	res.render('home',{
  })
});

// GET /auth/twitter
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Twitter authentication will involve redirecting
//   the user to twitter.com.  After authorization, the Twitter will redirect
//   the user back to this application at /auth/twitter/callback
app.get('/auth/twitter',
  passport.authenticate('twitter'),
  function(req, res){
    // The request will be redirected to Twitter for authentication, so this
    // function will not be called.
  });

// GET /auth/twitter/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', {scope: 'email',
                    failureRedirect: '/' }),
  function(req, res) {
    console.log('user info from twitter: ' + JSON.stringify(req.user));
    res.redirect('/wastewise');
  });

app.get('/auth/linkedin',
  passport.authenticate('linkedin', { scope: ['r_basicprofile', 'r_emailaddress'] }),
  function(req, res){
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
  });

app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/wastewise');
  });

app.get('/wastewise', function(req, res) {
  if(req.user.provider === 'twitter') {
  userCred = {
    userId : req.user.id,
    firstName : req.user.displayName.split(' ')[0],
    lastName : req.user.displayName.split(' ')[1],
    profilePic : req.user.photos[0].value
  };
  var user = new User1();
    user.userId = userCred.userId;
    user.firstName = userCred.firstName;
    user.lastName = userCred.lastName;
    user.profilePic = userCred.profilePic;
    user.save(function(err) {
    if (err){
      console.log('error');
    }
  });
}
  else if(req.user.provider === 'linkedin') {
    userCred = {
      userId : req.user.id,
      firstName : req.user.name.givenName,
      lastName : req.user.name.familyName,
      profilePic : req.user._json.pictureUrl
    };
    var user = new User1();
    user.userId = userCred.userId;
    user.firstName = userCred.firstName;
    user.lastName = userCred.lastName;
    user.profilePic = userCred.profilePic;
    user.save(function(err) {
    if (err){
      console.log('error');
    }
  });
}
  res.render('expert1', {
    user: userCred
  });

});


//--------------------------------------------
app.listen(8002);
