var socketio = require('socket.io');

module.exports.listen = function(server) {
	io = socketio.listen(server);

	io.on('connection',function(socket) {
		socket.emit('test','testFromServer2 different file');
	});
}