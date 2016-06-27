var fs = require("fs");
var express = require('express');
var router = express.Router();
var formidable=require("formidable");
var path= require("path");
var http = require('http');
var modelID = 0;
var util = require('util');
var uuid = require('node-uuid');
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({contactPoints: ['127.0.0.1:9042']});

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

router.get("/generalPredictorPage",function(request,response) {
	console.log("Request handler 'generalPredictorPage' was called."); 

	fs.readFile('./generalPredictor.html', function (err, html) {
	    if (err) {
	        throw err; 
    	}       
	    response.writeHead(200, {"Content-Type": "text/html"});  
	    response.write(html);  
	    response.end();  
    });

});

router.post("/generalPredictorModelUpload",function(request,response) {
	console.log("Request handler for generalPredictorModelUpload called");

	var form = new formidable.IncomingForm();
	form.keepExtensions = true;

    form.parse(request, function(err, fields, files) {
	    response.writeHead(200, {'content-type': 'text/plain'});
	    //console.log(files);
	    response.write('Received model : '+files.upload.name +"\n");
	    response.end();
	    //response.end(util.inspect({fields: fields, files: files}));
	});

	form.on('fileBegin',function(name,file) {
		file.path="./generalPredictor/"+"general.ckpt";
	});
});

router.post("/generalPredictorImageUpload", function(request,response) {
	console.log("Request handler 'generalPredictorImageUpload' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true; 
	var data = "";

	form.on('fileBegin', function(name, file) {
        file.path = "./generalPredictor/"+file.name;
        data = file.name;
    });



	console.log("about to parse.");
	var dataString = "";


	form.parse(request,function(error,fields,files) {
		console.log("parsing done.");
		//console.log(fields)
		//console.log(JSON.stringify(fields))
		//console.log(files);
		console.log("File name : "+files.upload.path);

		var spawn = require('child_process').spawn,
		    py    = spawn('python', ['./generalPredictSavedModel.py'], {cwd:"./generalPredictor"});

		py.stdout.on('data', function(data){
		  console.log("here1 : "+data);
		  console.log(data.toString());
		  dataString = data.toString();
		});

		console.log("here2");

		py.stderr.on('data', function(data) {
		  console.log('stdout: ' + data);
		  dataString = data.toString();
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




router.post("/uploadCompleteScript",function (request,response) {
	console.log("Request handler 'uploadCompleteScript' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	var fileName = "";

	form.on('fileBegin', function(name, file) {
		file.path = "./S3LabUploads/"+file.name;
		console.log("Model ID : "+ ++modelID);
		fileName = noExtension(file.name);
    });

	console.log("about to parse.");
	var dataString = "";

	form.parse(request,function(error,fields,files) {
		console.log("parsing done.");
		console.log("File name : "+files.upload.path);

		var hasCrashed = false;
		var spawn = require('child_process').spawn,
		    py    = spawn('python', ['./newTest.py'], {cwd:"./S3LabUploads"});
		var UUID = uuid.v4();
		console.log("Process started with PID : "+py.pid+" and title "+py.title+"\n");
		py.title= 'trainingJob'+UUID;


		var query = "INSERT INTO dummyDB.jobInfo (user_id,job_id,jobStatus,jobType,pid) VALUES ('sjs7007testing',"+UUID+",'live','training','"+py.pid+"')";   
		client.execute(query, function(err, result) {
		  console.log(err);
		});


        var jsonSend = fields;
		jsonSend["File Name"]=fileName;
		jsonSend["modelID"]=modelID;
		data = JSON.stringify(jsonSend) ;
		console.log("Sending : "+data);


		py.stdout.on('data', function(data){
		  console.log("here1");
		  console.log(data.toString());
		  dataString = data.toString();
		});

		console.log("here2");

		
		py.stderr.on('data', function(data) {
		  hasCrashed = true;
		  console.log('stdout: ' + data);
		  dataString = data.toString();
		});

		py.stdout.on('end', function(){
			var modelPath = "/S3LabUploads/"+fileName+"_"+modelID+".ckpt";
			var accuracyValue = "dummyForNow";
			if(!hasCrashed) {
				var query = "UPDATE dummyDB.jobInfo SET jobStatus='finished',pid='null',accuracy='"+accuracyValue+"' ,model='"+modelPath+"' WHERE job_id="+UUID;
				client.execute(query, function(err, result) {
				console.log(err);
				});
			}
			else {

			}
			response.setHeader('Content-Type', 'application/json');
   			response.end(JSON.stringify({ Accuracy : accuracyValue  , trainedModel : modelPath }));
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
		//console.log(fields)
		//console.log(JSON.stringify(fields))
		//console.log(files);
		console.log("File name : "+files.upload.path);

		var spawn = require('child_process').spawn,
		    py    = spawn('python', ['./predictSavedModel.py'], {cwd:"./MNISTPredictor"});

		py.stdout.on('data', function(data){
		  console.log("here1 : "+data);
		  console.log(data.toString());
		  dataString = data.toString();
		});

		console.log("here2");

		py.stderr.on('data', function(data) {
		  console.log('stdout: ' + data);
		  dataString = data.toString();
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

