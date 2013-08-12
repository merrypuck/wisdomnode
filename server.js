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
//var http = require('http');
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

var options = {
	key: fs.readFileSync('livewisdomlykey.key'),
	cert: fs.readFileSync('livewisdomly.crt'),
	ca: fs.readFileSync('livewisdomlyca.pem')
}

var server = https.createServer(options, app);

mongoose.connect('mongodb://localhost/wisdom1');
var db = mongoose.connection;
var fileServer = new nodestatic.Server(__dirname + '/public/static');



app.engine('html', require('ejs').renderFile);

app.configure(function(){
  app.set('port', process.env.PORT || 80);
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
    callbackURL: "https://live.wisdom.ly/auth/linkedin/callback",
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
    res.redirect('/expert1');
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
    res.redirect('/expert1');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
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

// TODO(mj): Move this to another file that would contain all the schemas.
/*var userSchema = new Schema({
	firstName : String,
	lastName : String,
	email : String,
	password : String, // Store the hash here.
	userProfile : [profileSchema],
	organization : String,
	title : String,

}, {collection: 'users' });

var profileSchema = new Schema({
	location : String,
	organization : String,
	title : String,
	linkedinProfile : [linkedinProfileSchema],
	activity : [activitySchema],
	profileImage : String

});

var linkedinProfileSchema = new Schema({

});

var activitySchema = new Schema({
	lastLogin: String,
	pointer: String
});*/

var User1 = mongoose.model('User1', userSchema);

	var cb = function(obj) {
		console.log("this is a callback " + obj.username);
	}

var dict = {'username' : 'mukund'};
console.log("Mongoose Test");
	console.log(" upper keys : " + Object.keys(User1));
	mongooseW.findFirst(User1, {'username' :'mukund'}, cb);

var io = require('socket.io').listen(server);

var dummyTalk = {
	talkId : '883nnew39231nn321',
	talkTitle : 'Waste Management in Urban settings.',
	startTime : 1375763389,
	status : 'LIVE', // this should be an enum.
	info : {numSpeakers : 3},
}

var dummyTalk = {
	talkId : '883nnew39231nn321',
	talkTitle : 'Waste Management in Urban settings.',
	startTime : 1375763389,
	status : 'LIVE', // this should be an enum.
	info : {numSpeakers : 3},
}
 app.get('/', function(req, res) {
	res.render('index1', {
		
		user:req.user,

	})
});
 		/*userCred = {
			firstName : req.user.name.givenName,
			lastName : req.user.name.familyName,
			pic : req.user._json.pictureUrl,
			email : req.user._json.emailAdress,
		};
		var user = new User1();
			user.firstName = userCred.firstName;
			user.lastName = userCred.lastName;
			user.pic = userCred.pic;
			user.email = userCred.email;
			user.save(function(err) {
			if (err){
			console.log('error');
			}
			});*/
		
app.get('/expert1', function(req, res) {
	console.log(JSON.stringify(req.user));
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
	else {
		userCred = {
			firstName : req.body.firstName,
			lastName : req.body.lastName,
			email : req.body.email,
			password : req.body.password
		};
		var user = new User1();
		user.firstName = userCred.firstName;
		user.lastName = userCred.lastName;
		user.email = userCred.email;
		user.password = userCred.password;
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

app.get('/expert', function(req, res) {
	console.log(JSON.stringify(req.user));
	res.render('expert', {
		user:req.user
	});
});

app.get('/login', function(req, res) {

	res.render('login', {
	});
});
/*
app.post('/signup', function(req, res) {
	
    res.redirect('/expert1');


});
*/
/*
app.post('/login', function(req, res) {
	res.render('expert', {
		firstName : req.param('firstName'),
		lastName : req.param('lastName'),
		email : req.param('email'),
		userId : req.param('userId')

	})
});*/
//app.get('/', function(req, res){
//	res.render('login', {
		/*user : dummyUser,
		talk : dummyTalk,
		serverAddress : "http://localhost:8002"*/
//		});
//});

/*app.post('/', function(req, res) {
	var user = new User1({
		username : req.param('username'),
		password : req.param('password')
	});
	user.save(function(err) {
		if (err){
			console.log('error');
		}
	});

	res.render('expert', {
		username : req.param('username')
	});


});


	var obj1 = null;

	var f = User1.findOne({'username' : "mukund"}, function(err, obj) {
		if(obj === null) {
			console.log(" f the fucking object is null");
			return null;
		}
		else if(obj === undefined) {
			console.log("f the fucking object is undefined");
			return 'undefined';
		}
		else {
			cobj = JSON.parse(JSON.stringify(obj))
			if(cobj.username === 'mukund') {
				console.log('cobj.username is ' + cobj.username);
			} 
			obj1 = cobj;
			//console.log("f  object " + obj.toObject());
		//return cobj; //obj.toObject();
		res.render('success', {
		userData : cobj,
		uname : cobj.username
	});
		}
	});

	//console.log("f = " + Object.keys(obj1) + " , f.username = " + f.username 
	//	+ " f = " + JSON.stringify(f));
	

//});


app.get('/signup', function(req, res) {
	res.render('signup', {})
});


app.post('/signup', function(req, res) { 
	userCred = {
		firstName : req.param('firstName'),
		lastName : req.param('lastName'),
		email: req.param('email'),
		password : req.param('password'),
		userId : req.param('email') + 'bobdylan'
	};

	authentication.saveToDB(User1, userCred);

	res.render('expert', {
						firstName : userCred.firstName,
						lastName : userCred.lastName,
						email : userCred.email,
						userId : userCred.userId
	});

});

app.get('/login', function(req, res) {
	res.render('login')
});

app.post('/login', function(req, res) {
	if(mongooseW.findFirst(User1, 'email', req.param('email')) != null) {
		var userCred = mongooseW.findFirst(User1, 'email', req.param('email'));
		if(userCred.password === req.param('password')) {
			res.redirect('expert1', {});
		}
	}
	res.redirect('/expert')
});
app.get('/expert1', function(req, res) {
	userCred = mongooseW.findFirst(User1, 'email', req.param('findFirst'));
	res.render('expert', {
		firstName : userCred.firstName,
		lastName : userCred.lastName,
		email : userCred.email,
		userId : userCred.userId
	});

});

app.get('/expert', function(req, res) {
	userCred = {
		firstName : req.param('firstName'),
		lastName : req.param('lastName'),
		email: req.param('email'),
		password : req.param('password'),
		userId : req.param('email') + 'bobdylan'
	};
	res.render('expert', {
		firstName : userCred.firstName,
		lastName : userCred.lastName,
		email : userCred.email,
		userId : userCred.userId
	});
});
 app.post('/expert', function(req, res) {
	res.render('expert',{
		username : req.param('username'),
		//title: req.session.user
		});
	//res.cookie('remember', '1', { maxAge: 120000 })
	//req.session.username = user.username;
});

app.get('/hangout', function(req, res){
	fileServer.serveFile('/wiseApp.xml', 200, {}, req, res);


});



wtwitter.init(io,
	{
		consumer_key: '5BF7XxniredSxapGu7LWQ',
		consumer_secret: 'mCjQIqvDSOlvQbar3v6taZ4Ydw7BlUtNyD2lXJYypQ8',
		access_token_key: '74211576-VRsXMuX2QB3a4LSMv0uEEU5YsfBLFB6p0HV9V8pM',
		access_token_secret: 'fopvDihR38yNASI4QMmo5FRJifa61z5M0dGafDc'
	}, 'mysession',
	["dropbox"], ["mukundjha"]);
	*/

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

		io.sockets.on('connection', function(socket) {
		
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
/*
			socket.on(wtwitter.SUBSCRIBE, function(data) {
				wtwitter.subscribe(socket);
			});

			socket.on(wtwitter.UNSUBSCRIBE, function(data) {
				wtwitter.unsubscribe(socket);
			});
*/
			socket.on('disconnect', function() {
				// Unsubscribe from twitter feed.
				
				console.log(socket.userId  + 'just disconnected!!!!!!!!!!!!!!!!!!!!!!!!!!!');
				thisSpectatorSession.userLeaving(socket);
			});


	});

server.listen(80);
