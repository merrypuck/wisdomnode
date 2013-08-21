
var io = require('socket.io')

wSupportModule = {
		myIO: undefined,
		adminInfo: undefined,   //{admin usrID , admin socketID}
		curUsers: {},  // key: userID val: socketID

		//not using logs for now
		supportLogs: {
		},

		USERSUBSCRIBE: "user-subscribe-support",
		ADMINSUBSCRIBE: "admin-subscribe-support",
		NEWMSGFROMUSER: "user-sent-support-newmsg",
		NEWMSGFROMADMIN: "admin-sent-support-newmsg",
		
		init: function(socket){
			console.log("initializing support module!"+socket);
			this.myIO=socket;
			console.log(socket.id);
		},

		userSubscribe: function(msg,socketid){   //send msg with userID when subscribe
			//user subcribe to support module
			console.log('step 2: user subscribe');
			var self = this;
			var userID = msg.userID;
			console.log("puting pair: "+userID+", "+socketid);
			this.curUsers[userID] = socketid;
			var socket = this.myIO.sockets.socket(socketid);

			socket.on(self.NEWMSGFROMUSER, function(msg){
				self.userSendMsg(msg); 	
			});

			//send user subscribe msg to admin page
			var adminSocket = this.myIO.sockets.socket(self.adminInfo.socketid);
			console.log('sending user subscribe event '+userID);
			adminSocket.emit("create-conversation",{userID: userID});
		},

		adminSubscribe : function(msg,socketid){
			//admin subcribe to support module
			var self = this;
			console.log("admin linking!!");
			var userID = msg.userID;
			this.adminInfo = {
				userID:userID,
				socketid:socketid
			};
			var adminSocket = this.myIO.sockets.socket(socketid);
			adminSocket.on(self.NEWMSGFROMADMIN,function(msg){
				console.log("got msg from admin!");
				self.adminSendMsg(msg);
			});
		},

		adminSendMsg: function(msg){
			//send msg content to socket refered by userID in curUsers dictionary
			//send msg to userID
			//data = {userID: userID, content: msg},
			console.log("adminSendMsg: msg is : "+ msg.toUser + msg.payload);
			var socketid = this.curUsers[msg.toUser];
			this.myIO.sockets.socket(socketid).emit(this.NEWMSGFROMADMIN,msg);
		},

		userSendMsg: function(msg){   //here msg from user contains its userID
			var self = this;
			console.log('server side user send msg, event: ');
			var adminSocket = this.myIO.sockets.socket(this.adminInfo.socketid);
			adminSocket.emit(self.NEWMSGFROMUSER,msg);
		}
	}

module.exports = exports = wSupportModule