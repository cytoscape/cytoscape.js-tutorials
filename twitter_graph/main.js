"use strict";

document.addEventListener('DOMContentLoaded', function() {
  var username = 'josephst18';
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
          'background-opacity': 'mapData(tweetCount, 0, 2000, 0.1, 1)'
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

  var userPromise = $.ajax({
    url: 'http://127.0.0.1:8000/' + username + '-user.json',
    type: 'GET',
    dataType: 'json'
  });

  var followersPromise = $.ajax({
    url: 'http://127.0.0.1:8000/' + username + '-followers.json',
    type: 'GET',
    dataType: 'json'
  });

  Promise.all([userPromise, followersPromise]).then(initCy);

  function initCy(then) {
    var mainUser = then[0];
    var mainUserId = mainUser.id_str; // saves calls while adding edges
    var followers = then[1];

    // main user
    cy.add({
      data: {
        id: mainUser.id_str,
        username: mainUser.screen_name,
        followerCount: mainUser.followers_count,
        tweetCount: mainUser.statuses_count
      }
    });

    // followers
    cy.batch(function() {
      followers.forEach(function(ele) {
        cy.add({
          data: {
            id: ele.id_str,
            username: ele.screen_name,
            followerCount: ele.followers_count,
            tweetCount: ele.statuses_count
          }
        });
        cy.add({
          data: {
            id: 'follower-' + ele.id_str,
            source: ele.id_str,
            target: mainUserId
          }
        });
      });
    });

    concentricLayout.run();
  }

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
