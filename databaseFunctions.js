/*
Contains code for the database related functions such as update db, pull information from db. 
*/

var cassandra = require('cassandra-driver');
var client = new cassandra.Client({contactPoints: ['127.0.0.1:9042']});
var helper = require('./helperFunctions');
//https://www.npmjs.com/package/hashset-native
var url = "http://localhost:8889";
var htmlGen = require('./htmlGenerator')


module.exports = {
	//Database functions
	// In case app restarts after a crash, set status of all live jobs to crashed 
	// since the child process
	// use Prepared statements : http://datastax.github.io/nodejs-driver/getting-started/
	onDatabaseStart : function() {
		helper.logExceptOnTest("Clearing up Database...");
		var query = " SELECT job_id FROM DeepCloud.jobInfo  WHERE jobstatus='live' ALLOW FILTERING;";
		client.execute(query, { prepare: true },function(err,result) {
			if(err) {
				helper.logExceptOnTest("onDatabaseStart Error : "+err);	
			}
			else {
				for(var i=0;i<result.rows.length;i++) {
					var query2= "UPDATE DeepCloud.jobInfo SET jobstatus='crashed',pid='processCrashed' WHERE job_id=?;"; 
					client.execute(query2,[result.rows[i].job_id],  { prepare: true },function(err2,result2) {
						if(err2) {
							helper.logExceptOnTest("onDatabaseStart Error : "+err2);						
						}
					});
				}
			}
		});
	},

	onProcessSucessDB : function(accuracyValue,modelPath, UUID, pid) {
		helper.sendEmailTo('sjs7007@gmail.com','Process state of job_id : '+UUID+" changed to "+"processFinished");
		//processIDSet.remove(pid);
		var query = "UPDATE DeepCloud.jobInfo SET jobStatus='finished',pid='processFinished',accuracy=? ,model=? WHERE job_id=?";
		client.execute(query, [accuracyValue,modelPath,UUID], { prepare: true },function(err, result) {
			if(err) {
				helper.logExceptOnTest("onProcessSucessDB Error : "+err);
			}
		});
	},

	onProcessFailDB : function(accuracyValue,modelPath, UUID, pid) {
		helper.sendEmailTo('sjs7007@gmail.com','Process state of job_id : '+UUID+" changed to "+"processCrashed");
		//processIDSet.remove(pid);
		var query = "UPDATE DeepCloud.jobInfo SET jobStatus='finished',pid='processCrashed',accuracy=? ,model=? WHERE job_id=?";
		client.execute(query, [accuracyValue,modelPath,UUID], { prepare: true },function(err, result) {
			if(err) {
				helper.logExceptOnTest("onProcessFailDB Error : "+err);
			}
		});
	},

	onJobCreationDB : function(UUID,pid) {
		//helper.sendEmailTo('sjs7007@gmail.com','Process state of job_id : '+UUID+" changed to "+"training");
		//helper.logExceptOnTest("pid : "+pid+ " : "+typeof(pid));
		htmlGen.getButton(UUID,url+"/killProcess","killProcess",function(killHTML) {
			htmlGen.getButton(UUID,url+"/suspendProcess","suspendProcess",function(suspendHTML) {
				htmlGen.getButton(UUID,url+"/resumeProcess","resumeProcess",function(resumeHTML) {
					console.log(killHTML+suspendHTML+resumeHTML);
					helper.sendMIMEEmailTo("sjs7007@gmail.com",killHTML+suspendHTML+resumeHTML);
				});
			});
		});

		var query = "INSERT INTO DeepCloud.jobInfo (user_id,job_id,jobStatus,jobType,pid) VALUES ('sjs7007testing',?,'live','training',?)";   
		client.execute(query, [UUID,pid.toString()], { prepare: true },function(err, result) {
			helper.logExceptOnTest("onJobCreationDB Error : "+err);
		});
	},

	onProcessKillDB : function(job_id,pid) {
		helper.sendEmailTo('sjs7007@gmail.com','Process state of job_id : '+job_id+" changed to "+"processKilled");
		//processIDSet.remove(pid);
		//add code to update db 
		var query = "UPDATE DeepCloud.jobInfo SET jobStatus='killed',pid='processKilled' WHERE job_id=?;";
		client.execute(query,[job_id],{prepare : true}, function(err,result) {
			if(err!=null) {
				helper.logExceptOnTest("onProcessKillDB error : "+err);
			}
		});
	},

	onProcessSuspendDB : function(job_id) {
		helper.sendEmailTo('sjs7007@gmail.com','Process state of job_id: '+job_id+" changed to "+"processSuspended");
		var query = "UPDATE DeepCloud.jobInfo SET jobStatus='suspended' WHERE job_id=?;";
		client.execute(query,[job_id],{prepare : true}, function(err,result) {
			if(err!=null) {
				helper.logExceptOnTest("onProcessSuspendDB error : "+err);
			}
		});
	},


	onProcessResumeDB : function(job_id) {
		helper.sendEmailTo('sjs7007@gmail.com','Process state of PID : '+pid+" changed to "+"processResumed");
		var query = "UPDATE DeepCloud.jobInfo SET jobStatus='live' WHERE job_id=?;";
		client.execute(query,[job_id],{prepare : true}, function(err,result) {
			if(err!=null) {
				helper.logExceptOnTest("onProcessResumeDB error : "+err);
			}
		});
	},

	///http://stackoverflow.com/questions/23339907/returning-a-value-from-callback-function-in-node-js
	dashboardPullDB : function(callback) {
		var query = "SELECT pid,job_id,jobstatus,jobtype,model,accuracy,prediction,user_id FROM DeepCloud.jobInfo;";
		client.execute(query, { prepare: true },function(err,result) {
			if(err) {
				helper.logExceptOnTest("dashboardPullDB Error : "+err);
			}
			else {
				//helper.logExceptOnTest(result);
				//helper.logExceptOnTest("---> "+result.rows[0]);
				callback(result);
			}
		});
	},

	dashboardPullDBSelective : function(callback,user_id) {
		var query = "SELECT pid,job_id,jobstatus,jobtype,model,prediction,user_id FROM DeepCloud.jobInfo WHERE user_id=? ALLOW FILTERING;";
		client.execute(query,[user_id], { prepare: true },function(err,result) {
			if(err) {
				helper.logExceptOnTest("dashboardPullDBSelective  Error : "+err);
			}
			else {
				//helper.logExceptOnTest(result);
				//helper.logExceptOnTest("---> "+result.rows[0]);
				callback(result);
			}
		});
	},

	processIDSetContains : function(pid) {
		return processIDSet.contains(pid);
	},

	getModelPath : function(job_id,callback) {
		var query = "SELECT model FROM DeepCloud.jobInfo WHERE job_id=? ALLOW FILTERING;";
		client.execute(query,[job_id], { prepare : true }, function(err,result) {
			if(err) {
				helper.logExceptOnTest("getModelPath Error : "+err);
			}
			else {
				callback(result);
			}
		});
	},

	addModel : function(modelID,description,modelPath,paper_link,tagsCommaSeparated,developer_username,category,citations,callback) {
		tagsList = tagsCommaSeparated.split(',');
		var query = "INSERT INTO tensorServing.modelDetails (modelID,description,modelPath,paper_link,tags,published,developer_username,category,citations) VALUES (?,?,?,?,?,?,?,?,?)";
		client.execute(query,[modelID,description,modelPath,paper_link,tagsList,false,developer_username,category,citations],{ prepare: true}, function(err,result) {
			/*if(err!=null) {
				console.log("error in addModel : "+err);
			}*/
			callback(err,result);		
		});
	},

	getModelByID : function(modelID,callback) {
		console.log("getModelByID called.");
		var query = "SELECT * FROM tensorServing.modelDetails  WHERE modelID=?";
		client.execute(query,[modelID],{ prepare: true}, function(err,result) {
			callback(err,result);			
		});
	},

	getModelByCategory : function(category,callback) {
		console.log("getModelByCategory called.");
		var query = "SELECT * FROM tensorServing.modelDetails  WHERE category=? ALLOW FILTERING";
		client.execute(query,[category],{ prepare: true}, function(err,result) {
			callback(err,result);			
		});
	},

	getAllModels : function(callback) 
	{
		console.log("getAllModels called.");
		var query = "SELECT * FROM tensorServing.modelDetails";
		client.execute(query,[],{ prepare: true}, function(err,result) {
			callback(err,result);			
		});
	},


	addReview : function(modelID,reviewer_username,review,rating,callback) {
		var query = "INSERT INTO tensorServing.modelReviews (modelID, reviewer_username, review, rating, timestamp) VALUES (?,?,?,?,?)";
		client.execute(query,[modelID,reviewer_username,review,rating,cassandra.types.timeuuid()], {prepare: true}, function(err,result) {
			callback(err,result);
		});
	},

	getReviews: function(modelID,callback) {
		var query = "SELECT * from tensorServing.modelReviews where modelID=?";
		client.execute(query,[modelID],{prepare : true},function(err,result) {
			callback(err,result);
		});
	},

	getModelRating: function(modelID,callback) {
		var query = "SELECT AVG(rating) from tensorServing.modelReviews where modelID=?";
		client.execute(query,[modelID],{prepare : true},function(err,result) {
			callback(err,result);
		});
	}

	/*dashboardPullDB(function(result) {
		helper.logExceptOnTest("result : "+JSON.stringify(result));
	});*/
}
