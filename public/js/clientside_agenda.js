var AgendaClient = (function() {
	return {
		mySocket : undefined,

		CREATE_AGENDA : "wagenda-create",
		CHANGE_MAIN_TOPIC : "wagenda-change-main-topic",

		init : function(socket) {

			this.mySocket = socket;
			var self = this;

			this.mySocket.on(this.CREATE_AGENDA, function(topics) {
				self.createAgenda(topics);
			});
		},

		changeMainTopic : function(topicId) {
			console.log(topicId);
			this.mySocket.emit(this.CHANGE_MAIN_TOPIC, topicId);
		}

};
});


