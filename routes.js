var fs = require("fs");
var express = require('express');
var router = express.Router();
var formidable=require("formidable");
var path= require("path");
var http = require('http');
//var modelID = 0;
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
	fs.readFile('./index.html', function (err, html) {
	    if (err) {
	        throw err;
    	}
	    response.writeHead(200, {"Content-Type": "text/html"});
	    response.write(html);
	    response.end();
    });
});

// 2. Pretrained MNIST page
router.get("/MNISTPredictorPage",function (request,response) {
	helper.logExceptOnTest("Request handler 'MNISTPredictorPage' was called.");

	fs.readFile('./MNISTPredictor.html', function (err, html) {
	    if (err) {
	        throw err;
    	}
	    response.writeHead(200, {"Content-Type": "text/html"});
	    response.write(html);
	    response.end();
    });
});

// 3. General Predictor Page
router.get("/generalPredictorPage",function(request,response) {
	helper.logExceptOnTest("Request handler 'generalPredictorPage' was called.");

	fs.readFile('./generalPredictor.html', function (err, html) {
	    if (err) {
	        throw err;
    	}
	    response.writeHead(200, {"Content-Type": "text/html"});
	    response.write(html);
	    response.end();
    });

});

// 4. Kill process with PID
router.get("/killProcessPage", function(request,response) {
	helper.logExceptOnTest("Request handler for killProcess called.");
	fs.readFile('./killProcess.html', function(err,html) {
		if (err) {
			throw err;
		}
		response.writeHead(200, {"Content-Type": "text/html"});
	    response.write(html);
	    response.end();
	});
});

// API endpoints

// 1. Upload the model for general predciton
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

// 2. Upload image to be used by general predictor
router.post("/generalPredictorImageUpload", function(request,response) {
	helper.logExceptOnTest("Request handler 'generalPredictorImageUpload' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	var data = "";

	form.on('fileBegin', function(name, file) {
        file.path = "./generalPredictor/"+file.name;
        data = file.name;
    });



	helper.logExceptOnTest("about to parse.");
	var dataString = "";


	form.parse(request,function(error,fields,files) {
		helper.logExceptOnTest("parsing done.");
		//helper.logExceptOnTest(fields)
		//helper.logExceptOnTest(JSON.stringify(fields))
		//helper.logExceptOnTest(files);
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

// 3. Endpoint for training and testing on the MNIST dataset
router.post("/uploadCompleteScript",function (request,response) {
	var oldDataString = "";
	helper.logExceptOnTest("Request handler 'uploadCompleteScript' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	var fileName = "";

	form.on('fileBegin', function(name, file) {
		file.path = path.join(__dirname,"/S3LabUploads/",file.name);
		//helper.logExceptOnTest("Model ID : "+ ++modelID);
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
		  response.end();
		});

		helper.logExceptOnTest("here2");


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

// 4. Endpoint for prediction on pretrained MNIST dataset
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
		//helper.logExceptOnTest(fields)
		//helper.logExceptOnTest(JSON.stringify(fields))
		//helper.logExceptOnTest(files);
		helper.logExceptOnTest("File name : "+files.upload.path);

		var spawn = require('child_process').spawn,
		    py    = spawn('python', [path.join(__dirname,"/MNISTPredictor",'/predictSavedModel.py')], {cwd:path.join(__dirname,"/MNISTPredictor")});

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

// 5. Kill process with specific job_id, also supply pid
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

// 8. Suspend job with specific UUID, also needs PID
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
				    try {
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

// 9. Kill process with specific PID
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

// 6. Get dashboard for all users

router.get("/getDashboard",function(request,response) {
	database.dashboardPullDB(function(result) {
		helper.logExceptOnTest("result : "+JSON.stringify(result));
		response.writeHead(200,{'Content-Type': 'application/json'});
   		response.end(JSON.stringify(result));
	});
});

// 7. Get Dashboard selective : i.e. info about specific user

router.get("/getDashboardSelective",function(request,response) {
	database.dashboardPullDBSelective(function(result) {
		helper.logExceptOnTest("result : "+JSON.stringify(result));
		response.setHeader('Content-Type', 'application/json');
   		response.end(JSON.stringify(result));
	},request.query.user_id);
});

module.exports = router;
