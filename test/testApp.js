//timeouts : http://stackoverflow.com/questions/16607039/in-mocha-testing-while-calling-asynchronous-function-how-to-avoid-the-timeout-er

var chai = require('chai');
var chaiHTTP = require('chai-http');
var server = require('../app');
var should = chai.should();
var fs = require('fs');

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

    it('should return .. on /uploadCompleteScript POST', function(done) {
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


});
