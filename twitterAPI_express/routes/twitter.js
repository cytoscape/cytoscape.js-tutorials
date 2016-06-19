var express = require('express');
var router = express.Router();
var Twit = require('twit');
var fs = require('fs');

var T = new Twit({
  consumer_key: 'VIP8NsuVgTdAV2EViWQt3PKPH',
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  app_only_auth: true,
  timeout_ms: 60 * 1000
});

/* POST followers. */
router.post('/followers', function(req, res, next) {
  // var followers = []; Only necessary if getting many pages of users
  var username = req.body.username;
  fs.readFile('public/cache/' + username + '-followers.json', function(err, fd) {
    if (err === null) {
      // file exists
      res.json(JSON.parse(fd));
    } else {
      // need to get data from Twitter
      T.get('followers/list',
        { screen_name: username, count: 200, skip_status: true },
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
            fs.writeFile('public/cache/' + username + '-followers.json', JSON.stringify(data.users, null, 4));

            // Only return a single page to stay under API rate limit
            res.json(data.users);

            // Uncomment to return all pages
            // followers = followers.concat(data.users);
            // if (data.next_cursor === 0) {
            //   res.json(followers);
            // } else {
            //   T.get('followers/list',
            //     { screen_name: username, count: 200, skip_status: true, cursor: data.next_cursor },
            //     collectData);
            // }
          }
        });
    }
  });
});

/* POST user information. */
router.post('/user', function(req, res, next) {
  var username = req.body.username;
  fs.readFile('public/cache/' + username + '-user.json', function(err, fd) {
    if (err === null) {
      // file exists
      res.json(JSON.parse(fd));
    } else {
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
          fs.writeFile('public/cache/' + username + '-user.json', JSON.stringify(data, null, 4));
          res.json(data);
        }
      });
    }
  });
});

module.exports = router;
