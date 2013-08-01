mongooseW = {
	findFirst : function(model, key, value) {
	model.findOne({key : value}, function(err, obj) {
		if(err) {
			console.log(err);
		}
		if(obj === undefined) {
			return User.find({key : value}, function(err, obj) {
				return obj;
			});
		}
		if(obj === null) {
			return null;
		}
		else {
			return obj;
		}
	});
}
};

module.exports = mongooseW;

