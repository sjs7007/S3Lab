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
	}
}