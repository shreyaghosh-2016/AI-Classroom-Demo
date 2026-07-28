export const defaultGraph = {
  nodes: [
    { id: 'A', x: 100, y: 260, h: 10 },
    { id: 'B', x: 270, y: 120, h: 8 },
    { id: 'C', x: 270, y: 390, h: 7 },
    { id: 'D', x: 465, y: 95, h: 6 },
    { id: 'E', x: 465, y: 265, h: 4 },
    { id: 'F', x: 465, y: 430, h: 3 },
    { id: 'G', x: 700, y: 170, h: 2 },
    { id: 'H', x: 790, y: 355, h: 0 }
  ],
  edges: [
    { from: 'A', to: 'B', cost: 2 },
    { from: 'A', to: 'C', cost: 4 },
    { from: 'B', to: 'D', cost: 5 },
    { from: 'B', to: 'E', cost: 3 },
    { from: 'C', to: 'E', cost: 1 },
    { from: 'C', to: 'F', cost: 6 },
    { from: 'D', to: 'G', cost: 4 },
    { from: 'E', to: 'G', cost: 2 },
    { from: 'E', to: 'F', cost: 2 },
    { from: 'F', to: 'H', cost: 3 },
    { from: 'G', to: 'H', cost: 2 }
  ]
};

export function cloneGraph(graph) {
  return {
    nodes: graph.nodes.map(node => ({ ...node })),
    edges: graph.edges.map(edge => ({ ...edge }))
  };
}

export function buildAdjacency(graph) {
  const adjacency = Object.fromEntries(graph.nodes.map(node => [node.id, []]));
  for (const edge of graph.edges) {
    adjacency[edge.from].push({ node: edge.to, cost: edge.cost });
    adjacency[edge.to].push({ node: edge.from, cost: edge.cost });
  }
  for (const id of Object.keys(adjacency)) {
    adjacency[id].sort((a, b) => a.node.localeCompare(b.node));
  }
  return adjacency;
}

export function generateRandomGraph() {
  const ids = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const positions = [
    [100, 270], [270, 110], [270, 420], [465, 85],
    [465, 265], [465, 445], [690, 160], [790, 360]
  ];
  const nodes = ids.map((id, index) => ({
    id,
    x: positions[index][0] + Math.round((Math.random() - 0.5) * 30),
    y: positions[index][1] + Math.round((Math.random() - 0.5) * 30),
    h: id === 'H' ? 0 : Math.max(1, 10 - index + Math.floor(Math.random() * 3))
  }));

  const baseEdges = [
    ['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'E'],
    ['C', 'F'], ['D', 'G'], ['E', 'G'], ['E', 'F'], ['F', 'H'], ['G', 'H']
  ];
  const extraCandidates = [['B', 'C'], ['D', 'E'], ['F', 'G'], ['D', 'H']];
  const selectedExtras = extraCandidates.filter(() => Math.random() > 0.55);
  const edges = [...baseEdges, ...selectedExtras].map(([from, to]) => ({
    from,
    to,
    cost: 1 + Math.floor(Math.random() * 8)
  }));

  return { nodes, edges };
}
