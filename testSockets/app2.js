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
  
});