2
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
	CHANGE_MAIN_TOPIC : "wagenda-change-main-topic",

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

		socket.on(this.CHANGE_MAIN_TOPIC, function(topicId) {
			self.changeMainTopic(topicId);
		});

	},

	changeMainTopic : function(topicId) {
		var self = this;
		socket.emit(this.CHANGE_MAIN_TOPIC, topicId);
	}

  }
	

	}
}