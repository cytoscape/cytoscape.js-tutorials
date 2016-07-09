var Twit = require('twit');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var Promise = require('bluebird');

var userCount = 100; // number of followers to return per call
var cacheLocation = path.join(__dirname, '../cache');
var T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  app_only_auth: true,
  timeout_ms: 60 * 1000
});

var TwitterAPI = function() {};

TwitterAPI.prototype.getUser = function(username) {
  return new Promise(function(resolve, reject) {
    var filePath = path.join(cacheLocation, username, 'user.json');
    try {
      var cachedJSON = getCachedData(filePath);
      if (cachedJSON) {
        resolve(cachedJSON);
      }
    } catch (error) {
      T.get('users/show', { screen_name: username }, function(err, data) {
        if (err) {
          reject(makeErrorMessage(err));
        }
        logDataToFile(data, filePath);
        resolve(data);
      });
    }
  });
  // OLD
  // var filePath = path.join(cacheLocation, username, 'user.json');
  // try {
  //   var cachedJSON = getCachedData(filePath);
  //   return new Promise(function(resolve, reject) {
  //     if (cachedJSON) {
  //       resolve(cachedJSON);
  //     }
  //     reject(Error("something went wrong reading the cached data"));
  //   });
  // } catch (error) {
  //   return T.get('users/show', { screen_name: username })
  //     .catch(function(err) {
  //       return makeErrorMessage(err);
  //     })
  //     .then(function(result) {
  //     // Log all API calls so tutorial can use cached data
  //       logDataToFile(result.data, filePath);
  //       return result.data;
  //     });
  // }
};

TwitterAPI.prototype.getFollowers = function(username) {
  return new Promise(function(resolve, reject) {
    var filePath = path.join(cacheLocation, username, 'followers.json');
    try {
      var cachedJSON = getCachedData(filePath);
      if (cachedJSON) {
        resolve(cachedJSON);
      }
    } catch (error) {
      T.get('followers/list', { screen_name: username, count: userCount, skip_status: true }, function(err, data) {
        if (err) {
          reject(makeErrorMessage(err));
        }
        logDataToFile(data.users, filePath);
        resolve(data.users);
      });
    }
  });
  // OLD
  // var filePath = path.join(cacheLocation, username, 'followers.json');
  // try {
  //   var cachedJSON = getCachedData(filePath);
  //   return new Promise(function(resolve, reject) {
  //     if (cachedJSON) {
  //       resolve(cachedJSON);
  //     }
  //     reject(Error("something went wrong reading the cached data"));
  //   });
  // } catch (error) {
  //   T.get('followers/list', { screen_name: username, count: userCount, skip_status: true })
  //     .catch(function(err) {
  //       return makeErrorMessage(err);
  //     })
  //     .then(function(result) {
  //       // Log all API calls so tutorial can use cached data
  //       logDataToFile(result.data.users, filePath);
  //       return result.data.users;
  //     });
  // }
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

function logDataToFile(data, filePath) {
  var dirPath = path.dirname(filePath);
  // mkdirp does nothing if dirPath already has folders
  mkdirp.sync(dirPath);

  // async write to file (it's OK for the rest of the program to continue while write happens)
  fs.writeFile(filePath, JSON.stringify(data, null, 4));
}

function getCachedData(dataPath) {
  var cachedJSONStat = fs.statSync(dataPath);
  if (cachedJSONStat.isFile) {
    var cachedData = fs.readFileSync(dataPath);
    return JSON.parse(cachedData);
  }
  // made it here => cachedJSON must not be a file
  throw new Error("not a file");
}

module.exports = new TwitterAPI();
