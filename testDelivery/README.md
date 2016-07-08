Start the receiver server and then run the sender server file. sample-image.jpg will be sent and stored as testName. 

Code on sender server 
```
var io  = require('socket.io-client'),
    dl  = require('delivery'),
    fs  = require('fs');

var socket = io.connect('http://0.0.0.0:5002');

socket.on( 'connect', function() {
  console.log( "Sockets connected" );
		
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


```

Code on receiver server
```
var io  = require('socket.io').listen(5002),
    dl  = require('delivery'),
    fs  = require('fs');

io.sockets.on('connection', function(socket){
  
  var delivery = dl.listen(socket);
  delivery.on('receive.success',function(file){
		
    fs.writeFile("testName", file.buffer, function(err){
      if(err){
        console.log('File could not be saved: ' + err);
      }else{
        console.log('File ' + file.name + " saved");
      };
    });
  });	
});

```

Send Files : https://www.npmjs.com/package/delivery

Using socket client on server side : http://stackoverflow.com/questions/22279922/file-data-transfer-between-two-node-js-servers

Fixing error on receiver side : https://github.com/liamks/Delivery.js/issues/22

"Found solution for this problem. Just need to add the following code after attempting to send the images once on sender node server.

socket.disconnect();
socket.connect();"

Send Files : https://www.npmjs.com/package/delivery

Using socket client on server side : http://stackoverflow.com/questions/22279922/file-data-transfer-between-two-node-js-servers

Fixing error on receiver side : https://github.com/liamks/Delivery.js/issues/22

"Found solution for this problem. Just need to add the following code after attempting to send the images once on sender node server.

socket.disconnect();
socket.connect();"


Send messages : http://stackoverflow.com/questions/11498508/socket-emit-vs-socket-send