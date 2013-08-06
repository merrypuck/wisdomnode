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
var qnaModule = require('./lib/QnAModule');
var app = express();
var server = http.createServer(app);

mongoose.connect('mongodb://localhost/wisdom1');

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
  app.use(express.cookieParser('secret-code'));
  app.use(express.session({secret: 'secret-code'}));
  app.use(flash());
  //app.use(express.session({key: 'express.sid', cookie: { maxAge: hour * 24, secure: true }}));
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var Schema = mongoose.Schema;


var userSchema = new Schema({
	username : String,
	password : String
}, {collection: 'user' });

var User1 = mongoose.model('User1', userSchema);

	var cb = function(obj) {
		console.log("this is a callback " + obj.username);
	}

var dict = {'username' : 'mukund'};
console.log("Mongoose Test");
	console.log(" upper keys : " + Object.keys(User1));
	mongooseW.findFirst(User1, {'username' :'mukund'}, cb);

var io = require('socket.io').listen(server);

app.get('/', function(req, res){
	res.render('login', {

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
	

});


app.get('/signup', function(req, res) {
	
	res.render('signup', {})
});


app.post('/signup', function(req, res) {
	userCred = {
		firstName : req.param('firstName'),
		lastName : req.param('lastName'),
		email: req.param('email'),
		username : req.param('username'),
		password1 : req.param('password1'),
		password2 : req.param('password2'),
		password1 : req.param('organization'),
		password1 : req.param('orgTitle')
	};
	authentication.signupAuth(User1, userCred);
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

		socket.on('disconnect', function(socket) {
			console.log('sleesleepsleepsleepsleepsleepsleepp');
		});
		
	});
		

	res.render('expert',{
		username : req.param('username'),
		//title: req.session.user
		});
	//res.cookie('remember', '1', { maxAge: 120000 })
	//req.session.username = user.username;
});


server.listen(8002);
