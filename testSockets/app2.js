var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var count = 0;

server.listen(9090);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log("here 2");
  	var spawn = require('child_process').spawn;
  	var py = spawn('python',['test.py']);

  	py.stdout.on('data',function(pyStdout) {
  		console.log("godyt data count : "+count++)
  		console.log(pyStdout.toString());
  		socket.emit('pythonSocket',pyStdout.toString());
  	});

  	//to stop process 
  	socket.on("pause",function() {
  		console.log("pausing pid : "+py.pid);
  		socket.emit("pythonSocket","pausing pid : "+py.pid);
  		process.kill(py.pid,"SIGTSTP");
  	});

  	//to resume process
  	socket.on("continue",function() {
  		console.log("resuming pid : "+py.pid);
  		socket.emit("pythonSocket","resuming pid : "+py.pid);
  		process.kill(py.pid,"SIGCONT");
  	});	
  
});