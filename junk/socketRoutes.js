/* Different socket events defined here 
	 
	 Currently only 1 event is there which is for training MNIST dataset when file upload happens. 
	 If we need to add further events based on file upload we can specify in parameters field 
	 what type of event it is and then route it to relevant code. 
*/

var socketio = require('socket.io');
var dl = require('delivery');
var fs = require('fs');
var helper = require('./helperFunctions');
var database = require('./databaseFunctions');
var uuid = require('node-uuid');

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
					var py = spawn('python',['newTest.py'],{cwd : "./S3LabUploadsSocket"});

					var hasCrashed = false;
					var UUID = uuid.v4();
					var dataString = "";

					helper.logExceptOnTest("Process started with PID : "+py.pid+" and UUID "+UUID);
					database.onJobCreationDB(UUID,py.pid);

					params["File Name"]=helper.noExtension(file.name);
					params["modelID"] = UUID;
					data = JSON.stringify(params);
					helper.logExceptOnTest("Sending : "+data);

					py.stdin.write(JSON.stringify(data));
					py.stdin.end();

					py.stdout.on('data',function(pySTDOut) {
						helper.logExceptOnTest("python STDOUT : "+pySTDOut.toString());
						dataString = pySTDOut.toString();
						socket.emit('/trainingSocket/result',pySTDOut.toString());
					});

					py.stderr.on('data',function(err) {
						helper.logExceptOnTest("python STDERR : "+err);
					})

					py.stdout.on('end',function() {
						var modelPath = "/S3LabUploadsSocket/"+helper.noExtension(file.name)+"_"+UUID+".ckpt";
						var accuracyValue = "dummyForNow";

						//skip things below if process was killed, 
						try {
							accuracyValue = JSON.parse(dataString);
							//helper.logExceptOnTest("a - "+accuracyValue);
							accuracyValue = accuracyValue[accuracyValue.length-1]['Accuracy'];
						}
						catch (err) {
							helper.logExceptOnTest("error : "+err);
							accuracyValue = "null";
						}
						
						
						if(!hasCrashed) {
							database.onProcessSucessDB(accuracyValue,modelPath,UUID,py.pid);
						}
						else {

						}
					});
				}
			});
		});

	});
}