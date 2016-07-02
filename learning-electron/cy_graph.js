var cytoscape = require('./cytoscape');

var TestGraph = function() {};

TestGraph.prototype.createGraph = function() {
  var cy = cytoscape({
    container: document.getElementById('cy'),
    layout: {
      name: 'grid'
    },
    elements: [
      { data: { id: 'a' } }
    ]
  });
  return cy;
};

module.exports = new TestGraph();
