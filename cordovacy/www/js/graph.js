var cy = cytoscape({
  container: document.getElementById('cy'),
  data: {
    elements: [
        { data: { id: 'a' } },
        { data: { id: 'b' } },
        { data: { id: 'ab', source: 'a', target: 'b' } }
    ]
  }
});
