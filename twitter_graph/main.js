"use strict";

document.addEventListener('DOMContentLoaded', function() {
  var username = 'josephst18';
  // TODO: try to get userId from user JSON
  var userId = '371074472';
  var cy = cytoscape({
    container: document.getElementById('cy'),
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(username)',
          'background-color': function(ele) {
            if (ele.data('followerCount') < 200) {
              // http://www.colourlovers.com/palette/4268287/paleta_2
              return '#FFE769';
            }
            return '#C2ED97';
          }
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
      username: data.screen_name
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
});

// from http://stackoverflow.com/questions/14388452/how-do-i-load-a-json-object-from-a-file-with-ajax
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
