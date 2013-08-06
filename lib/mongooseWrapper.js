mongooseW = {
	findFirst : function(model, dict, callback) {
	//console.log("unmae = " + dict.username);
	//console.log(JSON.stringify(dict) + 'keys : ' + Object.keys(model));
	model.findOne(dict, function(err, obj) {
	//model.findOne({'username' : 'mukund'}, function(err, obj) {	
		if(err) {
			console.log(err);
		}
		else if(obj === undefined) {
			console.log('hello undefined ')
			cobj = 'undefined';
			}
		
		if(obj === null) {
			console.log('hello null')
			cobj = 'null';
		}
		else {
			callback(obj.toObject());
			/*cobj = JSON.parse(JSON.stringify(obj));
			console.log('hello ')
			console.log('findFirst username: ' + cobj.username);
			return cobj;*/
		}
	});
}
};

module.exports = mongooseW;

