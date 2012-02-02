
var http = require('http');
http.createServer(
  function (req, res) {

    req.setEncoding("UTF8");

    req.on('data', function(chunk) {
             console.log(chunk.toString('utf8'));
           });

    req.on('end', function() {
             res.end();
           });

  }).listen(3000, "127.0.0.1");
console.log('Server running at http://127.0.0.1:3000/');