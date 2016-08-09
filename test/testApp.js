//timeouts : http://stackoverflow.com/questions/16607039/in-mocha-testing-while-calling-asynchronous-function-how-to-avoid-the-timeout-er

var chai = require('chai');
var chaiHTTP = require('chai-http');
var server = require('../app');
var should = chai.should();
var fs = require('fs');
var dl = require('delivery');
var io = require('socket.io-client');

chai.use(chaiHTTP);

process.env.NODE_ENV = 'tes';

describe('DatabaseTest',function() {
	it('should list all log entries on /getDashboard GET',function(done) {
		chai.request(server)
		.get('/getDashboard')
		.end(function(err,res) {
			 // console.log(res);
			 // add checks on data later 
				res.should.have.status(200);
				done();
		});
	});


	it('should list all log entries for user_id specified on /getDashboardSelective?user_id=sjs7007testing GET',function(done) {
		chai.request(server)
		//.get('/getDashboardSelective?user_id=sjs7007testing')
		.get('/getDashboardSelective')
		.query({user_id:'sjs7007'})
		.end(function(err,res) {
			 // console.log(res);
			 //add checks on data later 
				res.should.have.status(200);
				done();
		});
	});

	it('should return 200 on /uploadCompleteScript POST', function(done) {
		this.timeout(10000);
		chai.request(server)
		.post('/uploadCompleteScript')
		.field('width',28)
		.field('height',28)
		.field('nClass',10)
		.field('alpha',0.01)
		//.attach('upload',fs.readFileSync('testChai.jpg'))
		.attach('upload',fs.readFileSync('MNIST_data.zip'),'MNIST_data.zip')
		.end(function(err,res) {
				//add checks on data later 
				//console.log("result : "+res.body[0])
				res.should.have.status(200);
				done();
		});
	});

	//just automate socket call 
	// no test
/*	it('socket-call-test',function(done) {
		this.timeout(10000);

		var socket = io.connect('http://0.0.0.0:8888');

		socket.on( 'connect', function() {
		console.log( "Sockets connected" );
						
		delivery = dl.listen( socket );
		delivery.connect();
				
		delivery.on('delivery.connect',function(delivery){
				delivery.send({
					name: 'MNIST_data.zip',
					path : './MNIST_data.zip',
					params : {width : "28",height : "28", nClass : "10", alpha : "0.01"}
				});

				//socket.disconnect();
				//socket.connect();
		 
				delivery.on('send.success',function(file){
					console.log('File sent successfully!');
				});
			});
		}); */

		/*socket.on('/trainingSocket/result',function(data) {
			console.log("On /trainingSocket/result socket endpoint : "+data);
			done();
		});
	});*/ 
});
