//http://stackoverflow.com/questions/5924072/express-js-cant-get-my-static-files-why
//http://stackoverflow.com/questions/22709882/how-to-suppress-application-logging-messages-from-a-node-js-application-when-run

var express = require('express');
var routes = require('./routes');
var app = module.exports = express();
var cors = require('cors');

process.env.NODE_ENV = 'est';


app.use(cors({origin: true}));

app.use('/', routes);

app.use("/S3LabUploads",express.static('S3LabUploads'));

var server = app.listen(8888, function () {
	console.log('App listening on port 8888!');
});

// socket part 
/*var io = require('socket.io').listen(server);

io.on('connection',function(socket) {
	socket.emit('test','testFromServer2');
});

without splitting in files
*/

// http://stackoverflow.com/questions/9709912/separating-file-server-and-socket-io-logic-in-node-js
var io = require('./socketRoutes').listen(server);


