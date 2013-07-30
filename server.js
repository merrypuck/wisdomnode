var express = require('express');
var http = require('http');
var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var mime  = require('mime');
var io = require('socket.io');
var parseCookie = require('connect').utils.parseCookie;
var flash = require('connect-flash');
var groupchat = require('./lib/groupchat')
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
var io = require('socket.io').listen(server);
app.get('/', function(req, res){
	res.render('login', {

	})
});

app.post('/', function(req, res) {
	var thisSession = wGroupChat.newChatroom(req.param('sessionNum'));
	thisSession.init(io, 'blankForNow', req.param('sessionNum'));

	io.sockets.on('connection', function(socket) {
		thisSession.joinChatroom(req.param('username'), socket);
		socket.emit('connectionAlert', 'connected!');
	});

	res.render('expert',{
		username : req.param('username'),
		//title: req.session.user
		});
	//res.cookie('remember', '1', { maxAge: 120000 })
	//req.session.username = user.username;
});


server.listen(4000);