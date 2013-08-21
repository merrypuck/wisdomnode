var SupportClient = (function() {
	return {
		mySocket : undefined,
		USERSUBSCRIBE: "user-subscribe-support",
		ADMINSUBSCRIBE: "admin-subscribe-support",
		NEWMSGFROMUSER: "user-sent-support-newmsg",
		NEWMSGFROMADMIN: "admin-sent-support-newmsg",

		tmplt : {
			supportconversation: [
				'<div id="support-${userID}" class="supportconversation">','</div>',
					'<div class="inputComponent"><input id="supportchatdata-${userID}" placeholder="compose message..."><input id="supportenterchat-${userID}" class="entersupport" type="button" value="SEND" />'
					
			].join(""),
			message: [
				'<div class="chatmessagebox"><div class="sender">${sender}:</div><div class="msg">${message}</div><div class="msgtime">${time}</div></div>'
			].join("")
		},

		initUser : function(socket,wisdom) {
			this.mySocket = socket;
			var self = this;
			
			//subscribe
			this.mySocket.emit(self.USERSUBSCRIBE,{userID:wisdom.user.firstName});

			//init listener
			this.mySocket.on(self.NEWMSGFROMADMIN, function(msg) {
				//function to render view
				console.log("new msg from admin: "+JSON.stringify(msg));
				self.insertMessage("Admin",msg.toUser,msg.payload,true);
			});
		},

		initAdmin: function(socket,wisdom) {
			console.log("initializing admin!!!!");
			this.mySocket = socket;
			var self = this;
			//subscribe
			this.mySocket.emit(self.ADMINSUBSCRIBE,{userID:wisdom.user.userID});

			// console.log("The session ID is : " + JSON.stringify(socket.socket));

			this.mySocket.on(self.NEWMSGFROMUSER,function(msg){
				//function to render view
				console.log("got msg form user! : "+JSON.stringify(msg));
				self.insertMessage(msg.firstName,msg.firstName,msg.payload,true);
			});	

			//register listener :do something when user subscribe to support
			this.mySocket.on("create-conversation",function(data){
				console.log("new user subcribing!");
				self.addConversationWithUserID(data.userID);
			});
		},

		// updateHTML: function(msg){
		// 	//overide by user   basically render the view
		// 	console.log("got msg from server!!" + msg.fromUser);
		// 	if (msg.fromUser!=undefined){
		// 		//this is a message from user!
				
		// 	} else {
		// 		//this is a message from admin
		// 		$(".supportMsgBox").append("<div>Admin:</div>");
		// 		$(".supportMsgBox").append("<div>"+msg.payload+"</div>");
		// 	}
			
		// },

		userSendMessage : function(msg) {
			// data = {
			// 	fromUserID:  
			// 	payload:
			// }
			var self = this;
			this.mySocket.emit(self.NEWMSGFROMUSER, msg);
		},

		adminSendMessage : function(msg) {
			// data = {
			// 	toUser:  
			// 	payload:
			// }
			var self = this;
			// display msg on admin's page
			self.insertMessage(wisdom.user.firstName,msg.toUser,msg.payload,true);
			
			console.log("adminSendMessage: sending mesg from admin");
			this.mySocket.emit(self.NEWMSGFROMADMIN, msg);
		},

		addConversationWithUserID: function(userID){
			if($('#support-'+userID).length == 0){
			$.tmpl(this.tmplt.supportconversation, { userID: userID }).appendTo('#rightBar');
			}
			//add click event listener
			$('.entersupport').click(function(){
			var user = $(this).attr("id").split('-')[1];
			var msg = $('#supportchatdata-'+user).val();
			$('#supportchatdata-'+user).val('');
			var data = {
				toUser : user,
				payload : msg
			}
			console.log(JSON.stringify(data));
			newSupport.adminSendMessage(data);
		})

		},

		insertMessage: function(sender,user,message,showTime){
			var $html = $.tmpl(this.tmplt.message, {
				sender: sender,
				message: message,
				time: showTime ? this.getTime() : ''
			});

			$html.appendTo('#support-'+user);
			// $('.chat-messages').animate({ scrollTop: $('.chat-messages ul').height() }, 100);
		
		},

		// return a short time format for the messages
		getTime: function (){
			var date = new Date();
			return (date.getHours() < 10 ? '0' + date.getHours().toString() : date.getHours()) + ':' +
					(date.getMinutes() < 10 ? '0' + date.getMinutes().toString() : date.getMinutes());
		}

		}

		
});