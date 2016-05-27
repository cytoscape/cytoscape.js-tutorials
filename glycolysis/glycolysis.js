document.addEventListener("DOMContentLoaded", function() {
  var cy = cytoscape({
    container: document.getElementById('cy'),
    style: [{
      selector: 'node',
      style: {
        label: 'data(molecule)'
      }
    }]
  });

  cy.add(GlyElements);
  cy.nodes().forEach(function(ele, i, eles) {
    if (ele.data('molecule') !== 'Pyruvate' && !(ele.isChild())) {
      cy.add({
        group: 'edges', data: { id: 'step' + i, source: ele.id(), target: eles[i + 1].id() }
      });
    }
  });

  cy.layout({
    name: 'grid',
    fit: false, // it's okay if some of the graph is hidden off-screen because viewport scrolls
    columns: 1
  });

  var firstStep = cy.filter('node[molecule = "Glucose"]');
  // TUTORIAL: this can be more succintly written as cy.$('#step0')
  cy.fit(firstStep, 50); // pan to firstStep and use 50px padding
});
