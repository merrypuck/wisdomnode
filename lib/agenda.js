
var io = require('socket.io')

wAgenda = { 

newAgenda : function(session) {
  
  return {

  	topics : [],

  	sessionId : session,

	roomId : "wchat-" + session,

	myIO : undefined,

	myDB : undefined,

	CREATE_AGENDA : "wagenda-create",

	init : function(IO, DB, sessionId) {
		this.myIO = IO;
		this.myDB = DB;
		this.sessionId = sessionId;
		this.roomId = "wchat-" + sessionId;
	},

	addTopic : function(topic) {
		self = this;
		this.topics.push(topic);
	},

	
	joinAgenda : function(socket) {
		var self = this;
		socket.emit(this.CREATE_AGENDA, this.topics);


	}

  }
	

	}
}