"use strict";

document.addEventListener('DOMContentLoaded', function() {
  var username = 'josephst18';
  var userId = '371074472';
  var cy = cytoscape({
    container: document.getElementById('cy'),
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(username)'
        }
      }
    ]
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
        username: follower.screen_name
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
    var n = 0;
    cy.layout({
      name: 'concentric',
      concentric: function(node) {
        if (node.data('username') === username) {
          return 100;
        }
        n += 1;
        return n % 20;
      },
      levelWidth: function() {
        return 5;
      }
    });
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
