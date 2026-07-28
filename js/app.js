import { defaultGraph, cloneGraph, buildAdjacency, generateRandomGraph } from './graph-data.js';
import { bfs } from './algorithms/bfs.js';
import { dfs } from './algorithms/dfs.js';
import { ucs } from './algorithms/ucs.js';
import { greedy } from './algorithms/greedy.js';
import { astar } from './algorithms/astar.js';
import { pathCost } from './algorithms/common.js';

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
