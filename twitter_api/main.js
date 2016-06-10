var Twit = require('twit');
var fs = require('fs');

var T = new Twit({
  consumer_key: 'VIP8NsuVgTdAV2EViWQt3PKPH',
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  app_only_auth: true,
  timeout_ms: 60 * 1000
});

function writeFollowers(username) {
  T.get('followers/list', { screen_name: username, count: 200, skip_status: true }, function saveData(err, data) {
    if (err) {
      throw err;
    }
    fs.appendFileSync(username + '-followers.json', JSON.stringify(data.users, null, 4));
    if (data.next_cursor !== 0) {
      T.get('followers/list',
        { screen_name: username, count: 200, skip_status: true, cursor: data.next_cursor },
        saveData
        );
    }
  });
}

function writeUser(username) {
  T.get('users/show', { screen_name: username }, function(err, data) {
    if (err) {
      throw err;
    }
    fs.appendFileSync(username + '-user.json', JSON.stringify(data, null, 4));
  });
}

writeFollowers('cytoscape');
writeUser('cytoscape');
