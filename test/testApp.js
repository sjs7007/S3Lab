var chai = require('chai');
var chaiHTTP = require('chai-http');
var server = require('../app');
var should = chai.should();
var fs = require('fs');

chai.use(chaiHTTP);

process.env.NODE_ENV = 'test';

describe('DatabaseTest',function() {
    it('should list all log entries on /getDashboard GET',function(done) {
        chai.request(server)
        .get('/getDashboard')
        .end(function(err,res) {
           // console.log(res);
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
            res.should.have.status(200);
            done();
        });
    });

    it('should return .. on /uploadCompleteScript POST', function(done) {
        chai.request(server)
        .post('/uploadCompleteScript')
        .field('width',28)
        .field('height',28)
        .field('nClass',10)
        .field('alpha',0.01)
        //.attach('upload',fs.readFileSync('testChai.jpg'))
        .attach('upload',fs.readFileSync('MNIST_data.zip'))
        .end(function(err,res) {
            res.should.have.status(200);
            done();
        });
    });


});
