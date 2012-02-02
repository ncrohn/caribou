
var http = require('http');
http.createServer(
  function (req, res) {
    req.on('end', function(x) {
             req.setEncoding("UTF8");
             console.log(req);
             res.end();
           });
  }).listen(3000, "127.0.0.1");
console.log('Server running at http://127.0.0.1:3000/');