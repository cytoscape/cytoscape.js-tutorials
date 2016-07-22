var fs = require('fs');
var path = require('path');
var os = require('os');
var ipcRenderer = require('electron').ipcRenderer;

// skip loading screen if .env exists
fs.stat(path.join(os.tmpdir(), 'cytoscape-electron/.env'), function(err, stats) {
  if (err) {
    console.log('.env not found');
  } else if (stats && stats.isFile()) {
    document.getElementById('api_input').className = 'hidden'; // hide input fields
    document.getElementById('example_submit').click(); // skip forward with automatic button click
  }
});

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
