import { reconstructPath, makeStep } from './common.js';

export function astar(adjacency, heuristics, start, goal) {
  const frontier = [{ node: start, priority: heuristics[start] ?? 0 }];
  const g = { [start]: 0 };
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
        current, frontier, explored, parent, costs: g, found: true, path,
        explanation: `${current} is the goal with g(n)=${g[current]}. A* stops after selecting the lowest f(n)=g(n)+h(n).`
      }));
      return steps;
    }

    const relaxed = [];
    for (const neighbor of adjacency[current]) {
      const tentative = g[current] + neighbor.cost;
      if (tentative < (g[neighbor.node] ?? Infinity)) {
        g[neighbor.node] = tentative;
        parent[neighbor.node] = current;
        closed.delete(neighbor.node);
        const f = tentative + (heuristics[neighbor.node] ?? 0);
        frontier.push({ node: neighbor.node, priority: f });
        relaxed.push(`${neighbor.node}: g=${tentative}, f=${f}`);
      }
    }

    steps.push(makeStep({
      current, frontier, explored, parent, costs: g,
      explanation: `A* expanded ${current} with g=${g[current]} and h=${heuristics[current] ?? 0}. ${relaxed.length ? `Updated ${relaxed.join('; ')}.` : 'No better route was found.'}`
    }));
  }

  return steps;
}
