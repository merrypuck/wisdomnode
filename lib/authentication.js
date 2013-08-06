authentication = {

	signupAuth : function(model, userCred) {

		var don = function(obj) {
			console.log(obj)
		};

		mongooseW.findFirst(model, {username : 'mukund'}, don);
			/**console.log(userCred);
	 		if(mongooseW.findFirst(model, {username : userCred.username}) === null) {
	  			if(userCred.password1 === userCred.password2) {
		  			user = new User();
		  			user.firstName = userCred.firstName;
		  			user.lastName = userCred.lastName;
		  			user.dob = userCred.dob;
		  			user.email = userCred.email;
		  			user.username = userCred.username;
		  			user.password = userCred.password1;
		  			user.organization = userCred.organization;
		  			user.orgTitle = userCred.orgTitle;
		  			user.save(function(err) {
						if (err){
						
					}
		
					});
*/
					//res.render('expert', {
					//	username : userCred.username
					//});
						},

	  	//}
		//}
		//return null;
	//},


	// paramater(user) means username or email
	loginAuth : function(user,password) {
		console.log(user + password);
		verifyEmail = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\.([a-zA-Z])+([a-zA-Z])+/
		if(user.length > 0 && password.length > 0) {
			if(verifyEmail.test(user)) {
			 	if(mongooseW.findFirst('email', user) != null){
			 		userData = mongooseW.findFirst('email',user);
			 		if(userData.password === password) {
			 			return userData;
			 		}

			  }
			}
			else if(mongooseW.findFirst('username', user) != null) {
				userdata = mongooseW.findFirst('username', user);
				if(userData.password === password) {
					return userData;
				}
			}  
	}
	return null;
}

}

module.exports = authentication;
