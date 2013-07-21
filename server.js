var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var app = express();

mongoose.connect('mongodb://localhost/node');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var app = express();

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
  app.use(express.session({secret:'hello'}));
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// initialize schema 
var Schema = mongoose.Schema;

var userSchema = new Schema({
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, required: true },
	username: { type: String, required: true },
	password: String}, 
    { collection : 'user' });

var User = mongoose.model('User', userSchema);

app.get('/', function(req, res){
      res.render('index', {
            title: 'Home',
        });

});

app.get('/signup', function(req, res) {
	res.render('signup', {
		title: 'Signup'
	})
});

app.post('/signup', function(req, res){

	if(signup(req.body)) {
		var user = new User();
		user.firstName = req.param('firstName');
		user.lastName = req.param('lastName');
		user.email = req.param('email');
		user.username = req.param('username');
		user.password = req.param('password');
		user.save(function (err) {
  		if (err) // ...
  		console.log('meow');
	});
	res.render('index', {
		title : user.firstname
	});
	req.session.email = user.email;
}
	else {
		res.render('index', {
			title : 'Sorry, all fields are required'
		});
	}
});

function signup(form) {
	if(form.username.length > 0 && form.email.length > 0){
		if(validateEmail(form.email)){
			if(findone('email', form.email) === null) {
				if(findone('username', form.username) === null) {
					return true;

			
				}	
			}
		}
	}

	else {
		return false;
	}
}

function findone(key, value) {
	user.findOne({key: value}, function(err, obj) {
		if (err) throw err;
		return obj;
	});
}

function validateEmail(email) { 
  // http://stackoverflow.com/a/46181/11236
  // http://jsbin.com/ozeyag/800/edit
    var re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    return re.test(email);
}



app.listen(3000);
console.log('Server running on 3000.')
