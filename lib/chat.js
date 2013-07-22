var usernames = {};
var chatData = [];
var rooms = ['room1', 'room2', 'room3'];

io.sockets.on('connection', function (socket) {
	for(var i = 0; i < chatData.length; i = i + 2) {
    socket.emit('updatechat', chatData[i], chatData[i+1])
  }

	socket.on('sendchat', function (data) {
		chatData.push(socket.username);
    	chatData.push(data);
		io.sockets.emit('updatechat', socket.username, data)
	});

	socket.on('adduser', function(username) {
		socket.username = username;
		usernames[username] = username;
		socket.emit('updatechat', 'SERVER', 'you have connected');
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');

		io.sockets.emit('updateusers', usernames)
	});

	socket.on('disconnect', function() {
		delete usernames[socket.username];
		io.sockets.emit('updateusers', usernames)
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});
