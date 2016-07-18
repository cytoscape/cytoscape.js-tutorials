var fs = require('fs');
var path = require('path');
var os = require('os');
const { ipcRenderer } = require('electron');

var apiButton = document.getElementById('api_submit');
apiButton.addEventListener('click', function() {
  var consumerKey = document.getElementById('consumer-key').value;
  var consumerSecret = document.getElementById('consumer-secret').value;
  if (consumerKey && consumerSecret) {
    var data = 'TWITTER_CONSUMER_KEY=' + consumerKey +
        '\nTWITTER_CONSUMER_SECRET=' + consumerSecret;
    try {
      var tmpDir = path.join(os.tmpdir(), 'cytoscape-electron');
      fs.mkdirSync(tmpDir);
      fs.writeFileSync(path.join(tmpDir, '.env'), data);
    } catch (error) {
      console.log('error writing api keys');
      console.log(error);
    }
  }
});

var submissionButtons = document.getElementById('submission_buttons');
submissionButtons.addEventListener('click', function(event) {
  // events will bubble up from either button click
  if (event.target === document.getElementById('api_submit')) {
    ipcRenderer.send('loading-screen', 'done getting API keys');
  } else if (event.target === document.getElementById('example_submit')) {
    ipcRenderer.send('loading-screen', 'user is skipping API key input');
  }
  document.getElementById('loading').className = ""; // unhide loading spinner

  event.stopPropagation();
});
