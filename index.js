var router=require("./router");
var server=require("./server");
var requestHandlers=require("./requestHandlers");

var handle={};
handle["/"]=requestHandlers.start;
handle["/start"]=requestHandlers.start;
handle["/uploadCompleteScript"]=requestHandlers.uploadCompleteScript;
handle["/MNISTPredictorPage"]=requestHandlers.MNISTPredictorPage;
handle["/MNISTPredictor"]=requestHandlers.MNISTPredictor;

server.start(router.route,handle);
