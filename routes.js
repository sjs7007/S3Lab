var fs = require("fs");
var express = require('express');
var router = express.Router();
var formidable=require("formidable");
var path= require("path");
var http = require('http');
var util = require('util');
var alreadyRunning =false;
//http://stackoverflow.com/questions/13541948/node-js-cant-open-files-error-enoent-stat-path-to-file
var path = require('path');
var uuid = require('node-uuid');
var helper = require('./helperFunctions');
var database = require('./databaseFunctions');
var jadeGen = require('./htmlGenerator');
var HashMap = require('hashmap');
var processIDMap = new HashMap();

// Runs for all routes
router.use(function timeLog(req, res, next) {
	helper.logExceptOnTest('Time: ', Date.now());
	//cleare database on app start
	if(!alreadyRunning) {
		database.onDatabaseStart();
	}
	alreadyRunning = true;
	next();
});



//Basic HTML Page renders
// 1. Home Page

router.get('/', function(request, response) {
	helper.logExceptOnTest("Homepage requested.")
	response.sendFile(__dirname + '/webPages/index.html');
});

// 2. Pretrained MNIST page
router.get("/MNISTPredictorPage",function (request,response) {
	helper.logExceptOnTest("Request handler 'MNISTPredictorPage' was called.");
	response.sendFile(__dirname + '/webPages/MNISTPredictor.html');
});

// 3. General Predictor Page
router.get("/generalPredictorPage",function(request,response) {
	helper.logExceptOnTest("Request handler 'generalPredictorPage' was called.");
	response.sendFile(__dirname + '/webPages/generalPredictor.html');

});

// 4. Kill process with PID
router.get("/killProcessPage", function(request,response) {
	helper.logExceptOnTest("Request handler for killProcess called.");
	response.sendFile(__dirname + '/webPages/killProcess.html');
});

// API endpoints

// 2.1 Upload the model for general predciton
router.post("/generalPredictorModelUpload",function(request,response) {
	helper.logExceptOnTest("Request handler for generalPredictorModelUpload called");

	var form = new formidable.IncomingForm();
	//store file with extension name
	form.keepExtensions = true;

	//set file location
	form.on('fileBegin',function(name,file) {
		file.path="./generalPredictor/"+"general.ckpt";
	});

	//send response back after parsing is done
	form.parse(request, function(err, fields, files) {
		response.writeHead(200, {'content-type': 'text/plain'});
		response.write('Received model : '+files.upload.name +"\n");
		response.end();
	});

	
});

// 2.2 Upload image to be used by general predictor
router.post("/generalPredictorImageUpload", function(request,response) {
	helper.logExceptOnTest("Request handler 'generalPredictorImageUpload' was called.");
	var data = "";
	var name = "";
	var form = new formidable.IncomingForm();
	//store file with extension name 
	form.keepExtensions = true;

	//set file location
	form.on('fileBegin', function(name, file) {
		file.path = "./generalPredictor/"+file.name;
	});

	//store temporary output
	var dataString = "";

	form.parse(request,function(error,fields,files) {
		helper.logExceptOnTest("File name : "+files.upload.path+","+files.upload.name);
	var spawn = require('child_process').spawn,
		cpy = spawn('docker',['cp',files.upload.path,'settytest:/home/']);
		name = files.upload.name;
		
		cpy.on('close', function() {

			console.log("finished copying "+files.upload.path+"...");
			//spawn child process for prediction
			var spawn = require('child_process').spawn,
			py = spawn('docker', ['exec', '178d8405db16', 'python', '/home/generalPredictSavedModel2.py','/home/'+files.upload.name, '2>/dev/null']);

			//input to script
			py.stdin.write(JSON.stringify(data));
			py.stdin.end();

			//output onstdout from script
			py.stdout.on('data', function(data){
				helper.logExceptOnTest("here1 : "+data);
				helper.logExceptOnTest(data.toString());
				dataString = data.toString();
			});

			//error messages on tdetderr from script
			py.stderr.on('data', function(data) {
				helper.logExceptOnTest('stderr: ' + data);
				dataString = data.toString();
			});

			//stdout done
			py.stdout.on('end', function(){
				response.setHeader('Content-Type', 'application/json');
				response.end(JSON.stringify({ Prediction : dataString.substring(0,dataString.length-1)}));
			});
		});
	});

});

// 1. Endpoint for training and testing on the MNIST dataset
router.post("/uploadCompleteScript",function (request,response) {
	helper.logExceptOnTest("Request handler 'uploadCompleteScript' was called.");

	//set response header
	response.setHeader('Content-Type', 'application/json');


	var form = new formidable.IncomingForm();
	//store extensions 
	form.keepExtensions = true;

	//set location and get file name
	var fileName = "";
	form.on('fileBegin', function(name, file) {
		file.path = path.join(__dirname,"/S3LabUploads/",file.name);
		fileName = helper.noExtension(file.name);
	});

	//store temp output
	var dataString = "";

	form.parse(request,function(error,fields,files) {
		var hasCrashed = false;

		//spawn child process for training and testing 
		var spawn = require('child_process').spawn,
		py = spawn('docker', ['exec', '178d8405db16', 'python', '/home/newTest.py', '{"width":"28","height":"28","nClass":"10","alpha":"0.01","File Name":"MNIST_data","modelID":"modelID"}', '2>/dev/null']);




		var job_id = uuid.v4();

		//store model path for sending later 
		var modelPath = "/S3LabUploads/"+fileName+"_"+job_id+".ckpt";

		//insert info in db and map
		helper.logExceptOnTest("Process started with PID : "+py.pid+"\n");
		database.onJobCreationDB(job_id,py.pid);
		processIDMap[job_id]=py.pid;

		//input to python script 
		var jsonSend = fields;
		jsonSend["File Name"]=fileName;
		jsonSend["modelID"]=job_id;
		data = JSON.stringify(jsonSend) ;
		py.stdin.write(JSON.stringify(data));
		py.stdin.end();

		//stdout from script
		py.stdout.on('data', function(data){
			dataString = data.toString();
			helper.logExceptOnTest(dataString);
			response.write(JSON.stringify({ Accuracy : dataString  , trainedModel : modelPath }));
		});

		//stderr from script
		py.stderr.on('data', function(data) {
			//hasCrashed = true;
			helper.logExceptOnTest('stderr: ' + data);
			dataString = data.toString();
		});
		
		//stdout ends
		py.stdout.on('end', function(){
			var accuracyValue = "dummyForNow";
			//skip things below if process was killed
			//maintain a datastructure of active jobs
			//if killed, job should be removed from set
			//if not in set here -> killed, if killed -> don't update db since kill already updated
			try {
				accuracyValue = JSON.parse(dataString);
				accuracyValue = accuracyValue[accuracyValue.length-1]['Accuracy'];
			}
			catch (err) {
				hasCrashed = true;
				helper.logExceptOnTest("python parsing error : "+err);
				accuracyValue = "null";
			}

			//case 1 : normal , not killed, process ended , parsing was ok
			if(!hasCrashed && processIDMap[job_id]!=null) {
				database.onProcessSucessDB(dataString,modelPath,job_id,py.pid);
				processIDMap[job_id]=null;

				if(!response.headersSent) {
					response.setHeader('Content-Type', 'application/json');
				}
				response.end(JSON.stringify({ Accuracy : dataString  , trainedModel : modelPath }));
			}
			// case 2 : not killed but parsing issue
			else if(processIDMap[job_id]!=null) {
				database.onProcessFailDB(accuracyValue,"null",job_id,py.pid);
				processIDMap[job_id]=null;

				if(!response.headersSent) {
					response.writeHead(500, {'content-type': 'text/html'});
				}
				response.write("Python process failed : maybe problem in tensorflow.");
				response.end();
			}
			// case 3 : killed, db updated by kill api, so just tell user killed
			else {
				if(!response.headersSent) {
					response.writeHead(500, {'content-type': 'text/html'});
				}
				response.end("Process was killed by user.");
			}		
		});
	});
	
});

// 3. Endpoint for prediction on pretrained MNIST dataset
router.post("/MNISTPredictor", function(request,response) {
	helper.logExceptOnTest("Request handler 'MNISTPredictor' was called.");

	var form = new formidable.IncomingForm();

	//save files with extension
	form.keepExtensions = true;
	var data = "";

	//set file location and store filename 
	form.on('fileBegin', function(name, file) {
		file.path = "./MNISTPredictor/"+file.name;
		data = file.name;
	});

	//temporary output buffer
	var dataString = "";

	form.parse(request,function(error,fields,files) {

		//spawn python process
		var spawn = require('child_process').spawn,
		py = spawn('python', [path.join(__dirname,"/MNISTPredictor",'/predictSavedModel.py')], {cwd:path.join(__dirname,"/MNISTPredictor")});
		
		//input to python
		py.stdin.write(JSON.stringify(data));
		py.stdin.end();

		//stdout
		py.stdout.on('data', function(data){
			dataString = data.toString();
			helper.logExceptOnTest(dataString);
		});

		//stderr
		py.stderr.on('data', function(data) {
			helper.logExceptOnTest('stderr: ' + data);
			dataString = data.toString();
		});

		//stdout ends 
		py.stdout.on('end', function(){
			response.setHeader('Content-Type', 'application/json');
			response.end(JSON.stringify({ Prediction : dataString.substring(0,dataString.length-1)}));
		});
	});

});

// 4. Get dashboard for all users

router.get("/getDashboard",function(request,response) {
	database.dashboardPullDB(function(result) {
		helper.logExceptOnTest("result : "+JSON.stringify(result));
		response.writeHead(200,{'Content-Type': 'application/json'});
		response.end(JSON.stringify(result));
	});
});

// 5. Get Dashboard selective : i.e. info about specific user

router.get("/getDashboardSelective",function(request,response) {
	database.dashboardPullDBSelective(function(result) {
		helper.logExceptOnTest("result : "+JSON.stringify(result));
		response.setHeader('Content-Type', 'application/json');
		response.end(JSON.stringify(result));
	},request.query.user_id);
});



// 6. Kill process with specific job_id, also supply pid
router.post("/killProcess",function(request,response) {
	var form = new formidable.IncomingForm();
	form.parse(request,function(error,fields,files) {
		job_id = fields.job_id;
		//pid = parseInt(fields.pid);

		if(processIDMap[job_id]==null) {
			helper.logExceptOnTest("Job killing failed : not found in map");
			response.writeHead(400, {"Content-Type": "text/html"});
			response.write("Job killing failed : not found in map.");
			response.end();
		}
		else {
			processID = processIDMap[job_id];
			//try killing processs
			try {
				process.kill(processID);
				database.onProcessKillDB(job_id,processID);
				response.writeHead(200, {"Content-Type" : "text/html"});
				response.end("Job : "+job_id+" killed.");
				processIDMap[job_id] = null;
			}
			catch(err) {
				helper.logExceptOnTest("Job killing failed : process doesn't exist, probably finished executing : "+err);
				response.writeHead(400, {"Content-Type": "text/html"});
				response.write("Job killing failed : process doesn't exist, probably finished executing : "+err);
				response.end();
			}
		}

	});
});


// 7. Suspend job with specific job_id, also needs PID
router.post("/suspendProcess",function(request,response) {
	var form = new formidable.IncomingForm();
	form.parse(request,function(error,fields,files) {
		job_id = fields.job_id;
		//pid = parseInt(fields.pid);

		if(processIDMap[job_id]==null) {
			helper.logExceptOnTest("Job suspension failed : not found in map");
			response.writeHead(400, {"Content-Type": "text/html"});
			response.write("Job suspension failed : not found in map.");
			response.end();
		}
		else {
			processID = processIDMap[job_id];
			//try suspending processs
			try {
				process.kill(processID,"SIGTSTP");
				database.onProcessSuspendDB(job_id,processID);
				response.writeHead(200, {"Content-Type" : "text/html"});
				response.end("Job : "+job_id+" suspended.");
			}
			catch(err) {
				helper.logExceptOnTest("Job suspension failed : process doesn't exist, probably finished executing : "+err);
				response.writeHead(400, {"Content-Type": "text/html"});
				response.write("Job suspension failed : process doesn't exist, probably finished executing : "+err);
				response.end();
			}
		}

	});
});



// 8. Resume process with specific job_id and PID
router.post("/resumeProcess",function(request,response) {
	var form = new formidable.IncomingForm();
	form.parse(request,function(error,fields,files) {
		job_id = fields.job_id;

		if(processIDMap[job_id]==null) {
			helper.logExceptOnTest("Job resuming failed : not found in map");
			response.writeHead(400, {"Content-Type": "text/html"});
			response.write("Job resuming failed : not found in map.");
			response.end();
		}
		else {
			processID = processIDMap[job_id];
			//try killing processs
			try {
				process.kill(processID,"SIGCONT");
				database.onProcessResumeDB(job_id,processID);
				response.writeHead(200, {"Content-Type" : "text/html"});
				response.end("Job : "+job_id+" resumed.");
			}
			catch(err) {
				helper.logExceptOnTest("Job resuming failed : process doesn't exist, probably finished executing : "+err);
				response.writeHead(400, {"Content-Type": "text/html"});
				response.write("Job resuming failed : process doesn't exist, probably finished executing : "+err);
				response.end();
			}
		}

	});
});

// 9. Select specific model on server and test with it
// curl -F job_id=71cd6c9f-2bc1-4380-8d89-b32182441638 localhost:8888/testTrainedOnline 
// just prints model path now 

router.post("/testTrainedOnline",function(request,response) {
	helper.logExceptOnTest("Received POST request for testTrainedOnline.");
	var form = new formidable.IncomingForm();
	var imPath = "dummy";
	form.keepExtensions = true;

	form.on('fileBegin', function(name, file) {
		file.path = "./testTrainedOnline/"+file.name;
		//imPath = file.path;
	});

	form.parse(request,function(error,fields,files) {

		//will contain selected job_id

		//var jsonSend = fields;
		var selectedJobID = fields.job_id;
		var temp = "";

		//get path of model from db and store 
		database.getModelPath(selectedJobID, function(result) {
			var jsonSend = JSON.stringify({ modelPath : result.rows[0].model, imPath : files.upload.name });

			var spawn = require('child_process').spawn;
			var py = spawn('python',['-u',path.join(__dirname,'/testTrainedOnline','/generalPredictSavedModel.py')], {cwd: path.join(__dirname,"/testTrainedOnline")});

			//input to script	
			py.stdin.write(jsonSend);
			py.stdin.end();

			//on data from script 
			py.stdout.on('data',function(data) {
				temp = data;
				helper.logExceptOnTest("testTrainedOnline stdout : "+data);
			});

			//on error
			py.stderr.on('data',function(data) {
				helper.logExceptOnTest("testTrainedOnline stderr : "+data);
			});

			//on end 
			py.stdout.on('end',function() {
				helper.logExceptOnTest("testTrainedOnline stdout ended : "+temp);
				response.setHeader('Content-Type', 'application/json');
			  response.end(JSON.stringify({"Prediction" : temp.toString() }));

			});
			//helper.logExceptOnTest("result : "+(result.rows[0].model));
			//response.setHeader('Content-Type', 'application/json');
			//response.end(JSON.stringify(result));

		});
		var currentJobID = uuid.v4();
	});
});
module.exports = router;
