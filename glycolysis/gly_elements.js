var GlyElements = {
  nodes: [
    { data: { id: 0, molecule: 'Glucose' } },
    { data: { id: 1, molecule: 'G6P' } },
    { data: { id: 2, molecule: 'F6P' } },
    { data: { id: 3, molecule: 'F1,6BP' } },
    { data: { id: 4, molecule: 'Equilibrium' } },
    { data: { id: 5, molecule: '1,3PG' } },
    { data: { id: 6, molecule: '3PG' } },
    { data: { id: 7, molecule: '2PG' } },
    { data: { id: 8, molecule: 'PEP' } },
    { data: { id: 9, molecule: 'Pyruvate' } },
    // GADP/ DHAP equilibrium is a compound node
    { data: { id: -1, parent: 4, molecule: 'GADP' } },
    { data: { id: -2, parent: 4, molecule: 'DHAP' } }
  ]
};
