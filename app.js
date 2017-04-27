//http://stackoverflow.com/questions/5924072/express-js-cant-get-my-static-files-why
//http://stackoverflow.com/questions/22709882/how-to-suppress-application-logging-messages-from-a-node-js-application-when-run

var express = require('express');
var app = module.exports = express();
var bodyParser = require('body-parser');
var cors = require('cors');
/*var corsOptions = {
	credentials: true
}*/
var auth = require('./auth.js')();
var routes = require('./routes');
var modelDBRoutes = require('./modelDBRoutes');

process.env.NODE_ENV = 'est';

app.use(cors({origin: true,credentials: true}));
app.use("/S3LabUploads",express.static('S3LabUploads'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(auth.initialize()); 
app.use('/',routes);
app.use('/',modelDBRoutes);


var server = app.listen(8889,function() {
   console.log('App listening on port 8889.'); 
});



