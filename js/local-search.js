(() => {
  'use strict';

  const MODULE_ID = 'localSearchView';
  const state = {
    algorithm: 'hill',
    landscape: [],
    position: 2,
    startPosition: 2,
    bestPosition: 2,
    iteration: 0,
    temperature: 12,
    tabu: [],
    beamLevel: 0,
    beamNodes: [],
    timer: null,
    running: false,
    finished: false,
    history: []
  };

  const algorithmInfo = {
    hill: {
      title: 'Hill Climbing Search',
      summary: 'Move to a better neighbouring state and stop when no neighbour improves the objective.',
      idea: 'Hill climbing keeps only one current state. At every step, it inspects nearby states and moves to the best improving neighbour.',
      strength: 'Very small memory requirement and often reaches a good solution quickly.',
      limitation: 'It can stop at a local maximum, plateau, or ridge even when a better global solution exists.'
    },
    anneal: {
      title: 'Simulated Annealing',
      summary: 'Usually prefer improvements, but sometimes accept a worse move to escape a local optimum.',
      idea: 'At high temperature, the search explores freely. As temperature falls, it becomes increasingly selective and behaves more like hill climbing.',
      strength: 'Can escape local optima and explore several regions of the search space.',
      limitation: 'The cooling schedule matters. Cooling too quickly can trap the search; cooling too slowly costs time.'
    },
    beam: {
      title: 'Local Beam Search',
      summary: 'Keep the best k states at each level and expand all of them together.',
      idea: 'Beam search maintains several candidate states instead of one. Their successors compete, and only the best k survive to the next level.',
      strength: 'Explores several promising regions simultaneously while limiting memory.',
      limitation: 'A narrow beam can lose diversity and discard the path leading to the global optimum.'
    },
    tabu: {
      title: 'Tabu Search',
      summary: 'Move to the best allowed neighbour while temporarily forbidding recently visited states.',
      idea: 'A tabu list remembers recent moves or states. This prevents immediate cycling and encourages the search to enter a different region.',
      strength: 'Can leave local optima and avoids repeatedly moving between the same states.',
      limitation: 'Performance depends on tabu-list size and aspiration rules; too much memory may block useful moves.'
    }
  };

  function injectCard() {
    const grid = document.querySelector('.module-grid');
    if (!grid || grid.querySelector(`[data-view="${MODULE_ID}"]`)) return;
    const planning = [...grid.children].find((item) => item.textContent.includes('Planning'));
    const card = document.createElement('button');
    card.className = 'module-card live-module';
    card.type = 'button';
    card.dataset.view = MODULE_ID;
    card.innerHTML = `
      <span class="module-number">05</span>
      <span class="module-icon" aria-hidden="true">⛰️</span>
      <span class="module-status live">Live</span>
      <strong>Local Search</strong>
      <span class="module-description">Visualize how local search improves candidate solutions without constructing complete paths.</span>
      <span class="module-link">Open local search lab →</span>`;
    if (planning) grid.insertBefore(card, planning); else grid.append(card);
    [...grid.querySelectorAll('.module-number')].forEach((n, i) => n.textContent = String(i + 1).padStart(2, '0'));
    card.addEventListener('click', showModule);
  }

  function injectView() {
    const main = document.querySelector('main');
    if (!main || document.getElementById(MODULE_ID)) return;
    const section = document.createElement('section');
    section.id = MODULE_ID;
    section.className = 'module-view hidden local-search-module';
    section.innerHTML = `
      <div class="module-page-header">
        <div>
          <p class="eyebrow">Module 05</p>
          <h1>Local Search</h1>
          <p class="subtitle">Local search focuses on the quality of the current candidate solution. It usually stores little or no path information and is especially useful for optimization problems.</p>
        </div>
        <button class="secondary-button local-home-button" type="button">All modules</button>
      </div>

      <div class="local-tabs" role="tablist" aria-label="Local search activities">
        <button class="local-tab active" type="button" data-local-tab="visual" role="tab" aria-selected="true">🎬 Algorithm Visualizations</button>
      </div>

      <section class="local-panel active" data-local-panel="visual">
        <div class="local-intro-grid">
          <article class="local-explain-card">
            <h2>What makes search “local”?</h2>
            <p>The algorithm starts from one or more complete candidate solutions and repeatedly modifies them. Unlike BFS or A*, it normally does not build a path from an initial state to a goal state.</p>
          </article>
          <article class="local-explain-card">
            <h2>Objective value</h2>
            <p>Every state receives a score measuring solution quality. In this visualization, higher points are better. For minimization problems, the same idea applies with lower cost being better.</p>
          </article>
          <article class="local-explain-card">
            <h2>Neighbourhood</h2>
            <p>A neighbour is a solution reachable through one small modification, such as moving a queen, swapping two cities, or changing one scheduled task.</p>
          </article>
        </div>

        <div class="local-algorithm-selector" role="tablist" aria-label="Choose a local search algorithm">
          <button class="local-algorithm-button active" type="button" data-local-algorithm="hill">Hill Climbing</button>
          <button class="local-algorithm-button" type="button" data-local-algorithm="anneal">Simulated Annealing</button>
          <button class="local-algorithm-button" type="button" data-local-algorithm="beam">Beam Search</button>
          <button class="local-algorithm-button" type="button" data-local-algorithm="tabu">Tabu Search</button>
        </div>

        <section class="local-algorithm-summary">
          <div>
            <p class="eyebrow">Selected method</p>
            <h2 id="localAlgorithmTitle"></h2>
            <p id="localAlgorithmSummary"></p>
          </div>
          <div class="local-summary-badges">
            <span id="localCurrentBadge">Current state: —</span>
            <span id="localBestBadge">Best found: —</span>
            <span id="localIterationBadge">Iteration: 0</span>
          </div>
        </section>

        <div class="local-layout">
          <aside class="local-controls-panel">
            <section>
              <h3>Animation controls</h3>
              <div class="local-control-buttons">
                <button id="localRun" class="primary-button" type="button">Run</button>
                <button id="localStep" type="button">Next step</button>
                <button id="localPause" type="button">Pause</button>
                <button id="localReset" type="button">Reset</button>
              </div>
            </section>
            <section>
              <label for="localSpeed"><strong>Animation speed</strong></label>
              <div class="range-row"><span>Slow</span><input id="localSpeed" type="range" min="150" max="1100" value="550" step="50"><span>Fast</span></div>
            </section>
            <section id="localLandscapeControls">
              <h3>Landscape and starting state</h3>
              <button id="localRandomLandscape" type="button">Generate new landscape</button>
              <label for="localStartPosition"><strong>Starting position</strong></label>
              <input id="localStartPosition" type="range" min="0" max="16" value="2" step="1">
              <p id="localStartLabel">Start at position 2.</p>
              <button id="localRandomStart" type="button">Choose random initial state</button>
              <p>Change the starting state to see how the same algorithm can reach a different result on the same landscape.</p>
            </section>
            <section id="annealControls" class="hidden">
              <label for="localTemperature"><strong>Starting temperature</strong></label>
              <input id="localTemperature" type="range" min="4" max="24" value="12" step="1">
              <p>Higher temperature allows more exploratory moves.</p>
            </section>
            <section id="beamControls" class="hidden">
              <label for="beamWidth"><strong>Beam width k</strong></label>
              <input id="beamWidth" type="range" min="1" max="4" value="2" step="1">
              <p id="beamWidthLabel">Keep the best 2 states per level.</p>
            </section>
            <section id="tabuControls" class="hidden">
              <label for="tabuLength"><strong>Tabu-list length</strong></label>
              <input id="tabuLength" type="range" min="2" max="6" value="3" step="1">
              <p id="tabuLengthLabel">Remember the last 3 positions.</p>
            </section>
          </aside>

          <div class="local-workspace">
            <div id="landscapeWorkspace" class="local-visual-shell">
              <svg id="localLandscapeSvg" viewBox="0 0 920 460" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Smooth local search optimization landscape"></svg>
            </div>
            <div id="beamWorkspace" class="local-visual-shell hidden">
              <svg id="beamSvg" viewBox="0 0 920 500" role="img" aria-label="Beam search tree"></svg>
            </div>

            <div class="local-metrics-grid">
              <article><span>Current score</span><strong id="localCurrentScore">—</strong></article>
              <article><span>Best score found</span><strong id="localBestScore">—</strong></article>
              <article id="localTemperatureMetric"><span>Temperature</span><strong id="localTemperatureValue">—</strong></article>
              <article id="localMemoryMetric"><span>Search memory</span><strong id="localMemoryValue">1 state</strong></article>
            </div>

            <article class="local-step-card">
              <h3>Step-by-step explanation</h3>
              <p id="localExplanation" aria-live="polite"></p>
              <div id="localDecisionDetails" class="local-decision-details"></div>
            </article>

            <div class="local-concept-grid">
              <article><h3>Core idea</h3><p id="localIdea"></p></article>
              <article><h3>Why it helps</h3><p id="localStrength"></p></article>
              <article><h3>Important limitation</h3><p id="localLimitation"></p></article>
            </div>

            <article class="local-comparison-note">
              <h3>What to observe</h3>
              <p id="localObserve"></p>
            </article>
          </div>
        </div>
      </section>`;
    main.append(section);
    section.querySelector('.local-home-button').addEventListener('click', showHome);
  }

  function generateLandscape() {
    const anchors = [3, 8, 5, 12, 7, 17, 10, 14, 9, 22, 13, 18, 8, 15, 6, 11, 4];
    state.landscape = anchors.map((v, i) => Math.max(2, v + Math.floor(Math.random() * 5) - 2 + (i === 9 ? 4 : 0)));
    const slider = document.getElementById('localStartPosition');
    if (slider) slider.max = String(state.landscape.length - 1);
    state.startPosition = Math.min(state.startPosition, state.landscape.length - 1);
    state.position = state.startPosition;
    state.bestPosition = state.startPosition;
  }

  const chart = { left: 68, right: 858, top: 62, bottom: 390 };
  function xFor(i) { return chart.left + (chart.right - chart.left) * i / Math.max(1, state.landscape.length - 1); }
  function yFor(score) {
    const min = Math.min(...state.landscape);
    const max = Math.max(...state.landscape);
    const pad = Math.max(2, (max - min) * 0.18);
    return chart.bottom - ((score - (min - pad)) / ((max + pad) - (min - pad))) * (chart.bottom - chart.top);
  }

  function smoothPath(points) {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  function renderLandscape() {
    const svg = document.getElementById('localLandscapeSvg');
    if (!svg || !state.landscape.length) return;
    const curvePoints = state.landscape.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
    const curve = smoothPath(curvePoints);
    const area = `${curve} L ${curvePoints[curvePoints.length - 1].x} ${chart.bottom} L ${curvePoints[0].x} ${chart.bottom} Z`;
    const max = Math.max(...state.landscape);
    const globalIndex = state.landscape.indexOf(max);
    const neighbours = [state.position - 1, state.position + 1].filter(i => i >= 0 && i < state.landscape.length);
    const gx = xFor(globalIndex), gy = yFor(max);
    const markerTextY = Math.max(25, gy - 34);
    const markerLineStart = markerTextY + 8;
    const markerLineEnd = Math.max(markerLineStart + 10, gy - 13);
    svg.innerHTML = `
      <defs>
        <linearGradient id="localArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--local-accent)" stop-opacity=".30" />
          <stop offset="100%" stop-color="var(--local-accent)" stop-opacity=".03" />
        </linearGradient>
        <clipPath id="localPlotClip"><rect x="${chart.left-15}" y="16" width="${chart.right-chart.left+30}" height="${chart.bottom-4}" rx="12"/></clipPath>
        <marker id="arrowLocal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker>
      </defs>
      <line x1="${chart.left}" y1="${chart.bottom}" x2="${chart.right}" y2="${chart.bottom}" class="local-axis" />
      <line x1="${chart.left}" y1="${chart.top-18}" x2="${chart.left}" y2="${chart.bottom}" class="local-axis" />
      <text x="${(chart.left+chart.right)/2}" y="440" class="local-axis-label">Candidate state / position</text>
      <text x="22" y="228" class="local-axis-label" transform="rotate(-90 22 228)">Objective value (higher is better)</text>
      <g clip-path="url(#localPlotClip)">
        <path d="${area}" fill="url(#localArea)" />
        <path d="${curve}" class="local-landscape-line" />
      </g>
      ${state.landscape.map((v, i) => {
        const classes = ['local-landscape-point'];
        if (i === state.position) classes.push('current');
        if (i === state.startPosition) classes.push('start');
        if (i === state.bestPosition) classes.push('best');
        if (neighbours.includes(i)) classes.push('neighbour');
        if (state.tabu.includes(i)) classes.push('tabu');
        const labelY = Math.max(30, yFor(v)-16);
        return `<g><circle cx="${xFor(i)}" cy="${yFor(v)}" r="${i === state.position ? 11 : 6}" class="${classes.join(' ')}"/><text x="${xFor(i)}" y="${labelY}" class="local-point-label">${v}</text><text x="${xFor(i)}" y="410" class="local-index-label">${i}</text></g>`;
      }).join('')}
      <g class="local-global-marker"><path d="M ${gx} ${markerLineStart} L ${gx} ${markerLineEnd}" marker-end="url(#arrowLocal)"/><text x="${gx}" y="${markerTextY}" text-anchor="middle">Global maximum</text></g>
      <g class="local-start-marker"><text x="${xFor(state.startPosition)}" y="${Math.min(425, yFor(state.landscape[state.startPosition])+30)}" text-anchor="middle">Start</text></g>
      ${state.algorithm === 'hill' && state.finished && state.position !== globalIndex ? `<text x="${xFor(state.position)}" y="${Math.max(26,yFor(state.landscape[state.position])-42)}" text-anchor="middle" class="local-stop-label">Local maximum</text>` : ''}
    `;
  }

  function createBeamTree() {
    const levels = 5;
    const nodes = [];
    let id = 0;
    for (let level = 0; level < levels; level++) {
      const count = Math.pow(2, level);
      const levelNodes = [];
      for (let i = 0; i < count; i++) {
        const parent = level === 0 ? null : Math.floor(i / 2);
        const base = level * 5 + Math.floor(Math.random() * 12);
        const bonus = (level >= 3 && i === count - 2) ? 18 : 0;
        levelNodes.push({ id: id++, level, index: i, parent, score: base + bonus, active: level === 0, selected: level === 0, expanded: false });
      }
      nodes.push(levelNodes);
    }
    state.beamNodes = nodes;
    state.beamLevel = 0;
    state.bestPosition = 0;
  }

  function beamCoords(level, index) {
    const count = Math.pow(2, level);
    const usable = 820;
    return { x: 50 + usable * ((index + 0.5) / count), y: 58 + level * 102 };
  }

  function renderBeam() {
    const svg = document.getElementById('beamSvg');
    if (!svg) return;
    const lines = [];
    const circles = [];
    state.beamNodes.forEach((levelNodes, level) => {
      levelNodes.forEach((node, index) => {
        const p = beamCoords(level, index);
        if (level > 0) {
          const pp = beamCoords(level - 1, node.parent);
          lines.push(`<line x1="${pp.x}" y1="${pp.y+22}" x2="${p.x}" y2="${p.y-22}" class="beam-edge ${node.active ? 'active' : ''}"/>`);
        }
        const classes = ['beam-node'];
        if (node.selected) classes.push('selected');
        else if (node.active) classes.push('candidate');
        if (node.expanded) classes.push('expanded');
        circles.push(`<g><circle cx="${p.x}" cy="${p.y}" r="22" class="${classes.join(' ')}"/><text x="${p.x}" y="${p.y+5}" text-anchor="middle" class="beam-score">${node.score}</text></g>`);
      });
    });
    svg.innerHTML = `${lines.join('')}${circles.join('')}<text x="15" y="30" class="beam-caption">Each number is an objective score. Higher is better.</text>`;
  }

  function resetAlgorithm(keepLandscape = true) {
    stopTimer();
    state.iteration = 0;
    state.finished = false;
    state.history = [];
    state.tabu = [];
    state.temperature = Number(document.getElementById('localTemperature')?.value || 12);
    const startSlider = document.getElementById('localStartPosition');
    const startLabel = document.getElementById('localStartLabel');
    if (startSlider) startSlider.value = String(state.startPosition);
    if (startLabel) startLabel.textContent = `Start at position ${state.startPosition}.`;
    if (state.algorithm === 'beam') createBeamTree();
    else {
      if (!keepLandscape || !state.landscape.length) generateLandscape();
      state.position = state.startPosition;
      state.bestPosition = state.startPosition;
    }
    updateAll();
    setExplanation(initialExplanation());
  }

  function initialExplanation() {
    if (state.algorithm === 'hill') return `The search begins at position ${state.startPosition}. Press Next step to compare its neighbouring states.`;
    if (state.algorithm === 'anneal') return 'The search begins with a high temperature. Better moves are accepted, and some worse moves may also be accepted.';
    if (state.algorithm === 'beam') return 'The root is the initial candidate. At each level, all successors are scored and only the best k remain active.';
    return `The search begins at position ${state.startPosition}. Recently visited positions will become temporarily tabu.`;
  }

  function stepHill() {
    const i = state.position;
    const candidates = [i - 1, i + 1].filter(x => x >= 0 && x < state.landscape.length);
    const best = candidates.reduce((a, b) => state.landscape[a] >= state.landscape[b] ? a : b);
    state.iteration++;
    if (state.landscape[best] > state.landscape[i]) {
      const old = i;
      state.position = best;
      if (state.landscape[best] > state.landscape[state.bestPosition]) state.bestPosition = best;
      setExplanation(`Neighbour ${best} has score ${state.landscape[best]}, which is better than the current score ${state.landscape[old]}. Hill climbing moves uphill.`);
    } else {
      state.finished = true;
      setExplanation(`Neither neighbour improves the current score ${state.landscape[i]}. Hill climbing stops here, even if a higher peak exists elsewhere.`);
    }
  }

  function stepAnneal() {
    if (state.temperature < 0.35 || state.iteration > 50) {
      state.finished = true;
      setExplanation('The temperature is now very low, so exploration has effectively ended. The best state encountered is retained.');
      return;
    }
    const direction = Math.random() < 0.5 ? -1 : 1;
    let next = state.position + direction;
    if (next < 0 || next >= state.landscape.length) next = state.position - direction;
    const delta = state.landscape[next] - state.landscape[state.position];
    const probability = delta >= 0 ? 1 : Math.exp(delta / state.temperature);
    const random = Math.random();
    const accepted = random < probability;
    const old = state.position;
    state.iteration++;
    if (accepted) {
      state.position = next;
      if (state.landscape[next] > state.landscape[state.bestPosition]) state.bestPosition = next;
    }
    const type = delta >= 0 ? 'an improving move' : 'a worse move';
    setExplanation(`${type.charAt(0).toUpperCase()+type.slice(1)} was proposed: ${old} → ${next}, Δ = ${delta}. Acceptance probability = ${probability.toFixed(2)}; random draw = ${random.toFixed(2)}. The move was ${accepted ? 'accepted' : 'rejected'}.`);
    state.temperature *= 0.86;
  }

  function stepTabu() {
    const i = state.position;
    const neighbours = [i - 1, i + 1].filter(x => x >= 0 && x < state.landscape.length);
    let allowed = neighbours.filter(x => !state.tabu.includes(x));
    if (!allowed.length) allowed = neighbours;
    const best = allowed.reduce((a, b) => state.landscape[a] >= state.landscape[b] ? a : b);
    const old = i;
    state.position = best;
    state.iteration++;
    state.tabu.push(old);
    const limit = Number(document.getElementById('tabuLength')?.value || 3);
    while (state.tabu.length > limit) state.tabu.shift();
    if (state.landscape[best] > state.landscape[state.bestPosition]) state.bestPosition = best;
    setExplanation(`Among the non-tabu neighbours, position ${best} has the best score (${state.landscape[best]}). The previous position ${old} enters the tabu list, preventing an immediate return.`);
    if (state.iteration >= 28 || state.landscape[state.bestPosition] === Math.max(...state.landscape)) {
      state.finished = true;
      setExplanation(`Tabu search has reached the best peak found on this landscape. The tabu list helped it continue even when an immediate move was not an improvement.`);
    }
  }

  function stepBeam() {
    const width = Number(document.getElementById('beamWidth')?.value || 2);
    if (state.beamLevel >= state.beamNodes.length - 1) {
      state.finished = true;
      setExplanation('The final level has been reached. The highest-scoring surviving state is the beam-search result.');
      return;
    }
    const current = state.beamNodes[state.beamLevel].filter(n => n.selected);
    current.forEach(n => n.expanded = true);
    const nextLevel = state.beamNodes[state.beamLevel + 1];
    nextLevel.forEach(n => {
      const parentNode = state.beamNodes[state.beamLevel][n.parent];
      n.active = parentNode.selected;
      n.selected = false;
    });
    const candidates = nextLevel.filter(n => n.active).sort((a,b) => b.score - a.score);
    candidates.slice(0, width).forEach(n => n.selected = true);
    state.beamLevel++;
    state.iteration++;
    const kept = candidates.slice(0, width).map(n => n.score).join(', ');
    const discarded = candidates.slice(width).map(n => n.score).join(', ') || 'none';
    setExplanation(`All successors of the current beam were evaluated. The best ${Math.min(width, candidates.length)} scores (${kept}) survive; the remaining active candidates (${discarded}) are discarded.`);
    if (state.beamLevel >= state.beamNodes.length - 1) state.finished = true;
  }

  function step() {
    if (state.finished) return;
    if (state.algorithm === 'hill') stepHill();
    else if (state.algorithm === 'anneal') stepAnneal();
    else if (state.algorithm === 'beam') stepBeam();
    else stepTabu();
    updateAll();
    if (state.finished) stopTimer();
  }

  function setExplanation(text) {
    const p = document.getElementById('localExplanation');
    if (p) p.textContent = text;
  }

  function updateAll() {
    const info = algorithmInfo[state.algorithm];
    document.getElementById('localAlgorithmTitle').textContent = info.title;
    document.getElementById('localAlgorithmSummary').textContent = info.summary;
    document.getElementById('localIdea').textContent = info.idea;
    document.getElementById('localStrength').textContent = info.strength;
    document.getElementById('localLimitation').textContent = info.limitation;
    document.getElementById('localIterationBadge').textContent = `Iteration: ${state.iteration}`;

    const beam = state.algorithm === 'beam';
    document.getElementById('landscapeWorkspace').classList.toggle('hidden', beam);
    document.getElementById('beamWorkspace').classList.toggle('hidden', !beam);
    document.getElementById('beamControls').classList.toggle('hidden', !beam);
    document.getElementById('annealControls').classList.toggle('hidden', state.algorithm !== 'anneal');
    document.getElementById('tabuControls').classList.toggle('hidden', state.algorithm !== 'tabu');
    document.getElementById('localLandscapeControls').classList.toggle('hidden', beam);

    if (beam) {
      const selected = state.beamNodes[state.beamLevel]?.filter(n => n.selected) || [];
      const best = selected.length ? Math.max(...selected.map(n => n.score)) : 0;
      document.getElementById('localCurrentBadge').textContent = `Current beam: ${selected.length} states`;
      document.getElementById('localBestBadge').textContent = `Best beam score: ${best}`;
      document.getElementById('localCurrentScore').textContent = selected.map(n => n.score).join(', ') || '—';
      document.getElementById('localBestScore').textContent = best || '—';
      document.getElementById('localMemoryValue').textContent = `${Number(document.getElementById('beamWidth')?.value || 2)} states`;
      document.getElementById('localTemperatureValue').textContent = 'Not used';
      document.getElementById('localObserve').textContent = 'Watch how a wider beam preserves more alternatives, while a narrow beam may discard a promising branch before its high-value descendants appear.';
      renderBeam();
    } else {
      const currentScore = state.landscape[state.position];
      const bestScore = state.landscape[state.bestPosition];
      document.getElementById('localCurrentBadge').textContent = `Current state: ${state.position}`;
      document.getElementById('localBestBadge').textContent = `Best found: ${state.bestPosition}`;
      document.getElementById('localCurrentScore').textContent = currentScore;
      document.getElementById('localBestScore').textContent = bestScore;
      document.getElementById('localTemperatureValue').textContent = state.algorithm === 'anneal' ? state.temperature.toFixed(2) : 'Not used';
      document.getElementById('localMemoryValue').textContent = state.algorithm === 'tabu' ? `${state.tabu.length} tabu states` : '1 current state';
      document.getElementById('localObserve').textContent = state.algorithm === 'hill'
        ? 'Notice that the algorithm never moves downhill. This makes it fast, but it cannot cross a valley to reach a higher peak.'
        : state.algorithm === 'anneal'
          ? 'Notice how worse moves are more likely at high temperature and become increasingly unlikely as the system cools.'
          : 'Notice that the search can accept a lower-scoring neighbour because recently visited states are forbidden, helping it avoid cycles and leave a local peak.';
      renderLandscape();
    }
  }

  function selectAlgorithm(name) {
    state.algorithm = name;
    document.querySelectorAll('.local-algorithm-button').forEach(btn => btn.classList.toggle('active', btn.dataset.localAlgorithm === name));
    resetAlgorithm(true);
  }

  function startTimer() {
    if (state.running) return;
    state.running = true;
    const tick = () => {
      if (!state.running || state.finished) return;
      step();
      if (!state.finished) state.timer = setTimeout(tick, 1250 - Number(document.getElementById('localSpeed').value));
    };
    tick();
  }

  function stopTimer() {
    state.running = false;
    if (state.timer) clearTimeout(state.timer);
    state.timer = null;
  }

  function showModule() {
    document.querySelectorAll('#homeView, .module-view').forEach(v => { v.classList.add('hidden'); v.classList.remove('view-active'); });
    const section = document.getElementById(MODULE_ID);
    section.classList.remove('hidden'); section.classList.add('view-active');
    document.querySelector('#homeButton')?.classList.remove('hidden');
    document.title = 'Local Search | AI Course (IIT BBSR)';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showHome() {
    stopTimer();
    document.querySelectorAll('#homeView, .module-view').forEach(v => { v.classList.add('hidden'); v.classList.remove('view-active'); });
    document.getElementById('homeView')?.classList.remove('hidden');
    document.getElementById('homeView')?.classList.add('view-active');
    document.querySelector('#homeButton')?.classList.add('hidden');
    document.title = 'AI Course (IIT BBSR)';
  }

  function bindEvents() {
    document.querySelectorAll('.local-algorithm-button').forEach(btn => btn.addEventListener('click', () => selectAlgorithm(btn.dataset.localAlgorithm)));
    document.getElementById('localRun').addEventListener('click', startTimer);
    document.getElementById('localStep').addEventListener('click', () => { stopTimer(); step(); });
    document.getElementById('localPause').addEventListener('click', stopTimer);
    document.getElementById('localReset').addEventListener('click', () => resetAlgorithm(true));
    document.getElementById('localRandomLandscape').addEventListener('click', () => resetAlgorithm(false));
    document.getElementById('localStartPosition').addEventListener('input', e => {
      state.startPosition = Number(e.target.value);
      document.getElementById('localStartLabel').textContent = `Start at position ${state.startPosition}.`;
      resetAlgorithm(true);
    });
    document.getElementById('localRandomStart').addEventListener('click', () => {
      state.startPosition = Math.floor(Math.random() * state.landscape.length);
      const slider = document.getElementById('localStartPosition');
      slider.value = String(state.startPosition);
      document.getElementById('localStartLabel').textContent = `Random start: position ${state.startPosition}.`;
      resetAlgorithm(true);
    });
    document.getElementById('localTemperature').addEventListener('input', e => { state.temperature = Number(e.target.value); resetAlgorithm(true); });
    document.getElementById('beamWidth').addEventListener('input', e => { document.getElementById('beamWidthLabel').textContent = `Keep the best ${e.target.value} state${e.target.value === '1' ? '' : 's'} per level.`; resetAlgorithm(true); });
    document.getElementById('tabuLength').addEventListener('input', e => { document.getElementById('tabuLengthLabel').textContent = `Remember the last ${e.target.value} positions.`; resetAlgorithm(true); });
    document.querySelector('#homeButton')?.addEventListener('click', () => document.getElementById(MODULE_ID)?.classList.add('hidden'));
    document.querySelector('#brandButton')?.addEventListener('click', () => document.getElementById(MODULE_ID)?.classList.add('hidden'));
  }

  function initialise() {
    injectCard();
    injectView();
    generateLandscape();
    bindEvents();
    resetAlgorithm(true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise);
  else initialise();
})();
