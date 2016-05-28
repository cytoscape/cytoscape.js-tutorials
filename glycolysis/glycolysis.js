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

  function zoomOut() {
    cy.animate({
      fit: {
        eles: cy.nodes(),
        padding: 100
      },
      duration: 700,
      easing: 'ease-out-circ',
      queue: true
    });
  }

  function panIn(target) {
    cy.animate({
      fit: {
        eles: target,
        padding: 0
      },
      duration: 700,
      easing: 'ease-in-out-circ',
      queue: true
    });
  }

  function findSuccessor(selected) {
    var connectedNodes = selected.connectedEdges().connectedNodes();
    var max = connectedNodes.max(function(ele) {
      return Number(ele.id());
      // Need to use Number; otherwise, id() provide string
      // which messes up comparison (says that "10" < "9")

      // max returns object with value and ele
    });
    return max.ele;
  }

  function advanceLayout() {
    var oldSelect = cy.$(':selected');
    oldSelect.unselect();
    var nextSelect = findSuccessor(oldSelect);
    nextSelect.select();

    zoomOut();
    panIn(nextSelect);
  }

  // Initialization: select first element to focus on.
  var startNode = cy.$('node[molecule = "Glucose"]');
  startNode.select();
  panIn(startNode);
  // TUTORIAL: this can be more succintly written as cy.$('#0').select()

  var advanceButton = document.createElement('button');
  advanceButton.id = 'advance';
  advanceButton.textContent = "Next Step";
  advanceButton.onclick = advanceLayout;
  document.body.appendChild(advanceButton);
});
