//var httpLI = require("https");
var http = require("http");
var url = require("url");
var io = require("socket.io");
var myFS = require("fs");
var crypto = require('crypto');
shasum = undefined;

function start(route, handle, QnA) {
  
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname + " received.");
    route(handle, pathname, response, request);
  }

  var myserver = http.createServer(onRequest).listen(8000);
  console.log("Server has started.");

  var io1 = io.listen(myserver);

  console.log(QnA);

  QnA.initialize(66666, io1, undefined);


  io1.sockets.on('connection', function (socket) {
  
    QnA.subscribe(socket, crypto);


    socket.emit('news', { hello: 'world' });

    socket.on('my other event', function (data) {
      console.log(data);

	  });




	});
}

exports.start = start;


/**
  var httpsOpts = {
    key: myFS.readFileSync('key.pem'),
    cert: myFS.readFileSync('cert.pem')
  };

  var secureServer = httpLI.createServer(httpsOpts, onRequest).listen(8000);
  if(secureServer){
    console.log("Secure Server Started");
  } 
**/
