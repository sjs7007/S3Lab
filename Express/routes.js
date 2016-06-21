var fs = require("fs");
var express = require('express');
var router = express.Router();
var formidable=require("formidable");
var path= require("path");
var http = require('http');
var modelID = 0;


// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});


router.get('/', function(request, response) {
	console.log("Homepage requested.")
	fs.readFile('./index.html', function (err, html) {
	    if (err) {
	        throw err;
    	}
	    response.writeHead(200, {"Content-Type": "text/html"});
	    response.write(html);
	    response.end();
    });
});


router.get("/MNISTPredictorPage",function (request,response) {
	console.log("Request handler 'MNISTPredictorPage' was called.");

	fs.readFile('./MNISTPredictor.html', function (err, html) {
	    if (err) {
	        throw err; 
    	}       
	    response.writeHead(200, {"Content-Type": "text/html"});  
	    response.write(html);  
	    response.end();  
    });
});


router.post("/uploadCompleteScript",function (request,response) {
	console.log("Request handler 'uploadCompleteScript' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	var fileName = "";

	form.on('fileBegin', function(name, file) {
		file.path = "./S3LabUploads/"+file.name;
		fileName = file.name;
		console.log("Model ID : "+ ++modelID);
    });

	console.log("about to parse.");
	var dataString = "";

	form.parse(request,function(error,fields,files) {
		console.log("parsing done.");
		console.log("File name : "+files.upload.path);

		var spawn = require('child_process').spawn,
		    py    = spawn('python', ['./newTest.py'], {cwd:"./S3LabUploads"});

		var jsonSend = fields;
		jsonSend["File Name"]=noExtension(fileName);
		data = JSON.stringify(jsonSend) ;
		console.log("Sending : "+data);


		py.stdout.on('data', function(data){
		  console.log("here1");
		  console.log(data.toString());
		  dataString += data.toString();
		});

		console.log("here2");

		
		py.stderr.on('data', function(data) {
		  console.log('stdout: ' + data);
		  dataString += data.toString();
		});

		py.stdout.on('end', function(){
			//response.writeHead(200,{"Content-Type":"text/plain"});
		    //response.write(dataString);
			//response.end();

			 response.setHeader('Content-Type', 'application/json');
   			 response.end(JSON.stringify({ Accuracy : dataString.substring(0,dataString.length-1) , TrainedModel : "/S3LabUploads/"+noExtension(fileName)+"_"+modelID }));
		});
		py.stdin.write(JSON.stringify(data));
		py.stdin.end();
			});

});

function noExtension(fileName) {
	return fileName.substring(0,fileName.indexOf("."));
}

router.post("/MNISTPredictor", function(request,response) {
	console.log("Request handler 'MNISTPredictor' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true; 
	var data = "";

	form.on('fileBegin', function(name, file) {
        file.path = "./MNISTPredictor/"+file.name;
        data = file.name;
    });



	console.log("about to parse.");
	var dataString = "";


	form.parse(request,function(error,fields,files) {
		console.log("parsing done.");
		console.log(fields)
		console.log(JSON.stringify(fields))
		console.log("File name : "+files.upload.path);

		var spawn = require('child_process').spawn,
		    py    = spawn('python', ['./predictSavedModel.py'], {cwd:"./MNISTPredictor"});

		py.stdout.on('data', function(data){
		  console.log("here1 : "+data);
		  console.log(data.toString());
		  dataString += data.toString();
		});

		console.log("here2");

		py.stderr.on('data', function(data) {
		  console.log('stdout: ' + data);
		  dataString += data.toString();
		});

		py.stdout.on('end', function(){
			//response.writeHead(200,{"Content-Type":"text/html"});
			//var p1 = "<html> <img src="+files.upload.path+"> <br>";
			//var p2 = "Prediction is : "+dataString + "</html>";
		    //response.write(p2);
			//response.end();
			response.setHeader('Content-Type', 'application/json');
   			response.end(JSON.stringify({ Prediction : dataString.substring(0,dataString.length-1)}));
		});
		py.stdin.write(JSON.stringify(data));
		py.stdin.end();
			});

});

module.exports = router;