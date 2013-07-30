var ChatClient = (function() {
	return {
		mySocket : undefined,
		SEND_MESSAGE : "wchat-send-message",
		UPDATE_CHAT : "wchat-update-chat",
		JOIN_CHAT_UPDATE : "wchat-update-onjoin",


		init : function(socket) {
			
			this.mySocket = socket;

			this.mySocket.on(JOIN_CHAT_UPDATE, function(chatlog) {
				joinChat(chatlog);
			});

			this.mySocket.on(UPDATE_CHAT, function(username, message) {
				updateChat(username, message);
			});


		}
	}

	function()
})