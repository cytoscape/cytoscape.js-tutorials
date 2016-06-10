var Twit = require('twit');
var fs = require('fs');

var T = new Twit({
  consumer_key: 'VIP8NsuVgTdAV2EViWQt3PKPH',
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  app_only_auth: true,
  timeout_ms: 60 * 1000
});

function writeFollowers(username) {
  T.get('followers/list', { screen_name: username, count: 200, skip_status: true }, function writeData(err, data) {
    if (err) {
      throw err;
    }
    fs.appendFileSync(username + '.txt', JSON.stringify(data));
    if (data.next_cursor != 0) {
      T.get('followers/list',
        { screen_name: username, count: 200, skip_status: true, cursor: data.next_cursor },
        writeData
        );
    }
  });
}

writeFollowers('cytoscape');
