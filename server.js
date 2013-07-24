var express = require('express');
var http = require('http');
var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var mime  = require('mime');
var io = require('socket.io');
var parseCookie = require('connect').utils.parseCookie;
var flash = require('connect-flash');
var app = express();
var server = http.createServer(app);

mongoose.connect('mongodb://localhost/wisdom');

var db = mongoose.connection;

app.engine('html', require('ejs').renderFile);

app.configure(function(){
  app.set('port', process.env.PORT || 4000);
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

var userSchema= new Schema({
	firstName: String,
	lastName: String,
	username: String,
	email : String,
	organization : String,
	orgtitle : String,
	notes : String,
}, {collection: 'user' });

var User = mongoose.model('User', userSchema);

app.get('/', function(req, res){
	res.render('index', {title:'a'})
});

app.post('/', function(req, res) {
	if(User.findOne({'username':req.param('username')}) != null) {
		if(User.findOne({'email':req.param('email')}) != null) {
			var user = new User();
			user.firstName = req.param('firstName');
			user.lastName = req.param('lastName');
			user.username = req.param('username');
			user.email = req.param('email');
			user.organization = req.param('organization');
			user.orgtitle = req.param('title');
			user.save(function(err) {
			if (err)
				console.log('meow')
	});
	res.render('chat',{
		firstName : user.firstName,
		title: req.session.user
		});
	res.cookie('remember', '1', { maxAge: 120000 })
	req.session.username = user.username;
	

		}
		else {
			res.render('signup', {
			title : 'Sorry, your email has already been used.'
		});
		}
	}

	else {
		res.render('signup', {
			title : 'Sorry, your username is already taken'
		});
	}
});
app.get('/expert', function(req, res) {
	res.render('expert')
});
app.get('/ej', function(req, res) {
	res.render('spectator')
});
function restrict(req, res, next) {
	if(req.session.user) {
		next();
	}
	else {
		res.render('signup', {
			title:'Sorry, you must be signed in to see this page.'
			
		});
	}
}

app.get('/chat', restrict, function(req, res) {
	res.render('chat', {title: req.session.user});
});



server.listen(4000);

var io = require('socket.io').listen(server);

usernames = {};
notes = {};
var chatData = [];
var rooms = ['room1', 'room2', 'room3']
io.sockets.on('connection', function (socket) {
	for(var i = 0; i < chatData.length; i = i + 2) {
    socket.emit('updatechat', chatData[i], chatData[i+1])
  }

	socket.on('sendchat', function (data) {
		chatData.push(socket.username);
    	chatData.push(data);
		io.sockets.emit('updatechat', socket.username, data)
	});

	socket.on('adduser', function(username) {
		socket.username = username;
		usernames[username] = username;
		socket.emit('updatechat', 'SERVER', 'you have connected');
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');

		io.sockets.emit('updateusers', usernames)
	});

	socket.on('disconnect', function() {
		delete usernames[socket.username];
		io.sockets.emit('updateusers', usernames)
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});
	socket.on('newAgenda', function(agendaItem) {
		console.log('reached server.')
		socket.emit('updateAgenda', agendaItem)
		socket.broadcast.emit('updateAgenda', agendaItem)
	});
	
	socket.on('editAgenda', function(item, data) {
		socket.emit('editTopic', item, data)
	});

	socket.on('saveNotes', function(notes) {
		notes[session.username] = userNotes;
		socket.emit('updateNotes', userNotes)
		socket.emit('timestampNote', notes)
	});
	socket.on('editTopic', function() {

	})
}); 