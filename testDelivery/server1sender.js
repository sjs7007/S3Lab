var io  = require('socket.io-client'),
    dl  = require('delivery'),
    fs  = require('fs');

var socket = io.connect('http://0.0.0.0:5002');

socket.on( 'connect', function() {
  console.log( "Sockets connected" );

  socket.emit('testSocket',"testing sockets in node.js");
		
  delivery = dl.listen( socket );
  delivery.connect();
	
  delivery.on('delivery.connect',function(delivery){
    delivery.send({
      name: 'sample-image.jpg',
      path : './sample-image.jpg'
    });

    socket.disconnect();
    //socket.connect();
 
    delivery.on('send.success',function(file){
      console.log('File sent successfully!');
    });
  });
	
});


