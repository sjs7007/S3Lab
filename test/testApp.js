var chai = require('chai');
var chaiHTTP = require('chai-http');
var server = require('../app');
var should = chai.should();

chai.use(chaiHTTP);

describe('DatabaseTest',function() {
    it('should list all log entries on /getDashboard GET',function(done) {
        chai.request(server)
        .get('/getDashboard')
        .end(function(err,res) {
            //console.log(res);
            res.should.have.status(200);
            done();
        });
    });
});
