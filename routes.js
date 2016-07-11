var fs = require("fs");
var express = require('express');
var router = express.Router();
var formidable=require("formidable");
var path= require("path");
var http = require('http');
//var modelID = 0;
var util = require('util');
var uuid = require('node-uuid');
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({contactPoints: ['127.0.0.1:9042']});
var alreadyRunning =false;
//https://www.npmjs.com/package/hashset-native
var HashSet = require('hashset-native');
var processIDSet = new HashSet.int32();


//Database functions
// In case app restarts after a crash, set status of all live jobs to crashed 
// since the child process
// use Prepared statements : http://datastax.github.io/nodejs-driver/getting-started/
function onDatabaseStart() {
	logExceptOnTest("Clearing up Database...");
	var query = " SELECT job_id FROM dummyDB.jobInfo  WHERE jobstatus='live' ALLOW FILTERING;";
	client.execute(query, { prepare: true },function(err,result) {
		for(var i=0;i<result.rows.length;i++) {
			var query2= "UPDATE dummyDB.jobInfo SET jobstatus='crashed',pid='processCrashed' WHERE job_id=?;"; 
			client.execute(query2,[result.rows[i].job_id],  { prepare: true },function(err2,result2) {
				logExceptOnTest("onDatabaseStart Error : "+err2);
			});
		}
	});
}

function onProcessSucessDB(accuracyValue,modelPath, UUID, pid) {
	processIDSet.remove(pid);
	var query = "UPDATE dummyDB.jobInfo SET jobStatus='finished',pid='processFinished',accuracy=? ,model=? WHERE job_id=?";
	client.execute(query, [accuracyValue,modelPath,UUID], { prepare: true },function(err, result) {
		logExceptOnTest("onProcessSucessDB Error : "+err);
	});
}

function onJobCreationDB(UUID,pid) {
	//logExceptOnTest("pid : "+pid+ " : "+typeof(pid));
	processIDSet.add(pid);
	var query = "INSERT INTO dummyDB.jobInfo (user_id,job_id,jobStatus,jobType,pid) VALUES ('sjs7007testing',?,'live','training',?)";   
	client.execute(query, [UUID,pid.toString()], { prepare: true },function(err, result) {
	  logExceptOnTest("onJobCreationDB Error : "+err);
	});
}

function onProcessKillDB(pid) {
	processIDSet.remove(pid);
	//add code to update db later
}

///http://stackoverflow.com/questions/23339907/returning-a-value-from-callback-function-in-node-js
function dashboardPullDB(callback) {
	var query = "SELECT pid,job_id,jobstatus,jobtype,model,accuracy,prediction,user_id FROM dummyDb.jobInfo;";
	client.execute(query, { prepare: true },function(err,result) {
		if(err) {
			logExceptOnTest("dashboardPullDB Error : "+err);
		}
		else {
			//logExceptOnTest(result);
			//logExceptOnTest("---> "+result.rows[0]);
			return callback(result);
		}
	});
}

function dashboardPullDBSelective(callback,user_id) {
	var query = "SELECT pid,job_id,jobstatus,jobtype,model,prediction,user_id FROM dummyDb.jobInfo WHERE user_id=? ALLOW FILTERING;";
	client.execute(query,[user_id], { prepare: true },function(err,result) {
		if(err) {
			logExceptOnTest("dashboardPullDBSelective  Error : "+err);
		}
		else {
			//logExceptOnTest(result);
			//logExceptOnTest("---> "+result.rows[0]);
			return callback(result);
		}
	});
}

/*dashboardPullDB(function(result) {
	logExceptOnTest("result : "+JSON.stringify(result));
});*/


//Other helper functions 

//Return name without extension  
function noExtension(fileName) {
	return fileName.substring(0,fileName.indexOf("."));
}

//log messages to console only if not in test mode
function logExceptOnTest(ip) {
	if(process.env.NODE_ENV!='test') {
		console.log(ip);
	}
}

// Runs for all routes 
router.use(function timeLog(req, res, next) {
  logExceptOnTest('Time: ', Date.now());
  //cleare database on app start
  if(!alreadyRunning) {
  	onDatabaseStart();
  }
  alreadyRunning = true;
  next();
});



//Basic HTML Page renders 
// 1. Home Page 

router.get('/', function(request, response) {
	logExceptOnTest("Homepage requested.")
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
	logExceptOnTest("Request handler 'MNISTPredictorPage' was called.");

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
	logExceptOnTest("Request handler 'generalPredictorPage' was called."); 

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
	logExceptOnTest("Request handler for killProcess called.");
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
	logExceptOnTest("Request handler for generalPredictorModelUpload called");

	var form = new formidable.IncomingForm();
	form.keepExtensions = true;

    form.parse(request, function(err, fields, files) {
	    response.writeHead(200, {'content-type': 'text/plain'});
	    //logExceptOnTest(files);
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
	logExceptOnTest("Request handler 'generalPredictorImageUpload' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true; 
	var data = "";

	form.on('fileBegin', function(name, file) {
        file.path = "./generalPredictor/"+file.name;
        data = file.name;
    });



	logExceptOnTest("about to parse.");
	var dataString = "";


	form.parse(request,function(error,fields,files) {
		logExceptOnTest("parsing done.");
		//logExceptOnTest(fields)
		//logExceptOnTest(JSON.stringify(fields))
		//logExceptOnTest(files);
		logExceptOnTest("File name : "+files.upload.path);

		var spawn = require('child_process').spawn,
		    py    = spawn('python', ['./generalPredictSavedModel.py'], {cwd:"./generalPredictor"});

		py.stdout.on('data', function(data){
		  logExceptOnTest("here1 : "+data);
		  logExceptOnTest(data.toString());
		  dataString = data.toString();
		});

		logExceptOnTest("here2");

		py.stderr.on('data', function(data) {
		  logExceptOnTest('stdout: ' + data);
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
	logExceptOnTest("Request handler 'uploadCompleteScript' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	var fileName = "";

	form.on('fileBegin', function(name, file) {
		file.path = "./S3LabUploads/"+file.name;
		//logExceptOnTest("Model ID : "+ ++modelID);
		fileName = noExtension(file.name);
    });

	logExceptOnTest("about to parse.");
	var dataString = "";

	form.parse(request,function(error,fields,files) {
		logExceptOnTest("parsing done.");
		logExceptOnTest(files);
        logExceptOnTest("File name : "+files.upload.path);

		var hasCrashed = false;
		var spawn = require('child_process').spawn,
		    py    = spawn('python', ['./newTest.py'], {cwd:"./S3LabUploads"});

		
		var UUID = uuid.v4();

		logExceptOnTest("Process started with PID : "+py.pid+" and title "+py.title+"\n");
		py.title= 'trainingJob'+UUID;

		

		onJobCreationDB(UUID,py.pid);


		


        var jsonSend = fields;
		jsonSend["File Name"]=fileName;
		jsonSend["modelID"]=UUID;
		data = JSON.stringify(jsonSend) ;
		logExceptOnTest("Sending : "+data);


		py.stdout.on('data', function(data){
		  logExceptOnTest("here1");
		  logExceptOnTest(data.toString());
		  dataString = data.toString();
		});

		logExceptOnTest("here2");

		
		py.stderr.on('data', function(data) {
		  hasCrashed = true;
		  logExceptOnTest('stdout: ' + data);
		  dataString = data.toString();
		});

		py.stdout.on('end', function(){
			
			var modelPath = "/S3LabUploads/"+fileName+"_"+UUID+".ckpt";
			var accuracyValue = "dummyForNow";

			//skip things below if process was killed, 
			try {
				accuracyValue = JSON.parse(dataString);
				accuracyValue = accuracyValue[accuracyValue.length-1]['Accuracy'];
			}
			catch (err) {
				logExceptOnTest("error : "+err);
				accuracyValue = "null";
			}
			
			
			if(!hasCrashed) {
				onProcessSucessDB(accuracyValue,modelPath,UUID,py.pid);
			}
			else {

			}
			response.setHeader('Content-Type', 'application/json');
   			response.end(JSON.stringify({ Accuracy : dataString  , trainedModel : modelPath }));
		});
		py.stdin.write(JSON.stringify(data));
		py.stdin.end();
		
	});

});

// 4. Endpoint for prediction on pretrained MNIST dataset
router.post("/MNISTPredictor", function(request,response) {
	logExceptOnTest("Request handler 'MNISTPredictor' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true; 
	var data = "";

	form.on('fileBegin', function(name, file) {
        file.path = "./MNISTPredictor/"+file.name;
        data = file.name;
    });



	logExceptOnTest("about to parse.");
	var dataString = "";


	form.parse(request,function(error,fields,files) {
		logExceptOnTest("parsing done.");
		//logExceptOnTest(fields)
		//logExceptOnTest(JSON.stringify(fields))
		//logExceptOnTest(files);
		logExceptOnTest("File name : "+files.upload.path);

		var spawn = require('child_process').spawn,
		    py    = spawn('python', ['./predictSavedModel.py'], {cwd:"./MNISTPredictor"});

		py.stdout.on('data', function(data){
		  logExceptOnTest("here1 : "+data);
		  logExceptOnTest(data.toString());
		  dataString = data.toString();
		});

		logExceptOnTest("here2");

		py.stderr.on('data', function(data) {
		  logExceptOnTest('stdout: ' + data);
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

// 5. Kill process with specific PID 
router.post("/killProcess",function(request,response) {
	var form = new formidable.IncomingForm();
	form.parse(request,function(error,fields,files) {
		logExceptOnTest(fields);
		pid = parseInt(fields.pid);
		if(processIDSet.contains(pid)) {
			//try catch incase still fails because process is done
		    try {
				//processIDSet.remove(pid);
				logExceptOnTest("Killing process with PID : "+pid);
				process.kill(pid);

				//update db and set
				onProcessKillDB(pid);
				response.writeHead(200, {"Content-Type": "text/html"});  
			    response.write("Process killed.");  
			    response.end();  
			}
			catch(err) {
				//process killing failed
				logExceptOnTest("error : "+err);
				response.writeHead(400, {"Content-Type": "text/html"});  
			    response.write("Process killing failed : "+err);  
			    response.end();  
			}

			/*processIDSet.remove(pid);
			logExceptOnTest("Killing process with PID : "+pid);
			process.kill(pid);
			response.writeHead(200, {"Content-Type": "text/html"});  
		    response.write("Process killed.");  
		    response.end();  */
		}
		else {
			logExceptOnTest("Process killing failed.");
			response.writeHead(400, {"Content-Type": "text/html"});  
		    response.write("Process killing failed : not a child process.");  
		    response.end();  
		}
		
		
		
	});
});

// 6. Get dashboard for all users

router.get("/getDashboard",function(request,response) {
	dashboardPullDB(function(result) {
		logExceptOnTest("result : "+JSON.stringify(result));
		response.writeHead(200,{'Content-Type': 'application/json'});
   		response.end(JSON.stringify(result));
	});
});

// 7. Get Dashboard selective : i.e. info about specific user 

router.get("/getDashboardSelective",function(request,response) {
	dashboardPullDBSelective(function(result) {
		logExceptOnTest("result : "+JSON.stringify(result));
		response.setHeader('Content-Type', 'application/json');
   		response.end(JSON.stringify(result));
	},request.query.user_id);
});



module.exports = router;

