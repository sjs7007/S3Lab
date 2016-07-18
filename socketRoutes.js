var socketio = require('socket.io');
var dl = require('delivery');
var fs = require('fs');
var helper = require('./helperFunctions');

module.exports.listen = function(server) {
	io = socketio.listen(server);

	io.on('connection',function(socket) {
		console.log("Connection made : "+Date.now());
		socket.emit('test','testFromServer2 different file');

		var delivery = dl.listen(socket);
		delivery.on('receive.success', function(file) {
			//use the params in helping different kind of tasks if needed 
			// later
			var params = file.params; 
			//helper.logExceptOnTest("params : "+params);
			//helper.logExceptOnTest("pram foo : "+params.foo);
			helper.logExceptOnTest("width : "+params.width+" , height : "+params.height);
			fs.writeFile("./S3LabUploadsSocket/"+file.name,file.buffer,function(err) {
				if(err) {
					helper.logExceptOnTest("deliveryJS : file couldn't be saved");
				}
				else {
					helper.logExceptOnTest("deliveryJS, file saved : "+file.name);
					
					var spawn = require('child_process').spawn;
					var py = spawn('python',['trainingSocket.py']);

					py.stdout.on('data',function(pySTDOut) {
						helper.logExceptOnTest("python STDOUT : "+pySTDOut.toString());
						socket.emit('/trainingSocket/result',pySTDOut.toString());
					});
				}
			});
		});

	});
}