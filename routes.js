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
	response.sendFile(__dirname + '/WebPages/index.html');
});

// 2. Pretrained MNIST page
router.get("/MNISTPredictorPage",function (request,response) {
	helper.logExceptOnTest("Request handler 'MNISTPredictorPage' was called.");
	response.sendFile(__dirname + '/WebPages/MNISTPredictor.html');
});

// 3. General Predictor Page
router.get("/generalPredictorPage",function(request,response) {
	helper.logExceptOnTest("Request handler 'generalPredictorPage' was called.");
	response.sendFile(__dirname + '/WebPages/generalPredictor.html');

});

// 4. Kill process with PID
router.get("/killProcessPage", function(request,response) {
	helper.logExceptOnTest("Request handler for killProcess called.");
	response.sendFile(__dirname + '/WebPages/killProcess.html');
});

// API endpoints

// 2.1 Upload the model for general predciton
router.post("/generalPredictorModelUpload",function(request,response) {
	helper.logExceptOnTest("Request handler for generalPredictorModelUpload called");

	var form = new formidable.IncomingForm();
	form.keepExtensions = true;

		form.parse(request, function(err, fields, files) {
			response.writeHead(200, {'content-type': 'text/plain'});
			//helper.logExceptOnTest(files);
			response.write('Received model : '+files.upload.name +"\n");
			response.end();
			//response.end(util.inspect({fields: fields, files: files}));
	});

	form.on('fileBegin',function(name,file) {
		file.path="./generalPredictor/"+"general.ckpt";
	});
});

// 2.2 Upload image to be used by general predictor
router.post("/generalPredictorImageUpload", function(request,response) {
	helper.logExceptOnTest("Request handler 'generalPredictorImageUpload' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	var data = "";
	var dataString = "";

	form.on('fileBegin', function(name, file) {
		file.path = "./generalPredictor/"+file.name;
		data = file.name;
	});


	form.parse(request,function(error,fields,files) {
		helper.logExceptOnTest("File name : "+files.upload.path);

		var spawn = require('child_process').spawn,
		py    = spawn('python', [path.join(__dirname,"generalPredictor",'/generalPredictSavedModel.py')], {cwd:path.join(__dirname,"/generalPredictor")});

		py.stdout.on('data', function(data){
			helper.logExceptOnTest("here1 : "+data);
			helper.logExceptOnTest(data.toString());
			dataString = data.toString();
		});

		helper.logExceptOnTest("here2");

		py.stderr.on('data', function(data) {
			helper.logExceptOnTest('stdout: ' + data);
			dataString = data.toString();
		});

		py.stdout.on('end', function(){
			response.setHeader('Content-Type', 'application/json');
				response.end(JSON.stringify({ Prediction : dataString.substring(0,dataString.length-1)}));
		});

		py.stdin.write(JSON.stringify(data));
		py.stdin.end();
	});

});

// 1. Endpoint for training and testing on the MNIST dataset
router.post("/uploadCompleteScript",function (request,response) {
	var oldDataString = "";
	helper.logExceptOnTest("Request handler 'uploadCompleteScript' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	var fileName = "";

	form.on('fileBegin', function(name, file) {
		file.path = path.join(__dirname,"/S3LabUploads/",file.name);
		fileName = helper.noExtension(file.name);
		});

	helper.logExceptOnTest("about to parse.");
	var dataString = "";

	form.parse(request,function(error,fields,files) {
		helper.logExceptOnTest("parsing done.");
		helper.logExceptOnTest(files);
		helper.logExceptOnTest("File name : "+files.upload.path);

		var hasCrashed = false;
		var spawn = require('child_process').spawn,
				py    = spawn('python', [path.join(__dirname,'/S3LabUploads','/newTest.py')], {cwd:path.join(__dirname,"/S3LabUploads")});
		var UUID = uuid.v4();

		helper.logExceptOnTest("Process started with PID : "+py.pid+" and title "+py.title+"\n");
		py.title= 'trainingJob'+UUID;
		database.onJobCreationDB(UUID,py.pid);

		var jsonSend = fields;
		jsonSend["File Name"]=fileName;
		jsonSend["modelID"]=UUID;
		data = JSON.stringify(jsonSend) ;
		helper.logExceptOnTest("Sending : "+data);
		var modelPath = "/S3LabUploads/"+fileName+"_"+UUID+".ckpt";
		response.setHeader('Content-Type', 'application/json');
		py.stdout.on('data', function(data){
			helper.logExceptOnTest("here1");
			helper.logExceptOnTest(data.toString());
			dataString = data.toString();
			console.log("writing data");
			response.write(JSON.stringify({ Accuracy : dataString  , trainedModel : modelPath }));
			//response.end();
		});

		py.stderr.on('data', function(data) {
			hasCrashed = true;
			helper.logExceptOnTest('stdout: ' + data);
			dataString = data.toString();
		});

		py.stdout.on('end', function(){
			var accuracyValue = "dummyForNow";
			//skip things below if process was killed,
			try {
				accuracyValue = JSON.parse(dataString);
				accuracyValue = accuracyValue[accuracyValue.length-1]['Accuracy'];
			}
			catch (err) {
				hasCrashed = true;
				helper.logExceptOnTest("python error : "+err);
				accuracyValue = "null";
			}

			if(!hasCrashed) {
				database.onProcessSucessDB(dataString,modelPath,UUID,py.pid);
				if(!response.headersSent) {
					response.setHeader('Content-Type', 'application/json');
				}
				response.end(JSON.stringify({ Accuracy : dataString  , trainedModel : modelPath }));
			}
			else {
				database.onProcessFailDB(accuracyValue,"null",UUID,py.pid);
				response.writeHead(500, {'content-type': 'text/html'});
				response.write("Python process failed : maybe problem in tensorflow.");
				response.end();
			}
		});
		py.stdin.write(JSON.stringify(data));
		py.stdin.end();

	});

});

// 3. Endpoint for prediction on pretrained MNIST dataset
router.post("/MNISTPredictor", function(request,response) {
	helper.logExceptOnTest("Request handler 'MNISTPredictor' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	var data = "";

	form.on('fileBegin', function(name, file) {
		file.path = "./MNISTPredictor/"+file.name;
		data = file.name;
	});

	helper.logExceptOnTest("about to parse.");
	var dataString = "";

	form.parse(request,function(error,fields,files) {
		helper.logExceptOnTest("parsing done.");
		helper.logExceptOnTest("File name : "+files.upload.path);

		var spawn = require('child_process').spawn,
				py    = spawn('python', [path.join(__dirname,"/MNISTPredictor",'/predictSavedModel.py')], {cwd:path.join(__dirname,"/MNISTPredictor")});
dashbo
		py.stdout.on('data', function(data){
			helper.logExceptOnTest("here1 : "+data);
			helper.logExceptOnTest(data.toString());
			dataString = data.toString();
		});

		helper.logExceptOnTest("here2");

		py.stderr.on('data', function(data) {
			helper.logExceptOnTest('stdout: ' + data);
			dataString = data.toString();
		});

		py.stdout.on('end', function(){
			response.setHeader('Content-Type', 'application/json');
			response.end(JSON.stringify({ Prediction : dataString.substring(0,dataString.length-1)}));
		});

		py.stdin.write(JSON.stringify(data));
		py.stdin.end();
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
		helper.logExceptOnTest(fields);
		job_id = fields.job_id;
		pid = parseInt(fields.pid);

		if(!database.processIDSetContains(pid)) {
			helper.logExceptOnTest("Process killing failed.");
			response.writeHead(400, {"Content-Type": "text/html"});
			response.write("Process killing failed : not a child process.");
			response.end();
		}
		else
		{
			helper.validJobID(job_id,function(err,res) {
				if(err!=null) {
					helper.logExceptOnTest("Invalid job ID : "+err);
					helper.logExceptOnTest("Process killing failed : invalid job_id.");
					response.writeHead(400, {"Content-Type": "text/html"});
					response.write("Process killing failed : not a valid job_id.");
					response.end();
				}
				else {
					//try catch incase still fails because process is done
					try {
						helper.logExceptOnTest("Killing process with PID : "+pid+" and job_id"+job_id);
						process.kill(pid);

						//update db and set
						database.onProcessKillDB(job_id,pid);
						response.writeHead(200, {"Content-Type": "text/html"});
						response.write("Process killed.");
						response.end();
					}
					catch(err) {
						//process killing failed
						helper.logExceptOnTest("error : "+err);
						response.writeHead(400, {"Content-Type": "text/html"});
							response.write("Process killing failed : "+err);
							response.end();
					}
				}
			});
		}
	});
});

// 7. Suspend job with specific UUID, also needs PID
router.post("/suspendProcess",function(request,response) {
	var form = new formidable.IncomingForm();
	form.parse(request,function(error,fields,files) {
		helper.logExceptOnTest(fields);
		pid = parseInt(fields.pid);
		job_id = fields.job_id;

		if(!database.processIDSetContains(pid)) {
			helper.logExceptOnTest("Process suspension failed : not a child process.");
			response.writeHead(400, {"Content-Type": "text/html"});
			response.write("Process suspension failed : not a child process.");
			response.end();
		}
		else
		{
			helper.validJobID(job_id,function(err,res) {
				if(err!=null) {
					helper.logExceptOnTest("Invalid job ID : "+err);
					helper.logExceptOnTest("Process suspension failed : invalid job_id.");
					response.writeHead(400, {"Content-Type": "text/html"});
					response.write("Process suspension failed : not a valid job_id.");
					response.end();
				}
				else {
					//try catch incase still fails because process is done
					try{
						helper.logExceptOnTest("Suspending process with PID : "+pid+" and job_id"+job_id);
						process.kill(pid,"SIGTSTP");
						//update db and set
						database.onProcessSuspendDB(job_id);
						response.writeHead(200, {"Content-Type": "text/html"});
						response.write("Process suspended.");
						response.end();
					}

					catch(err) {
						//process suspension failed
						helper.logExceptOnTest("error : "+err);
						response.writeHead(400, {"Content-Type": "text/html"});
						response.write("Process suspension failed : "+err);
						response.end();
					}
				}
			});
		}
	});
});

// 8. Resume process with specific job_id and PID
router.post("/resumeProcess",function(request,response) {
	var form = new formidable.IncomingForm();
	form.parse(request,function(error,fields,files) {
		helper.logExceptOnTest(fields);
		pid = parseInt(fields.pid);
		job_id = fields.job_id;

		if(!database.processIDSetContains(pid)) {
			helper.logExceptOnTest("Process resuming failed.");
			response.writeHead(400, {"Content-Type": "text/html"});
				response.write("Process resuming failed : not a child process.");
				response.end();
		}
		else
		{
			helper.validJobID(job_id,function(err,res) {
			if(err!=null) {
				helper.logExceptOnTest("Invalid job ID : "+err);
				helper.logExceptOnTest("Process resuming failed : invalid job_id.");
				response.writeHead(400, {"Content-Type": "text/html"});
					response.write("Process resuming failed : not a valid job_id.");
					response.end();
			}
			else {
				//try catch incase still fails because process is done
					try {
					helper.logExceptOnTest("resume process with PID : "+pid+" and job_id"+job_id);
					process.kill(pid,"SIGCONT");

					//update db and set
					database.onProcessResumeDB(job_id,pid);
					response.writeHead(200, {"Content-Type": "text/html"});
					response.write("Process resumed.");
					response.end();
				}
				catch(err) {
					//process killing failed
					helper.logExceptOnTest("error : "+err);
					response.writeHead(400, {"Content-Type": "text/html"});
					response.write("Process resuming failed : "+err);
					response.end();
					}
				}
			});
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
