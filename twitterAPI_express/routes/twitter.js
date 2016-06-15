var express = require('express');
var router = express.Router();
var Twit = require('twit');

var T = new Twit({
  consumer_key: 'VIP8NsuVgTdAV2EViWQt3PKPH',
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  app_only_auth: true,
  timeout_ms: 60 * 1000
});

/* POST followers. */
router.post('/followers', function(req, res, next) {
  var followers = [];
  var username = req.body.username;
  T.get('followers/list',
    { screen_name: username, count: 200, skip_status: true },
    function collectData(err, data) {
      if (err) {
        res.status(500).send('Could not get user data');
      } else {
        followers = followers.concat(data.users);
        if (data.next_cursor === 0) {
          res.send(JSON.stringify(followers, null, 4));
        } else {
          T.get('followers/list',
            { screen_name: username, count: 200, skip_status: true, cursor: data.next_cursor },
            collectData);
        }
      }
    });
});

/* POST user information. */
router.post('/user', function(req, res, next) {
  var username = req.body.username;
  T.get('users/show', { screen_name: username }, function(err, data) {
    if (err) {
      res.status(500).send(undefined);
    } else {
      res.send(JSON.stringify(data, null, 4));
    }
  });
});

module.exports = router;
