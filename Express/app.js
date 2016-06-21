//http://stackoverflow.com/questions/5924072/express-js-cant-get-my-static-files-why

var express = require('express');
var birds = require('./birds2');
var app = express();

app.use('/', birds);


app.use("/S3LabUploads",express.static('/home/shinchan/S3Lab/Express/S3LabUploads/'));

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
