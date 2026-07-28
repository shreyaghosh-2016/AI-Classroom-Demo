import { reconstructPath, makeStep } from './common.js';

export function bfs(adjacency, start, goal) {
  const queue = [start];
  const discovered = new Set([start]);
  const explored = [];
  const parent = {};
  const steps = [];

  while (queue.length) {
    const before = [...queue];
    const current = queue.shift();
    explored.push(current);

    if (current === goal) {
      const path = reconstructPath(parent, goal);
      steps.push(makeStep({
        current, frontier: queue, explored, parent, found: true, path,
        explanation: `${current} is the goal. BFS stops and reconstructs the shallowest solution path.`
      }));
      return steps;
    }

    const added = [];
    for (const neighbor of adjacency[current]) {
      if (!discovered.has(neighbor.node)) {
        discovered.add(neighbor.node);
        parent[neighbor.node] = current;
        queue.push(neighbor.node);
        added.push(neighbor.node);
      }
    }

    steps.push(makeStep({
      current, frontier: queue, explored, parent,
      explanation: `${current} was removed from the FIFO queue [${before.join(', ')}]. ${added.length ? `New nodes ${added.join(', ')} were appended.` : 'No new nodes were added.'}`
    }));
  }

  return steps;
}
