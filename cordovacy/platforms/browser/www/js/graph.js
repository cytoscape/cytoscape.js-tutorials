var apiPath = 'https://en.wikipedia.org/w/api.php';

var cy = window.cy = cytoscape({
  container: document.getElementById('cy'),
  elements: [
      { data: { id: 'a' } },
      { data: { id: 'b' } },
      { data: { id: 'ab', source: 'a', target: 'b' } }
  ],
  layout: {
    name: 'grid'
  }
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
  console.log(response.query.pages);
  for (var key in response.query.pages) {
    if ({}.hasOwnProperty.call(response.query.pages, key)) {
      var page = response.query.pages[key];
      page.links.forEach(function(element) {
        console.log(element.title);
      }, this);
    }
  }
};

createRequest('Albert Einstein').done(parseData);
