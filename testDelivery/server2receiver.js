var io  = require('socket.io').listen(5002),
    dl  = require('delivery'),
    fs  = require('fs');

io.sockets.on('connection', function(socket){

  socket.on('testSocket', function(data) {
    console.log("Data received on socket : "+data);
  });

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
