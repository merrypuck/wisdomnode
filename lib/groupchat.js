
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
		socket.join(this.roomID);
		this.socket = socket;

		console.log("binding sockets");
		var self = this;
		this.userNames.push(username);
		//this.myIO.join(this.roomId);
		socket.emit(this.JOIN_CHAT_UPDATE, this.chatlog);
		// Event handlers.
		socket.on(this.SEND_MESSAGE, function(data) {
			console.log("Got message " + JSON.stringify(data));

			self.updateChat(data);
		});

		socket.on('disconnect', function() {
			// VERY INEFFICIENT
			// this.userNames.splice(this.userNames.indexOf(username), 1);
		});
	},
	
	updateChat : function(data) {
		var self = this;
		// data.username
		// data.message
		// data.timestamp
		console.log(data);
		if(data.payload.length <= 250 ) { 
		chatData = {
			username : data.firstName ,
			messageData : data.payload,
			timestamp : new Date().getTime()
		};
		this.chatlog.push(chatData);
		self.myIO.sockets.in(self.roomID).emit(this.UPDATE_CHAT, chatData);
		//this.myIO.sockets.in(this.roomId).emit(this.UPDATE_CHAT, data);
	}
	else {
		console.log('Error: messageData length is over 250.');
	}
	}
  } // return
}
}

module.exports = exports = wGroupChat
