var https = require("https");
var http = require("http");
var url = require("url");
var io = require("socket.io");
var myFS = require("fs");


function start(route, handle, QnAModule) {
  
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname + " received.");
    route(handle, pathname, response, request);
  }

  var options = {
    key: myFS.readFileSync('key.pem'),
    cert: myFS.readFileSync('cert.pem')
  };

  var myserver = https.createServer(options, onRequest).listen(80);
  console.log("Server has started.");

  var io1 = io.listen(myserver);

  QnAModule.initialize(66666, io1, undefined);


  io1.sockets.on('connection', function (socket) {
  
    QnAModule.subscribe(socket);


    socket.emit('news', { hello: 'world' });

    socket.on('my other event', function (data) {
      console.log(data);

	  });
    
  });

}

exports.start = start;