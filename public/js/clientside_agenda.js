var AgendaClient = (function() {
	return {
		mySocket : undefined,

		CREATE_AGENDA : "wagenda-create",

		init : function(socket) {

			this.mySocket = socket;
			var self = this;

			this.mySocket.on(this.CREATE_AGENDA, function(topics) {
				self.createAgenda(topics);
			});
		}

};
});


