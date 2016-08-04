/* Socket client code for training the MNIST dataset */ 

var io  = require('socket.io-client'),
		dl  = require('delivery'),
		fs  = require('fs'),
		helper = require('./helperFunctions');

var socket = io.connect('http://0.0.0.0:8888');

socket.on( 'connect', function() {
	console.log( "Sockets connected" );
		
	delivery = dl.listen( socket );
	delivery.connect();
	
	delivery.on('delivery.connect',function(delivery){
		delivery.send({
			name: 'MNIST_data.zip',
			path : './MNIST_data.zip',
			params : {width : "28",height : "28", nClass : "10", alpha : "0.01"}
		});

		//socket.disconnect();
		//socket.connect();
 
		delivery.on('send.success',function(file){
			console.log('File sent successfully!');
		});
	});
});

socket.on('/trainingSocket/result',function(data) {
	helper.logExceptOnTest("On /trainingSocket/result socket endpoint : "+data);
});



