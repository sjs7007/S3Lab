/*
code for generating custom html page from templates
*/

var ejs = require('ejs');
var fs = require('fs');
var helper = require('./helperFunctions');


module.exports = {
	/*getKillButton : function(job_id,pid,url,callback) {
		fs.readFile('./jadeTemplates/killProcess.ejs',function(err,ejsTemplate) {
			if(err!=null) {
				helper.logExceptOnTest("Error reading kill template : "+err);
			}
			else {
				ejsTemplate = ejsTemplate.toString();
				htmlGen = ejs.render(ejsTemplate,{"job_id" : job_id, "pid" : pid, "url" : url});
				//helper.logExceptOnTest(htmlGen);
				callback(htmlGen);
			}
		});
	},

	getSuspendButton : function(job_id,url,callback) {
		fs.readFile('./jadeTemplates/suspendProcess.ejs', function(err,ejsTemplate) {
			if(err!=null) {
				helper.logExceptOnTest("Error reading suspend template : "+err);
			}
			else {
				ejsTemplate = ejsTemplate.toString();
				htmlGen  = ejs.render(ejsTemplate,{"job_id" : job_id, "url" : url});
				callback(htmlGen);
			}
		});
	},*/

	getButton : function(job_id,url,buttonText,callback) {
		fs.readFile('./jadeTemplates/button.ejs', function(err,ejsTemplate) {
			if(err!=null) {
				helper.logExceptOnTest("Error reading button template : "+err);
			}
			else {
				ejsTemplate = ejsTemplate.toString();
				htmlGen  = ejs.render(ejsTemplate,{"job_id" : job_id, "url" : url, "buttonText" : buttonText});
				callback(htmlGen);
			}
		});
	}

}

