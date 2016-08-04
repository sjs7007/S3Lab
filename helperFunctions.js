var cassandra = require('cassandra-driver');
var client = new cassandra.Client({contactPoints: ['127.0.0.1:9042']});
var fs = require('fs');

module.exports = {
	//Other helper functions 
	//Return name without extension  
	noExtension : function (fileName) {
		return fileName.substring(0,fileName.indexOf("."));
	},

	//log messages to console only if not in test mode
	logExceptOnTest : function (ip) {
		if(process.env.NODE_ENV!='test') {
			console.log(ip);
		}
	},

	validJobID : function(job_id,callback) {
		var query = "SELECT job_id from dummyDb.jobInfo WHERE job_id=?;";
		client.execute(query,[job_id],{prepare:true},function(err,res) {
			return callback(err,res);
		});
	},

	sendEmailTo : function(toEmail,message) {
		fs.readFile('mailgun2.key','utf-8',function(err,data) {
			if(err!=null) {
				console.log("Mailgun API Key Error : "+err);
			}
			else {
				var api_key = data;
				var domain = 'sandbox2796510b356d4fd5a02c639af3080887.mailgun.org';
				var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

				var data = {
				  from: 'S3 Lab <postmaster@sandbox2796510b356d4fd5a02c639af3080887.mailgun.org>',
				  to: toEmail ,
				  subject: 'S3Lab Job Status Update',
				  text: message
				};
				 
				mailgun.messages().send(data, function (error, body) {
				  console.log(body);
				});
			}
		});

	}
}
