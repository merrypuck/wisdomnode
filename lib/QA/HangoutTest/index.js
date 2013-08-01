var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");
var QnAModule = require("./QnAModule");


var handle = {}
handle["/"] = requestHandlers.start;
handle["/start"] = requestHandlers.start;
handle["/upload"] = requestHandlers.upload;
handle["/show"] = requestHandlers.show;
handle["/home"] = requestHandlers.home;
handle["/hangout"] = requestHandlers.hangout;
handle["/QnAClient.js"] = requestHandlers.QnAClient;
handle["/myindex"] = requestHandlers.myindex;


server.start(router.route, handle, QnAModule);