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
function onDatabaseStart() {
	console.log("Clearing up Database...");
	var query = " SELECT job_id FROM dummyDB.jobInfo  WHERE jobstatus='live' ALLOW FILTERING;";
	client.execute(query,function(err,result) {
		for(var i=0;i<result.rows.length;i++) {
			var query2= "UPDATE dummyDB.jobInfo SET jobstatus='crashed',pid='processCrashed' WHERE job_id="+result.rows[i].job_id; 
			client.execute(query2,function(err2,result2) {
				console.log(err2);
			});
		}
	});
}

function onProcessSucessDB(accuracyValue,modelPath, UUID, pid) {
	processIDSet.remove(pid);
	var query = "UPDATE dummyDB.jobInfo SET jobStatus='finished',pid='processFinished',accuracy='"+accuracyValue+"' ,model='"+modelPath+"' WHERE job_id="+UUID;
	client.execute(query, function(err, result) {
		console.log(err);
	});
}

function onJobCreationDB(UUID,pid) {
	//console.log("pid : "+pid+ " : "+typeof(pid));
	processIDSet.add(pid);
	var query = "INSERT INTO dummyDB.jobInfo (user_id,job_id,jobStatus,jobType,pid) VALUES ('sjs7007testing',"+UUID+",'live','training','"+pid+"')";   
	client.execute(query, function(err, result) {
	  console.log(err);
	});
}

function onProcessKillDB(pid) {
	processIDSet.remove(pid);
	//add code to update db later
}

///http://stackoverflow.com/questions/23339907/returning-a-value-from-callback-function-in-node-js
function dashboardPullDB(callback) {
	var query = "SELECT jobstatus,jobtype,model,prediction,user_id FROM dummyDb.jobInfo;";
	client.execute(query,function(err,result) {
		if(err) {
			console.log(err);
		}
		else {
			//console.log(result);
			//console.log("---> "+result.rows[0]);
			return callback(result);
		}
	});
}


/*dashboardPullDB(function(result) {
	console.log("result : "+JSON.stringify(result));
});*/


//Other helper functions 

//Return name without extension  
function noExtension(fileName) {
	return fileName.substring(0,fileName.indexOf("."));
}

// Runs for all routes 
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
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

// 2. Pretrained MNIST page 
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

// 3. General Predictor Page 
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

// 4. Kill process with PID 
router.get("/killProcessPage", function(request,response) {
	console.log("Request handler for killProcess called.");
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

// 2. Upload image to be used by general predictor 
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

// 3. Endpoint for training and testing on the MNIST dataset 
router.post("/uploadCompleteScript",function (request,response) {
	console.log("Request handler 'uploadCompleteScript' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	var fileName = "";

	form.on('fileBegin', function(name, file) {
		file.path = "./S3LabUploads/"+file.name;
		//console.log("Model ID : "+ ++modelID);
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

		

		onJobCreationDB(UUID,py.pid);


		


        var jsonSend = fields;
		jsonSend["File Name"]=fileName;
		jsonSend["modelID"]=UUID;
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
			
			var modelPath = "/S3LabUploads/"+fileName+"_"+UUID+".ckpt";
			var accuracyValue = "dummyForNow";

			//skip things below if process was killed, 
			try {
				accuracyValue = JSON.parse(dataString);
				accuracyValue = accuracyValue[accuracyValue.length-1]['Accuracy'];
			}
			catch (err) {
				console.log("error : "+err);
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

// 5. Kill process with specific PID 
router.post("/killProcess",function(request,response) {
	var form = new formidable.IncomingForm();
	form.parse(request,function(error,fields,files) {
		console.log(fields);
		pid = parseInt(fields.pid);
		if(processIDSet.contains(pid)) {
			//try catch incase still fails because process is done
		    try {
				//processIDSet.remove(pid);
				console.log("Killing process with PID : "+pid);
				process.kill(pid);

				//update db and set
				onProcessKillDB(pid);
				response.writeHead(200, {"Content-Type": "text/html"});  
			    response.write("Process killed.");  
			    response.end();  
			}
			catch(err) {
				//process killing failed
				console.log("error : "+err);
				response.writeHead(400, {"Content-Type": "text/html"});  
			    response.write("Process killing failed : "+err);  
			    response.end();  
			}

			/*processIDSet.remove(pid);
			console.log("Killing process with PID : "+pid);
			process.kill(pid);
			response.writeHead(200, {"Content-Type": "text/html"});  
		    response.write("Process killed.");  
		    response.end();  */
		}
		else {
			console.log("Process killing failed.");
			response.writeHead(400, {"Content-Type": "text/html"});  
		    response.write("Process killing failed : not a child process.");  
		    response.end();  
		}
		
		
		
	});
});

// 6. Get dashboard

router.get("/getDashboard",function(request,response) {
	dashboardPullDB(function(result) {
		console.log("result : "+JSON.stringify(result));
		response.setHeader('Content-Type', 'application/json');
   		response.end(JSON.stringify(result));
	});
});


module.exports = router;

