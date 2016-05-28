"use strict";

document.addEventListener("DOMContentLoaded", function() {
  var cy = cytoscape({
    container: document.getElementById('cy'),
    style: [
      {
        selector: 'node',
        style: {
          label: 'data(molecule)'
        }
      }, {
        selector: 'edge',
        style: {
          label: 'data(enzyme)'
        }
      }
    ]
  });

  cy.add(GlyElements);

  cy.layout({
    name: 'grid',
    fit: false, // it's okay if some of the graph is hidden off-screen because viewport scrolls
    columns: 1,
    avoidOverlapPadding: 80
  });

  function viewSelected() {
    var selected = cy.$(':selected');
    cy.fit(selected, 50);
  }

  function advanceLayout() {
    var oldSelect = cy.$(':selected');

    // TEMP CODE TO TEST BUTTON
    cy.$('#1').select();
    viewSelected();
  }

  // Initialization: select first element to focus on.
  cy.$('node[molecule = "Glucose"]').select();
  viewSelected();
  // TUTORIAL: this can be more succintly written as cy.$('#0').select()

  // var advanceButton = document.createElement('input');
  // advanceButton.type = 'button';
  // advanceButton.id = 'advance';
  // advanceButton.textContent = "Next Step";
  // advanceButton.onclick = advanceLayout();
  // document.body.appendChild(advanceButton);
});
