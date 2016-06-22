//http://stackoverflow.com/questions/5924072/express-js-cant-get-my-static-files-why

var express = require('express');
var routes = require('./routes');
var app = express();
var cors = require('cors');

app.use(cors({origin: true}));

app.use('/', routes);

app.use("/S3LabUploads",express.static('S3LabUploads'));

app.listen(8888, function () {
  console.log('App listening on port 8888!');
});
