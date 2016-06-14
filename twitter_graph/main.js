"use strict";

document.addEventListener('DOMContentLoaded', function() {
  var username = 'josephst18';
  // TODO: try to get userId from user JSON
  var userId = 371074472;
  var cy = cytoscape({
    container: document.getElementById('cy'),
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(username)',
          'width': 'mapData(followerCount, 0, 400, 50, 150)',
          'height': 'mapData(followerCount, 0, 400, 50, 150)',
          'background-color': '#02779E',
          'background-opacity': 'mapData(tweetCount, 0, 2000, 0, 1)'
        }
      }
    ]
  });
  var concentricLayout = cy.makeLayout({
    name: 'concentric',
    concentric: function(node) {
      if (node.data('username') === username) {
        return 100;
      }
      return Math.random() * 20;
    },
    levelWidth: function() {
      return 5;
    }
  });
  var forceLayout = cy.makeLayout({
    name: 'cose'
  });

  // add main user
  fetchJSONFile(username + '-user.json', function(data) {
    var element = {};
    element.data = {
      id: data.id_str,
      username: data.screen_name,
      followerCount: data.followers_count,
      tweetCount: data.statuses_count
    };
    cy.add(element);
  });

  // add followers
  fetchJSONFile(username + '-followers.json', function(data) {
    var followers = [];
    var edges = [];
    for (var i = 0; i < data.length; i++) {
      var follower = data[i];
      var element = {};
      element.data = {
        id: follower.id_str,
        username: follower.screen_name,
        followerCount: follower.followers_count,
        tweetCount: follower.statuses_count
      };
      var edge = {};
      edge.data = {
        id: 'follower-' + follower.id,
        source: follower.id_str,
        target: userId
      };
      followers.push(element);
      edges.push(edge);
    }
    cy.add(followers);
    cy.add(edges);
    // layout
    concentricLayout.run();
  });

  var concentricButton = document.getElementById('concentricButton');
  concentricButton.addEventListener('click', function() {
    concentricLayout.run();
  });

  var forceButton = document.getElementById('forceButton');
  forceButton.addEventListener('click', function() {
    forceLayout.run();
  });

  cy.on('select', 'node', function(event) {
    var target = event.cyTarget;
    target.qtip({
      content: {
        text: '<a href="http://twitter.com/' +
          target.data('username') +
          '">Twitter profile</a>'
      }
    });
  });
});

/**
 * Load a JSON file using AJAX (XMLHttpRequest) and execute callback when done.
 * @param {string} path - path of the JSON file relative to this file
 * @param {function} callback - function to execute once JSON is loaded; is called as function(data) where data is loaded from JSON file
 * @see http://stackoverflow.com/questions/14388452/how-do-i-load-a-json-object-from-a-file-with-ajax
*/
function fetchJSONFile(path, callback) {
  var httpRequest = new XMLHttpRequest();
  httpRequest.overrideMimeType('application/json');
  httpRequest.onreadystatechange = function() {
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        var data = JSON.parse(httpRequest.responseText);
        if (callback) {
          callback(data);
        }
      }
    }
  };
  httpRequest.open('GET', path);
  httpRequest.send();
}
