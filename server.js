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
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
//var bcrypt = require('bcrypt');
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
var wtwitter = require('./lib/node-wisdom-twitter');
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

mongoose.connect('mongodb://localhost/wisdom1');
var db = mongoose.connection;
var fileServer = new nodestatic.Server(__dirname + '/public/static');

var serverAddress = "localhost";
var serverPort = 8002;
process.argv.forEach(function(val, index, array) {
  console.log(" args " + index + ': ' + val);
  var arr = val.split("=")
  if (arr[0] === "serverAddress") {
  	serverAddress = arr[1];
  }
  if (arr[0] === "serverPort") {
  	serverPort = arr[1]; 
  }
});


console.log("Hosting application on " + serverAddress +
	" Port " + serverPort);

var hostName = "http://" + serverAddress;
if (serverPort != "80") {
	hostName += ":" + serverPort;
}

console.log("HostName " + hostName +
	" Port " + serverPort);

app.engine('html', require('ejs').renderFile);

app.configure(function(){
  app.set('port', serverPort);
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
  
  // Add a secret code for cookie parser and session.
  app.use(flash());
  //app.use(express.session({key: 'express.sid', cookie: { maxAge: hour * 24,
  // secure: true }}));
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

var LINKEDIN_API_KEY = "8rwv6azucv8a";
var LINKEDIN_SECRET_KEY = "EmxI0a4AIIP9Pwjj";
var TWITTER_CONSUMER_KEY = "HBM4WcoQALBZKS3kGj4A";
var TWITTER_CONSUMER_SECRET = "xImFOpHBteRDlmPnmTByKCJtVCGktc8OwTnb10Enlk";


// NOTE(mj): Maybe comment this part for production?
app.configure('development', function(){
  app.use(express.errorHandler());
});

passport.serializeUser(function(user, done) {
  done(null, user);
});
  
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new LinkedInStrategy({
    consumerKey: LINKEDIN_API_KEY,
    consumerSecret: LINKEDIN_SECRET_KEY,
    callbackURL: hostName + "/auth/linkedin/callback",
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

// Use the TwitterStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and Twitter profile), and
//   invoke a callback with a user object.
passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: hostName + "/auth/twitter/callback"
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
  									failureRedirect: '/login' }),
  function(req, res) {
  	console.log('user info from twitter: ' + JSON.stringify(req.user));
    res.redirect('/bewastewise');
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
    res.redirect('/bewastewise');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

// Defining Database

var Schema = mongoose.Schema;

var userSchema = new Schema({
	firstName : { type: String, required: true },
	lastName : { type: String, required: true },
	pic : { type: String },
	email : { type: String, required: true },
	password : { type: String, required: true },
}, {collection : 'users1'});




var User1 = mongoose.model('User1', userSchema);

var io = require('socket.io').listen(server);


app.get('/', function(req, res) {
	res.render('index', {
		hostUrl : hostName
	});
});

app.get('/moderator', function(req, res) {
	res.render('moderator', {
		hostUrl : hostName
	});
});

app.get('/bewastewise', function(req, res) {
	ensureAuthenticated(req, res, function() {
		if(req.user.provider === 'twitter') {
			userCred = {
				userId : req.user.id,
				firstName : req.user.displayName.split(' ')[0],
				lastName : req.user.displayName.split(' ')[1],
				profilePic : req.user.photos[0].value
	      	};
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
			user: userCred,
			hostUrl : hostName
		});
	});
});


var generateRandomToken = function () {
  var user = this,
      chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      token = new Date().getTime() + '_';
  for ( var x = 0; x < 10; x++ ) {
    var i = Math.floor( Math.random() * 62 );
    token += chars.charAt( i );
  }
  return token;
};

app.post('/bewastewise', function(req, res) {
	userCred = {
			userId : generateRandomToken(),
			firstName : '(Guest) ' + req.body.nickname,
			lastName : '',
			profilePic : 'http://leadersinheels.com/wp-content/uploads/facebook-default.jpg',
	};
		var user = new User1();
		user.nickname = userCred.nickname;
		user.email = userCred.email;
		user.save(function(err) {
		if (err){
			console.log('error');
		}
	});

    res.render('expert1', {
    	user : userCred,
    	hostUrl : hostName
    });


});


wtwitter.init(io,
	{
		consumer_key: '5BF7XxniredSxapGu7LWQ',
		consumer_secret: 'mCjQIqvDSOlvQbar3v6taZ4Ydw7BlUtNyD2lXJYypQ8',
		access_token_key: '74211576-VRsXMuX2QB3a4LSMv0uEEU5YsfBLFB6p0HV9V8pM',
		access_token_secret: 'fopvDihR38yNASI4QMmo5FRJifa61z5M0dGafDc'
	}, 'mysession',
	["dropbox"], ["mukundjha"]);

//initalize chat session
	var thisChatSession = wGroupChat.newChatroom(221);
	thisChatSession.init(io, 'blankForNow', 221);

	//initialize note session
	var thisNoteSession = wNotes.newNote(221);
	thisNoteSession.init(io, 'blankForNow', 221);

	//initialize agenda session
	var thisAgendaSession = wAgenda.newAgenda(221);
	thisAgendaSession.init(io, 'blankForNow', 221);

	//initialze qa session
	qnaModule.initialize(221, io, 'blankForNow');

	//initalize spectators session
	var thisSpectatorSession = wprofile.newProfile(221);
	thisSpectatorSession.init(io, 'blankForNow', 221);

		//for(var i = 0; i < req.param('topicAmt'); i++) {
		//	topic = req.param('topic' + i.toString());
		//	thisAgendaSession.addTopic(topic);
		//};
		clients = {};
		io.sockets.on('connection', function(socket) {

			clients[socket.id] = socket;

			//Connect to chatroom with username and socket
			thisChatSession.joinChatroom('mukk', socket);
			
			//Connect to notes with username and socket
			thisNoteSession.joinNotes('mukk', socket);
	 
			//Connect to Agena with username and socket
			thisAgendaSession.joinAgenda(socket);

			//Connect to qna
			qnaModule.subscribe(socket);

			//Connect to spectators
			thisSpectatorSession.joinSpectators(socket);

			socket.on(wtwitter.SUBSCRIBE, function(data) {
				wtwitter.subscribe(socket);
			});

			socket.on(wtwitter.UNSUBSCRIBE, function(data) {
				wtwitter.unsubscribe(socket);
			});
			socket.on('disconnect', function() {

				delete clients[socket.id];
				
				console.log(socket.userId  + 'just disconnected!!!!!!!!!!!!!!!!!!!!!!!!!!!');
				thisSpectatorSession.userLeaving(socket);
			});


	});

server.listen(serverPort);
