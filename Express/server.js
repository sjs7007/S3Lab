var http = require("http");
var url = require("url");

function start(route,handle)
{
	function onRequest(request,response)
	{
		// Set CORS headers
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.setHeader('Access-Control-Request-Method', '*');
		response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
		response.setHeader('Access-Control-Allow-Headers', '*');
		if ( request.method === 'OPTIONS' ) {
			request.writeHead(200);
			request.end();
			return;
		}
		var postData="";
		var pathname=url.parse(request.url).pathname;
		console.log("Request for "+pathname+" received.");
		route(handle,pathname,response,request);
	}

	http.createServer(onRequest).listen(process.env.PORT||8888);
	console.log("Server has started.");
}

exports.start=start;
