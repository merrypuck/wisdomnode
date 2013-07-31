
var io = require('socket.io')

wNotes = {
newNote : function(session) {

  return {

	notelog : {},

	sessionId : session,

	roomId : "wnotes-" + session,

	myIO : undefined,

	myDB : undefined,

	UPDATE_NOTES : "wnotes-update",
	TIMESTAMP_NOTES: "wnotes-timestamp",

	init : function(IO, DB, sessionId) {
	  this.myIO = IO;
	  this.myDB = DB;
	  this.sessionId = sessionId;
	  this.roomId = "wnotes-" + sessionId;

	},

	joinNotes : function(username, socket) {
	  var self = this;
	  this.notelog[username] = [];
	  socket.on(this.UPDATE_NOTES, function(notes) {
		self.updateNotes(username, socket, notes);
		});
	},

	updateNotes : function(username, socket, notes) {
	  var self = this;

	  self.notelog[username].push({
		"notes" : notes,
		"timestamp" : new Date().getTime() 

		});

	  socket.emit(this.TIMESTAMP_NOTES, 'dummy message');

		
	}

		
	}
}

}