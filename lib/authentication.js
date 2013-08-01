authentication = {

	signupAuth : function(userCred) {
		if(mongooseW.findFirst('email', userCred.email) === null) {
	 		if(mongooseW.findFirst('username', userCred.username) === null) {
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
				}
	  	}
		}
		return null;
	},


	// paramater(user) means username or email
	loginAuth : function(user,password) {
		verifyEmail = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\.([a-zA-Z])+([a-zA-Z])+/
		if(user.length > 0 && password.length > 0) {
			if(verifyEmail.test(user)) {
			 	if(mongooseW.findone('email', user) != null){
			 		userData = mongooseW.findone('email',user);
			 		if(userData.password === password) {
			 			return userData;
			 		}

			  }
			}
			else if(mongooseW.findone('username', user) != null) {
				userdata = mongooseW.findone('username', user);
				if(userData.password === password) {
					return userData;
				}
			}  
	}
	return null;
}

}

module.exports = authentication;
