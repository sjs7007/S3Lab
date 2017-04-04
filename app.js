//http://stackoverflow.com/questions/5924072/express-js-cant-get-my-static-files-why
//http://stackoverflow.com/questions/22709882/how-to-suppress-application-logging-messages-from-a-node-js-application-when-run


var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var cors = require('cors');

/*var corsOptions = {
	credentials: true
}*/

var routes = require('./routes');

process.env.NODE_ENV = 'est';
var app = module.exports = express();
app.use(cors({origin: true,credentials: true}));
app.use("/S3LabUploads",express.static('S3LabUploads'));



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(require('express-session')({
    secret: 'apple banana', //only hardcoded here for testing
	cookie: { httpOnly: false }
}));


app.use(passport.initialize());
app.use(passport.session());

app.use('/',routes);

// passport serialize + deserialize 
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// database : mongoose
mongoose.connect('mongodb://localhost/passport_local_mongoose_express4');

var server = app.listen(8889,function() {
   console.log('App listening on port 8889.'); 
});



var express = require('express');
var app = module.exports = express();






