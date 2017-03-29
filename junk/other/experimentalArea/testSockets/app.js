var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(9090);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log("here");
  socket.emit('news','thisisfromservertoclient');
  socket.on('my other event', function (data) {
    console.log(data);
  });
});