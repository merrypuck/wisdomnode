
var io = require('socket.io')

wGroupChat = { 

newChatroom : function(session) {

	return {
	userNames : [],

	chatlog : [],

	sessionId : session,

	roomId : "wchat-" + session,

	myIO : undefined,

	myDB : undefined,

	SEND_MESSAGE : "wchat-send-message",
	UPDATE_CHAT : "wchat-update-chat",
	JOIN_CHAT_UPDATE : "wchat-update-onjoin",

	init : function(IO, DB, sessionId) {
		this.myIO = IO;
		this.myDB = DB;
		this.sessionId = sessionId;
		this.roomId = "wchat-" + sessionId;
	},

	joinChatroom : function(username, socket) {
		console.log("binding sockets");
		var self = this;
		this.userNames.push(username);
		//this.myIO.join(this.roomId);
		socket.emit(this.JOIN_CHAT_UPDATE, this.chatlog);
		// Event handlers.
		socket.on(this.SEND_MESSAGE, function(message) {
			console.log("Got message " + message);
			self.updateChat(message);
		});

		socket.on('disconnect', function() {
			// VERY INEFFICIENT
			// this.userNames.splice(this.userNames.indexOf(username), 1);
		});
	},
	updateChat : function(message) {
		console.log("Recieved message " + message);
		// data.username
		// data.message
		// data.timestamp
		data = {
			username : "aaron",
			messageData : message,
			timestamp : new Date().getTime()
		};
		this.chatlog.push(data);
		this.myIO.sockets.emit(this.UPDATE_CHAT, data)
		//this.myIO.sockets.in(this.roomId).emit(this.UPDATE_CHAT, data);
	}




  } // return
}
}

module.exports = exports = wGroupChat
