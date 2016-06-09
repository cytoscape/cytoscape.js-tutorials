var Twit = require('twit');
var fs = require('fs');

var T = new Twit({
  consumer_key: 'VIP8NsuVgTdAV2EViWQt3PKPH',
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  app_only_auth: true,
  timeout_ms: 60 * 1000
});

var outputFile = 'twitter_api/followers.txt';

function getFollowerPromise(screenName) {
  return T.get('followers/ids', { screen_name: screenName });
}

getFollowerPromise('cytoscape')
  .then(function(result) {
    fs.writeFile(outputFile, result.data.ids);
  });
