var Twit = require('twit');

var T = new Twit({
  consumer_key: 'VIP8NsuVgTdAV2EViWQt3PKPH',
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: '371074472-cLqYUGbYB5q9hx9cl5KhiaeW7nzo2MypXbMJ7s53',
  access_token_secret: process.env.TWITTER_ACCESS_SECRET,
  timeout_ms: 60 * 1000
});


