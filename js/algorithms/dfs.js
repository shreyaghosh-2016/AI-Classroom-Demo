import { reconstructPath, makeStep } from './common.js';

export function dfs(adjacency, start, goal) {
  const stack = [start];
  const discovered = new Set([start]);
  const explored = [];
  const parent = {};
  const steps = [];

  while (stack.length) {
    const before = [...stack];
    const current = stack.pop();
    explored.push(current);

    if (current === goal) {
      const path = reconstructPath(parent, goal);
      steps.push(makeStep({
        current, frontier: stack, explored, parent, found: true, path,
        explanation: `${current} is the goal. DFS returns the path determined by its last-in, first-out expansion order.`
      }));
      return steps;
    }

    const neighbors = [...adjacency[current]].reverse();
    const added = [];
    for (const neighbor of neighbors) {
      if (!discovered.has(neighbor.node)) {
        discovered.add(neighbor.node);
        parent[neighbor.node] = current;
        stack.push(neighbor.node);
        added.push(neighbor.node);
      }
    }

    steps.push(makeStep({
      current, frontier: stack, explored, parent,
      explanation: `${current} was popped from the LIFO stack [${before.join(', ')}]. ${added.length ? `Nodes ${added.join(', ')} were pushed.` : 'No new nodes were pushed.'}`
    }));
  }

  return steps;
}
