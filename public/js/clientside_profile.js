var ProfileClient = (function() {
	return {
	mySocket : undefined,
	USER_UPDATE : "wprofile-user-update",
	USER_JOINING : "wprofile-user-joining",
	USER_LEAVING : "wprofile-user-leaving",

	init : function(socket) {

		this.mySocket = socket;
		var self = this;

		this.mySocket.on(this.USER_UPDATE, function(users) {
			self.updateSpectators(users);
		});

		this.mySocket.on(this.USER_JOINING, function(userData) {
			self.newSpectator(userData);
		});
			

		this.mySocket.on(this.USER_LEAVING, function(userId) {
			self.spectatorLeft(userId);
		});

		this.mySocket.on('a1', function(message) {

			alert(message + self.USER_UPDATE);
		});

	}

}

});