var Twit = require('twit');
var fs = require('fs');
var os = require('os');
var mkdirp = require('mkdirp');
var path = require('path');
var Promise = require('bluebird');

var userCount = 100; // number of followers to return per call
var preDownloadedDir = path.join(__dirname, '../predownload');
var programTempDir = 'cytoscape-electron';
var T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  app_only_auth: true,
  timeout_ms: 60 * 1000
});

var TwitterAPI = function() {};

function readFile(username, fileName) {
  var predownloadPromise = new Promise(function(resolve, reject) {
    var predownloadFileName = path.join(preDownloadedDir, username, fileName);
    fs.readFile(predownloadFileName, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
  var cachedPromise = new Promise(function(resolve, reject) {
    var cacheDir = path.join(os.tmpdir(), programTempDir, username);
    var cachedFileName = path.join(cacheDir, fileName);
    fs.readFile(cachedFileName, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
  return Promise.any([predownloadPromise, cachedPromise]);
}

TwitterAPI.prototype.getUser = function(username) {
  return readFile(username, 'user.json') // checks predownloaded data and cache
    .catch(function() {
      // need to download data from Twitter
      return T.get('users/show', { screen_name: username })
        .then(function(result) {
          // success; record and return data
          var data = result.data;
          logDataToTemp(data, username, 'user.json');
          return Promise.resolve(data);
        }, function(err) {
          // error. probably rate limited or private user
          return Promise.reject(makeErrorMessage(err));
        });
    });
};

TwitterAPI.prototype.getFollowers = function(username) {
  return readFile(username, 'followers.json')
    .catch(function() {
      return T.get('followers/list', { screen_name: username, count: userCount, skip_status: true })
        .then(function(result) {
          var data = result.data.users;
          logDataToTemp(data, username, 'followers.json');
          return Promise.resolve(data);
        }, function(err) {
          // error. probably rate limited or private user
          return Promise.reject(makeErrorMessage(err));
        });
    });
};

function makeErrorMessage(err) {
  if (err.statusCode === 401) {
    // can't send error status because it breaks promise, so JSON instead
    return {
      error: true,
      status: err.statusCode,
      statusText: 'User\'s data is private'
    };
  } else if (err.statusCode === 429) {
    // can't send error status because it breaks promise, so JSON instead
    return {
      error: true,
      status: err.statusCode,
      statusText: 'Rate limited'
    };
  }
  // unknown error
  return {
    error: true,
    status: err.statusCode,
    statusText: "Other error"
  };
}

function logDataToTemp(data, username, fileName) {
  var tempPath = path.join(os.tmpdir(), programTempDir, username);
  var filePath = path.join(tempPath, fileName);
  try {
    mkdirp.sync(tempPath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
  } catch (error) {
    console.log('could not write data');
    console.log(error);
  }
}

function loadFromDownload(dataPath) {
  var cachedJSONStat = fs.statSync(dataPath);
  if (cachedJSONStat.isFile) {
    var cachedData = fs.readFileSync(dataPath);
    return JSON.parse(cachedData);
  }
  // made it here => cachedJSON must not be a file
  throw new Error("not a file");
}

module.exports = new TwitterAPI();
