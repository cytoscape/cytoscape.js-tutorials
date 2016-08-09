var apiPath = 'https://en.wikipedia.org/w/api.php';

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

var parseData = function(response) {
  var results = [];
  function makeEdges(sourcePage, links) {
    return links.map(function(link) {
      return {
        data: {
          id: 'edge-' + sourcePage + '-' + link.title,
          source: sourcePage,
          target: link.title
        }
      };
    });
  }

  for (var key in response.query.pages) {
    if ({}.hasOwnProperty.call(response.query.pages, key)) {
      var page = response.query.pages[key];

      // source page (the page with the links on it)
      results.push({
        data: {
          id: page.title
        }
      });

      // nodes
      // see note on apply https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
      var links = page.links;
      Array.prototype.push.apply(results, links.map(function(link) {
        return {
          data: {
            id: link.title
          }
        };
      }));

      // edges
      Array.prototype.push.apply(results, makeEdges(page.title, page.links));
    }
  }
  return results;
};

function addData(elementArr) {
  var containsElement = function(element) {
    // true means graph already contains element
    if (cy.getElementById(element.data.id).length === 0) {
      return true;
    }
    return false;
  };
  cy.add(elementArr.filter(containsElement));
}

var addThenLayout = function(response) {
  addData(parseData(response));
  cy.layout({
    name: 'cose'
  });
};

cy.on(`tap`, `node`, function(event) {
  var node = event.cyTarget;
  createRequest(node.id()).done(addThenLayout);
});

var submitButton = document.getElementById('submitButton');
submitButton.addEventListener('click', function() {
  cy.elements().remove();
  var page = document.getElementById('pageTitle').value;
  if (page) {
    createRequest(page).done(addThenLayout);
  }
});

var redoLayoutButton = document.getElementById('redoLayoutButton');
redoLayoutButton.addEventListener('click', function() {
  cy.layout({ name: 'cose' });
});
