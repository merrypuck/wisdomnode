var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable");

var nodestatic = require('node-static');
var fileServer = new nodestatic.Server(__dirname + '/tmp');


function home(response, request){

  console.log("Request handler 'Home' was called.")

  var homeBody = "<script src=\"/socket.io/socket.io.js\"></script> <script> var socket = io.connect(\'http://ec2-54-218-74-52.us-west-2.compute.amazonaws.com:8888\'); socket.on(\'news\', function (data) {console.log(data); socket.emit(\'my other event\', { my: \'data\' }); var kevin = document.getElementById(\"mukund\"); kevin.innerHTML = data[\'hello\']; }); </script> <html> <div id=\"mukund\"> </div> </html>";

	response.writeHead(200, {"Content-Type": "text/html"});
	response.write(homeBody);
	response.end();

}

function start(response) {
  console.log("Request handler 'start' was called.");

  var body = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" '+
    'content="text/html; charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    '<form action="/upload" enctype="multipart/form-data" '+
    'method="post">'+
    '<input type="file" name="upload" multiple="multiple">'+
    '<input type="submit" value="Upload file" />'+
    '<script>'+
    'console.log("Landy BABBBBB");'+
    '</script>'+
    '</form>'+
    '</body>'+
    '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

function upload(response, request) {
  console.log("Request handler 'upload' was called.");

  var form = new formidable.IncomingForm();
  console.log("about to parse");
  form.parse(request, function(error, fields, files) {
    console.log("parsing done");

    /* Possible error on Windows systems:
       tried to rename to an already existing file */
    fs.rename(files.upload.path, "/tmp/test.png", function(err) {
      if (err) {
        fs.unlink("/tmp/test.png");
        fs.rename(files.upload.path, "/tmp/test.png");
      }
    });
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write("received image:<br/>");
    response.write("<img src='/show' />");
    response.end();
  });
}

function show(response) {
  console.log("Request handler 'show' was called.");
  response.writeHead(200, {"Content-Type": "image/png"});
  fs.createReadStream("/tmp/test.png").pipe(response);
}

function hangout(response, request){
    
  fileServer.serveFile('/mysimplehangoutapp.xml', 500, {}, request, response);

  /**
  response.writeHead(200, {"Content-Type": "text/xml"});
  fs.readFile(__dirname + '/tmp/simpleHangoutApp.xml', 'utf8', function(err, data) {
        if(err) 
        {
          return console.log(err);
        }
        response.write(data);
        });
    response.end();**/

}

exports.start = start;
exports.upload = upload;
exports.show = show;
exports.home = home;
exports.hangout = hangout;

