var spawn = require('child_process').spawn,
				py    = spawn('docker', ['exec', '199246ef08cd', 'python' ,'/home/newTest.py', '{"width":"28","height":"28","nClass":"10","alpha":"0.01","File Name":"MNIST_data","modelID":"modelID"}', '2>/dev/null']);

py.stdout.on('data', function(data){
			dataString = data.toString();
			console.log(dataString);
		});


