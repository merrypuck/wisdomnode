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


// Configuration settings.
var app = express();
var server = http.createServer(app);

mongoose.connect('mongodb://localhost/wisdom1');
var fileServer = new nodestatic.Server(__dirname + '/public/static');

var db = mongoose.connection;

app.engine('html', require('ejs').renderFile);

app.configure(function(){
  app.set('port', process.env.PORT || 8002);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.set('view options', {layout: false});
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  // Add a secret code for cookie parser and session.
  app.use(express.cookieParser('98475a915d49f2420891c0cb97b37fc8'));
  app.use(express.session({secret: '98475a915d49f2420891c0cb97b37fc8'}));
  app.use(flash());
  //app.use(express.session({key: 'express.sid', cookie: { maxAge: hour * 24,
  // secure: true }}));
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});


// NOTE(mj): Maybe comment this part for production?
app.configure('development', function(){
  app.use(express.errorHandler());
});


var dummyUser  = {
	userName : 'mukundjha@gmail.com',
	firstName : 'Mukund',
	lastName : 'Jha',
	userId : '8823n3nh38302kk23',
	profileImageUrl : "http://m.c.lnkd.licdn.com/" + 
		"mpr/mprx/0_U-uG0hNlNKy8liTGRAxA0_kANPVm1LhGJKZg0_bawKaY2T" +
		"cCcqyali1hsRslKG3asAmprXM58Fxj",
	bio : "Co-Founder at Wisdomly",
};

// Defining Database

var Schema = mongoose.Schema;

// TODO(mj): Move this to another file that would contain all the schemas.
var userSchema = new Schema({
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
});

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

app.get('/', function(req, res){
	res.render('login', {
		/*user : dummyUser,
		talk : dummyTalk,
		serverAddress : "http://localhost:8002"*/
		});
});

app.post('/', function(req, res) {
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
		username : req.param('username'),
		password : req.param('password'),
		organization : req.param('organization'),
		title : req.param('title'),
		bio : req.param('bio')
	};

	authentication.saveToDB(User1, userCred);

	res.render('expert', {
						firstName : userCred.firstName,
						lastName : userCred.lastName,
						email : userCred.email,
						username : userCred.username,
						bio : userCred.bio

	});

});

app.get('/login', function(req, res) {
	res.render('login')
});

app.post('/login', function(req, res) {
	res.redirect('/expert')
});
app.get('/expert', function(req, res) {
	userCred = {
		firstName : req.param('firstName'),
		lastName : req.param('lastName'),
		email: req.param('email'),
		username : req.param('username'),
		password : req.param('password'),
		organization : req.param('organization'),
		title : req.param('title'),
		bio : req.param('bio')
	};
	res.render('expert', {
		firstName : userCred.firstName,
		lastName : userCred.lastName,
		email : userCred.email,
		username : userCred.username,
		bio : userCred.bio
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

	

		socket.on('disconnect', function(socket) {
			console.log('sleesleepsleepsleepsleepsleepsleepp');
		});
	});



server.listen(8002);