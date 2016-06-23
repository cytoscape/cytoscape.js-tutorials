---
layout: post
title: Graphing a social network
subtitle: Using Twitter and Cytoscape.js to visualize social influence
tags:
- tutorial
---

# Introduction

This tutorial is the third part in a series of tutorials about [Cytoscape.js](http://js.cytoscape.org) written by [Joseph Stahl[(http://josephstahl.com/) for Google Summer of Code 2016.
For readers new to Cytoscape.js, [part 1]({% post_url 2016-05-24-getting-started %}) and [part 2]({% post_url 2016-05-30-glycolysis %}) are recommended reading.

Due to the [Twitter API](https://dev.twitter.com/rest/public) being rate-limited, this tutorial will use existing data.
**This means that when running the graph, you *must* specify cytoscape as the Twitter username on the webpage**.
For readers interested in using their own data, I've made a [Node.js server available](https://github.com/cytoscape/cytoscape.js-tutorials/tree/master/twitterAPI_express) with [instructions in README.md](https://github.com/cytoscape/cytoscape.js-tutorials/blob/master/twitterAPI_express/README.md).

In this tutorial, I will focus on loading elements into Cytoscape.js from JSON files that may be located on other servers.
Additionally, I will cover switching between layouts, changing individual node appearance, and using extensions.  

# Getting ready

Like before, we'll start with `index.html` so that the graph has an element to draw itself within.

```html
<!doctype html>
<html>
<head>
    <meta charset='utf-8'></meta>
    <title>Tutorial 3: Twitter</title>
    <script src='assets/cytoscape.js'></script>
    <script src='assets/jquery-2.2.4.js'></script>
    <script src='main.js'></script>
</head>
<style>
    #cy {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0px;
        left: 0px;
    }
</style>
<body>
    <div id='cy'></div>
</body>
``` 

**Note that `cytoscape.js` is now in an `assets/` folder.**
[Download the most recent version of Cytoscape.js](http://js.cytoscape.org) and unzip `cytoscape.js` to the `assets/` folder.
Do the same for [jQuery 2](https://code.jquery.com/), which will be used for downloading JSON data.
As this tutorial progresses many more Javascript files will be added so we'll place them in `assets/` to keep things organized.

Now it's time to start with `main.js`.
Like in the previous tutorials, we must wait for DOM layout to finish before giving Cytoscape.js a container.
To accomplish this, we'll again turn to [`DOMContentLoaded`](https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded).

```javascript
"use strict";
document.addEventListener('DOMContentLoaded', function() {
  var mainUser;
  var cy = window.cy = cytoscape({
    container: document.getElementById('cy')
  });
});
```

`mainUser` refers to the name of the Twitter user the graph will be built around.
The value will be set later by getting the value of an input field.

`var cy = window.cy = cytoscape({ ... })` is the standard Cytoscape.js initialization pattern, with a slight modification (`window.cy`) to make this instance of Cytoscape.js visible globally to help with debugging.

# Adding the first user

## The HTML side

First, we'll add an input field and submit button to `index.html` to get the name of a Twitter user.

```html
<!doctype html>
<html>
<head>
    <meta charset='utf-8'></meta>
    <title>Tutorial 3: Twitter</title>
    <script src='assets/cytoscape.js'></script>
    <script src='main.js'></script>
</head>
<style>
    #cy {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0px;
        left: 0px;
    }
    input[type='button'] {
        width: 100%;
    }
    #userSelection {
        position: absolute;
        top: 5%;
        left: 2%;
        width: 10%;
    }
</style>
<body>
    <div id='cy'></div>
    <div id='userSelection'>
        <input type='text' id='twitterHandle' placeholder="Twitter username">
        <input type='button' id='submitButton' value='Start graph'>
    </div>
</body>
``` 

Here we've made changes to the CSS and added a new `<div>` element.
It should look like this: 
![input buttons]({{site.baseurl}}/public/demos/twitter-graph/screenshots/input_button.PNG)

Now to get this button to do something when clicked, we'll turn back to `main.js`

## The JS side

```javascript
  var submitButton = document.getElementById('submitButton');
  submitButton.addEventListener('click', function() {
    cy.elements().remove();
    var userInput = document.getElementById('twitterHandle').value;
    if (userInput) {
      mainUser = userInput;
    } else {
      // default value
      mainUser = 'cytoscape';
    }
  });
```

This code should be placed within the `DOMContentLoaded` block of `main.js`.
Here the submit button is selected, then given an action.
Currently the only action performed is clearing the graph (useful for when a user tries several users in a row without reloading the page).
Before we can go further here, we need to write a few functions to use.

# Functions for adding nodes

A few functions come to mind: 

- Getting data about `mainUser` and the followers of `mainUser`
- Adding `mainUser` to the graph
- Adding the followers of `mainUser` to the graph
- Connecting `mainUser` and his or her followers
- Go out a level and repeat, this time with the top three followers of `mainUser`

A pattern emerges here; getting data about a user and her or his followers is done several times so we'll make that into a method.
Similarly, adding followers and connecting to an existing user is also a good fit for a method.

When we are moving out a level and getting the top followers of `mainUser`, we need a way to make sure the followers we're sorting are recently added.
In other words, there's no point in finding a several-million-follower user early on and continually ranking them first.
Instead, we want to focus on new users, such that after we've populated "level 2" (i.e. the followers of `mainUser`'s followers) we will no longer examine level 1.

With this in mind, we can define interfaces for our new functions:

- `getTwitterPromise(targetUser)` takes one argument and will return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) (to be covered in detail soon!)
  - `targetUser`: the user (as an ID string) whose followers will be requested from Twitter 
- `addToGraph(targetUser, followers, level)` takes three arguments
  - `targetUser`: like before, the user whose followers are being added
  - `followers`: an array of follower objects to be added to the graph
  - `level`: an integer; refers to the degrees out from the initially specified user and helps to prevent the same users from coming up during follower ranking

## getTwitterPromise(targetUser)

Since this function does not rely on the `cy` object at all, it will be located outside of the `DOMContentLoaded` listener.

```javascript
function getTwitterPromise(targetUser) {
  // Use cached data
  var userPromise = $.ajax({
    url: '(http://blog.js.cytoscape.org/public/demos/twitter-graph/cache' + targetUser + '-user.json',
    type: 'GET',
    dataType: 'json'
  });

  var followersPromise = $.ajax({
    url: 'http://blog.js.cytoscape.org/public/demos/twitter-graph/cache/' + targetUser + '-followers.json',
    type: 'GET',
    dataType: 'json'
  });

  return Promise.all([userPromise, followersPromise])
    .then(function(then) {
      return {
        user: then[0],
        followers: then[1]
      };
    });
}
```

*If you're following along and running your own copy of the API, modify the request URL (likely to `localhost:3000/twitter/`), change from `GET` to `POST`, and add `data: { username: targetUser }` to make the request properly.* 

For those unfamiliar with [jQuery](https://jquery.com/), it's a JavaScript library that can help us with asynchronously downloading JSON files (in this case, cached Twitter data).
Additionally, it'll be useful for adding an extension to the graph later.

The `return` statement is undoubedtly the most interesting part of this statement; it will return a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) object.
Some work has already been done in this function; rather than returning an array of Promises (ex: `[userPromise, followersPromise]`), a single Promise is returned.
[`Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) is a method for coalescing many Promises into a single promise.
Here, we are using it to return a Promise which will resolve when both of jQuery's AJAX calls have resolved.
[`.then(function(then) { ... })`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then) is a method for Promises which is called when `Promise.all()` is fulfilled (also known as resolved) and like `Promise.all()`, returns a Promise.
Since `Promise.all()` was given an array of two Promises, it will resolve to two values in `.then()`, which are stored in an object as `user` and `followers` properties.
In short, `Promise.all()` takes two Promises and will return one Promise which is then given to `Promise.then()`, which also returns a Promise.
This one Promise, when successfully fulfilled, will have its valued passed to whatever function is specified in `getTwitterPromise(username).then(myFunction)`.
The value is already known, since we specified it as the `{ user: then[0], followers: then[1] }` object.

Confused yet? Hopefully this will make more sense when you see it in action back in the `submitButton` function.

## addToGraph(targetUser, followers, level)

# TODO
- Write addToGraph section
- Return to submitButton to tie this all together
- Add style to the graph (cover mapData)
- Layout buttons
- Layout functions
  - Running the layout function when button is clicked
- Extensions (qTip)
- Try other force-directed layout options