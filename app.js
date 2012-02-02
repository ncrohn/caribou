
var http = require('http');
http.createServer(
  function (req, res) {

    req.setEncoding("UTF8");

    req.on('data', function(chunk) {
             if(req.headers['x-github-event'] === 'push') {
               var rawData = decodeURIComponent(chunk.toString('utf8'));
               var dataObject = convert(rawData);
               var jsonData = JSON.parse(dataObject['payload']);

               console.log(jsonData);

             }
           });

    req.on('end', function() {
             res.end();
           });

  }).listen(3000, "127.0.0.1");
console.log('Server running at http://127.0.0.1:3000/');

function convert(data) {
  var obj = {};

  data = data.split("=");

  for(var x = 0; x < data.length;x+=2) {
    obj[data[x]] = data[x+1];
  }

  return obj;
}