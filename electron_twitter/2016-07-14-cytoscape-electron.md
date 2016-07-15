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
In `package.json`, we indicated that `main.js` is the main file of our application.

![tautology club](http://imgs.xkcd.com/comics/honor_societies.png)
[0]

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
Node.js provides ['process.platform'](https://nodejs.org/api/process.html#process_process_platform) for checking the platform the code is running on.
If it's macOS (i.e. darwin), we'll do nothing; otherwise, closing all application windows [`window-all-closed`](http://electron.atom.io/docs/all/#event-window-all-closed) means it's time to close the application with [`app.quit()`](http://electron.atom.io/docs/all/#appquit).

The [`activate`](http://electron.atom.io/docs/all/#event-activate-macos) is another MacOS-specific behavior; it indicates that the app has been activated (i.e. the application is open but a window may not be open).
We're checking for the presence of `win` here despite `createWindow()` creating `loadingWin` because `loadingWin` is short-lived, being destroyed after the user moves on to the graph window.



# Thanks
- [0] Randall Munroe

