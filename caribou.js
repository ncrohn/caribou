/**
 *
 * MIT License copyright (c) 2012 Nick Crohn
 *
 */

var http = require('http'),
    winston = require('winston'),
    spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    path = require('path'),
    fs = require('fs'),

    // Config
    deployDir = path.normalize(__dirname + '/deploy'),
    queue = {};


fs.stat(deployDir,
  function(err, stat) {
    if(err && !err.toString().match(/ENOENT/)) throw err;
    if(stat) {
      startServer();
    } else {
      fs.mkdir(deployDir,
        function(err) {
          if(err) throw err;
          startServer();
        });
    }
  });

function startServer() {
  http.createServer(
    function (req, res) {

      req.setEncoding("UTF8");

      var rawData = [];

      req.on('data',
        function(chunk) {
          if(req.headers['x-github-event'] === 'push') {
            rawData.push(chunk.toString('utf8'));
          }
        });

      req.on('end',
        function() {
          winston.info('rawData.length: '+rawData.length);
          winston.info('rawData'+ rawData.join());

          var dataObject = convert(decodeURIComponent(rawData.join())),
              jsonData = JSON.parse(dataObject['payload']);

          processPush(jsonData);
          res.end();
        });

    }).listen(4050);
  winston.info('Caribou is nibling the hoops at http://127.0.0.1:4050/');

}

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
      gitProcess, repoUrl = data.repository.url,
      selfUpdate = false;

  if(data.repository.name === 'caribou') {
    // Hey that's us - let's go ahead and self update
    repoDir = path.normalize(__dirname);
  }

  fs.stat(repoDir,
    function(err, stat) {
      if(stat) {
        winston.info("git pull " + repoDir + " " + data.ref);
        process.chdir(repoDir);
        gitProcess = spawn('git', ['pull']);
      } else {

        if(data.repository.private) {
          // We need to add in the username and password if a private
          repoUrl = repoUrl.replace('https://github.com/', 'git@github.com:');
        }

        winston.info("git clone " + repoUrl + " " + repoDir);
        gitProcess = spawn('git', ['clone', repoUrl, repoDir]);
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

          process.chdir(repoDir);
          var npm = spawn('npm', ['install']);

          winston.info('Installing dependencies with `npm install`');

          npm.stdout.on('data',
            function(feed) {
              winston.info(feed);
            });

          npm.stderr.on('data',
            function(feed) {
              winston.error(feed);
            });

          npm.on('exit',
            function(code) {
              winston.info('npm install process finished with code: ' + code);
            });


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