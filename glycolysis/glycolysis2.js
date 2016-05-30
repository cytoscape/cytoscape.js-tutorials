// README: incomplete; this was a test to see how practical it was to refactor glycolysis.js as an object.
// Doesn't work naturally so I stopped working on it.

"use strict";

document.addEventListener("DOMContentLoaded", function() {
  cyGraph.init();
});

var cyGraph = {
  init: function() {
    this.cy = cytoscape({
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
    this.cy.add(GlyElements);
    this.cy.nodes().forEach(function(ele) {
      this.cy.style().selector('#' + ele.id())
        .style({
          'width': 200,
          'height': 200,
          'background-opacity': 0,
          'background-image': 'assets/' + ele.data().image,
          'background-fit': 'contain',
          'background-clip': 'none'
        })
        .update();
    }, this);
    this.cy.layout({
      name: 'grid',
      fit: false, // it's okay if some of the graph is hidden off-screen because viewport scrolls
      columns: 2,
      avoidOverlap: true,
      avoidOverlapPadding: 80,
      position: function(ele) {
        if (ele.data().molecule === 'DHAP') {
          // DHAP is, as usual, a special case
          return { row: ele.id() - 1, col: 1 }; // layout to right of GADP
        }
        return { row: ele.id(), col: 0 };
      }
    });
    this.cy.nodes().lock();
      // Initialization: select first element to focus on.
    var startNode = this.cy.$('node[molecule = "Glucose"]');
    startNode.select();
    this.panIn(startNode);
    // TUTORIAL: this can be more succintly written as cy.$('#0').select()

    document.body.appendChild(this.makeAdvanceButton());
  },

  // function zoomOut() {
  //   cy.animate({
  //     fit: {
  //       eles: cy.nodes(),
  //       padding: 100
  //     },
  //     duration: 700,
  //     easing: 'ease-out-circ',
  //     queue: true
  //   });
  // }

  panIn: function(target) {
    this.cy.animate({
      fit: {
        eles: target,
        padding: 40
      },
      duration: 700,
      easing: 'linear',
      queue: true
    });
  },

  findSuccessor: function(selected) {
    var connectedNodes = selected.connectedEdges().connectedNodes();
    var successor = connectedNodes.max(function(ele) {
      return Number(ele.id());
      // Need to use Number; otherwise, id() provide string
      // which messes up comparison (says that "10" < "9")

      // max returns object with value and ele
    });

    if (Number(successor.ele.id()) >= Number(selected.id())) {
      return successor.ele;
    }
    // May need to backtrack when successor == selected (ex: if DHAP is selected)
    var predecessor = connectedNodes.min(function(ele) {
      return Number(ele.id());
    });
    return predecessor.ele;
  },

  advanceLayout: function() {
    var oldSelect = this.cy.$(':selected');
    oldSelect.unselect();
    var nextSelect = this.findSuccessor(oldSelect);
    if (nextSelect.id() === oldSelect.id()) {
      // loop back to beginning instead of repeating pyruvate
      nextSelect = this.cy.$('#0');
    }
    nextSelect.select();

    // zoomOut();
    this.panIn(nextSelect);
  },

  makeAdvanceButton: function() {
    var advanceButton = document.createElement('button');
    advanceButton.id = 'advance';
    advanceButton.textContent = "Next Step";
    advanceButton.onclick = this.advanceLayout.call();
    return advanceButton;
  }
};
