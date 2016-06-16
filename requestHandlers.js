var querystring=require("querystring"),fs=require("fs"),formidable=require("formidable"),exec=require("child_process").exec;

function start(response) {
	console.log("Request handler 'start' was called.");

	fs.readFile('./index.html', function (err, html) {
	    if (err) {
	        throw err;
    	}
	    response.writeHead(200, {"Content-Type": "text/html"});
	    response.write(html);
	    response.end();
    });
}


function MNISTPredictorPage(response) {
	console.log("Request handler 'MNISTPredictorPage' was called.");

	fs.readFile('./MNISTPredictor.html', function (err, html) {
	    if (err) {
	        throw err; 
    	}       
	    response.writeHead(200, {"Content-Type": "text/html"});  
	    response.write(html);  
	    response.end();  
    });
}
	



function uploadCompleteScript(response,request) {
	console.log("Request handler 'uploadCompleteScript' was called.");
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;

	form.on('fileBegin', function(name, file) {
		file.path = "./S3LabUploads/"+file.name;
    });



	console.log("about to parse.");
	var dataString = "";

	form.parse(request,function(error,fields,files) {
		console.log("parsing done.");
		console.log("File name : "+files.upload.path);

		var spawn = require('child_process').spawn,
		    py    = spawn('python', ['./newTest.py'], {cwd:"./S3LabUploads"}),
		    data = JSON.stringify(fields) ;


		py.stdout.on('data', function(data){
		  console.log("here1");
		  console.log(data.toString());
		  dataString += data.toString();
		});

		console.log("here2");

		
		py.stderr.on('data', function(data) {
		  console.log('stdout: ' + data);
		});

		py.stdout.on('end', function(){
			response.writeHead(200,{"Content-Type":"text/plain"});
		    response.write(dataString);
			response.end();
		});
		py.stdin.write(JSON.stringify(data));
		py.stdin.end();
			});

}

function MNISTPredictor(response,request) {
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

		py.stdout.on('end', function(){
			response.writeHead(200,{"Content-Type":"text/html"});
			//var p1 = "<html> <img src="+files.upload.path+"> <br>";
			var p2 = "Prediction is : "+dataString + "</html>";
		    response.write(p2);
			response.end();
		});
		py.stdin.write(JSON.stringify(data));
		py.stdin.end();
			});

}



exports.start=start;
exports.MNISTPredictorPage=MNISTPredictorPage;
exports.uploadCompleteScript=uploadCompleteScript;
exports.MNISTPredictor=MNISTPredictor;
