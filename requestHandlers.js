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
	


function uploadCompleteScript(response,request) {
	console.log("Request handler 'uploadCompleteScript' was called.");
	var form = new formidable.IncomingForm();
	//form.uploadDir = "/home/shinchan/S3Lab/S3LabUploads";
	form.keepExtensions = true; 

	form.on('fileBegin', function(name, file) {
        file.path = "/home/shinchan/S3Lab/S3LabUploads/"+file.name;
    });



	console.log("about to parse.");
	var dataString = "";


	form.parse(request,function(error,fields,files) {
		console.log("parsing done.");
		console.log(fields)
		console.log("File name : "+files.upload.path);

		var spawn = require('child_process').spawn,
		    //py    = spawn('python', [files.upload.path]),
		    py    = spawn('python', ['/home/shinchan/S3Lab/S3LabUploads/newTest.py'], {cwd:"/home/shinchan/S3Lab/S3LabUploads"}),
		    data = '' ;


		py.stdout.on('data', function(data){
		  console.log("here1");
		  console.log(data.toString());
		  dataString += data.toString();
		});

		console.log("here2");

		py.stdout.on('end', function(){
			//console.log(dataString);  
			response.writeHead(200,{"Content-Type":"text/plain"});
		    response.write(dataString);
			response.end();
		});
		py.stdin.write(JSON.stringify(data));
		py.stdin.end();
			});

}



exports.start=start;
exports.uploadCompleteScript=uploadCompleteScript;