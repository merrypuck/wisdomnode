
var io = require('socket.io');

wprofile = {
newProfile : function(session) {
	return {

	spectators : [],

	sessionId : session,

	roomId : "wprofile-" + session,

	myIO : undefined,

	myDB : undefined,

	USER_UPDATE : "wprofile-user-update",
	USER_JOINING : "wprofile-user-joining",
	USER_LEAVING : "wprofile-user-leaving",

	init : function(IO, DB, sessionId) {
		this.myIO = IO;
		this.myDB = DB;
		this.sessionId = sessionId;
		this.roomId = "wprofile-" + sessionId;
	},

	joinSpectators : function(socket) {
		socket.join(this.roomID);
		var self = this;
		socket.on(this.USER_UPDATE, function(userData) {
			var users = self.spectators;
			socket.userId = userData.userId;
			socket.emit(self.USER_UPDATE, users);
			if(users.length > 0) {
				for(var user in users){
					if(users[user].userId != userData.userId) {
						self.spectators.push(userData);
					}
				}
				socket.broadcast.to(self.roomID).emit(self.USER_JOINING, userData);
			}
			else {
				self.spectators.push(userData);
			}
			//only for this user 
			//socket.emit('a1', 'step3...');
			//console.log('step2, saving userData in db and sending to other users: '  + JSON.stringify(userData));
		});
		
		

		//only for other users 
		//socket.emit(USER_JOINING, users, userData);

		
	},
	updateSpectators : function(username) {
		self.myIO.sockets.in(self.roomID).emit(this.USER_LEAVING, username);
	},

	userLeaving : function(socket) {
		var self = this;
		console.log('step2 ' + socket.userId + ' just left the room!');
		users = this.spectators;
		console.log('position of user who left in list');
		for(var user in users) {
			if(users[user].userId === socket.userId) {
				this.spectators.splice(user, 1);
			}
		};
		socket.broadcast.to(self.roomID).emit(this.USER_LEAVING, socket.userId);
		socket.broadcast.emit(this.USER_LEAVING, socket.userId);
				
			}
		}
		socket.broadcast.to(self.roomID).emit(this.USER_LEAVING, socket.userId);
		
	

	}


	}

