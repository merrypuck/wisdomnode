var NoteClient = (function() {
	return {
		mySocket : undefined,
		UPDATE_NOTES : "wnotes-update",
		TIMESTAMP_NOTES: "wnotes-timestamp",

		init : function(socket) {
			this.mySocket = socket;
			var self = this;
			this.mySocket.on(self.TIMESTAMP_NOTES, function(message) {
				console.log(message);
				self.clientNoteStamp();
			})
		},

		updateNotes : function(notes) {
			this.mySocket.emit(this.UPDATE_NOTES, notes);
		}
	}
});