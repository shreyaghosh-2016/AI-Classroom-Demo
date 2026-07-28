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

function cloneGraph(graph) {
  return {
    nodes: graph.nodes.map(node => ({ ...node })),
    edges: graph.edges.map(edge => ({ ...edge }))
  };
}

function buildAdjacency(graph) {
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

function generateRandomGraph() {
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
  for (let i = 0; i < path.length - 1; i += 1) {
    const edge = adjacency[path[i]].find(item => item.node === path[i + 1]);
    total += edge?.cost ?? 0;
  }
  return total;
}

function makeStep({ current, frontier, explored, parent, costs = {}, explanation, found = false, path = [] }) {
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


function bfs(adjacency, start, goal) {
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


function dfs(adjacency, start, goal) {
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


function ucs(adjacency, start, goal) {
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


function greedy(adjacency, heuristics, start, goal) {
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


function astar(adjacency, heuristics, start, goal) {
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


const SVG_NS = 'http://www.w3.org/2000/svg';

const elements = {
  svg: document.querySelector('#graphSvg'),
  algorithm: document.querySelector('#algorithmSelect'),
  start: document.querySelector('#startSelect'),
  goal: document.querySelector('#goalSelect'),
  speed: document.querySelector('#speedRange'),
  run: document.querySelector('#runButton'),
  step: document.querySelector('#stepButton'),
  pause: document.querySelector('#pauseButton'),
  reset: document.querySelector('#resetButton'),
  defaultGraph: document.querySelector('#defaultGraphButton'),
  randomGraph: document.querySelector('#randomGraphButton'),
  theme: document.querySelector('#themeToggle'),
  summary: document.querySelector('#algorithmSummary'),
  status: document.querySelector('#statusBadge'),
  current: document.querySelector('#currentMetric'),
  expanded: document.querySelector('#expandedMetric'),
  cost: document.querySelector('#costMetric'),
  stepMetric: document.querySelector('#stepMetric'),
  frontier: document.querySelector('#frontierList'),
  visited: document.querySelector('#visitedList'),
  explanation: document.querySelector('#stepExplanation')
};


const views = {
  homeView: document.querySelector('#homeView'),
  problemView: document.querySelector('#problemView'),
  searchView: document.querySelector('#searchView')
};
const homeButton = document.querySelector('#homeButton');
const brandButton = document.querySelector('#brandButton');

function showView(viewId) {
  stopTimer();
  stopProblemDemos();
  Object.entries(views).forEach(([id, view]) => {
    view.classList.toggle('hidden', id !== viewId);
    view.classList.toggle('view-active', id === viewId);
  });
  homeButton.classList.toggle('hidden', viewId === 'homeView');
  document.title = viewId === 'homeView'
    ? 'AI Course (IIT BBSR)'
    : viewId === 'problemView'
      ? 'Automated Problem Solving | AI Course (IIT BBSR)'
      : 'Search Techniques | AI Course (IIT BBSR)';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (viewId === 'searchView') renderGraph(currentStepIndex >= 0 ? steps[currentStepIndex] : null);
}

document.querySelectorAll('[data-view]').forEach(card => {
  card.addEventListener('click', () => showView(card.dataset.view));
});
document.querySelectorAll('.open-search-button').forEach(button => {
  button.addEventListener('click', () => showView('searchView'));
});
homeButton.addEventListener('click', () => showView('homeView'));
brandButton.addEventListener('click', () => showView('homeView'));

const summaries = {
  bfs: 'BFS expands the shallowest unexpanded node first using a FIFO queue.',
  dfs: 'DFS expands the deepest available node first using a LIFO stack.',
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

function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

function getNode(id) {
  return graph.nodes.find(node => node.id === id);
}

function edgeKey(a, b) {
  return [a, b].sort().join('::');
}

function populateNodeSelectors() {
  const previousStart = elements.start.value || graph.nodes[0]?.id;
  const previousGoal = elements.goal.value || graph.nodes.at(-1)?.id;
  elements.start.replaceChildren();
  elements.goal.replaceChildren();

  for (const node of graph.nodes) {
    for (const select of [elements.start, elements.goal]) {
      const option = document.createElement('option');
      option.value = node.id;
      option.textContent = node.id;
      select.append(option);
    }
  }

  elements.start.value = graph.nodes.some(node => node.id === previousStart) ? previousStart : graph.nodes[0].id;
  elements.goal.value = graph.nodes.some(node => node.id === previousGoal) ? previousGoal : graph.nodes.at(-1).id;
  if (elements.start.value === elements.goal.value && graph.nodes.length > 1) {
    elements.goal.value = graph.nodes.at(-1).id;
  }
}

function renderGraph(step = null) {
  elements.svg.replaceChildren();
  const pathEdges = new Set();
  if (step?.path?.length) {
    for (let i = 0; i < step.path.length - 1; i += 1) {
      pathEdges.add(edgeKey(step.path[i], step.path[i + 1]));
    }
  }

  const edgeLayer = createSvgElement('g');
  const labelLayer = createSvgElement('g');
  const nodeLayer = createSvgElement('g');

  for (const edge of graph.edges) {
    const source = getNode(edge.from);
    const target = getNode(edge.to);
    const line = createSvgElement('line', {
      x1: source.x, y1: source.y, x2: target.x, y2: target.y,
      class: `edge${pathEdges.has(edgeKey(edge.from, edge.to)) ? ' path-edge' : ''}`
    });
    edgeLayer.append(line);

    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const labelGroup = createSvgElement('g');
    labelGroup.append(createSvgElement('rect', {
      x: midX - 18, y: midY - 14, width: 36, height: 28, rx: 10, class: 'edge-label-bg'
    }));
    const text = createSvgElement('text', { x: midX, y: midY + 1, class: 'edge-label' });
    text.textContent = edge.cost;
    labelGroup.append(text);
    labelLayer.append(labelGroup);
  }

  const frontierSet = new Set(step?.frontier ?? []);
  const exploredSet = new Set(step?.explored ?? []);
  const pathSet = new Set(step?.path ?? []);

  for (const node of graph.nodes) {
    const group = createSvgElement('g', { 'data-node-id': node.id });
    let stateClass = '';
    if (pathSet.has(node.id)) stateClass = 'path';
    else if (step?.current === node.id) stateClass = 'current';
    else if (frontierSet.has(node.id)) stateClass = 'frontier';
    else if (exploredSet.has(node.id)) stateClass = 'visited';

    const circle = createSvgElement('circle', {
      cx: node.x, cy: node.y, r: 31,
      class: `node-circle ${stateClass}${elements.goal.value === node.id ? ' goal-node' : ''}`,
      'data-node-id': node.id
    });
    group.append(circle);

    const text = createSvgElement('text', { x: node.x, y: node.y + 1, class: 'node-label' });
    text.textContent = node.id;
    group.append(text);

    if (['greedy', 'astar'].includes(elements.algorithm.value)) {
      const heuristic = createSvgElement('text', { x: node.x, y: node.y + 51, class: 'node-heuristic' });
      heuristic.textContent = `h=${node.h}`;
      group.append(heuristic);
    }

    nodeLayer.append(group);
  }

  elements.svg.append(edgeLayer, labelLayer, nodeLayer);
}

function computeSteps() {
  adjacency = buildAdjacency(graph);
  const start = elements.start.value;
  const goal = elements.goal.value;
  const heuristics = Object.fromEntries(graph.nodes.map(node => [node.id, node.h]));

  switch (elements.algorithm.value) {
    case 'dfs': return dfs(adjacency, start, goal);
    case 'ucs': return ucs(adjacency, start, goal);
    case 'greedy': return greedy(adjacency, heuristics, start, goal);
    case 'astar': return astar(adjacency, heuristics, start, goal);
    case 'bfs':
    default: return bfs(adjacency, start, goal);
  }
}

function ensureSteps() {
  if (!steps.length) {
    steps = computeSteps();
    currentStepIndex = -1;
    elements.stepMetric.textContent = `0 / ${steps.length}`;
  }
}

function renderTokens(container, values, costs = null) {
  container.replaceChildren();
  if (!values.length) {
    const empty = document.createElement('span');
    empty.className = 'empty-token';
    empty.textContent = 'Empty';
    container.append(empty);
    return;
  }
  for (const value of values) {
    const token = document.createElement('span');
    token.className = 'token';
    token.textContent = costs && costs[value] !== undefined ? `${value} (${costs[value]})` : value;
    container.append(token);
  }
}

function renderStep(index) {
  if (index < 0 || index >= steps.length) return;
  currentStepIndex = index;
  const step = steps[index];
  renderGraph(step);
  elements.current.textContent = step.current ?? '—';
  elements.expanded.textContent = step.explored.length;
  elements.stepMetric.textContent = `${index + 1} / ${steps.length}`;
  elements.explanation.textContent = step.explanation;
  renderTokens(elements.frontier, step.frontier, step.costs);
  renderTokens(elements.visited, step.explored);

  if (step.found) {
    elements.cost.textContent = pathCost(step.path, adjacency);
    setStatus(`Goal found: ${step.path.join(' → ')}`);
    stopTimer();
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
    setStatus(steps.at(-1)?.found ? 'Complete' : 'No path found');
  }
}

function getDelay() {
  const value = Number(elements.speed.value);
  return 1800 - value;
}

function run() {
  ensureSteps();
  if (isRunning) return;
  isRunning = true;
  setStatus('Running');
  nextStep();
  if (!isRunning) return;
  timer = window.setInterval(nextStep, getDelay());
}

function stopTimer() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  isRunning = false;
}

function pause() {
  stopTimer();
  setStatus(currentStepIndex >= 0 ? 'Paused' : 'Ready');
}

function resetSearch() {
  stopTimer();
  steps = [];
  currentStepIndex = -1;
  elements.current.textContent = '—';
  elements.expanded.textContent = '0';
  elements.cost.textContent = '—';
  elements.stepMetric.textContent = '0 / 0';
  elements.explanation.textContent = 'Choose an algorithm and press Run or Next step.';
  renderTokens(elements.frontier, []);
  renderTokens(elements.visited, []);
  renderGraph();
  setStatus('Ready');
}

function setStatus(text) {
  elements.status.textContent = text;
}

function loadGraph(newGraph) {
  graph = cloneGraph(newGraph);
  adjacency = buildAdjacency(graph);
  populateNodeSelectors();
  resetSearch();
}

function svgPointFromEvent(event) {
  const point = elements.svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = elements.svg.getScreenCTM();
  return matrix ? point.matrixTransform(matrix.inverse()) : { x: 0, y: 0 };
}

function startDrag(event) {
  const target = event.target.closest('[data-node-id]');
  if (!target) return;
  draggingNodeId = target.getAttribute('data-node-id');
  elements.svg.setPointerCapture(event.pointerId);
}

function drag(event) {
  if (!draggingNodeId) return;
  const point = svgPointFromEvent(event);
  const node = getNode(draggingNodeId);
  node.x = Math.max(40, Math.min(860, point.x));
  node.y = Math.max(45, Math.min(495, point.y));
  renderGraph(currentStepIndex >= 0 ? steps[currentStepIndex] : null);
}

function endDrag(event) {
  if (draggingNodeId) {
    draggingNodeId = null;
    if (elements.svg.hasPointerCapture(event.pointerId)) {
      elements.svg.releasePointerCapture(event.pointerId);
    }
  }
}

function handleConfigurationChange() {
  elements.summary.textContent = summaries[elements.algorithm.value];
  resetSearch();
}

elements.run.addEventListener('click', run);
elements.step.addEventListener('click', () => { pause(); nextStep(); });
elements.pause.addEventListener('click', pause);
elements.reset.addEventListener('click', resetSearch);
elements.defaultGraph.addEventListener('click', () => loadGraph(defaultGraph));
elements.randomGraph.addEventListener('click', () => loadGraph(generateRandomGraph()));
elements.algorithm.addEventListener('change', handleConfigurationChange);
elements.start.addEventListener('change', handleConfigurationChange);
elements.goal.addEventListener('change', handleConfigurationChange);
elements.speed.addEventListener('input', () => {
  if (isRunning) {
    stopTimer();
    isRunning = true;
    timer = window.setInterval(nextStep, getDelay());
  }
});
elements.theme.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  elements.theme.textContent = document.body.classList.contains('dark') ? 'Light mode' : 'Dark mode';
});
elements.svg.addEventListener('pointerdown', startDrag);
elements.svg.addEventListener('pointermove', drag);
elements.svg.addEventListener('pointerup', endDrag);
elements.svg.addEventListener('pointercancel', endDrag);

populateNodeSelectors();
elements.start.value = 'A';
elements.goal.value = 'H';
elements.summary.textContent = summaries.bfs;
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
  const actionPanel = document.querySelector('#jugActions');
  const water4 = document.querySelector('#jugWater4');
  const water3 = document.querySelector('#jugWater3');
  const amount4 = document.querySelector('#jugAmount4');
  const amount3 = document.querySelector('#jugAmount3');
  const stateOutput = document.querySelector('#jugState');
  const stepOutput = document.querySelector('#jugSteps');
  const explanation = document.querySelector('#jugExplanation');
  const history = document.querySelector('#jugHistory');
  const solveButton = document.querySelector('#jugSolve');
  const nextButton = document.querySelector('#jugNext');
  const resetButton = document.querySelector('#jugReset');

  if (![actionPanel, water4, water3, amount4, amount3, stateOutput, stepOutput,
    explanation, history, solveButton, nextButton, resetButton].every(Boolean)) return;

  const actions = ['fill4', 'fill3', 'empty4', 'empty3', 'pour4to3', 'pour3to4'];
  const labels = {
    fill4: 'Fill Jug A to 4 L',
    fill3: 'Fill Jug B to 3 L',
    empty4: 'Empty Jug A',
    empty3: 'Empty Jug B',
    pour4to3: 'Pour Jug A into Jug B',
    pour3to4: 'Pour Jug B into Jug A'
  };

  let state = [0, 0];
  let stepsTaken = 0;
  let plan = [];
  let planIndex = 0;
  let isRunning = false;

  const sameState = (a, b) => a[0] === b[0] && a[1] === b[1];
  const stateKey = (s) => `${s[0]},${s[1]}`;
  const formatState = (s) => `(${s[0]}, ${s[1]})`;
  const isGoal = (s) => s[0] === 2;

  function transition(source, action) {
    let [a, b] = source;

    if (action === 'fill4') a = 4;
    if (action === 'fill3') b = 3;
    if (action === 'empty4') a = 0;
    if (action === 'empty3') b = 0;

    if (action === 'pour4to3') {
      const transferred = Math.min(a, 3 - b);
      a -= transferred;
      b += transferred;
    }

    if (action === 'pour3to4') {
      const transferred = Math.min(b, 4 - a);
      b -= transferred;
      a += transferred;
    }

    return [a, b];
  }

  function findShortestPlan(start) {
    const queue = [{ state: [...start], path: [] }];
    const visited = new Set([stateKey(start)]);

    while (queue.length) {
      const node = queue.shift();
      if (isGoal(node.state)) return node.path;

      for (const action of actions) {
        const next = transition(node.state, action);
        const key = stateKey(next);
        if (sameState(next, node.state) || visited.has(key)) continue;
        visited.add(key);
        queue.push({ state: next, path: [...node.path, action] });
      }
    }

    return [];
  }

  function addHistory(actionLabel) {
    const wrapper = document.createElement('div');
    wrapper.className = 'jug-history-entry';

    const chip = document.createElement('span');
    chip.className = 'state-chip current-chip';
    chip.textContent = formatState(state);

    const caption = document.createElement('small');
    caption.textContent = actionLabel;

    history.querySelectorAll('.current-chip').forEach((item) => item.classList.remove('current-chip'));
    wrapper.append(chip, caption);
    history.append(wrapper);
  }

  function updateButtons() {
    actionPanel.querySelectorAll('[data-jug-action]').forEach((button) => {
      const next = transition(state, button.dataset.jugAction);
      button.disabled = isRunning || sameState(state, next);
    });
    nextButton.disabled = isRunning || isGoal(state);
    solveButton.textContent = isRunning ? 'Pause' : 'Auto solve';
  }

  function render(message) {
    water4.style.height = `${(state[0] / 4) * 100}%`;
    water3.style.height = `${(state[1] / 3) * 100}%`;
    amount4.textContent = `${state[0]} L`;
    amount3.textContent = `${state[1]} L`;
    stateOutput.textContent = formatState(state);
    stepOutput.textContent = String(stepsTaken);
    stateOutput.classList.toggle('goal-text', isGoal(state));
    explanation.textContent = isGoal(state)
      ? `Goal reached! Jug A contains exactly 2 litres after ${stepsTaken} actions.`
      : message;
    updateButtons();
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
      render(`${labels[action]} is not useful in state ${formatState(state)}.`);
      return false;
    }

    state = next;
    stepsTaken += 1;
    addHistory(labels[action]);
    render(`${searchSelected ? 'BFS selected: ' : ''}${labels[action]}. ${formatState(previous)} → ${formatState(state)}.`);
    return true;
  }

  function preparePlan() {
    plan = findShortestPlan(state);
    planIndex = 0;
    if (!plan.length) {
      render(isGoal(state) ? 'The goal is already satisfied.' : 'No solution was found.');
      return false;
    }
    explanation.textContent = `BFS found a shortest plan of ${plan.length} remaining actions.`;
    return true;
  }

  actionPanel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-jug-action]');
    if (!button) return;
    cancelRun();
    plan = [];
    planIndex = 0;
    perform(button.dataset.jugAction);
  });

  nextButton.addEventListener('click', () => {
    cancelRun();
    if (!plan.length || planIndex >= plan.length) {
      if (!preparePlan()) return;
    }
    perform(plan[planIndex], true);
    planIndex += 1;
  });

  solveButton.addEventListener('click', async () => {
    if (isRunning) {
      cancelRun();
      render('Automatic solving paused.');
      return;
    }

    if (!preparePlan()) return;
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

  resetButton.addEventListener('click', () => {
    cancelRun();
    state = [0, 0];
    stepsTaken = 0;
    plan = [];
    planIndex = 0;
    history.replaceChildren();
    addHistory('Initial state');
    render('Both jugs are empty. Choose an action or let BFS solve the problem.');
  });

  history.replaceChildren();
  addHistory('Initial state');
  render('Both jugs are empty. Choose an action or let BFS solve the problem.');
}

function initEightPuzzleDemo() {
  const board = document.querySelector('#puzzleBoard');
  const goalBoard = document.querySelector('#puzzleGoal');
  const blankOutput = document.querySelector('#puzzleBlank');
  const moveOutput = document.querySelector('#puzzleMoves');
  const misplacedOutput = document.querySelector('#puzzleMisplaced');
  const explanation = document.querySelector('#puzzleExplanation');
  const history = document.querySelector('#puzzleHistory');
  const solveButton = document.querySelector('#puzzleSolve');
  const nextButton = document.querySelector('#puzzleNext');
  const newButton = document.querySelector('#puzzleShuffle');
  const resetButton = document.querySelector('#puzzleReset');

  if (![board, goalBoard, blankOutput, moveOutput, misplacedOutput, explanation,
    history, solveButton, nextButton, newButton, resetButton].every(Boolean)) return;

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
    draw(board, state, true);
    const blank = state.indexOf(0);
    blankOutput.textContent = `row ${Math.floor(blank / 3) + 1}, col ${blank % 3 + 1}`;
    moveOutput.textContent = String(moves);
    misplacedOutput.textContent = String(state.filter((value, index) => value !== 0 && value !== goal[index]).length);
    explanation.textContent = key(state) === key(goal) ? `Goal reached in ${moves} moves!` : message;
    solveButton.textContent = isRunning ? 'Pause' : 'Auto solve';
    nextButton.disabled = isRunning || key(state) === key(goal);
  }

  function addHistory(text) {
    const chip = document.createElement('span');
    chip.className = 'state-chip';
    chip.textContent = text;
    history.prepend(chip);
    while (history.children.length > 8) history.lastElementChild.remove();
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
    addHistory(`Tile ${step.tile}`);
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
    [state[tileIndex], state[blankIndex]] = [state[blankIndex], state[tileIndex]];
    moves += 1;
    plan = [];
    planIndex = 0;
    addHistory(`Tile ${tile}`);
    render(`Moved tile ${tile} into the blank square.`);
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

  newButton.addEventListener('click', () => {
    stopProblemDemos();
    isRunning = false;
    initial = [...starts[Math.floor(Math.random() * starts.length)]];
    state = [...initial];
    moves = 0;
    plan = [];
    planIndex = 0;
    history.replaceChildren();
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

  draw(goalBoard, goal, false);
  render('Click a tile adjacent to the blank, or let BFS solve it.');
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
