var express = require('express');
var router = express.Router();
var Twit = require('twit');
var fs = require('fs');

var userCount = 100; // number of followers to return per call
var T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  app_only_auth: true,
  timeout_ms: 60 * 1000
});

function addCacheFolder() {
  try {
    fs.statSync('public');
  } catch (error) {
    fs.mkdirSync('public');
  }

  try {
    fs.statSync('public/cache');
  } catch (error) {
    fs.mkdirSync('public/cache');
  }
}

/* POST followers. */
router.post('/followers', function(req, res, next) {
  // var followers = []; Only necessary if getting many pages of users
  var username = req.body.username;
  var filePath = 'public/cache/' + username + '-followers.json';
  try {
    // use cached data if available
    var cachedFileStat = fs.statSync(filePath);
    if (cachedFileStat.isFile) {
      var cachedJSON = fs.readFileSync(filePath);
      res.json(JSON.parse(cachedJSON));
    }
  } catch (error) {
    // download data from Twitter
    T.get('followers/list',
      { screen_name: username, count: userCount, skip_status: true },
      function collectData(err, data) {
        if (err) {
          if (err.statusCode === 401) {
            // can't send error status because it breaks promise, so JSON instead
            res.json({ error: true,
                status: err.statusCode,
                statusText: 'User\'s data is private' });
          } else if (err.statusCode === 429) {
            // can't send error status because it breaks promise, so JSON instead
            res.json({ error: true,
                status: err.statusCode,
                statusText: 'Rate limited' });
          }
        } else {
          // Log all API calls so tutorial can use cached data
          addCacheFolder();
          fs.writeFile(filePath, JSON.stringify(data.users, null, 4));

          // Only return a single page to stay under API rate limit
          res.json(data.users);
        }
      });
  }
});

/* POST user information. */
router.post('/user', function(req, res, next) {
  var username = req.body.username;
  var filePath = 'public/cache/' + username + '-user.json';
  try {
    // use cached data if available
    var cachedFileStat = fs.statSync(filePath);
    if (cachedFileStat.isFile) {
      var cachedJSON = fs.readFileSync(filePath);
      res.json(JSON.parse(cachedJSON));
    }
  } catch (error) {
      // need to download data from Twitter
    T.get('users/show', { screen_name: username }, function(err, data) {
      if (err) {
        if (err.statusCode === 401) {
          // can't send error status because it breaks promise, so JSON instead
          res.json({ error: true,
              status: err.statusCode,
              statusText: 'User\'s data is private' });
        } else if (err.statusCode === 429) {
          // can't send error status because it breaks promise, so JSON instead
          res.json(
            { error: true,
              status: err.statusCode,
              statusText: 'Rate limited' });
        }
      } else {
        // Log all API calls so tutorial can use cached data
        addCacheFolder();
        fs.writeFile(filePath, JSON.stringify(data, null, 4));
        res.json(data);
      }
    });
  }
});

module.exports = router;
