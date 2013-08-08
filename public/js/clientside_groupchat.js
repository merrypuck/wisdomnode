var ChatClient = (function() {
	return {
		mySocket : undefined,
		SEND_MESSAGE : "wchat-send-message",
		UPDATE_CHAT : "wchat-update-chat",
		JOIN_CHAT_UPDATE : "wchat-update-onjoin",

		displayChat : function() {
			// TO BE OVERWRITTEN BY USER.
		},

		joinChat : function() {
			// Overwrite this function.
		},

		init : function(socket, wisdom) {
			this.mySocket = socket;
			var self = this;

			this.mySocket.on(this.JOIN_CHAT_UPDATE, function(chatlog) {
				self.joinChat(chatlog);
			});

			this.mySocket.on(this.UPDATE_CHAT, function(data) {
				self.displayChat(data.username, data.messageData);
			});
		},

		sendMessage : function(data) {
			console.log('freakign out ' + JSON.stringify(data));
			this.mySocket.emit(this.SEND_MESSAGE, data);
		}
	};
});