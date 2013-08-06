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
var mongooseWrapper = require('./lib/mongooseWrapper');
var authentication = require('./lib/authentication');
var authentication = require('./lib/authentication');
var qnaModule = require('./lib/QnAModule');
var nodestatic = require('node-static');


// Configuration settings.
var app = express();
var server = http.createServer(app);

var fileServer = new nodestatic.Server(__dirname + '/public/static');

mongoose.connect('mongodb://localhost/wisdomDB');

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
	dateOfBirth : Number, // Why is this important?
	username: String,
	email : String,
	password : String, // Store the hash here.
	organization : String,
	orgtitle : String,
	profileImageUrl : String,
	// Contains the unique identifier for the user for now same as _id.
	userId : String, 
	// Stores information related to LinkedIn profile.
	linkedInProfile : 
	  {
	  	profileUrl : String
	  }

}, {collection: 'users' });

var User = mongoose.model('User', userSchema);

var io = require('socket.io').listen(server);

//User.findOne({'firstName' : firstName}, function(err, obj) {
//	console.log(JSON.stringify(obj))
//});

var dummyTalk = {
	talkId : '883nnew39231nn321',
	talkTitle : 'Waste Management in Urban settings.',
	startTime : 1375763389,
	status : 'LIVE', // this should be an enum.
	info : {numSpeakers : 3},
}

app.get('/', function(req, res){
	//var mobj = mongooseW.findFirst(User, 'firstName','aaron');
	//console.log('toObject version: ' + mobj.toObject());
	res.render('test_talk', {
		user : dummyUser,
		talk : dummyTalk,
		serverAddress : "http://localhost:8002"
	});
});

app.post('/', function(req, res) {
	userCred = {
		firstName : req.param(firstName),
		lastName : req.param(firstName),
		dob : req.param(dob),
		email: req.param(email),
		username : req.param(username),
		password1 : req.param(password1),
		password2 : req.param(password2),
		password1 : req.param(organization),
		password1 : req.param(orgTitle)
	};
	if(authentication.signupAuth(userCred) === null) {
		res.render('signup', {

		});
	}

	
	else {
		authentication.signupAuth(userCred);
		res.render('expert');
	};

});

app.get('/signup', function(req, res) {
	
	res.render('signup', {})
});
app.post('/signup', function(req, res) {

});

app.get('/expert', function(req, res) {
	res.render('expert', {
		username : 'aa'
	});
});
 app.post('/expert', function(req, res) {
	//initalize chat session
	var thisChatSession = wGroupChat.newChatroom(req.param('sessionNum'));
	thisChatSession.init(io, 'blankForNow', req.param('sessionNum'));

	//initialize note session
	var thisNoteSession = wNotes.newNote(req.param('sessionNum'));
	thisNoteSession.init(io, 'blankForNow', req.param('sessionNum'));

	//initialize agenda session
	var thisAgendaSession = wAgenda.newAgenda(req.param('sessionNum'));
	thisAgendaSession.init(io, 'blankForNow', req.param('sessionNum'));

	//initialze qa session
	qnaModule.initialize(req.param('sessionNum'), io, 'blankForNow');

		for(var i = 0; i < req.param('topicAmt'); i++) {
			topic = req.param('topic' + i.toString());
			thisAgendaSession.addTopic(topic);
		};

		io.sockets.on('connection', function(socket) {
		
		//Connect to chatroom with username and socket
		thisChatSession.joinChatroom(req.param('username'), socket);
		
		//Connect to notes with username and socket
		thisNoteSession.joinNotes(req.param('username'), socket);

		//Connect to Agena with username and socket
		thisAgendaSession.joinAgenda(socket);

		//Connect 
		qnaModule.subscribe(socket);
		
	});

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


server.listen(8002);
