var spawn = require('child_process').spawn,
    winston = require('winston');


var method = process.argv[2],
    dir = process.argv[3],
    ref = process.argv[4],
    git;

      git = spawn('git', ['--git-dir='+dir+'/.git', method]);

git.stdout.on('data',
  function(feed) {
    console.log(feed.toString("utf8"));
  });

git.stderr.on('data',
  function(data) {
    console.log(data.toString("utf8"));
  });

git.on('exit',
  function(code) {
    console.log("Git " + method + " finished with exit code: " + code);
  });
