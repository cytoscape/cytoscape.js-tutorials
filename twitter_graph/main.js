"use strict";

document.addEventListener('DOMContentLoaded', function() {
  var username = 'cytoscape';
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

  // add main user
  fetchJSONFile(username + '-user.json', function(data) {
    var element = {};
    element.data = {
      id: data.id,
      username: data.screen_name
    };
    cy.add(element);
  });
});
