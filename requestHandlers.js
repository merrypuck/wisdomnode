function start() {
	console.log("Request handler 'start' was called.");

}

function upload() {
	console.log("Request handler 'upload' was called.");
	return "Hello Upload";
}

exports.starte = start;
exports.upload = upload;