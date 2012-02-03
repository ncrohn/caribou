
var http = require('http'),
    winston = require('winston'),
    spawn = require('child_process').spawn,
    path = require('path'),
    fs = require('fs'),

    // Config
    deployDir = path.normalize(__dirname + '/deploy');

http.createServer(
  function (req, res) {

    req.setEncoding("UTF8");

    req.on('data', function(chunk) {
             if(req.headers['x-github-event'] === 'push') {
               var rawData = decodeURIComponent(chunk.toString('utf8'));
               var dataObject = convert(rawData);
               var jsonData = JSON.parse(dataObject['payload']);

               processPush(jsonData);
             }
           });

    req.on('end', function() {
             res.end();
           });

  }).listen(3000, "127.0.0.1");
winston.info('Server running at http://127.0.0.1:3000/');

function processPush(data) {

  if(data.deleted) {
    winston.info(data.repository.name + " " + data.ref + " was deleted.");
    winston.info("Starting undeploy process and deploying last known good artifact.");
  } else if(data.created) {
    winston.info(data.repository.name + " " + data.ref + " was created.");
    winston.info("Starting deploy process of new artifact.");
  } else {
    winston.info(data.repository.name + " " + data.ref + " was updated.");
    winston.info("Starting deploy process of updated artifact.");
    deploy(data);
  }

}

function deploy(data) {

  var repoDir = path.normalize(deployDir + "/" + data.repository.name),
      gitProcess;

  fs.stat(repoDir,
    function(err, stat) {
      if(stat) {
        winston.info("git pull " + repoDir + " " + data.ref);
        process.chdir(repoDir);
        gitProcess = spawn('git', ['pull']);
      } else {
        winston.info("git clone " + data.repository.url + " " + repoDir);
        gitProcess = spawn('git', ['clone', data.repository.url, repoDir]);
      }

      gitProcess.stdout.on('data',
        function(feed) {
          winston.info(feed);
        });

      gitProcess.stderr.on('data',
        function(feed) {
          winston.error(feed);
        });

      gitProcess.on('exit',
        function(code) {
          winston.info("Git clone finished with exit code: " + code);
        });

    });

}

function convert(data) {
  var obj = {};

  data = data.split("=");

  for(var x = 0; x < data.length;x+=2) {
    obj[data[x]] = data[x+1];
  }

  return obj;
}