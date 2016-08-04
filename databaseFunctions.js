var cassandra = require('cassandra-driver');
var client = new cassandra.Client({contactPoints: ['127.0.0.1:9042']});
var helper = require('./helperFunctions');
//https://www.npmjs.com/package/hashset-native
var HashSet = require('hashset-native');
var processIDSet = new HashSet.int32();


module.exports = {
	//Database functions
	// In case app restarts after a crash, set status of all live jobs to crashed 
	// since the child process
	// use Prepared statements : http://datastax.github.io/nodejs-driver/getting-started/
	onDatabaseStart : function() {
		helper.logExceptOnTest("Clearing up Database...");
		var query = " SELECT job_id FROM dummyDB.jobInfo  WHERE jobstatus='live' ALLOW FILTERING;";
		client.execute(query, { prepare: true },function(err,result) {
			for(var i=0;i<result.rows.length;i++) {
				var query2= "UPDATE dummyDB.jobInfo SET jobstatus='crashed',pid='processCrashed' WHERE job_id=?;"; 
				client.execute(query2,[result.rows[i].job_id],  { prepare: true },function(err2,result2) {
					helper.logExceptOnTest("onDatabaseStart Error : "+err2);
				});
			}
		});
	},

	onProcessSucessDB : function(accuracyValue,modelPath, UUID, pid) {
		helper.sendEmailTo('sjs7007@gmail.com','Process state of job_id : '+UUID+" changed to "+"processFinished");
		processIDSet.remove(pid);
		var query = "UPDATE dummyDB.jobInfo SET jobStatus='finished',pid='processFinished',accuracy=? ,model=? WHERE job_id=?";
		client.execute(query, [accuracyValue,modelPath,UUID], { prepare: true },function(err, result) {
			helper.logExceptOnTest("onProcessSucessDB Error : "+err);
		});
	},

    onProcessFailDB : function(accuracyValue,modelPath, UUID, pid) {
    	helper.sendEmailTo('sjs7007@gmail.com','Process state of job_id : '+UUID+" changed to "+"processCrashed");
		processIDSet.remove(pid);
		var query = "UPDATE dummyDB.jobInfo SET jobStatus='finished',pid='processCrashed',accuracy=? ,model=? WHERE job_id=?";
		client.execute(query, [accuracyValue,modelPath,UUID], { prepare: true },function(err, result) {
			helper.logExceptOnTest("onProcessFailDB Error : "+err);
		});
	},

	onJobCreationDB : function(UUID,pid) {
		helper.sendEmailTo('sjs7007@gmail.com','Process state of job_id : '+UUID+" changed to "+"training");
		//helper.logExceptOnTest("pid : "+pid+ " : "+typeof(pid));
		processIDSet.add(pid);
		var query = "INSERT INTO dummyDB.jobInfo (user_id,job_id,jobStatus,jobType,pid) VALUES ('sjs7007testing',?,'live','training',?)";   
		client.execute(query, [UUID,pid.toString()], { prepare: true },function(err, result) {
		  helper.logExceptOnTest("onJobCreationDB Error : "+err);
		});
	},

	onProcessKillDB : function(job_id,pid) {
		helper.sendEmailTo('sjs7007@gmail.com','Process state of job_id : '+job_id+" changed to "+"processKilled");
		processIDSet.remove(pid);
		//add code to update db 
		var query = "UPDATE dummyDb.jobInfo SET jobStatus='killed',pid='processKilled' WHERE job_id=?;";
		client.execute(query,[job_id],{prepare : true}, function(err,result) {
			if(err!=null) {
				helper.logExceptOnTest("onProcessKillDB error : "+err);
			}
		});
	},

	onProcessSuspendDB : function(job_id) {
		helper.sendEmailTo('sjs7007@gmail.com','Process state of job_id: '+job_id+" changed to "+"processSuspended");
		var query = "UPDATE dummyDb.jobInfo SET jobStatus='suspended' WHERE job_id=?;";
		client.execute(query,[job_id],{prepare : true}, function(err,result) {
			if(err!=null) {
				helper.logExceptOnTest("onProcessSuspendDB error : "+err);
			}
		});
	},


	onProcessResumeDB : function(job_id) {
		helper.sendEmailTo('sjs7007@gmail.com','Process state of PID : '+pid+" changed to "+"processResumed");
		var query = "UPDATE dummyDb.jobInfo SET jobStatus='live' WHERE job_id=?;";
		client.execute(query,[job_id],{prepare : true}, function(err,result) {
			if(err!=null) {
				helper.logExceptOnTest("onProcessResumeDB error : "+err);
			}
		});
	},

	///http://stackoverflow.com/questions/23339907/returning-a-value-from-callback-function-in-node-js
	dashboardPullDB : function(callback) {
		var query = "SELECT pid,job_id,jobstatus,jobtype,model,accuracy,prediction,user_id FROM dummyDb.jobInfo;";
		client.execute(query, { prepare: true },function(err,result) {
			if(err) {
				helper.logExceptOnTest("dashboardPullDB Error : "+err);
			}
			else {
				//helper.logExceptOnTest(result);
				//helper.logExceptOnTest("---> "+result.rows[0]);
				return callback(result);
			}
		});
	},

	dashboardPullDBSelective : function(callback,user_id) {
		var query = "SELECT pid,job_id,jobstatus,jobtype,model,prediction,user_id FROM dummyDb.jobInfo WHERE user_id=? ALLOW FILTERING;";
		client.execute(query,[user_id], { prepare: true },function(err,result) {
			if(err) {
				helper.logExceptOnTest("dashboardPullDBSelective  Error : "+err);
			}
			else {
				//helper.logExceptOnTest(result);
				//helper.logExceptOnTest("---> "+result.rows[0]);
				return callback(result);
			}
		});
	},

	processIDSetContains : function(pid) {
		return processIDSet.contains(pid);
	}

	/*dashboardPullDB(function(result) {
		helper.logExceptOnTest("result : "+JSON.stringify(result));
	});*/
}
