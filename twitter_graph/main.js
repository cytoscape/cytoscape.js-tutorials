"use strict";

document.addEventListener('DOMContentLoaded', function() {
  var username;
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
    },
    animate: false
  });
  var forceLayout = cy.makeLayout({
    name: 'cose',
    animate: false
  });

  function initCy(then) {
    var mainUser = then[0];
    var followers = then[1];

    // main user
    cy.add(parseData(mainUser));

    // followers
    var mainUserId = mainUser.id_str; // saves calls while adding edges
    cy.batch(function() {
      followers.forEach(function(ele) {
        cy.add(parseData(ele));
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

  var submitButton = document.getElementById('submitButton');
  submitButton.addEventListener('click', function() {
    cy.elements().remove();
    var userInput = document.getElementById('twitterHandle').value;
    if (userInput === 'Enter Twitter username') {
      // Default value
      username = 'josephst18';
    } else {
      username = userInput;
    }
    Promise.all(getDataPromise(username)).then(initCy);
  });

  cy.on('select', 'node', function(event) {
    var target = event.cyTarget;
    target.qtip({
      content: {
        text: qtipText(target),
        title: target.data('fullName')
      },
      style: {
        classes: 'qtip-bootstrap'
      }
    });
  });
});

function qtipText(node) {
  var twitterLink = '<a href="http://twitter.com/' + node.data('username') + '">' + node.data('username') + '</a>';
  var following = 'Following ' + node.data('followingCount') + ' other users';
  var location = 'Location: ' + node.data('location');
  var image = '<img src="' + node.data('profilePic') + '" style="float:left;width:48px;height:48px;">';
  var description = '<i>' + node.data('description') + '</i>';

  return image + twitterLink + '<br>' + location + '<br>' + following + '<p><br>' + description + '</p>';
}

function getDataPromise(user) {
  var userPromise = $.ajax({
    url: 'http://127.0.0.1:8000/cache/' + user + '-user.json',
    type: 'GET',
    dataType: 'json'
  });

  var followersPromise = $.ajax({
    url: 'http://127.0.0.1:8000/cache/' + user + '-followers.json',
    type: 'GET',
    dataType: 'json'
  });

  // Express API
  // var expressUserPromise = $.ajax({
  //   async: true,
  //   crossDomain: true,
  //   url: 'http://localhost:3000/twitter/user',
  //   method: 'POST',
  //   headers: {
  //     'cache-control': 'no-cache',
  //     'content-type': 'application/x-www-form-urlencoded'
  //   },
  //   data: {
  //     username: user
  //   }
  // });

  // var expressFollowersPromise = $.ajax({
  //   async: true,
  //   crossDomain: true,
  //   url: 'http://localhost:3000/twitter/followers',
  //   method: "POST",
  //   headers: {
  //     'cache-control': 'no-cache',
  //     'content-type': 'application/x-www-form-urlencoded'
  //   },
  //   data: {
  //     username: user
  //   }
  // });

  return [userPromise, followersPromise];
}

function parseData(user) {
  return {
    data: {
      id: user.id_str,
      username: user.screen_name,
      followerCount: user.followers_count,
      tweetCount: user.statuses_count,
      // following data for qTip
      fullName: user.name,
      followingCount: user.friends_count,
      location: user.location,
      description: user.description,
      profilePic: user.profile_image_url
    }
  };
}
