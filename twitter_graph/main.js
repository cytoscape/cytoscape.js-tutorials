"use strict";

document.addEventListener('DOMContentLoaded', function() {
  var mainUser;
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
      return 10 - node.data('level');
    },
    levelWidth: function() {
      return 1;
    },
    animate: false
  });
  var forceLayout = cy.makeLayout({
    name: 'cose',
    animate: false
  });

  function addToGraph(then, level) {
    var targetUser = then[0];
    var followers = then[1];

    // target user
    if (cy.nodes('#' + targetUser.id_str).length === 0) {
      // does not yet contain user
      cy.add(parseData(targetUser, level));
    }

    // that user's followers
    var targetId = targetUser.id_str; // saves calls while adding edges
    cy.batch(function() {
      followers.forEach(function(ele) {
        if (cy.nodes('#' + ele.id_str).length === 0) {
          // does not yet contain follower
          // level + 1 since followers are 1 degree out from the main user
          cy.add(parseData(ele, level + 1));
          cy.add({
            data: {
              id: 'follower-' + ele.id_str,
              source: ele.id_str,
              target: targetId
            }
          });
        }
      });
    });
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
      mainUser = 'josephst18';
    } else {
      mainUser = userInput;
    }

    // add first user to graph
    Promise.all(getDataPromises(mainUser)).then(function(then) {
      addToGraph(then, 0);

      // add followers
      try {
        var options = {
          maxLevel: 5,
          usersPerLevel: 3,
          graphFunc: addToGraph
        };
        addFollowersByLevel(1, options);
      } catch (error) {
        console.log('Stopped adding to graph. Error: ' + error);
      }

      // layout graph
      concentricLayout.run();
    });
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

  /**
   * Get followers for the top three users (ranked by followers) at each level.
   *
   * Levels are degrees from the initial node.
   * Example: user specifies 'cytoscape' as the initial node. Cytoscape's followers
   * are level=1, followers of cytoscape's followers are level=2, etc.
   *
   * @param {number} level The level of the graph being added to
   * @param {object} options Constant options for addFollowersByLevel
   * @param {number} options.maxLevel The deepest level to add followers to
   * @param {number} options.usersPerLevel Number of users to add followers at each level
   * @param {function} options.graphFunc Function passed to add JSON data to graph after Promise completes
   */
  function addFollowersByLevel(level, options) {
    var followerCompare = function(a, b) {
      return a.data('followerCount') - b.data('followerCount');
    };
    var topFollowers = cy.nodes()
        .filter('[level = ' + level + ']')
        .sort(followerCompare);

    for (var i = topFollowers.length - 1;
        i >= topFollowers.length - options.usersPerLevel && i >= 0;
        i--) {
      // the last element in collection is the one with the most followers
      // will throw an error once Twitter API limit reached unless using cached data
      Promise.all(getDataPromises(topFollowers[i].data('username')))
        .then(function(then) {
          options.graphFunc(then, level);
          addFollowersByLevel(level + 1, options);
        }, function(err) {
          console.log("Promise returned error: " + err.responseText);
        });
    }
  }
});

function qtipText(node) {
  var twitterLink = '<a href="http://twitter.com/' + node.data('username') + '">' + node.data('username') + '</a>';
  var following = 'Following ' + node.data('followingCount') + ' other users';
  var location = 'Location: ' + node.data('location');
  var image = '<img src="' + node.data('profilePic') + '" style="float:left;width:48px;height:48px;">';
  var description = '<i>' + node.data('description') + '</i>';

  return image + twitterLink + '<br>' + location + '<br>' + following + '<p><br>' + description + '</p>';
}

function getDataPromises(user) {
  // var userPromise = $.ajax({
  //   url: 'http://localhost:8080/cache/' + user + '-user.json',
  //   type: 'GET',
  //   dataType: 'json'
  // });

  // var followersPromise = $.ajax({
  //   url: 'http://localhost:8080/cache/' + user + '-followers.json',
  //   type: 'GET',
  //   dataType: 'json'
  // });
  // return [userPromise, followersPromise];

  // Express API
  var expressUserPromise = $.ajax({
    async: true,
    crossDomain: true,
    url: 'http://localhost:3000/twitter/user',
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    data: {
      username: user
    }
  });

  var expressFollowersPromise = $.ajax({
    async: true,
    crossDomain: true,
    url: 'http://localhost:3000/twitter/followers',
    method: "POST",
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    data: {
      username: user
    }
  });
  return [expressUserPromise, expressFollowersPromise];
}

function parseData(user, level) {
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
      profilePic: user.profile_image_url,
      level: level
    }
  };
}
