var fs = require('fs');
var os = require('os');
var path = require('path');
var Twit = require('twit');
var mkdirp = require('mkdirp');
var Promise = require('bluebird');

var programTempDir = 'cytoscape-electron';
var dotEnvPath = path.join(os.tmpdir(), programTempDir, '.env');

try {
  var dotenvConfig = {
    path: dotEnvPath,
    silent: true
  };
  require('dotenv').config(dotenvConfig); // make sure .env is loaded for Twit
} catch (error) {
  console.log('.env not found');
  console.log(error);
}

var userCount = 100; // number of followers to return per call
var preDownloadedDir = path.join(__dirname, '../predownload');
var T;

try {
  if (process.env.TWITTER_CONSUMER_KEY) {
    T = new Twit({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      app_only_auth: true,
      timeout_ms: 60 * 1000
    });
  }
} catch (error) {
  T = undefined;
  console.log('could not initialize Twit');
  console.log(error);
}

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
    statusText: 'Other error'
  };
}

TwitterAPI.prototype.getAuth = function() {
  return (T && T.getAuth());
};

TwitterAPI.prototype.clearAuth = function() {
  fs.unlinkSync(dotEnvPath);
};

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

module.exports = new TwitterAPI();
