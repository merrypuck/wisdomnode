var express = require('express');
var http = require('http');
var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var mime  = require('mime');
var io = require('socket.io');
var parseCookie = require('connect').utils.parseCookie;
var flash = require('connect-flash');
var everyauth = require('everyauth');
var app = express();


var server = http.createServer(app);


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
  app.use(everyauth.middleware(app));
  app.use(flash());
  //app.use(express.session({key: 'express.sid', cookie: { maxAge: hour * 24, secure: true }}));
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});



