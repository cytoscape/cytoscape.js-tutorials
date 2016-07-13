var fs = require('fs');
var path = require('path');
const { ipcRenderer } = require('electron');

var apiButton = document.getElementById('api_submit');
apiButton.addEventListener('click', function() {
  var consumerKey = document.getElementById('consumer-key').value;
  var consumerSecret = document.getElementById('consumer-secret').value;
  if (consumerKey && consumerSecret) {
    var data = 'TWITTER_CONSUMER_KEY=' + consumerKey +
        '\nTWITTER_CONSUMER_SECRET=' + consumerSecret;
    fs.writeFile(path.join(__dirname, '../.env'), data, function(err) {
      console.log('error writing api keys');
      console.log(err);
    });
  }
  // show loading spinner and tell Electron we're ready to disappear when Cy is loaded
  ipcRenderer.send('loading-screen', 'done getting API keys');
});

var exampleButton = document.getElementById('example_submit');
exampleButton.addEventListener('click', function() {
  // show loading spinner and tell Electron we're ready to disappear when Cy is loaded
  ipcRenderer.send('loading-screen', 'user is skipping API key input');
});
