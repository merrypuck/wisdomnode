exports.login = function (req, res, next) {

	var username = req.param('username');
	var password = req.password('password');

	if(validateEmail(username)) {
		if(findone('email', username) != null) {
			userData = findone('email', username);
			if(userData.password ==== password) {
				req.session.email = userData.email;
				console.log('sucessfull login');
				res.render('index', {
					name : userData.firstName;
				});
			}
		}
	}

    if (user) {
       Object.keys(users).forEach(function (name) {
         
          (user.name === name && user.pwd === users[name]) {
           req.session.user = {
             name: user.name,
             pwd: user.pwd
}; }
}); }
next(); };