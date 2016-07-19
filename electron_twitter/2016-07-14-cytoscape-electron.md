---
layout: post
title: Desktop applications with Cytoscape.js and Electron
subtitle: Turning Tutorial 3 into a cross platform desktop application
tags:
- tutorial
---

# Introduction

This tutorial is the fourth part in a series of tutorials about [Cytoscape.js](http://js.cytoscape.org) written by [Joseph Stahl](http://josephstahl.com/) for Google Summer of Code 2016.
It builds upon the previous tutorials, especially [part 3]({% post_url 2016-07-04-social-network %}).
For readers unfamiliar with Cytoscape.js, it's recommended to start with [part 1]({% post_url 2016-05-24-getting-started %}) and progress from there.

Previous tutorials have focused on using Cytoscape.js in the browser.
However, projects such as [Electron](http://electron.atom.io/) have made it possible to run web apps on the desktop, with full access to the resources available to native applications, such as file system access.
Additionally, Electron allows us to overcome a significant limitation in the previous tutorial: running into API limits with Twitter.
Because Electron uses [Node.js](https://nodejs.org/en/), we can use packages such as [Twit](https://github.com/ttezel/twit) for getting data from Twitter while the program runs.
What would have formerly required a static web page and an API process running on a service such as Heroku can now all be done locally with Electron.

Because this tutorial reuses a lot of the code from Tutorial 3, the main focus will be on changes made to run Cytoscape.js with Electron.
I wrote Tutorial 3 with the possibility of later downloading data in real time so very few changes will need to be made to run the graph with Twit.

# Setting up the environment

The nature of this tutorial (being a desktop application instead of a web app) necessitates more [yak shaving](http://www.hanselman.com/blog/YakShavingDefinedIllGetThatDoneAsSoonAsIShaveThisYak.aspx) than previous tutorials.
Luckily, a few tools will make quick work of this.

## Node.js (and npm)

First of all, create a directory for this tutorial. `electron_twitter` will do.
Next, we'll need to install [Node.js](https://nodejs.org/en/download/).
For the sake of ensuring compatibility with this tutorial, I recommend [the current version](https://nodejs.org/en/download/current) (6.3.0 at time of writing) but based on a quick glance at Node.js API docs I don't believe I'm using any brand new features.

Once Node.js is installed, open a shell and `cd electron_twitter`.
To make sure everything is set up properly, run `node -v` and `npm -v`.
You should get `6.3.0` and `3.10.3`, respectively. 

Now that Node.js and npm are working, we can install the packages we'll use in this tutorial.
While package managers such as [bower](https://bower.io/) could technically have been used in previous tutorials—Cytoscape.js is listed—it adds complexity to the tutorial.
In this case, using the packages installed by npm is easy as `var cytoscape = require('cytoscape');`.

### package.json

`npm install` will automatically install all packages in a `package.json` file located in the root of `electron_twitter`.
We'll take advantage of this to install all our packages at once.
Open your favorite editor and create a new `package.json` with the following contents: 

```javascript
{
  "name": "twitter-electron",
  "version": "0.1.0",
  "main": "main.js",
  "dependencies": {
    "bluebird": "^3.4.1",
    "cytoscape": "^2.7.4",
    "cytoscape-qtip": "^2.4.0",
    "dotenv": "^2.0.0",
    "jquery": "^2.2.4",
    "mkdirp": "^0.5.1",
    "qtip2": "^2.2.0",
    "twit": "^2.2.4"
  },
  "devDependencies": {
    "electron-prebuilt": "^1.2.5"
  },
  "scripts": {
    "start": "node_modules/.bin/electron ."
  }
}
```

I'll explain the packages as we get to them but a few should already be recogniziable.
For example, `cytoscape`, `cytoscape-qtip`, `jquery`, and `qtip2` all correspond to the JavaScript files downloaded in Tutorial 3.
A lot easier than hopping between websites to download all the files, unzip them, and make sure versions match!

The numbers after each package are for [semantic versioning](http://semver.org/), a wonderful system that increments version numbers predictably in response to patchs, minor updates, and major updates.
The carat (^) before each version indicates that each package can be updated to the most recent patch but no minor or major version upgrades.
This is necessary because some package depend on specific versions of others; for example, `cytoscape-qtip` requires a specific `qtip` version, which in turn requires a specific `jquery` version.

Once the file is done and in the root of `electron_twitter/`, run `npm install` and you should see npm taking care of downloading and installing each package.

# Electron

Now that the environment is set up, we can get to work! 
First, we'll need a file for Electron to load at startup.
In `package.json`, we indicated that `main.js` is the [main file](https://xkcd.com/703/) of our application.

Create a `main.js` file for Electron to use.

```javascript
const electron = require('electron');
const { app } = electron;
const { BrowserWindow } = electron;
const { ipcMain } = electron;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let loadingWin;

function createWindow() {
  // Create the browser window.
  loadingWin = new BrowserWindow({ width: 800, height: 600 });
  // and load the loading screen
  loadingWin.loadURL(`file://${__dirname}/loading.html`);
  loadingWin.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    loadingWin = null;
  });
}

ipcMain.once('loading-screen', (event, arg) => {
  console.log(arg);
  // can't create window until user has clicked submit button because Twit needs API key from .env
  win = new BrowserWindow({ width: 800, height: 600, show: false });
  win.loadURL(`file://${__dirname}/index.html`);
  win.once('ready-to-show', () => {
    win.show();
    loadingWin.close();
  });
  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null;
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});
```

*Note: this is borrowed heavily from Electron's [quick start guide](http://electron.atom.io/docs/tutorial/quick-start/), which provides excellent boilerplate for a simple app such as this one.*

The first six statements are all initialization, first of the Electron specific componenets, then of the two windows we want to persist through the application's lifecycle.

## createWindow()

`createWindow()` will create the loading window rather than the Cytoscape.js window.
This allows a user to input an API key if desired; also, it gives us an opportunity to display a loading spinner while the graph window remains hidden and loading.
[`loadURL()`](http://electron.atom.io/docs/api/web-contents/#webcontentsloadurlurl-options) loads the loading screen for us.
Now the uses of Electron and Node.js should be more apparent—instead of a browser running JavaScript, we've written JavaScript that will run a browser!

## Listening to events: ipcMain.once()

This listener is the biggest change between this code Electron's Quick Start `main.js`. 
When a button on the loading page is clicked (not yet covered), the page will emit an event which `main.js` acts on.
Specifically, the event will indicate that the user is ready to move on the graph.
At this point, the API key for Twitter will have either been input or skipped; either way, we can move forward and let Twit handle a missing or incorrect API key.

Like before, we'll create a new [`BrowserWindow`](http://electron.atom.io/docs/api/browser-window/#new-browserwindowoptions), only this time hidden with `show: false`.
The `.loadURL()` function is used again, this time to load the primary page, with Cytoscape.js.
This way, we can display a loading spinner while the page loads (providing a smoother experience).
The window will emit it's own event once loading is done, this time a [`ready-to-show`](http://electron.atom.io/docs/api/browser-window/#using-ready-to-show-event) event that allows us to display the graph without any worry of page-flickering while loading.
We'll unhide the new window with [`win.show()`](http://electron.atom.io/docs/api/browser-window/#winshow) and close the loading window with [`loadingWin.close()`](http://electron.atom.io/docs/api/browser-window/#winclose).
Finally, we'll add a listener for `closed` events to this new window, just like we did for the loading window.
All that we need to do is set `win = null` so that the window may be garbage collected.

## The rest of main.js

A few more lines are necessary to round out `main.js`.
We've writen a function to create a loading window but not yet provided a way to execute that function.
Just like event listeners for windows, Electron has an event listener for the pp becoming ready, [`app.on('ready', createWindow)`](http://electron.atom.io/docs/all/#event-ready).
Here, we'll passing `createWindow()` as the function to run when the app is done loading.

MacOS handles application lifecycles differently than Windows or Linux; applications will stay "loaded" until the application has been quit, even if all windows are closed.
With that in mind, we only want the following code code to execute on non-MacOS systems.
Node.js provides [`process.platform`](https://nodejs.org/api/process.html#process_process_platform) for checking the platform the code is running on.
If it's macOS (i.e. `darwin`), we'll do nothing; otherwise, closing all application windows [`window-all-closed`](http://electron.atom.io/docs/all/#event-window-all-closed) means it's time to close the application with [`app.quit()`](http://electron.atom.io/docs/all/#appquit).

[`activate`](http://electron.atom.io/docs/all/#event-activate-macos) is another MacOS-specific behavior; it indicates that the app has been activated (i.e. the application is open but a window may not be open).
We're checking for the presence of `win` here despite `createWindow()` creating `loadingWin` because `loadingWin` is short-lived, being destroyed after the user moves on to the graph window.

# Loading screen

`main.js` needs a page to load; we'll write that now.

```html
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8">
  <title>Tutorial 4</title>
  <link href="css/normalize.css" rel="stylesheet" type="text/css" />
  <link href="css/skeleton.css" rel="stylesheet" type="text/css" />
  <link href="css/font-awesome.min.css" rel="stylesheet" type="text/css" />
  <link href="css/graph_style.css" rel="stylesheet" type="text/css" />
</head>

<body>
  <div id="loading" class="hidden">
    <span class="fa fa-refresh fa-spin"></span>
  </div>

  <div class="container">
    <div class="row">
      <div class="six columns">
        <label for="consumer-key">Twitter consumer key</label>
        <input class="u-full-width" placeholder="abc123" id="consumer-key" type="text">
      </div>
      <div class="six columns">
        <label for="consumer-secret">Twitter consumer secret</label>
        <input class="u-full-width" placeholder="xyz890" id="consumer-secret" type="text">
      </div>
      <div id="submission_buttons">
        <input class="button-primary" value="Submit" id="api_submit" type="button">
        <input class="button" value="Use example data" id="example_submit" type="button">
      </div>
    </div>
</body>

<script>
  require('./javascripts/loading.js');

</script>

</html>
```

## <head>

Readers who have looked at the [Glycolysis]({% post_url 2016-06-08-glycolysis %}) tutorial may recognzie two of the stylesheets mentioned, [skeleton](http://getskeleton.com/) and [normalize](https://necolas.github.io/normalize.css/).
[Download the .zip from getskeleton.com](http://getskeleton.com/) and unzip to `/css`.
Next, we'll borrow the loading spinner [tutorial 3]({% post_url 2016-07-04-social-network %}), which means bringing in [Font Awesome](http://fontawesome.io/) again.
[Download from Font Awesome](http://fontawesome.io/) and extract the `/font` folder to the project root and `font-awesome.min.css` to `/css`.
If all this downloading is getting tedious, feel free to copy from [this project on GitHub](https://github.com/cytoscape/cytoscape.js-tutorials/tree/master/electron_twitter).
Finally, there's our own style sheet, also in the `/css/` folder; I'll go over its contents later on but I encourage you to skip down and take a look at the parts used in `loading.html`.

## <body>

We start out with a `<div>` element for our loading spinner with the corresponding `<span>` element.
Unlike in Tutorial 3, the loading spinner starts out hidden (while the API key is being entered) and is unhidden when the graph starts loading and before the loading window is closed.

Next, we'll add `<div class="container">`, indicating that we've started to use Skeleton.
Skeleton provides a 12-column grid, so by setting boxes to 6 columns with `<div class="six columns"> we can ensure that input boxes are equally sized.
The inclusion of `<div class="row">` will keep the input boxes normally on the same line, although will stack them if the window becomes too narrow.
Each input field, one for `consumer-key` and one for `consumer-secret`, are made the full width (i.e. six columns) with `u-full-width`.

With the input buttons done, we can close the `class="row"` div element and make a new container for the submission buttons.
The new element is given its own ID, `"submission_buttons"`, which will be useful for selecting both buttons when handling click events.
There are two submission buttons, one of which will use the information entered in the API input boxes and one of which will discard the input.
This allows users without a Twitter API key to still use the application with pre-downloaded data while users with an API key can analyze unique users.

## That final <script> tag

Back in `main.js`, we created a listener that would load the graph when an event was received from the loading screen.
If the API button is clicked, the consumer key and consumer secret entered will be saved to disk.
These events are dispatched when a user clicks the API submission buttons (either providing a key or going ahead with sample data).
In both cases, the next step to take is to dispath an event so that Electron can proceed with loading the graph window.
Because this script deals with the page (rather than Electron, like with `main.js`), we'll name it `javascripts/loading.js`.

```javascript
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
```

Three Node.js modules are necessary, plus `ipcRenderer` from Electron for dispatching events.
Because of the special behavior required of `apiButton` (saving data to disk), it requires its own event listener.
We'll take the values of `consumer-key` and `consumer-secret` and concatenate them into a single string, provided that both have been provided.
Writing to disk is done with Node.js's [fs.writeFileSync()](https://nodejs.org/dist/latest-v6.x/docs/api/fs.html#fs_fs_writefilesync_file_data_options)—necessary because we don't want the graph to start loading until we've recorded our API keys!
Additionally, we'll create a directory in the operating system's temporary directory to hold our files.

Putting both buttons within the same `<div>` element will save us some time now.
Because the action following recording the API key to disk is the same for both buttons—telling Electron we're done—we can use the same event handler for both.
In JavaScript, events "bubble up" meaning that an element's event will be handled not only by that element's event handler (if one exists) but by each of its parents in the DOM hierarchy.
In our case, a `'click'` event on either button will bubble up `submissionButtons`'s event listener, even though it may have already gone through `apiButton`'s event listener.

While bubbling up, events keep their `target` property constant, which allows determine which button was clicked and the message content changed depending on event source.
This doesn't matter because `main.js` doesn't care what message was received, only that event *was* received.

To finish the listener, we'll unhide the loading spinner.
Although this can be done with jQuery, removing a single class from an element is easy enough by setting that element's class name to an empty string.

I added a final line, [`event.stopPropagation()`](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation) which will prevent any other event handlers from "seeing" the button click.
This doesn't change any behavior because there are no other event listeners but fits nicely with the discussion of event bubbling.


# index.html

Once `loading.js` dispatches an event, `main.js` will take care of creating a new window containing `index.html` and unhiding it when loading is finished—so it's a great time to discuss `index.html`!

```html
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8">
  <title>Tutorial 4</title>
  <link href="css/normalize.css" rel="stylesheet" type="text/css" />
  <link href="css/skeleton.css" rel="stylesheet" type="text/css" />
  <link href="css/jquery.qtip.min.css" rel="stylesheet" type="text/css" />
  <link href="css/font-awesome.min.css" rel="stylesheet" type="text/css" />
  <link href="css/graph_style.css" rel="stylesheet" type="text/css" />
  <script>
    require("./javascripts/renderer.js");

  </script>
</head>

<body>
  <div id="full">
    <div class="container">

      <div class="row">
        <h1>Tutorial 4</h1>
      </div>

      <div class="row">
        <input type="text" id="twitterHandle" placeholder="Username (leave blank for cytoscape's Twitter profile)">
      </div>

      <div class="row">
        <div class="six columns">
          <input type="button" class="button-primary" id="submitButton" value="Start graph" type="submit">
        </div>
        <div class="six columns">
          <input type="button" class="button" id="layoutButton" value="Redo layout">
        </div>
      </div>

    </div>

    <div id="cy"></div>
  </div>
</body>

</html>
```

## <head>

`<head>` is almost identical to the `<head>` of `loading.html`.
The only change is the inclusion of qTip's stylesheet to help with styling qTip boxes.
Unlike previous tutorials, none of the JavaScript files for Cytoscape.js or qTip need to be included because they can be loaded with `require()` 
This time, we'll load `renderer.js` in `<head>` because all DOM-sensitive code within `renderer.js` is loaded within an event listener which waits for `DOMContentLoaded`, as in previous tutorials.

## <body>

All elements in `<body>` are wrapped within `<div id="full">`, which we'll use later for a [flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout/Using_CSS_flexible_boxes) powered layout.
Using flexible boxes allows us to give Cytoscape.js 100% of the remaining space after our Skeleton-related elements are laid out.
The [Skeleton](http://getskeleton.com/) framework is used again here to help with layout and appearance, so we'll again use the classes provided, such as `six columns`, 'row', and `container`.
The final element in our `full` flexbox is, as in every previous tutorial, the `cy` element which will hold our graph. 


# twitter_api.js

Before I cover the `renderer.js` file we just `require()`-ed, it's necessary to discuss `twitter_api.js`, which will be used heavily by `renderer.js` to retrieve data from Twitter.
`twitter_api.js` is relatively complex so I'll cover it in sections.

```javascript
var fs = require('fs');
var os = require('os');
var path = require('path');
var Twit = require('twit');
var mkdirp = require('mkdirp');
var Promise = require('bluebird');

var programTempDir = 'cytoscape-electron';

try {
  var dotenvConfig = {
    path: path.join(os.tmpdir(), programTempDir, '.env'),
    silent: true
  };
  require('dotenv').config(dotenvConfig); // make sure .env is loaded for Twit
} catch (error) {
  console.log('.env not found');
  console.log(error);
}

var userCount = 100; // number of followers to return per call
var preDownloadedDir = path.join(__dirname, '../predownload');
var T;
```

First, we load our modules with Node.js's [`require()`](https://nodejs.org/api/modules.html) function. 
We'll be using:

- [`fs`](https://nodejs.org/dist/latest-v6.x/docs/api/fs.html), [`os`](https://nodejs.org/dist/latest-v6.x/docs/api/os.html), and [`path`](https://nodejs.org/dist/latest-v6.x/docs/api/path.html): all built-in Node.js modules
- [`Twit`](https://github.com/ttezel/twit): the heart of `twitter_api.js`; handles interactions with Twitter's REST API.
- [`mkdirp`](https://github.com/substack/node-mkdirp): a Node equivalent of `mkdir -p`; can create nested folders with a single call
- [`bluebird`](http://bluebirdjs.com/docs/getting-started.html): implementation of JavaScript Promises, used for asynchronous interactions with Twitter's API

Next, we set up a few variables: 

- `programTempDir = 'cytoscape-electron'`:   

# renderer.js

`index.html` was fairly straightforward because almost all work in done in `renderer.js`, which is loaded with `require()` because of the Node.js environment.
Similar to `loading.js`, `renderer.js` goes in `javascripts/` because it deals with an HTML page rather than Electron.

`renderer.js` is far larger than previous JavaScript files, so I'll cover it in sections.  

```javascript
var twitter = require('./twitter_api.js');
var cytoscape = require('cytoscape');
var Promise = require('bluebird');
var jQuery = global.jQuery = require('jquery');
var cyqtip = require('cytoscape-qtip');
const shell = require('electron').shell;

jQuery.qtip = require('qtip2');
cyqtip(cytoscape, jQuery); // register extension
```

Starting with the top of the document, we'll load a number of other JavaScript files.
`twitter` is loaded from our own Twitter 




# Thanks


