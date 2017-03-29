var spawn = require('child_process').spawn,
				py    = spawn('docker', ['exec','199246ef08cd', 'date']);

py.stdout.on('data', function(data){
			dataString = data.toString();
			console.log(dataString);
		});


