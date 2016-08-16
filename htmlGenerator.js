/*
code for generating custom html page from templates
*/

var ejs = require('ejs');
var fs = require('fs');
var helper = require('./helperFunctions');


module.exports = {
	getKillButton : function(job_id,pid,url,callback) {
		fs.readFile('./jadeTemplates/killProcess.ejs',function(err,ejsTemplate) {
			if(err!=null) {
				helper.logExceptOnTest("Error reading kill template : "+err);
			}
			else {
				ejsTemplate = ejsTemplate.toString();
				htmlGen = ejs.render(ejsTemplate,{"job_id" : job_id, "pid" : pid, "url" : url});
				helper.logExceptOnTest(htmlGen);
				callback("sjs7007@gmail.com",htmlGen);
			}
		});
	}
}

