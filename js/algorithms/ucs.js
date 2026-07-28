import { reconstructPath, makeStep } from './common.js';

export function ucs(adjacency, start, goal) {
  const frontier = [{ node: start, priority: 0 }];
  const costs = { [start]: 0 };
  const parent = {};
  const explored = [];
  const closed = new Set();
  const steps = [];

  while (frontier.length) {
    frontier.sort((a, b) => a.priority - b.priority || a.node.localeCompare(b.node));
    const currentItem = frontier.shift();
    const current = currentItem.node;
    if (closed.has(current)) continue;
    closed.add(current);
    explored.push(current);

    if (current === goal) {
      const path = reconstructPath(parent, goal);
      steps.push(makeStep({
        current, frontier, explored, parent, costs, found: true, path,
        explanation: `${current} has the lowest cumulative cost g(n)=${costs[current]} and is the goal. UCS has found an optimal path.`
      }));
      return steps;
    }

    const relaxed = [];
    for (const neighbor of adjacency[current]) {
      const newCost = costs[current] + neighbor.cost;
      if (newCost < (costs[neighbor.node] ?? Infinity)) {
        costs[neighbor.node] = newCost;
        parent[neighbor.node] = current;
        frontier.push({ node: neighbor.node, priority: newCost });
        relaxed.push(`${neighbor.node}: ${newCost}`);
      }
    }

    steps.push(makeStep({
      current, frontier, explored, parent, costs,
      explanation: `UCS expanded ${current} with g(n)=${costs[current]}. ${relaxed.length ? `Updated costs: ${relaxed.join('; ')}.` : 'No cheaper path was discovered.'}`
    }));
  }

  return steps;
}
