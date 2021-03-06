// KISS (Keep-It-Simple-Stupid) CI
// Author: S. Eren Bekçe <seb@sebworks.com>

var http = require('http');
var url = require('url');
var sys = require('util');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
var redis_client = require("redis").createClient(),
    redis_lock = require("redis-lock")(redis_client);
var github_webhook_handler = require('github-webhook-handler')
var fs = require('fs');
Tail = require('tail').Tail;
var HttpsProxyAgent = require('https-proxy-agent');

// HTTP/HTTPS proxy to connect to
var proxy = process.env.https_proxy || null;
var agent;
if(proxy != null){
  agent = new HttpsProxyAgent(proxy);
  console.log('using proxy server %j', proxy);
}

const octokit = require('@octokit/rest')({
  agent: agent
});

var args = process.argv.slice(2); //first two params are 'node' and 'kissci.js'
if(args.length < 6) {
  console.log("Usage: node kissci.js <self_base_url> <port> <build_secret> <github_token> <github_owner> <github_repo> [<custom_build_sh_full_path>]");
  process.exit(1);
}

const SELF_BASE_URL=args[0];
const PORT=args[1];
const BUILD_SECRET=args[2];
const GITHUB_TOKEN=args[3];
const GITHUB_OWNER=args[4];
const GITHUB_REPO=args[5];
const FULL_REPO=GITHUB_OWNER+'_'+GITHUB_REPO;
const CLONE_ADDRESS='https://github.com/'+GITHUB_OWNER+'/'+GITHUB_REPO+'.git'
const BUILD_SH_PATH=args.length>=7?args[6]:'./build.sh'

// token (https://github.com/settings/tokens)
octokit.authenticate({
  type: 'token',
  token: GITHUB_TOKEN
});

var webhook_handler = github_webhook_handler({ path: '/webhook', secret: BUILD_SECRET });

function buildSha (sha) {
  var logLoc=SELF_BASE_URL+'/logs?sha='+sha;
  // lock (build) timeout = 15 minutes. If you need more than that, increase this number.
  redis_lock(FULL_REPO, 900000, function(unlock) {
    // clone repo to temp dir
    console.log('Acquired lock, running prepare.sh')
    fs.truncate('logs/'+sha,0,function(){
      var child = spawn('./prepare.sh', [FULL_REPO, CLONE_ADDRESS, sha, BUILD_SH_PATH]);
      child.stdout.on('data', function (data) {
        fs.appendFileSync('logs/'+sha, data);
      });
      child.stderr.on('data', function (data) {
        fs.appendFileSync('logs/'+sha, data);
      });
      child.on('error', function (err) {
        console.log(err);
      });
      child.on('close', function (code) {
        console.log('prepare.sh finished with exit code '+code)
        var obj = {
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          sha: sha,
          target_url: logLoc,
          context: 'kissci'
        };
        if(code != 0){ // failed
          obj.state='error';
          obj.description='Error while building, exited with '+code;
        } else {
          obj.state='success'
          obj.description='OK'
        }
        octokit.repos.createStatus(obj, (error, result) => {
          if(error != null){
            console.log(error)
          } else {
            // console.log(result)
          }
        });
        unlock();
      });
    });
  });
};

webhook_handler.on('push', function (event) {
  console.log('Received a push event for %s to %s, sha: %s',
    event.payload.repository.name,
    event.payload.ref,
    event.payload.after);

  var sha = event.payload.after;
  var logLoc=SELF_BASE_URL+'/logs?sha='+sha;
  console.log('See logs here: '+logLoc)
  // mark commit as pending
  octokit.repos.createStatus({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    sha: sha,
    state: 'pending',
    target_url: logLoc+'&tail=true',
    description: 'Building',
    context: 'kissci'
  }, (error, result) => {
    if(error != null){
      console.log(error)
    } else {
      // console.log(result)
    }
  });

  console.log('Acquiring lock');
  buildSha(sha);
});

webhook_handler.on('error', function (err) {
  console.warn('webhook_handler:', err.message)
});

//We need a function which handles requests and send response
function handleRequest(request, response){
  webhook_handler(request, response, function (err) {
    parsed = url.parse(request.url, true);
    //console.log(parsed);
    if (parsed.pathname == '/logs'){
      var sha = parsed.query.sha;
      if (sha != null){
        var patt = new RegExp("^[A-Za-z0-9]+$");
        var res = patt.test(sha);
        if(res){
          try {
            var tail_p = parsed.query.tail;
            response.writeHead(200, { 'Content-Type':'text/plain; charset=UTF-8', 'Transfer-Encoding':'chunked' });
            //response.setHeader('Transfer-Encoding', 'chunked');
            console.log('Received request for sha: ' + sha);
            // response.write('Coming through!\n');
            if(tail_p){
              var options= {separator: /[\r]{0,1}\n/, fromBeginning: true, follow: true, flushAtEOF: true}
              tail = new Tail("logs/"+sha, options);
              tail.on("line", function(data) {
                // console.log(data);
                response.write(data+'\n');
              });
              tail.on("error", function(error) {
                console.log(error);
                response.end('error');
              });
            } else {
              var file_stream = fs.createReadStream("logs/"+sha);
              file_stream.on("error", function(exception) {
                console.error("Error reading file: ", exception);
              });
              file_stream.on("data", function(data) {
                response.write(data);
              });
              file_stream.on("close", function() {
                response.end();
              });
            }
            return;
          } catch (error) {
            response.end(error.message);
          }
        }
      }
    }
    response.statusCode = 400;
    response.end('Bad request');
  });
}

var server = http.createServer(handleRequest);

server.listen(PORT, function(){
    console.log("Server listening on: http://0.0.0.0:%s", PORT);
});
