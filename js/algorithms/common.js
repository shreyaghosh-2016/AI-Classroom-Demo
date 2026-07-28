export function reconstructPath(parent, goal) {
  const path = [];
  let current = goal;
  while (current !== undefined) {
    path.unshift(current);
    current = parent[current];
  }
  return path;
}

export function pathCost(path, adjacency) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const edge = adjacency[path[i]].find(item => item.node === path[i + 1]);
    total += edge?.cost ?? 0;
  }
  return total;
}

export function makeStep({ current, frontier, explored, parent, costs = {}, explanation, found = false, path = [] }) {
  return {
    current,
    frontier: frontier.map(item => typeof item === 'string' ? item : item.node),
    explored: [...explored],
    parent: { ...parent },
    costs: { ...costs },
    explanation,
    found,
    path: [...path]
  };
}
