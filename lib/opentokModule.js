var opentok = require('opentok');

"use strict";

function OTModule(apikey, apisecret){
	this._OTObj = new opentok.OpenTokSDK(apikey, apisecret);
	console.log("Open Tok Object is : " + JSON.stringify(this._OTObj));
	this._OTsessionID = 0;

	this.OTEVENT = {
		NEWSUBSCRIBER : "ot-new-subscriber",
		NEWTOKEN : "ot-new-token"
	}

}

OTModule.prototype.subscribe = function fn3(socket){
	this._socket = socket;
	var self = this;

	if(this._OTsessionID === 0){
		console.log("New Session being created!!");
		this.createSessionID('localhost','enabled');
	}

	socket.on(this.OTEVENT.NEWSUBSCRIBER, function(data){
		console.log("Receiving a new subscriber....");
		
		var newtoken = self.generateNewToken(data['role'], "userID : data['userID'], username : data['username']");
		
		data['socket'].emit(self.OTEVENT.NEWTOKEN, {token : newtoken});
	});
}

OTModule.prototype.createSessionID = function fn1(loc, peer){
	var self = this;
	self._OTsessionID = '';

	this._OTObj.createSession(loc, function(sessionID){
		self._OTsessionID = sessionID;
		console.log("The session ID that was created is : " + sessionID);
	});

	console.log("Callback for creating session not CALLING BACK...");
}

OTModule.prototype.generateNewToken = function fn2(tokrole, meta){

	return this._OTObj.generateToken({
									session_id : this._OTsessionID, 
									role : tokrole, 
									connection_data : meta });
}

module.exports = exports = OTModule