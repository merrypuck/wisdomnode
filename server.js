var express = require('express');
var http = require('http');
var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var mime  = require('mime');
var io = require('socket.io');
var parseCookie = require('connect').utils.parseCookie;
var app = express();
var server = http.createServer(app);

mongoose.connect('mongodb://localhost/node');

var db = mongoose.connection;

app.engine('html', require('ejs').renderFile);

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.set('view options', {layout: false});
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('secret-code'));
  app.use(express.session({secret: 'secret', key: 'express.sid'}));
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var Schema = mongoose.Schema;

var testSchema = new Schema({
	firstName: String,
	lastName: String
}, {collection: 'test' });

var Test = mongoose.model('Test', testSchema);

app.get('/', function(req, res){
	console.log("Reading the main file.");
	res.render('chat', {sid:'hey'})
});
app.post('/', function(req, res) {
	var user = new Test();
	user.firstName = req.param('firstName');
	user.lastName = req.param('lastName');
	user.save(function(err) {
		if (err)
			console.log('meow')
	});
	res.render('index',{
		title: userData.first
		})
});
app.get('/chat', function(req, res) {
	res.render('chat');
});
app.get('/find', function(req, res) {
	res.render('find', {
		title: userData
	})
	});

app.get('/spec', function(req, res) {
	res.render('spectator');
});

app.get('/agenda', function(req, res) {
	res.render('agenda');
});
server.listen(3000);

var io = require('socket.io').listen(server);

usernames = {};
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

	socket.on('moreNotes', function(notes) {
		socket.emit('updateNotes', notes)
	})
	console.log('A socket is connected!');

	socket.on('newAgenda', function(itemId) {
		socket.broadcast.emit('updateAgenda', itemId)
	});
	console.log('A socket is connected!')
});
