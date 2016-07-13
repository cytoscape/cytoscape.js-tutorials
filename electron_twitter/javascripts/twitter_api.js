var Twit = require('twit');
var fs = require('fs');
var os = require('os');
// var mkdirp = require('mkdirp');
var path = require('path');
var temp = require('temp'); // use require('temp').track() if cleanup desired
var Promise = require('bluebird');

var userCount = 100; // number of followers to return per call
var preDownloadedDir = path.join(__dirname, '../predownload');
var tempDir = 'cytoscape-electron';
var T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  app_only_auth: true,
  timeout_ms: 60 * 1000
});

var TwitterAPI = function() {};

TwitterAPI.prototype.getUser = function(username) {
  return new Promise(function(resolve, reject) {
    var filePath = path.join(preDownloadedDir, username, 'user.json');
    try {
      var cachedJSON = loadFromDownload(filePath);
      if (cachedJSON) {
        resolve(cachedJSON);
      }
    } catch (error) {
      T.get('users/show', { screen_name: username }, function(err, data) {
        if (err) {
          reject(makeErrorMessage(err));
        }
        logDataToTemp(data, username, 'user.json');
        resolve(data);
      });
    }
  });
};

function readFile(username, fileName) {
  var predownloadPromise = new Promise(function(resolve, reject) {
    var predownloadFileName = path.join(preDownloadedDir, username, fileName);
    fs.readFile(predownloadFileName, function(err, data) {
      if (err) {
        reject(err);
      }
      resolve(JSON.parse(data));
    });
  });
  var cachedPromise = new Promise(function(resolve, reject) {
    var cacheDir = temp.open({ dir: path.join(os.tmpdir(), tempDir) });
    var cachedFileName = path.join(cacheDir, username, fileName);
    fs.readFile(cachedFileName, function(err, data) {
      if (err) {
        reject(err);
      }
      resolve(JSON.parse(data));
    });
  });
  return Promise.any([predownloadPromise, cachedPromise]);
}

TwitterAPI.prototype.getUser2 = function(username) {
  return readFile(username, 'user.json') // checks predownloaded data and cache
    .catch(() => {
      var downloadedData = T.get('users/show', { screen_name: username });
      logDataToTemp(downloadedData, username, 'user.json');
      return Promise.resolve(downloadedData);
    });
};


TwitterAPI.prototype.getFollowers = function(username) {
  return new Promise(function(resolve, reject) {
    var filePath = path.join(preDownloadedDir, username, 'followers.json');
    try {
      var cachedJSON = loadFromDownload(filePath);
      if (cachedJSON) {
        resolve(cachedJSON);
      }
    } catch (error) {
      T.get('followers/list', { screen_name: username, count: userCount, skip_status: true }, function(err, data) {
        if (err) {
          reject(makeErrorMessage(err));
        }
        logDataToTemp(data.users, username, 'followers.json');
        resolve(data.users);
      });
    }
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
  temp.open({ dir: path.join(os.tmpdir(), tempDir, username) }, function(err, info) {
    if (err) {
      console.log('error while recording data');
      console.log(err);
    } else {
      fs.write(info.fd, JSON.stringify(data, null, 4));
      fs.close(info.fd, function(err) {
        console.log('error closing file');
        console.log(err);
      });
    }
  });
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
