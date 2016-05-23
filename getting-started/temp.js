var cy = cytoscape({
  container: document.getElementById('cy'),
  elements: [
    {data: {id: 'a'}},
    {data: {id: 'b'}},
    {data: {
      id: 'ab',
      source: 'a',
      target: 'b'
    }
    }]
});
