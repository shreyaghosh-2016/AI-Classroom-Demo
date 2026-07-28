"use strict";

const defaultGraph = {
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
    { from: 'A', to: 'B', cost: 2 }, { from: 'A', to: 'C', cost: 4 },
    { from: 'B', to: 'D', cost: 5 }, { from: 'B', to: 'E', cost: 3 },
    { from: 'C', to: 'E', cost: 1 }, { from: 'C', to: 'F', cost: 6 },
    { from: 'D', to: 'G', cost: 4 }, { from: 'E', to: 'G', cost: 2 },
    { from: 'E', to: 'F', cost: 2 }, { from: 'F', to: 'H', cost: 3 },
    { from: 'G', to: 'H', cost: 2 }
  ]
};

function cloneGraph(source) {
  return {
    nodes: source.nodes.map((node) => ({ ...node })),
    edges: source.edges.map((edge) => ({ ...edge }))
  };
}

function buildAdjacency(source) {
  const result = Object.fromEntries(source.nodes.map((node) => [node.id, []]));
  for (const edge of source.edges) {
    if (!result[edge.from] || !result[edge.to]) continue;
    result[edge.from].push({ node: edge.to, cost: edge.cost });
    result[edge.to].push({ node: edge.from, cost: edge.cost });
  }
  Object.values(result).forEach((neighbors) => neighbors.sort((a, b) => a.node.localeCompare(b.node)));
  return result;
}

function generateRandomGraph() {
  const ids = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const positions = [[100,270],[270,110],[270,420],[465,85],[465,265],[465,445],[690,160],[790,360]];
  const nodes = ids.map((id, index) => ({
    id,
    x: positions[index][0] + Math.round((Math.random() - 0.5) * 30),
    y: positions[index][1] + Math.round((Math.random() - 0.5) * 30),
    h: id === 'H' ? 0 : Math.max(1, 10 - index + Math.floor(Math.random() * 3))
  }));
  const base = [['A','B'],['A','C'],['B','D'],['B','E'],['C','E'],['C','F'],['D','G'],['E','G'],['E','F'],['F','H'],['G','H']];
  const extras = [['B','C'],['D','E'],['F','G'],['D','H']].filter(() => Math.random() > 0.55);
  const edges = [...base, ...extras].map(([from, to]) => ({ from, to, cost: 1 + Math.floor(Math.random() * 8) }));
  return { nodes, edges };
}

function reconstructPath(parent, goal) {
  const path = [];
  let current = goal;
  while (current !== undefined) {
    path.unshift(current);
    current = parent[current];
  }
  return path;
}

function pathCost(path, adjacency) {
  let total = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    total += adjacency[path[index]]?.find((item) => item.node === path[index + 1])?.cost ?? 0;
  }
  return total;
}

function isGoalNode(node, goals) {
  return goals.has(node);
}

function makeStep({ current, frontier, explored, parent, costs = {}, explanation, found = false, path = [] }) {
  return {
    current,
    frontier: frontier.map((item) => typeof item === 'string' ? item : item.node),
    explored: [...explored],
    parent: { ...parent },
    costs: { ...costs },
    explanation,
    found,
    path: [...path]
  };
}

function bfs(adjacency, start, goals) {
  const queue = [start];
  const discovered = new Set([start]);
  const explored = [];
  const parent = {};
  const steps = [];
  while (queue.length) {
    const before = [...queue];
    const current = queue.shift();
    explored.push(current);
    if (isGoalNode(current, goals)) {
      const path = reconstructPath(parent, current);
      steps.push(makeStep({ current, frontier: queue, explored, parent, found: true, path,
        explanation: `${current} is one of the selected goals. BFS returns the shallowest goal reached.` }));
      return steps;
    }
    const added = [];
    for (const neighbor of adjacency[current] ?? []) {
      if (!discovered.has(neighbor.node)) {
        discovered.add(neighbor.node); parent[neighbor.node] = current; queue.push(neighbor.node); added.push(neighbor.node);
      }
    }
    steps.push(makeStep({ current, frontier: queue, explored, parent,
      explanation: `${current} was removed from FIFO queue [${before.join(', ')}]. ${added.length ? `Added ${added.join(', ')}.` : 'No new nodes were added.'}` }));
  }
  return steps;
}

function dfs(adjacency, start, goals) {
  const stack = [start];
  const discovered = new Set([start]);
  const explored = [];
  const parent = {};
  const steps = [];
  while (stack.length) {
    const before = [...stack];
    const current = stack.pop();
    explored.push(current);
    if (isGoalNode(current, goals)) {
      const path = reconstructPath(parent, current);
      steps.push(makeStep({ current, frontier: stack, explored, parent, found: true, path,
        explanation: `${current} is one of the selected goals. DFS returns the first goal found by LIFO expansion.` }));
      return steps;
    }
    const added = [];
    for (const neighbor of [...(adjacency[current] ?? [])].reverse()) {
      if (!discovered.has(neighbor.node)) {
        discovered.add(neighbor.node); parent[neighbor.node] = current; stack.push(neighbor.node); added.push(neighbor.node);
      }
    }
    steps.push(makeStep({ current, frontier: stack, explored, parent,
      explanation: `${current} was popped from LIFO stack [${before.join(', ')}]. ${added.length ? `Pushed ${added.join(', ')}.` : 'No new nodes were pushed.'}` }));
  }
  return steps;
}

function ids(adjacency, start, goals) {
  const allSteps = [];
  const maxDepth = Math.max(0, Object.keys(adjacency).length - 1);

  for (let limit = 0; limit <= maxDepth; limit += 1) {
    const stack = [{ node: start, depth: 0, path: [start] }];
    const exploredThisIteration = [];
    const parent = {};

    while (stack.length) {
      const item = stack.pop();
      const current = item.node;
      exploredThisIteration.push(current);

      if (isGoalNode(current, goals)) {
        allSteps.push(makeStep({
          current,
          frontier: stack,
          explored: exploredThisIteration,
          parent,
          found: true,
          path: item.path,
          explanation: `${current} is a selected goal. IDS found it with depth limit ${limit}.`
        }));
        return allSteps;
      }

      const children = [];
      if (item.depth < limit) {
        for (const neighbor of [...(adjacency[current] ?? [])].reverse()) {
          if (!item.path.includes(neighbor.node)) {
            if (parent[neighbor.node] === undefined && neighbor.node !== start) {
              parent[neighbor.node] = current;
            }
            stack.push({
              node: neighbor.node,
              depth: item.depth + 1,
              path: [...item.path, neighbor.node]
            });
            children.push(neighbor.node);
          }
        }
      }

      allSteps.push(makeStep({
        current,
        frontier: stack,
        explored: exploredThisIteration,
        parent,
        explanation: `IDS depth limit ${limit}: expanded ${current} at depth ${item.depth}. ${item.depth === limit ? 'Depth limit reached.' : children.length ? `Added ${children.join(', ')}.` : 'No child was added.'}`
      }));
    }
  }

  return allSteps;
}

function ucs(adjacency, start, goals) {
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
    closed.add(current); explored.push(current);
    if (isGoalNode(current, goals)) {
      const path = reconstructPath(parent, current);
      steps.push(makeStep({ current, frontier, explored, parent, costs, found: true, path,
        explanation: `${current} is a selected goal with the lowest cumulative cost g(n)=${costs[current]}.` }));
      return steps;
    }
    const relaxed = [];
    for (const neighbor of adjacency[current] ?? []) {
      const newCost = costs[current] + neighbor.cost;
      if (newCost < (costs[neighbor.node] ?? Infinity)) {
        costs[neighbor.node] = newCost; parent[neighbor.node] = current;
        frontier.push({ node: neighbor.node, priority: newCost }); relaxed.push(`${neighbor.node}: ${newCost}`);
      }
    }
    steps.push(makeStep({ current, frontier, explored, parent, costs,
      explanation: `UCS expanded ${current} with g(n)=${costs[current]}. ${relaxed.length ? `Updated ${relaxed.join('; ')}.` : 'No cheaper path was found.'}` }));
  }
  return steps;
}

function greedy(adjacency, heuristics, start, goals) {
  const frontier = [{ node: start, priority: heuristics[start] ?? 0 }];
  const discovered = new Set([start]);
  const parent = {};
  const explored = [];
  const steps = [];
  while (frontier.length) {
    frontier.sort((a, b) => a.priority - b.priority || a.node.localeCompare(b.node));
    const current = frontier.shift().node;
    explored.push(current);
    if (isGoalNode(current, goals)) {
      const path = reconstructPath(parent, current);
      steps.push(makeStep({ current, frontier, explored, parent, found: true, path,
        explanation: `${current} is a selected goal. Greedy search stops at the first selected goal reached.` }));
      return steps;
    }
    const added = [];
    for (const neighbor of adjacency[current] ?? []) {
      if (!discovered.has(neighbor.node)) {
        discovered.add(neighbor.node); parent[neighbor.node] = current;
        frontier.push({ node: neighbor.node, priority: heuristics[neighbor.node] ?? 0 });
        added.push(`${neighbor.node} (h=${heuristics[neighbor.node] ?? 0})`);
      }
    }
    steps.push(makeStep({ current, frontier, explored, parent,
      explanation: `Greedy expanded ${current}. ${added.length ? `Added ${added.join(', ')}.` : 'No new nodes were added.'}` }));
  }
  return steps;
}

function astar(adjacency, heuristics, start, goals) {
  const frontier = [{ node: start, priority: heuristics[start] ?? 0 }];
  const g = { [start]: 0 };
  const parent = {};
  const explored = [];
  const closed = new Set();
  const steps = [];
  while (frontier.length) {
    frontier.sort((a, b) => a.priority - b.priority || a.node.localeCompare(b.node));
    const current = frontier.shift().node;
    if (closed.has(current)) continue;
    closed.add(current); explored.push(current);
    if (isGoalNode(current, goals)) {
      const path = reconstructPath(parent, current);
      steps.push(makeStep({ current, frontier, explored, parent, costs: g, found: true, path,
        explanation: `${current} is a selected goal with g(n)=${g[current]}.` }));
      return steps;
    }
    const relaxed = [];
    for (const neighbor of adjacency[current] ?? []) {
      const tentative = g[current] + neighbor.cost;
      if (tentative < (g[neighbor.node] ?? Infinity)) {
        g[neighbor.node] = tentative; parent[neighbor.node] = current; closed.delete(neighbor.node);
        const f = tentative + (heuristics[neighbor.node] ?? 0);
        frontier.push({ node: neighbor.node, priority: f }); relaxed.push(`${neighbor.node}: g=${tentative}, f=${f}`);
      }
    }
    steps.push(makeStep({ current, frontier, explored, parent, costs: g,
      explanation: `A* expanded ${current}. ${relaxed.length ? `Updated ${relaxed.join('; ')}.` : 'No better route was found.'}` }));
  }
  return steps;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const elements = {
  svg: document.querySelector('#graphSvg'), algorithm: document.querySelector('#algorithmSelect'),
  start: document.querySelector('#startSelect'), goal: document.querySelector('#goalSelect'), speed: document.querySelector('#speedRange'),
  run: document.querySelector('#runButton'), step: document.querySelector('#stepButton'), pause: document.querySelector('#pauseButton'), reset: document.querySelector('#resetButton'),
  defaultGraph: document.querySelector('#defaultGraphButton'), randomGraph: document.querySelector('#randomGraphButton'), drawGraph: document.querySelector('#drawGraphButton'),
  clearGraph: document.querySelector('#clearGraphButton'), graphEditor: document.querySelector('#graphEditorControls'), edgeCost: document.querySelector('#edgeCostInput'),
  deleteNode: document.querySelector('#deleteNodeButton'), finishDrawing: document.querySelector('#finishDrawingButton'),
  theme: document.querySelector('#themeToggle'), summary: document.querySelector('#algorithmSummary'), status: document.querySelector('#statusBadge'),
  current: document.querySelector('#currentMetric'), expanded: document.querySelector('#expandedMetric'), cost: document.querySelector('#costMetric'),
  stepMetric: document.querySelector('#stepMetric'), frontier: document.querySelector('#frontierList'), visited: document.querySelector('#visitedList'), explanation: document.querySelector('#stepExplanation'),
  searchTreePanel: document.querySelector('#searchTreePanel'), searchTreeSvg: document.querySelector('#searchTreeSvg'),
  searchTreeMessage: document.querySelector('#searchTreeMessage'), searchExpansionOrder: document.querySelector('#searchExpansionOrder')
};

const views = { homeView: document.querySelector('#homeView'), problemView: document.querySelector('#problemView'), searchView: document.querySelector('#searchView') };
const homeButton = document.querySelector('#homeButton');
const brandButton = document.querySelector('#brandButton');

function showView(viewId) {
  stopTimer(); stopProblemDemos();
  Object.entries(views).forEach(([id, view]) => { view.classList.toggle('hidden', id !== viewId); view.classList.toggle('view-active', id === viewId); });
  homeButton.classList.toggle('hidden', viewId === 'homeView');
  document.title = viewId === 'homeView' ? 'AI Course (IIT BBSR)' : viewId === 'problemView' ? 'Automated Problem Solving | AI Course (IIT BBSR)' : 'Search Techniques | AI Course (IIT BBSR)';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (viewId === 'searchView') renderGraph(currentStepIndex >= 0 ? steps[currentStepIndex] : null);
}

document.querySelectorAll('[data-view]').forEach((card) => card.addEventListener('click', () => showView(card.dataset.view)));
document.querySelectorAll('.open-search-button').forEach((button) => button.addEventListener('click', () => showView('searchView')));
homeButton.addEventListener('click', () => showView('homeView'));
brandButton.addEventListener('click', () => showView('homeView'));

const summaries = {
  bfs: 'BFS expands the shallowest unexpanded node first using a FIFO queue. Edge weights are ignored.',
  dfs: 'DFS expands the deepest available node first using a LIFO stack. Edge weights are ignored.',
  ids: 'IDS repeatedly performs depth-limited DFS with increasing depth limits. Edge weights are ignored.',
  ucs: 'UCS expands the node with the smallest cumulative path cost g(n).',
  greedy: 'Greedy search expands the node with the smallest heuristic h(n).',
  astar: 'A* expands the node with the smallest f(n) = g(n) + h(n).'
};

let graph = cloneGraph(defaultGraph);
let adjacency = buildAdjacency(graph);
let steps = [];
let currentStepIndex = -1;
let timer = null;
let isRunning = false;
let draggingNodeId = null;
let pointerMoved = false;
let drawingMode = false;
let selectedEditorNodeId = null;
let selectedGoals = new Set(['H']);

function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}
function getNode(id) { return graph.nodes.find((node) => node.id === id); }
function edgeKey(a, b) { return [a, b].sort().join('::'); }
function isUnweightedAlgorithm() { return ['bfs', 'dfs', 'ids'].includes(elements.algorithm.value); }
function setStatus(text) { elements.status.textContent = text; }

function populateNodeSelectors() {
  const previousStart = elements.start.value || graph.nodes[0]?.id;
  const ids = new Set(graph.nodes.map((node) => node.id));
  elements.start.replaceChildren();
  graph.nodes.forEach((node) => {
    const option = document.createElement('option'); option.value = node.id; option.textContent = node.id; elements.start.append(option);
  });
  if (graph.nodes.length) elements.start.value = ids.has(previousStart) ? previousStart : graph.nodes[0].id;
  selectedGoals = new Set([...selectedGoals].filter((id) => ids.has(id)));
  if (!selectedGoals.size && graph.nodes.length) selectedGoals.add(graph.nodes.at(-1).id);
  elements.goal.replaceChildren();
  graph.nodes.forEach((node) => {
    const label = document.createElement('label'); label.className = 'goal-checkbox-item';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = node.id; checkbox.checked = selectedGoals.has(node.id);
    checkbox.addEventListener('change', () => {
      checkbox.checked ? selectedGoals.add(node.id) : selectedGoals.delete(node.id);
      if (!selectedGoals.size) { checkbox.checked = true; selectedGoals.add(node.id); setStatus('At least one goal is required'); return; }
      handleConfigurationChange();
    });
    const text = document.createElement('span'); text.textContent = node.id;
    label.append(checkbox, text); elements.goal.append(label);
  });
}

function renderGraph(step = null) {
  elements.svg.replaceChildren();
  const pathEdges = new Set();
  if (step?.path?.length) for (let i = 0; i < step.path.length - 1; i += 1) pathEdges.add(edgeKey(step.path[i], step.path[i + 1]));
  const edgeLayer = createSvgElement('g');
  const labelLayer = createSvgElement('g');
  const nodeLayer = createSvgElement('g');
  for (const edge of graph.edges) {
    const source = getNode(edge.from); const target = getNode(edge.to); if (!source || !target) continue;
    edgeLayer.append(createSvgElement('line', { x1: source.x, y1: source.y, x2: target.x, y2: target.y, class: `edge${pathEdges.has(edgeKey(edge.from, edge.to)) ? ' path-edge' : ''}` }));
    if (!isUnweightedAlgorithm()) {
      const midX = (source.x + target.x) / 2; const midY = (source.y + target.y) / 2;
      const group = createSvgElement('g');
      group.append(createSvgElement('rect', { x: midX - 18, y: midY - 14, width: 36, height: 28, rx: 10, class: 'edge-label-bg' }));
      const text = createSvgElement('text', { x: midX, y: midY + 1, class: 'edge-label' }); text.textContent = edge.cost; group.append(text); labelLayer.append(group);
    }
  }
  const frontierSet = new Set(step?.frontier ?? []); const exploredSet = new Set(step?.explored ?? []); const pathSet = new Set(step?.path ?? []);
  for (const node of graph.nodes) {
    const group = createSvgElement('g', { 'data-node-id': node.id });
    let stateClass = '';
    if (pathSet.has(node.id)) stateClass = 'path'; else if (step?.current === node.id) stateClass = 'current'; else if (frontierSet.has(node.id)) stateClass = 'frontier'; else if (exploredSet.has(node.id)) stateClass = 'visited';
    const extra = `${selectedGoals.has(node.id) ? ' goal-node' : ''}${drawingMode && selectedEditorNodeId === node.id ? ' editor-selected' : ''}`;
    group.append(createSvgElement('circle', { cx: node.x, cy: node.y, r: 31, class: `node-circle ${stateClass}${extra}`, 'data-node-id': node.id }));
    const text = createSvgElement('text', { x: node.x, y: node.y + 1, class: 'node-label', 'data-node-id': node.id }); text.textContent = node.id; group.append(text);
    if (['greedy', 'astar'].includes(elements.algorithm.value)) {
      const heuristic = createSvgElement('text', { x: node.x, y: node.y + 51, class: 'node-heuristic' }); heuristic.textContent = `h=${node.h}`; group.append(heuristic);
    }
    nodeLayer.append(group);
  }
  elements.svg.append(edgeLayer, labelLayer, nodeLayer);
}


function hideSearchTree() {
  elements.searchTreePanel?.classList.add('hidden');
  elements.searchTreeSvg?.replaceChildren();
  elements.searchExpansionOrder?.replaceChildren();
}

function renderSearchTree(finalStep) {
  if (!finalStep || !elements.searchTreePanel || !elements.searchTreeSvg) return;

  const startNode = elements.start.value;
  const parent = finalStep.parent ?? {};
  const included = new Set([startNode, ...(finalStep.explored ?? []), ...(finalStep.frontier ?? [])]);
  Object.entries(parent).forEach(([child, parentNode]) => {
    included.add(child);
    included.add(parentNode);
  });

  const children = new Map([...included].map((id) => [id, []]));
  Object.entries(parent).forEach(([child, parentNode]) => {
    if (included.has(child) && included.has(parentNode)) {
      children.get(parentNode)?.push(child);
    }
  });
  children.forEach((items) => items.sort((a, b) => a.localeCompare(b)));

  const depth = new Map([[startNode, 0]]);
  const queue = [startNode];
  while (queue.length) {
    const current = queue.shift();
    for (const child of children.get(current) ?? []) {
      if (!depth.has(child)) {
        depth.set(child, depth.get(current) + 1);
        queue.push(child);
      }
    }
  }
  for (const id of included) {
    if (!depth.has(id)) depth.set(id, 0);
  }

  const levels = new Map();
  for (const id of included) {
    const level = depth.get(id) ?? 0;
    if (!levels.has(level)) levels.set(level, []);
    levels.get(level).push(id);
  }
  levels.forEach((items) => items.sort((a, b) => a.localeCompare(b)));

  const levelNumbers = [...levels.keys()].sort((a, b) => a - b);
  const maxLevelSize = Math.max(1, ...levelNumbers.map((level) => levels.get(level).length));
  const horizontalGap = 125;
  const verticalGap = 115;
  const paddingX = 70;
  const paddingY = 60;
  const width = Math.max(900, maxLevelSize * horizontalGap + paddingX * 2);
  const height = Math.max(280, levelNumbers.length * verticalGap + paddingY * 2);

  elements.searchTreeSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  elements.searchTreeSvg.replaceChildren();

  const positions = new Map();
  for (const level of levelNumbers) {
    const nodes = levels.get(level);
    const usableWidth = width - paddingX * 2;
    const spacing = usableWidth / (nodes.length + 1);
    nodes.forEach((id, index) => {
      positions.set(id, {
        x: paddingX + spacing * (index + 1),
        y: paddingY + level * verticalGap
      });
    });
  }

  const pathNodes = new Set(finalStep.path ?? []);
  const pathEdges = new Set();
  for (let index = 0; index < (finalStep.path?.length ?? 0) - 1; index += 1) {
    pathEdges.add(`${finalStep.path[index]}::${finalStep.path[index + 1]}`);
  }

  const edgeLayer = createSvgElement('g', { class: 'search-tree-edges' });
  Object.entries(parent).forEach(([child, parentNode]) => {
    const from = positions.get(parentNode);
    const to = positions.get(child);
    if (!from || !to) return;
    const isPath = pathEdges.has(`${parentNode}::${child}`);
    edgeLayer.append(createSvgElement('path', {
      d: `M ${from.x} ${from.y + 29} C ${from.x} ${(from.y + to.y) / 2}, ${to.x} ${(from.y + to.y) / 2}, ${to.x} ${to.y - 29}`,
      class: `search-tree-edge${isPath ? ' solution-edge' : ''}`
    }));
  });
  elements.searchTreeSvg.append(edgeLayer);

  const expansionIndex = new Map();
  (finalStep.explored ?? []).forEach((id, index) => {
    if (!expansionIndex.has(id)) expansionIndex.set(id, index + 1);
  });

  const nodeLayer = createSvgElement('g', { class: 'search-tree-nodes' });
  for (const id of included) {
    const position = positions.get(id);
    if (!position) continue;
    const group = createSvgElement('g', { transform: `translate(${position.x}, ${position.y})` });
    const classes = ['search-tree-node'];
    if (id === startNode) classes.push('start-node');
    if (selectedGoals.has(id)) classes.push('goal-node');
    if (pathNodes.has(id)) classes.push('solution-node');
    if (id === finalStep.current && finalStep.found) classes.push('reached-goal');

    group.append(createSvgElement('circle', { cx: 0, cy: 0, r: 28, class: classes.join(' ') }));
    const label = createSvgElement('text', { x: 0, y: 5, class: 'search-tree-node-label' });
    label.textContent = id;
    group.append(label);

    if (expansionIndex.has(id)) {
      const order = createSvgElement('text', { x: 0, y: 45, class: 'search-tree-order-label' });
      order.textContent = `#${expansionIndex.get(id)}`;
      group.append(order);
    }
    nodeLayer.append(group);
  }
  elements.searchTreeSvg.append(nodeLayer);

  elements.searchTreePanel.classList.remove('hidden');
  elements.searchTreeMessage.textContent = finalStep.found
    ? `${elements.algorithm.options[elements.algorithm.selectedIndex].text} reached goal ${finalStep.current}. The highlighted branch is the returned solution path.`
    : 'The search finished without reaching any selected goal. The tree shows all discovered states.';

  elements.searchExpansionOrder.replaceChildren();
  (finalStep.explored ?? []).forEach((id, index) => {
    const token = document.createElement('span');
    token.className = 'token search-order-token';
    token.textContent = `${index + 1}. ${id}`;
    elements.searchExpansionOrder.append(token);
  });
}

function computeSteps() {
  adjacency = buildAdjacency(graph);
  const start = elements.start.value;
  const goals = new Set(selectedGoals);
  if (!start || !goals.size) return [];
  const heuristics = Object.fromEntries(graph.nodes.map((node) => [node.id, node.h]));
  switch (elements.algorithm.value) {
    case 'dfs': return dfs(adjacency, start, goals);
    case 'ids': return ids(adjacency, start, goals);
    case 'ucs': return ucs(adjacency, start, goals);
    case 'greedy': return greedy(adjacency, heuristics, start, goals);
    case 'astar': return astar(adjacency, heuristics, start, goals);
    default: return bfs(adjacency, start, goals);
  }
}

function ensureSteps() { if (!steps.length) { steps = computeSteps(); currentStepIndex = -1; elements.stepMetric.textContent = `0 / ${steps.length}`; } }
function renderTokens(container, values, costs = null) {
  container.replaceChildren();
  if (!values.length) { const empty = document.createElement('span'); empty.className = 'empty-token'; empty.textContent = 'Empty'; container.append(empty); return; }
  values.forEach((value) => { const token = document.createElement('span'); token.className = 'token'; token.textContent = costs && costs[value] !== undefined ? `${value} (${costs[value]})` : value; container.append(token); });
}
function renderStep(index) {
  if (index < 0 || index >= steps.length) return;
  currentStepIndex = index; const step = steps[index]; renderGraph(step);
  elements.current.textContent = step.current ?? '—'; elements.expanded.textContent = step.explored.length; elements.stepMetric.textContent = `${index + 1} / ${steps.length}`;
  elements.explanation.textContent = step.explanation; renderTokens(elements.frontier, step.frontier, step.costs); renderTokens(elements.visited, step.explored);
  if (step.found) {
    elements.cost.textContent = isUnweightedAlgorithm() ? Math.max(0, step.path.length - 1) : pathCost(step.path, adjacency);
    setStatus(`Goal found: ${step.path.join(' → ')}`);
    stopTimer();
    renderSearchTree(step);
  } else {
    elements.cost.textContent = '—';
    setStatus(isRunning ? 'Running' : 'Paused');
  }
}
function nextStep() {
  ensureSteps();
  if (currentStepIndex + 1 < steps.length) {
    renderStep(currentStepIndex + 1);
  } else {
    stopTimer();
    const finalStep = steps.at(-1);
    setStatus(finalStep?.found ? 'Complete' : 'No selected goal is reachable');
    if (finalStep) renderSearchTree(finalStep);
  }
}
function getDelay() { return 1800 - Number(elements.speed.value); }
function run() {
  if (drawingMode) finishDrawing();
  ensureSteps(); if (!steps.length) { setStatus('Draw or load a graph first'); return; }
  if (isRunning) return; isRunning = true; setStatus('Running'); nextStep(); if (isRunning) timer = window.setInterval(nextStep, getDelay());
}
function stopTimer() { if (timer !== null) window.clearInterval(timer); timer = null; isRunning = false; }
function pause() { stopTimer(); setStatus(currentStepIndex >= 0 ? 'Paused' : 'Ready'); }
function resetSearch() {
  hideSearchTree();
  stopTimer(); steps = []; currentStepIndex = -1;
  elements.current.textContent = '—'; elements.expanded.textContent = '0'; elements.cost.textContent = '—'; elements.stepMetric.textContent = '0 / 0';
  elements.explanation.textContent = 'Choose an algorithm and press Run or Next step.'; renderTokens(elements.frontier, []); renderTokens(elements.visited, []); renderGraph(); setStatus('Ready');
}
function loadGraph(newGraph) { drawingMode = false; selectedEditorNodeId = null; elements.graphEditor.classList.add('hidden'); elements.svg.classList.remove('drawing-mode'); graph = cloneGraph(newGraph); adjacency = buildAdjacency(graph); selectedGoals = new Set([graph.nodes.at(-1)?.id].filter(Boolean)); populateNodeSelectors(); resetSearch(); }
function svgPointFromEvent(event) { const point = elements.svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY; const matrix = elements.svg.getScreenCTM(); return matrix ? point.matrixTransform(matrix.inverse()) : { x: 0, y: 0 }; }
function nextNodeId() {
  const used = new Set(graph.nodes.map((node) => node.id));
  for (let code = 65; code <= 90; code += 1) { const id = String.fromCharCode(code); if (!used.has(id)) return id; }
  let number = 1; while (used.has(`N${number}`)) number += 1; return `N${number}`;
}
function addCustomNode(point) {
  const id = nextNodeId(); graph.nodes.push({ id, x: Math.max(40, Math.min(860, point.x)), y: Math.max(45, Math.min(495, point.y)), h: 0 });
  if (!selectedGoals.size) selectedGoals.add(id); populateNodeSelectors(); resetSearch(); setStatus(`Added node ${id}`);
}
function connectEditorNodes(firstId, secondId) {
  if (firstId === secondId || graph.edges.some((edge) => edgeKey(edge.from, edge.to) === edgeKey(firstId, secondId))) { setStatus('That edge already exists'); return; }
  const cost = isUnweightedAlgorithm() ? 1 : Math.max(1, Number(elements.edgeCost.value) || 1);
  graph.edges.push({ from: firstId, to: secondId, cost }); adjacency = buildAdjacency(graph); resetSearch(); setStatus(`Connected ${firstId} and ${secondId}`);
}
function beginDrawing() {
  stopTimer(); drawingMode = true; selectedEditorNodeId = null; graph = { nodes: [], edges: [] }; adjacency = {};
  selectedGoals = new Set(); elements.graphEditor.classList.remove('hidden'); elements.svg.classList.add('drawing-mode'); populateNodeSelectors(); resetSearch(); setStatus('Drawing mode: click empty space to add nodes');
}
function clearDrawing() {
  if (!drawingMode) beginDrawing();
  graph = { nodes: [], edges: [] }; selectedGoals = new Set(); selectedEditorNodeId = null; populateNodeSelectors(); resetSearch(); setStatus('Drawing cleared');
}
function deleteSelectedNode() {
  if (!drawingMode || !selectedEditorNodeId) { setStatus('Select a node to delete'); return; }
  const id = selectedEditorNodeId; graph.nodes = graph.nodes.filter((node) => node.id !== id); graph.edges = graph.edges.filter((edge) => edge.from !== id && edge.to !== id); selectedGoals.delete(id); selectedEditorNodeId = null; populateNodeSelectors(); resetSearch(); setStatus(`Deleted node ${id}`);
}
function finishDrawing() {
  drawingMode = false; selectedEditorNodeId = null; elements.graphEditor.classList.add('hidden'); elements.svg.classList.remove('drawing-mode');
  if (graph.nodes.length && !selectedGoals.size) { selectedGoals.add(graph.nodes.at(-1).id); populateNodeSelectors(); }
  resetSearch(); setStatus(graph.nodes.length ? 'Custom graph ready' : 'No graph drawn');
}
function updateEdgeCostControl() {
  const disabled = isUnweightedAlgorithm(); elements.edgeCost.disabled = disabled; elements.edgeCost.closest('label')?.classList.toggle('muted-control', disabled);
}
function startPointer(event) {
  const target = event.target.closest('[data-node-id]'); pointerMoved = false;
  if (target) { draggingNodeId = target.getAttribute('data-node-id'); elements.svg.setPointerCapture(event.pointerId); }
}
function movePointer(event) {
  if (!draggingNodeId) return;
  const point = svgPointFromEvent(event); const node = getNode(draggingNodeId); if (!node) return;
  pointerMoved = true; node.x = Math.max(40, Math.min(860, point.x)); node.y = Math.max(45, Math.min(495, point.y)); renderGraph(currentStepIndex >= 0 ? steps[currentStepIndex] : null);
}
function endPointer(event) {
  const clickedNode = draggingNodeId;
  if (draggingNodeId && elements.svg.hasPointerCapture(event.pointerId)) elements.svg.releasePointerCapture(event.pointerId);
  draggingNodeId = null;
  if (!drawingMode || pointerMoved) return;
  if (clickedNode) {
    if (!selectedEditorNodeId) { selectedEditorNodeId = clickedNode; setStatus(`Selected ${clickedNode}; click another node to connect`); }
    else if (selectedEditorNodeId === clickedNode) { selectedEditorNodeId = null; setStatus('Node selection cleared'); }
    else { const first = selectedEditorNodeId; selectedEditorNodeId = null; connectEditorNodes(first, clickedNode); }
    renderGraph();
  } else {
    addCustomNode(svgPointFromEvent(event));
  }
}
function handleConfigurationChange() { elements.summary.textContent = summaries[elements.algorithm.value]; updateEdgeCostControl(); resetSearch(); }

elements.run.addEventListener('click', run);
elements.step.addEventListener('click', () => { pause(); nextStep(); });
elements.pause.addEventListener('click', pause);
elements.reset.addEventListener('click', resetSearch);
elements.defaultGraph.addEventListener('click', () => loadGraph(defaultGraph));
elements.randomGraph.addEventListener('click', () => loadGraph(generateRandomGraph()));
elements.drawGraph.addEventListener('click', beginDrawing);
elements.clearGraph.addEventListener('click', clearDrawing);
elements.deleteNode.addEventListener('click', deleteSelectedNode);
elements.finishDrawing.addEventListener('click', finishDrawing);
elements.algorithm.addEventListener('change', handleConfigurationChange);
elements.start.addEventListener('change', handleConfigurationChange);
elements.speed.addEventListener('input', () => { if (isRunning) { stopTimer(); isRunning = true; timer = window.setInterval(nextStep, getDelay()); } });
elements.theme.addEventListener('click', () => { document.body.classList.toggle('dark'); elements.theme.textContent = document.body.classList.contains('dark') ? 'Light mode' : 'Dark mode'; });
elements.svg.addEventListener('pointerdown', startPointer);
elements.svg.addEventListener('pointermove', movePointer);
elements.svg.addEventListener('pointerup', endPointer);
elements.svg.addEventListener('pointercancel', endPointer);

populateNodeSelectors();
elements.start.value = 'A';
selectedGoals = new Set(['H']);
populateNodeSelectors();
elements.summary.textContent = summaries.bfs;
updateEdgeCostControl();
resetSearch();



/* =========================================================
   AUTOMATED PROBLEM-SOLVING DEMONSTRATIONS
   Kept in this file so the site needs only one JavaScript entry point.
   ========================================================= */

let problemRunId = 0;

function stopProblemDemos() {
  problemRunId += 1;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function initProblemTabs() {
  const tabs = [...document.querySelectorAll('.problem-tab')];
  const panels = [...document.querySelectorAll('[data-problem-panel]')];

  function activateProblem(problemName) {
    stopProblemDemos();

    tabs.forEach((tab) => {
      const active = tab.dataset.problem === problemName;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    panels.forEach((panel) => {
      const active = panel.dataset.problemPanel === problemName;
      panel.classList.toggle('hidden', !active);
      panel.classList.toggle('active', active);
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateProblem(tab.dataset.problem));
  });

  activateProblem('jug');
}

function initTwoJugDemo() {
  const el = {
    actionPanel: document.querySelector('#jugActions'),
    waterA: document.querySelector('#jugWater4'),
    waterB: document.querySelector('#jugWater3'),
    amountA: document.querySelector('#jugAmount4'),
    amountB: document.querySelector('#jugAmount3'),
    vesselA: document.querySelector('#jugVesselA'),
    vesselB: document.querySelector('#jugVesselB'),
    capacityLabelA: document.querySelector('#jugCapacityLabelA'),
    capacityLabelB: document.querySelector('#jugCapacityLabelB'),
    stateOutput: document.querySelector('#jugState'),
    goalOutput: document.querySelector('#jugGoalDisplay'),
    stepOutput: document.querySelector('#jugSteps'),
    explanation: document.querySelector('#jugExplanation'),
    history: document.querySelector('#jugHistory'),
    solveButton: document.querySelector('#jugSolve'),
    nextButton: document.querySelector('#jugNext'),
    resetButton: document.querySelector('#jugReset'),
    generateButton: document.querySelector('#jugGenerate'),
    capacityAInput: document.querySelector('#jugCapacityA'),
    capacityBInput: document.querySelector('#jugCapacityB'),
    goalInput: document.querySelector('#jugGoalAmount'),
    targetInputs: [...document.querySelectorAll('input[name="jugTarget"]')],
    configStatus: document.querySelector('#jugConfigStatus'),
    problemStatement: document.querySelector('#jugProblemStatement'),
    stateSpaceText: document.querySelector('#jugStateSpaceText'),
    goalTestText: document.querySelector('#jugGoalTestText'),
    graphToggle: document.querySelector('#jugGraphToggle'),
    graphPanel: document.querySelector('#jugGraphPanel'),
    graphSvg: document.querySelector('#jugStateGraph')
  };

  const required = [
    el.actionPanel, el.waterA, el.waterB, el.amountA, el.amountB,
    el.vesselA, el.vesselB, el.capacityLabelA, el.capacityLabelB,
    el.stateOutput, el.goalOutput, el.stepOutput, el.explanation,
    el.history, el.solveButton, el.nextButton, el.resetButton,
    el.generateButton, el.capacityAInput, el.capacityBInput,
    el.goalInput, el.configStatus, el.problemStatement,
    el.stateSpaceText, el.goalTestText, el.graphToggle,
    el.graphPanel, el.graphSvg
  ];
  if (!required.every(Boolean) || el.targetInputs.length !== 2) return;

  const ACTIONS = ['fillA', 'fillB', 'emptyA', 'emptyB', 'pourAtoB', 'pourBtoA'];
  const ACTION_LABELS = {
    fillA: 'Fill Jug A', fillB: 'Fill Jug B',
    emptyA: 'Empty Jug A', emptyB: 'Empty Jug B',
    pourAtoB: 'Pour Jug A into Jug B',
    pourBtoA: 'Pour Jug B into Jug A'
  };

  let config = { capacityA: 4, capacityB: 3, goal: 2, target: 'A' };
  let state = [0, 0];
  let stepsTaken = 0;
  let plan = [];
  let planStates = [];
  let planIndex = 0;
  let isRunning = false;
  let solvable = true;
  let graphData = { states: [], edges: [] };

  const sameState = (a, b) => a[0] === b[0] && a[1] === b[1];
  const stateKey = (s) => `${s[0]},${s[1]}`;
  const formatState = (s) => `(${s[0]}, ${s[1]})`;
  const goalPattern = () => config.target === 'A' ? `(${config.goal}, *)` : `(*, ${config.goal})`;
  const isGoal = (s) => config.target === 'A' ? s[0] === config.goal : s[1] === config.goal;

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) [x, y] = [y, x % y];
    return x;
  }

  function transition(source, action) {
    let [a, b] = source;
    if (action === 'fillA') a = config.capacityA;
    if (action === 'fillB') b = config.capacityB;
    if (action === 'emptyA') a = 0;
    if (action === 'emptyB') b = 0;
    if (action === 'pourAtoB') {
      const transferred = Math.min(a, config.capacityB - b);
      a -= transferred;
      b += transferred;
    }
    if (action === 'pourBtoA') {
      const transferred = Math.min(b, config.capacityA - a);
      b -= transferred;
      a += transferred;
    }
    return [a, b];
  }

  function buildReachableGraph() {
  const start = [0, 0];

  const queue = [{
    state: start,
    depth: 0
  }];

  const visited = new Map([
    [stateKey(start), {
      state: start,
      depth: 0
    }]
  ]);

  const edges = [];
  let goalState = null;

  while (queue.length) {
    const currentNode = queue.shift();
    const current = currentNode.state;

    if (isGoal(current)) {
      goalState = current;
      break;
    }

    for (const action of ACTIONS) {
      const next = transition(current, action);
      const nextKey = stateKey(next);

      if (
        sameState(current, next) ||
        visited.has(nextKey)
      ) {
        continue;
      }

      const nextNode = {
        state: [...next],
        depth: currentNode.depth + 1
      };

      visited.set(nextKey, nextNode);

      edges.push({
        from: [...current],
        to: [...next],
        action,
        depth: nextNode.depth
      });

      queue.push(nextNode);

      if (isGoal(next)) {
        goalState = next;
        queue.length = 0;
        break;
      }
    }
  }

  return {
    states: [...visited.values()],
    edges,
    goalState
  };
}

  function findShortestPlan(start) {
    const queue = [{ state: [...start], actions: [], states: [[...start]] }];
    const visited = new Set([stateKey(start)]);

    while (queue.length) {
      const node = queue.shift();
      if (isGoal(node.state)) return node;

      for (const action of ACTIONS) {
        const next = transition(node.state, action);
        const key = stateKey(next);
        if (sameState(next, node.state) || visited.has(key)) continue;
        visited.add(key);
        queue.push({
          state: next,
          actions: [...node.actions, action],
          states: [...node.states, next]
        });
      }
    }
    return null;
  }

  function checkSolvability() {
    if (config.goal < 0) return { ok: false, message: 'Goal amount cannot be negative.' };
    const targetCapacity = config.target === 'A' ? config.capacityA : config.capacityB;
    if (config.goal > targetCapacity) {
      return { ok: false, message: `Jug ${config.target} can hold at most ${targetCapacity} L, so ${config.goal} L cannot be measured in it.` };
    }
    if (config.goal === 0) {
      return { ok: true, message: 'The initial state already satisfies the goal of 0 L.' };
    }
    const divisor = gcd(config.capacityA, config.capacityB);
    if (config.goal % divisor !== 0) {
      return { ok: false, message: `No solution: gcd(${config.capacityA}, ${config.capacityB}) = ${divisor}, and ${config.goal} is not divisible by ${divisor}.` };
    }
    return { ok: true, message: `Solvable: gcd(${config.capacityA}, ${config.capacityB}) = ${divisor}, which divides the goal amount ${config.goal}.` };
  }

  function createSvg(tag, attrs = {}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, String(value)));
    return node;
  }

function renderStateGraph() {
  el.graphSvg.replaceChildren();

  if (!el.graphToggle.checked) return;

  const stateNodes = graphData.states;

  if (!stateNodes.length) return;

  const levels = new Map();

  stateNodes.forEach((node) => {
    if (!levels.has(node.depth)) {
      levels.set(node.depth, []);
    }

    levels.get(node.depth).push(node);
  });

  const levelNumbers = [...levels.keys()].sort((a, b) => a - b);
  const maximumNodesInLevel = Math.max(
    ...levelNumbers.map((level) => levels.get(level).length)
  );

  const horizontalGap = 150;
  const verticalGap = 125;
  const horizontalPadding = 90;
  const verticalPadding = 65;

  const width = Math.max(
    900,
    maximumNodesInLevel * horizontalGap + horizontalPadding * 2
  );

  const height =
    levelNumbers.length * verticalGap + verticalPadding * 2;

  el.graphSvg.setAttribute(
    'viewBox',
    `0 0 ${width} ${height}`
  );

  const positions = new Map();

  levelNumbers.forEach((level) => {
    const nodes = levels.get(level);
    const availableWidth = width - horizontalPadding * 2;
    const spacing = availableWidth / (nodes.length + 1);

    nodes.forEach((node, index) => {
      positions.set(stateKey(node.state), {
        x: horizontalPadding + spacing * (index + 1),
        y: verticalPadding + level * verticalGap
      });
    });
  });

  const routePairs = new Set();

  for (let index = 0; index < planStates.length - 1; index += 1) {
    routePairs.add(
      `${stateKey(planStates[index])}|${stateKey(planStates[index + 1])}`
    );
  }

  const definitions = createSvg('defs');

  const arrowMarker = createSvg('marker', {
    id: 'jugArrow',
    markerWidth: 10,
    markerHeight: 10,
    refX: 9,
    refY: 3,
    orient: 'auto',
    markerUnits: 'strokeWidth'
  });

  arrowMarker.append(
    createSvg('path', {
      d: 'M0,0 L0,6 L9,3 z',
      class: 'jug-arrow-head'
    })
  );

  const solutionArrowMarker = createSvg('marker', {
    id: 'jugSolutionArrow',
    markerWidth: 10,
    markerHeight: 10,
    refX: 9,
    refY: 3,
    orient: 'auto',
    markerUnits: 'strokeWidth'
  });

  solutionArrowMarker.append(
    createSvg('path', {
      d: 'M0,0 L0,6 L9,3 z',
      class: 'jug-solution-arrow-head'
    })
  );

  definitions.append(
    arrowMarker,
    solutionArrowMarker
  );

  el.graphSvg.append(definitions);

  const edgeLayer = createSvg('g', {
    class: 'jug-graph-edges'
  });

  graphData.edges.forEach((edge) => {
    const from = positions.get(stateKey(edge.from));
    const to = positions.get(stateKey(edge.to));

    if (!from || !to) return;

    const pairKey =
      `${stateKey(edge.from)}|${stateKey(edge.to)}`;

    const isSolutionEdge = routePairs.has(pairKey);

    const nodeRadius = 31;

    const startX = from.x;
    const startY = from.y + nodeRadius;

    const endX = to.x;
    const endY = to.y - nodeRadius - 3;

    const middleY = (startY + endY) / 2;

    const pathData = [
      `M ${startX} ${startY}`,
      `C ${startX} ${middleY},`,
      `${endX} ${middleY},`,
      `${endX} ${endY}`
    ].join(' ');

    const edgePath = createSvg('path', {
      d: pathData,
      class: isSolutionEdge
        ? 'jug-graph-edge solution-edge'
        : 'jug-graph-edge',
      'marker-end': isSolutionEdge
        ? 'url(#jugSolutionArrow)'
        : 'url(#jugArrow)'
    });

    edgeLayer.append(edgePath);

    const labelX = (startX + endX) / 2;
    const labelY = middleY - 7;

    const actionLabel = createSvg('text', {
      x: labelX,
      y: labelY,
      'text-anchor': 'middle',
      class: 'jug-graph-action-label'
    });

    actionLabel.textContent =
      ACTION_LABELS[edge.action];

    edgeLayer.append(actionLabel);
  });

  el.graphSvg.append(edgeLayer);

  const nodeLayer = createSvg('g', {
    class: 'jug-graph-nodes'
  });

  stateNodes.forEach((node) => {
    const currentState = node.state;
    const position = positions.get(stateKey(currentState));

    const group = createSvg('g', {
      class: 'jug-graph-node-group',
      transform: `translate(${position.x}, ${position.y})`
    });

    const classes = ['jug-graph-node'];

    if (sameState(currentState, [0, 0])) {
      classes.push('start-node');
    }

    if (isGoal(currentState)) {
      classes.push('goal-node');
    }

    if (
      planStates.some(
        (routeState) =>
          sameState(routeState, currentState)
      )
    ) {
      classes.push('solution-node');
    }

    if (sameState(currentState, state)) {
      classes.push('current-node');
    }

    group.append(
      createSvg('rect', {
        x: -43,
        y: -26,
        width: 86,
        height: 52,
        rx: 10,
        ry: 10,
        class: classes.join(' ')
      })
    );

    const text = createSvg('text', {
      x: 0,
      y: 5,
      'text-anchor': 'middle',
      class: 'jug-graph-label'
    });

    text.textContent = formatState(currentState);

    group.append(text);

    const depthText = createSvg('text', {
      x: 0,
      y: 43,
      'text-anchor': 'middle',
      class: 'jug-graph-depth-label'
    });

    depthText.textContent =
      node.depth === 0
        ? 'Initial state'
        : `Depth ${node.depth}`;

    group.append(depthText);
    nodeLayer.append(group);
  });

  el.graphSvg.append(nodeLayer);
}

  function addHistory(actionLabel) {
    const wrapper = document.createElement('div');
    wrapper.className = 'jug-history-entry';
    const chip = document.createElement('span');
    chip.className = 'state-chip current-chip';
    chip.textContent = formatState(state);
    const caption = document.createElement('small');
    caption.textContent = actionLabel;
    el.history.querySelectorAll('.current-chip').forEach((item) => item.classList.remove('current-chip'));
    wrapper.append(chip, caption);
    el.history.append(wrapper);
  }

  function updateButtons() {
    el.actionPanel.querySelectorAll('[data-jug-action]').forEach((button) => {
      const next = transition(state, button.dataset.jugAction);
      button.disabled = isRunning || !solvable || sameState(state, next) || isGoal(state);
    });
    el.nextButton.disabled = isRunning || !solvable || isGoal(state);
    el.solveButton.disabled = !solvable || isGoal(state);
    el.solveButton.textContent = isRunning ? 'Pause' : 'Auto solve';
  }

  function setVesselSizes() {
    const maxCapacity = Math.max(config.capacityA, config.capacityB);
    const maxHeight = 230;
    const minHeight = 105;
    const heightFor = (capacity) => Math.round(minHeight + (capacity / maxCapacity) * (maxHeight - minHeight));
    el.vesselA.style.height = `${heightFor(config.capacityA)}px`;
    el.vesselB.style.height = `${heightFor(config.capacityB)}px`;
  }

  function render(message) {
    el.waterA.style.height = `${(state[0] / config.capacityA) * 100}%`;
    el.waterB.style.height = `${(state[1] / config.capacityB) * 100}%`;
    el.amountA.textContent = `${state[0]} L`;
    el.amountB.textContent = `${state[1]} L`;
    el.capacityLabelA.textContent = `${config.capacityA} L`;
    el.capacityLabelB.textContent = `${config.capacityB} L`;
    el.stateOutput.textContent = formatState(state);
    el.goalOutput.textContent = goalPattern();
    el.stepOutput.textContent = String(stepsTaken);
    el.stateOutput.classList.toggle('goal-text', isGoal(state));
    el.explanation.textContent = isGoal(state)
      ? `Goal reached! Jug ${config.target} contains exactly ${config.goal} litres after ${stepsTaken} action${stepsTaken === 1 ? '' : 's'}.`
      : message;
    setVesselSizes();
    updateButtons();
    renderStateGraph();
  }

  function cancelRun() {
    stopProblemDemos();
    isRunning = false;
    updateButtons();
  }

  function perform(action, searchSelected = false) {
    const previous = [...state];
    const next = transition(previous, action);
    if (sameState(previous, next)) {
      render(`${ACTION_LABELS[action]} does not change state ${formatState(state)}.`);
      return false;
    }
    state = next;
    stepsTaken += 1;
    addHistory(ACTION_LABELS[action]);
    render(`${searchSelected ? 'BFS selected: ' : ''}${ACTION_LABELS[action]}. ${formatState(previous)} → ${formatState(state)}.`);
    return true;
  }

  function preparePlan() {
    const result = findShortestPlan(state);
    if (!result || !result.actions.length) {
      plan = [];
      planStates = [];
      planIndex = 0;
      render(isGoal(state) ? 'The goal is already satisfied.' : 'No solution was found from the current state.');
      return false;
    }
    plan = result.actions;
    planStates = result.states;
    planIndex = 0;
    render(`BFS found a shortest plan of ${plan.length} remaining action${plan.length === 1 ? '' : 's'}.`);
    return true;
  }

  function resetSimulation(message = 'Both jugs are empty. Choose an action or let BFS solve the problem.') {
    cancelRun();
    state = [0, 0];
    stepsTaken = 0;
    plan = [];
    planStates = [];
    planIndex = 0;
    el.history.replaceChildren();
    addHistory('Initial state');
    render(message);
  }

  function generateProblem() {
    cancelRun();
    config = {
      capacityA: Number(el.capacityAInput.value),
      capacityB: Number(el.capacityBInput.value),
      goal: Number(el.goalInput.value),
      target: el.targetInputs.find((input) => input.checked)?.value || 'A'
    };

    const result = checkSolvability();
    solvable = result.ok;
    el.configStatus.textContent = result.message;
    el.configStatus.classList.toggle('valid', result.ok);
    el.configStatus.classList.toggle('invalid', !result.ok);
    el.problemStatement.textContent = `Use a ${config.capacityA}-litre jug and a ${config.capacityB}-litre jug to measure exactly ${config.goal} litre${config.goal === 1 ? '' : 's'} in Jug ${config.target}.`;
    el.stateSpaceText.textContent = `All pairs (x, y), where 0 ≤ x ≤ ${config.capacityA} and 0 ≤ y ≤ ${config.capacityB}.`;
    const variable = config.target === 'A' ? 'x' : 'y';
    el.goalTestText.textContent = `${variable} = ${config.goal}, meaning Jug ${config.target} contains exactly ${config.goal} litre${config.goal === 1 ? '' : 's'}.`;

    graphData = buildReachableGraph();
    resetSimulation(result.ok ? `${result.message} Choose an action or let BFS solve it.` : result.message);
  }

  el.actionPanel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-jug-action]');
    if (!button) return;
    cancelRun();
    plan = [];
    planStates = [];
    planIndex = 0;
    perform(button.dataset.jugAction);
  });

  el.nextButton.addEventListener('click', () => {
    cancelRun();
    if (!plan.length || planIndex >= plan.length) {
      if (!preparePlan()) return;
    }
    perform(plan[planIndex], true);
    planIndex += 1;
  });

  el.solveButton.addEventListener('click', async () => {
    if (isRunning) {
      cancelRun();
      render('Automatic solving paused.');
      return;
    }
    if (!plan.length || planIndex >= plan.length) {
      if (!preparePlan()) return;
    }
    isRunning = true;
    const thisRun = ++problemRunId;
    updateButtons();

    while (planIndex < plan.length && !isGoal(state)) {
      if (thisRun !== problemRunId) return;
      perform(plan[planIndex], true);
      planIndex += 1;
      await wait(850);
    }
    if (thisRun === problemRunId) {
      isRunning = false;
      updateButtons();
    }
  });

  el.resetButton.addEventListener('click', () => resetSimulation());
  el.generateButton.addEventListener('click', generateProblem);
  el.graphToggle.addEventListener('change', () => {
    el.graphPanel.classList.toggle('hidden', !el.graphToggle.checked);
    if (el.graphToggle.checked) renderStateGraph();
  });

  generateProblem();
}

function initEightPuzzleDemo() {
  const initialBoard = document.querySelector('#puzzleInitial');
const board = document.querySelector('#puzzleBoard');
const goalBoard = document.querySelector('#puzzleGoal');

const editInitialButton = document.querySelector('#puzzleEditInitial');
const initialEditor = document.querySelector('#puzzleInitialEditor');
const initialInputs = document.querySelector('#puzzleInitialInputs');
const applyInitialButton = document.querySelector('#puzzleApplyInitial');
const cancelInitialButton = document.querySelector('#puzzleCancelInitial');
const initialError = document.querySelector('#puzzleInitialError');
  const blankOutput = document.querySelector('#puzzleBlank');
  const moveOutput = document.querySelector('#puzzleMoves');
  const misplacedOutput = document.querySelector('#puzzleMisplaced');
  const explanation = document.querySelector('#puzzleExplanation');
  const history = document.querySelector('#puzzleHistory');
  const solveButton = document.querySelector('#puzzleSolve');
  const nextButton = document.querySelector('#puzzleNext');
  const newButton = document.querySelector('#puzzleShuffle');
  const resetButton = document.querySelector('#puzzleReset');

  if (![
  initialBoard,
  board,
  goalBoard,
  editInitialButton,
  initialEditor,
  initialInputs,
  applyInitialButton,
  cancelInitialButton,
  initialError,
  blankOutput,
  moveOutput,
  misplacedOutput,
  explanation,
  history,
  solveButton,
  nextButton,
  newButton,
  resetButton
].every(Boolean)) return;

  const goal = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  const starts = [
    [1, 2, 3, 4, 0, 6, 7, 5, 8],
    [1, 2, 3, 5, 0, 6, 4, 7, 8],
    [1, 3, 6, 5, 0, 2, 4, 7, 8]
  ];

  let initial = [...starts[0]];
  let state = [...initial];
  let moves = 0;
  let plan = [];
  let planIndex = 0;
  let isRunning = false;

  const key = (s) => s.join(',');
  function countInversions(values) {
  const tiles = values.filter((value) => value !== 0);
  let inversions = 0;

  for (let i = 0; i < tiles.length; i += 1) {
    for (let j = i + 1; j < tiles.length; j += 1) {
      if (tiles[i] > tiles[j]) {
        inversions += 1;
      }
    }
  }

  return inversions;
}

function isSolvable(values) {
  /*
   * For a 3 × 3 puzzle, the state is solvable when its inversion
   * parity matches the goal-state inversion parity.
   */
  return countInversions(values) % 2 === countInversions(goal) % 2;
}

function createInitialStateEditor() {
  initialInputs.replaceChildren();

  initial.forEach((selectedValue, index) => {
    const select = document.createElement('select');

    select.className = 'puzzle-position-select';
    select.dataset.position = String(index);
    select.setAttribute(
      'aria-label',
      `Tile at row ${Math.floor(index / 3) + 1}, column ${index % 3 + 1}`
    );

    for (let value = 0; value <= 8; value += 1) {
      const option = document.createElement('option');

      option.value = String(value);
      option.textContent = value === 0 ? 'Blank' : String(value);
      option.selected = value === selectedValue;

      select.append(option);
    }

    initialInputs.append(select);
  });
}

function readInitialStateEditor() {
  return [...initialInputs.querySelectorAll('select')].map(
    (select) => Number(select.value)
  );
}

function validateInitialState(values) {
  if (values.length !== 9) {
    return 'The initial state must contain exactly nine positions.';
  }

  const uniqueValues = new Set(values);

  if (uniqueValues.size !== 9) {
    return 'Each tile from 1 to 8 and the blank must appear exactly once.';
  }

  if (!values.every((value) => Number.isInteger(value) && value >= 0 && value <= 8)) {
    return 'Only tiles 1–8 and one blank position are allowed.';
  }

  if (!isSolvable(values)) {
    return 'This initial state cannot reach the selected goal state. Please use a solvable arrangement.';
  }

  return '';
}

function openInitialEditor() {
  stopProblemDemos();
  isRunning = false;

  createInitialStateEditor();
  initialError.textContent = '';
  initialEditor.classList.remove('hidden');
  editInitialButton.textContent = 'Editing initial state';
}

function closeInitialEditor() {
  initialEditor.classList.add('hidden');
  initialError.textContent = '';
  editInitialButton.textContent = 'Edit initial state';
}

  function neighbours(source) {
    const blank = source.indexOf(0);
    const row = Math.floor(blank / 3);
    const column = blank % 3;
    const result = [];

    for (const [dr, dc, direction] of [[-1, 0, 'up'], [1, 0, 'down'], [0, -1, 'left'], [0, 1, 'right']]) {
      const nextRow = row + dr;
      const nextColumn = column + dc;
      if (nextRow < 0 || nextRow > 2 || nextColumn < 0 || nextColumn > 2) continue;
      const tileIndex = nextRow * 3 + nextColumn;
      const next = [...source];
      const tile = next[tileIndex];
      [next[blank], next[tileIndex]] = [next[tileIndex], next[blank]];
      result.push({ state: next, tile, direction });
    }

    return result;
  }

  function draw(container, values, interactive) {
    container.replaceChildren();
    values.forEach((value, index) => {
      const tile = document.createElement(interactive ? 'button' : 'div');
      tile.className = `puzzle-tile${value === 0 ? ' blank-tile' : ''}`;
      tile.textContent = value === 0 ? '' : String(value);
      if (interactive) {
        tile.type = 'button';
        tile.dataset.index = String(index);
        tile.disabled = value === 0 || isRunning;
      }
      container.append(tile);
    });
  }

  function render(message) {
    draw(initialBoard, initial, false);
    draw(board, state, true);
    const blank = state.indexOf(0);
    blankOutput.textContent = `row ${Math.floor(blank / 3) + 1}, col ${blank % 3 + 1}`;
    moveOutput.textContent = String(moves);
    misplacedOutput.textContent = String(state.filter((value, index) => value !== 0 && value !== goal[index]).length);
    explanation.textContent = key(state) === key(goal) ? `Goal reached in ${moves} moves!` : message;
    solveButton.textContent = isRunning ? 'Pause' : 'Auto solve';
    nextButton.disabled = isRunning || key(state) === key(goal);
  }

  function formatDirection(direction) {
  return direction.charAt(0).toUpperCase() + direction.slice(1);
}

function addHistory(tile, direction) {
  const entry = document.createElement('div');
  entry.className = 'puzzle-move-entry';

  const tileLabel = document.createElement('strong');
  tileLabel.textContent = `Tile ${tile}`;

  const moveLabel = document.createElement('span');
  moveLabel.textContent = `Blank moved ${formatDirection(direction)}`;

  entry.append(tileLabel, moveLabel);
  history.prepend(entry);

  while (history.children.length > 8) {
    history.lastElementChild.remove();
  }
}

  function bfs() {
    if (key(state) === key(goal)) return [];
    const startKey = key(state);
    const queue = [[...state]];
    const visited = new Set([startKey]);
    const parent = new Map();

    while (queue.length) {
      const current = queue.shift();
      for (const next of neighbours(current)) {
        const nextKey = key(next.state);
        if (visited.has(nextKey)) continue;
        visited.add(nextKey);
        parent.set(nextKey, { previous: key(current), ...next });

        if (nextKey === key(goal)) {
          const path = [];
          let cursor = nextKey;
          while (cursor !== startKey) {
            const step = parent.get(cursor);
            path.push(step);
            cursor = step.previous;
          }
          return path.reverse();
        }
        queue.push(next.state);
      }
    }
    return [];
  }

  function applyStep(step) {
    state = [...step.state];
    moves += 1;
    addHistory(step.tile, step.direction);
    render(`Moved tile ${step.tile}; the blank moved ${step.direction}.`);
  }

  function cancelRun() {
    stopProblemDemos();
    isRunning = false;
    render('Automatic solving paused.');
  }

  function preparePlan() {
    plan = bfs();
    planIndex = 0;
    if (!plan.length) {
      render(key(state) === key(goal) ? 'The puzzle is already solved.' : 'No solution was found.');
      return false;
    }
    explanation.textContent = `BFS found a shortest solution containing ${plan.length} moves.`;
    return true;
  }

  board.addEventListener('click', (event) => {
    const tileButton = event.target.closest('[data-index]');
    if (!tileButton || isRunning) return;
    stopProblemDemos();
    const tileIndex = Number(tileButton.dataset.index);
    const blankIndex = state.indexOf(0);
    const tileRow = Math.floor(tileIndex / 3);
    const tileColumn = tileIndex % 3;
    const blankRow = Math.floor(blankIndex / 3);
    const blankColumn = blankIndex % 3;
    if (Math.abs(tileRow - blankRow) + Math.abs(tileColumn - blankColumn) !== 1) {
      render('Only a tile directly beside the blank can move.');
      return;
    }
    const tile = state[tileIndex];

let blankDirection = '';

if (tileRow < blankRow) {
  blankDirection = 'up';
} else if (tileRow > blankRow) {
  blankDirection = 'down';
} else if (tileColumn < blankColumn) {
  blankDirection = 'left';
} else {
  blankDirection = 'right';
}

[state[tileIndex], state[blankIndex]] = [
  state[blankIndex],
  state[tileIndex]
];

moves += 1;
plan = [];
planIndex = 0;

addHistory(tile, blankDirection);

render(
  `Moved tile ${tile}; the blank moved ${blankDirection}.`
);
  });

  nextButton.addEventListener('click', () => {
    stopProblemDemos();
    isRunning = false;
    if (!plan.length || planIndex >= plan.length) {
      if (!preparePlan()) return;
    }
    applyStep(plan[planIndex]);
    planIndex += 1;
  });

  solveButton.addEventListener('click', async () => {
    if (isRunning) {
      cancelRun();
      return;
    }
    if (!preparePlan()) return;
    isRunning = true;
    const thisRun = ++problemRunId;
    render('Running the BFS solution...');

    while (planIndex < plan.length && key(state) !== key(goal)) {
      if (thisRun !== problemRunId) return;
      applyStep(plan[planIndex]);
      planIndex += 1;
      await wait(550);
    }

    if (thisRun === problemRunId) {
      isRunning = false;
      render('The BFS solution is complete.');
    }
  });

  editInitialButton.addEventListener('click', () => {
  if (initialEditor.classList.contains('hidden')) {
    openInitialEditor();
  } else {
    closeInitialEditor();
  }
});

cancelInitialButton.addEventListener('click', () => {
  closeInitialEditor();
});

applyInitialButton.addEventListener('click', () => {
  const proposedInitial = readInitialStateEditor();
  const validationError = validateInitialState(proposedInitial);

  if (validationError) {
    initialError.textContent = validationError;
    return;
  }

  stopProblemDemos();
  isRunning = false;

  initial = [...proposedInitial];
  state = [...initial];

  moves = 0;
  plan = [];
  planIndex = 0;

  history.replaceChildren();
  closeInitialEditor();

  render(
    'The selected initial state has been applied. Click a legal tile or run BFS.'
  );
});

  newButton.addEventListener('click', () => {
  stopProblemDemos();
  isRunning = false;

  initial = [
    ...starts[Math.floor(Math.random() * starts.length)]
  ];

  state = [...initial];
  moves = 0;
  plan = [];
  planIndex = 0;

  history.replaceChildren();
  closeInitialEditor();

  render('A new solvable puzzle has been generated.');
});

  resetButton.addEventListener('click', () => {
    stopProblemDemos();
    isRunning = false;
    state = [...initial];
    moves = 0;
    plan = [];
    planIndex = 0;
    history.replaceChildren();
    render('Returned to the selected initial state.');
  });

  draw(initialBoard, initial, false);
draw(goalBoard, goal, false);
createInitialStateEditor();

render(
  'Click a tile adjacent to the blank, edit the initial state, or let BFS solve it.'
);
}

function initEightQueensDemo() {
  const board = document.querySelector('#queensBoard');
  const countOutput = document.querySelector('#queenCount');
  const conflictsOutput = document.querySelector('#queenConflicts');
  const columnOutput = document.querySelector('#queenColumn');
  const backtrackOutput = document.querySelector('#queenBacktracks');
  const explanation = document.querySelector('#queensExplanation');
  const stateOutput = document.querySelector('#queensState');
  const solveButton = document.querySelector('#queensSolve');
  const nextButton = document.querySelector('#queensNext');
  const clearButton = document.querySelector('#queensClear');

  if (![board, countOutput, conflictsOutput, columnOutput, backtrackOutput,
    explanation, stateOutput, solveButton, nextButton, clearButton].every(Boolean)) return;

  let queens = Array(8).fill(-1);
  let trace = [];
  let traceIndex = 0;
  let backtracks = 0;
  let isRunning = false;
  let consideredSquare = null;

  function attacks(c1, r1, c2, r2) {
    return r1 === r2 || Math.abs(c1 - c2) === Math.abs(r1 - r2);
  }

  function conflictInfo() {
    const conflicting = new Set();
    let pairs = 0;
    for (let c1 = 0; c1 < 8; c1 += 1) {
      for (let c2 = c1 + 1; c2 < 8; c2 += 1) {
        if (queens[c1] >= 0 && queens[c2] >= 0 && attacks(c1, queens[c1], c2, queens[c2])) {
          pairs += 1;
          conflicting.add(`${c1},${queens[c1]}`);
          conflicting.add(`${c2},${queens[c2]}`);
        }
      }
    }
    return { pairs, conflicting };
  }

  function render(message) {
    const { pairs, conflicting } = conflictInfo();
    board.replaceChildren();

    for (let row = 0; row < 8; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const square = document.createElement('button');
        square.type = 'button';
        square.className = `queen-square ${(row + column) % 2 ? 'dark-square' : 'light-square'}`;
        square.dataset.row = String(row);
        square.dataset.col = String(column);
        square.disabled = isRunning;
        square.setAttribute('aria-label', `Row ${row + 1}, column ${column + 1}`);

        if (consideredSquare && consideredSquare.row === row && consideredSquare.column === column) {
          square.classList.add('considered-square');
        }
        if (queens[column] === row) {
          square.textContent = '♛';
          square.classList.add('has-queen');
          if (conflicting.has(`${column},${row}`)) square.classList.add('queen-conflict');
        }
        board.append(square);
      }
    }

    const placed = queens.filter((row) => row >= 0).length;
    const nextColumn = queens.findIndex((row) => row < 0);
    countOutput.textContent = `${placed} / 8`;
    conflictsOutput.textContent = String(pairs);
    columnOutput.textContent = nextColumn < 0 ? 'Complete' : String(nextColumn + 1);
    backtrackOutput.textContent = String(backtracks);
    stateOutput.textContent = `[${queens.map((row) => row < 0 ? '–' : row + 1).join(', ')}]`;
    explanation.textContent = placed === 8 && pairs === 0
      ? 'Goal reached: eight queens are placed and no two queens attack each other.'
      : message;
    solveButton.textContent = isRunning ? 'Pause' : 'Visualize backtracking';
    nextButton.disabled = isRunning;
  }

  function buildTrace() {
    const working = Array(8).fill(-1);
    const steps = [];

    function safe(column, row) {
      for (let previousColumn = 0; previousColumn < column; previousColumn += 1) {
        if (attacks(previousColumn, working[previousColumn], column, row)) return false;
      }
      return true;
    }

    function solve(column) {
      if (column === 8) {
        steps.push({ type: 'goal', queens: [...working] });
        return true;
      }

      for (let row = 0; row < 8; row += 1) {
        steps.push({ type: 'consider', queens: [...working], column, row, safe: safe(column, row) });
        if (!safe(column, row)) continue;
        working[column] = row;
        steps.push({ type: 'place', queens: [...working], column, row });
        if (solve(column + 1)) return true;
        working[column] = -1;
        steps.push({ type: 'backtrack', queens: [...working], column, row });
      }
      return false;
    }

    solve(0);
    return steps;
  }

  function applyTraceStep(step) {
    queens = [...step.queens];
    consideredSquare = step.type === 'consider' ? { column: step.column, row: step.row } : null;

    if (step.type === 'consider') {
      render(`Testing row ${step.row + 1}, column ${step.column + 1}: ${step.safe ? 'safe' : 'attacked'}.`);
    } else if (step.type === 'place') {
      render(`Safe square found. Place a queen at row ${step.row + 1}, column ${step.column + 1}.`);
    } else if (step.type === 'backtrack') {
      backtracks += 1;
      render(`No continuation worked. Remove the queen from column ${step.column + 1} and backtrack.`);
    } else {
      render('Backtracking search found a complete valid assignment.');
    }
  }

  function prepareTrace() {
    queens = Array(8).fill(-1);
    consideredSquare = null;
    backtracks = 0;
    trace = buildTrace();
    traceIndex = 0;
  }

  board.addEventListener('click', (event) => {
    const square = event.target.closest('[data-row][data-col]');
    if (!square || isRunning) return;
    stopProblemDemos();
    trace = [];
    traceIndex = 0;
    consideredSquare = null;
    const row = Number(square.dataset.row);
    const column = Number(square.dataset.col);
    const removing = queens[column] === row;
    queens[column] = removing ? -1 : row;
    render(removing
      ? `Removed the queen from column ${column + 1}.`
      : `Placed a queen at row ${row + 1}, column ${column + 1}.`);
  });

  nextButton.addEventListener('click', () => {
    stopProblemDemos();
    isRunning = false;
    if (!trace.length || traceIndex >= trace.length) prepareTrace();
    if (trace[traceIndex]) {
      applyTraceStep(trace[traceIndex]);
      traceIndex += 1;
    }
  });

  solveButton.addEventListener('click', async () => {
    if (isRunning) {
      stopProblemDemos();
      isRunning = false;
      render('Backtracking visualization paused.');
      return;
    }

    prepareTrace();
    isRunning = true;
    const thisRun = ++problemRunId;
    render('Starting depth-first backtracking search...');

    while (traceIndex < trace.length) {
      if (thisRun !== problemRunId) return;
      applyTraceStep(trace[traceIndex]);
      traceIndex += 1;
      await wait(140);
    }

    if (thisRun === problemRunId) {
      isRunning = false;
      render('Backtracking search is complete.');
    }
  });

  clearButton.addEventListener('click', () => {
    stopProblemDemos();
    isRunning = false;
    queens = Array(8).fill(-1);
    trace = [];
    traceIndex = 0;
    backtracks = 0;
    consideredSquare = null;
    render('The board is empty. Place queens manually or visualize backtracking.');
  });

  render('Place queens manually, or watch backtracking explore the state space.');
}

initProblemTabs();
initTwoJugDemo();
initEightPuzzleDemo();
initEightQueensDemo();
