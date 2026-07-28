import { reconstructPath, makeStep } from './common.js';

export function greedy(adjacency, heuristics, start, goal) {
  const frontier = [{ node: start, priority: heuristics[start] ?? 0 }];
  const discovered = new Set([start]);
  const parent = {};
  const explored = [];
  const steps = [];

  while (frontier.length) {
    frontier.sort((a, b) => a.priority - b.priority || a.node.localeCompare(b.node));
    const currentItem = frontier.shift();
    const current = currentItem.node;
    explored.push(current);

    if (current === goal) {
      const path = reconstructPath(parent, goal);
      steps.push(makeStep({
        current, frontier, explored, parent, found: true, path,
        explanation: `${current} is the goal. Greedy search selected nodes solely using h(n), so the path need not be cheapest.`
      }));
      return steps;
    }

    const added = [];
    for (const neighbor of adjacency[current]) {
      if (!discovered.has(neighbor.node)) {
        discovered.add(neighbor.node);
        parent[neighbor.node] = current;
        frontier.push({ node: neighbor.node, priority: heuristics[neighbor.node] ?? 0 });
        added.push(`${neighbor.node} (h=${heuristics[neighbor.node] ?? 0})`);
      }
    }

    steps.push(makeStep({
      current, frontier, explored, parent,
      explanation: `Greedy search expanded ${current}, currently the node with smallest h(n). ${added.length ? `Added ${added.join(', ')}.` : 'No new nodes were added.'}`
    }));
  }

  return steps;
}
