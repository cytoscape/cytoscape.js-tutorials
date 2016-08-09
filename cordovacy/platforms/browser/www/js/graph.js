var apiPath = 'https://en.wikipedia.org/w/api.php';

$(document).ready(function() {
var cy = window.cy = cytoscape({
  container: document.getElementById('cy'),
  layout: {
    name: 'grid'
  },
  style: [
    {
      selector: 'node',
      style: {
        'label': 'data(id)'
      }
    }
  ]
});

var createRequest = function(pageTitle) {
  var settings = {
    'url': apiPath,
    'jsonp': 'callback',
    'dataType': 'jsonp',
    'data': {
      'action': 'query',
      'titles': pageTitle,
      'prop': 'links',
      'format': 'json'
    },
    'xhrFields': { 'withCredentials': true },
    'headers': { 'Api-User-Agent': 'Cytoscape.js-Tutorial/0.1 (https://github.com/cytoscape/cytoscape.js-tutorials; josephst18+cytoscape@outlook.com)' }
  };

  return $.ajax(settings);
};

var responseToCyEle = function(title) {
  return {
    data: { id: title }
  };
};

var parseAndAddData = function(response) {
  // TODO: refactor to separate parsing and adding to graph?
  var sourcePage;
  var addLink = function(link) {
    var node; // cy node (not an ordinary object!)
    if (cy.getElementById(link.title).length === 0) {
      node = cy.add(responseToCyEle(link.title));
    } else {
      node = cy.getElementById(link.title);
    }

    var parentToChildEdge = {
      data: {
        id: 'edge-' + sourcePage + '-' + node.id(),
        source: sourcePage,
        target: node.id()
      }
    };
    if (cy.getElementById(parentToChildEdge.data.id).length === 0) {
      cy.add(parentToChildEdge);
    }
  };

  for (var key in response.query.pages) {
    if ({}.hasOwnProperty.call(response.query.pages, key)) {
      var page = response.query.pages[key];

      // add the main page
      sourcePage = page.title;
      if (cy.getElementById(sourcePage).length === 0) {
        var sourcePageNode = responseToCyEle(sourcePage);
        cy.add(sourcePageNode);
      }

      // add links on main page as nodes connected to sourcePage
      page.links.forEach(addLink);
    }
  }
};

createRequest('Albert Einstein').done(function(response) {
  parseAndAddData(response);
  cy.layout({ name: 'cose' });
});

cy.on(`tap`, `node`, function(event) {
  var node = event.cyTarget;
  createRequest(node.id()).done(function(response) {
    parseAndAddData(response);
    cy.layout({
      name: 'cose',
      animate: true,
      animationThreshold: 1
    });
  });
});
});
