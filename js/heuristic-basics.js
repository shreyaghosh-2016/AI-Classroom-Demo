(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function init() {
    const root = document.getElementById('heuristicBasicsRoot');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = 'true';

    root.innerHTML = `
      <section class="hb-lesson-hero">
        <p class="eyebrow">Step 1 · Understand the A* evaluation function</p>
        <h2>How does A* decide where to search next?</h2>
        <p>A* balances two kinds of information: what it has already paid and what it estimates is still left. It ranks every frontier node using <strong>f(n)=g(n)+h(n)</strong>.</p>
      </section>

      <div class="hb-teaching-layout">
        <section class="hb-graph-card">
          <div class="hb-card-heading">
            <div>
              <p class="eyebrow">Worked example</p>
              <h3>Read g(n), h(n), and f(n) from a graph</h3>
            </div>
            <button id="hbAnimateExample" class="primary-button" type="button">Explain step by step</button>
          </div>
          <div class="hb-example-canvas" id="hbExampleCanvas" aria-label="Graph showing start, candidate nodes and goal"></div>
          <div class="hb-example-summary" id="hbExampleSummary">
            Click a frontier node or use “Explain step by step”.
          </div>
        </section>

        <aside class="hb-formula-stack">
          <article class="hb-formula-card" data-formula="g">
            <span class="concept-symbol">g(n)</span>
            <h3>Exact cost already incurred</h3>
            <p>Add the real edge costs along the path from the start node to <em>n</em>. A* knows this value exactly.</p>
            <div class="hb-mini-example">For S → A → C: <strong>g(C)=2+3=5</strong></div>
          </article>
          <article class="hb-formula-card" data-formula="h">
            <span class="concept-symbol">h(n)</span>
            <h3>Estimated cost still remaining</h3>
            <p>This is problem-specific guidance. It estimates the cheapest cost from <em>n</em> to a goal without solving the remaining problem completely.</p>
            <div class="hb-mini-example">If C appears 4 units from G: <strong>h(C)=4</strong></div>
          </article>
          <article class="hb-formula-card featured" data-formula="f">
            <span class="concept-symbol">f(n)=g(n)+h(n)</span>
            <h3>Estimated total solution cost</h3>
            <p>A* expands the frontier node with the smallest f-value. It therefore considers both progress already made and estimated work remaining.</p>
            <div class="hb-mini-example"><strong>f(C)=5+4=9</strong></div>
          </article>
        </aside>
      </div>

      <section class="hb-why-card">
        <h3>Why not use only g(n) or only h(n)?</h3>
        <div class="hb-why-grid">
          <article><strong>Only g(n): Uniform-Cost Search</strong><p>Safe and optimal with non-negative costs, but it may expand many nodes in every direction because it has no idea where the goal is.</p></article>
          <article><strong>Only h(n): Greedy Best-First Search</strong><p>Often fast, but it may choose a node that looks close to the goal even after reaching it through a very expensive path.</p></article>
          <article><strong>g(n)+h(n): A*</strong><p>Combines actual cost and goal-directed guidance. With the right heuristic properties, it remains optimal while usually exploring far fewer nodes.</p></article>
        </div>
      </section>

      <section class="hb-properties-section">
        <div class="hb-section-heading">
          <p class="eyebrow">Step 2 · Understand the guarantees</p>
          <h2>What makes a heuristic safe and useful?</h2>
          <p>A heuristic is not judged only by whether its numbers look sensible. We ask whether those estimates preserve A*'s optimality and whether they behave coherently across edges.</p>
        </div>

        <div class="hb-property-grid">
          <article class="hb-property-card admissible">
            <div class="hb-property-title"><span>✓</span><h3>Admissible</h3></div>
            <p><strong>Rule:</strong> h(n) must never exceed the true cheapest remaining cost h*(n).</p>
            <div class="hb-equation">0 ≤ h(n) ≤ h*(n)</div>
            <div class="hb-property-example"><strong>Example:</strong> If the true remaining cost is 7, estimates 0, 4, or 7 are admissible; 9 is not.</div>
            <div class="hb-importance"><strong>Why required?</strong> An overestimate can make A* ignore a node on the optimal path. For graph search, admissibility alone is not the most convenient guarantee; consistency gives the stronger operational property used below.</div>
          </article>

          <article class="hb-property-card consistent">
            <div class="hb-property-title"><span>↘</span><h3>Consistent (monotone)</h3></div>
            <p><strong>Rule:</strong> moving across one edge cannot reduce the estimate by more than that edge costs.</p>
            <div class="hb-equation">h(n) ≤ c(n,n′)+h(n′)</div>
            <div class="hb-property-example"><strong>Example:</strong> For an edge A → B of cost 3, h(A)=8 and h(B)=6 is valid because 8≤3+6. But h(A)=10 would violate consistency.</div>
            <div class="hb-importance"><strong>Why required?</strong> It makes f-values non-decreasing along a path. Therefore, when standard A* graph search closes a node, it need not discover a cheaper route to that node later.</div>
          </article>

          <article class="hb-property-card relation">
            <div class="hb-property-title"><span>⇒</span><h3>How they are related</h3></div>
            <p>If h(goal)=0, every consistent heuristic is also admissible. However, an admissible heuristic can still be inconsistent.</p>
            <div class="hb-relation-flow"><span>Consistent</span><b>⇒</b><span>Admissible</span><b>⇒</b><span>Optimal A* tree search</span></div>
            <div class="hb-property-example">For standard A* graph search without reopening closed nodes, consistency is the clean condition that preserves optimality.</div>
            <div class="hb-importance"><strong>Important:</strong> An inconsistent heuristic can still be used, but the implementation may need to reopen nodes when a better g-value is found.</div>
          </article>

          <article class="hb-property-card dominance">
            <div class="hb-property-title"><span>↑</span><h3>More informed / dominance</h3></div>
            <p>For two admissible heuristics, h₂ dominates h₁ when h₂(n)≥h₁(n) for every node while still never overestimating.</p>
            <div class="hb-equation">h₁(n) ≤ h₂(n) ≤ h*(n)</div>
            <div class="hb-property-example"><strong>Example:</strong> Manhattan distance usually dominates misplaced tiles for the 8-puzzle.</div>
            <div class="hb-importance"><strong>Why useful?</strong> A more informed admissible heuristic generally allows A* to expand no more nodes than a weaker one, apart from tie-breaking effects.</div>
          </article>
        </div>
      </section>

      <section class="hb-checklist-card">
        <h3>A practical heuristic checklist</h3>
        <div class="hb-checklist">
          <span>① Is h(goal)=0?</span><span>② Does h(n) avoid overestimation?</span><span>③ Does every edge satisfy consistency?</span><span>④ Is it cheaper to compute than solving the problem?</span><span>⑤ Is it more informative than h(n)=0?</span>
        </div>
      </section>

      <section class="hb-challenge-section">
        <div class="hb-section-heading">
          <p class="eyebrow">Step 3 · Do it yourself</p>
          <h2>Random A* frontier challenge</h2>
          <p>Every new question generates a different graph. Read each path cost, combine it with the displayed heuristic, and predict which frontier node A* expands next.</p>
        </div>

        <div class="hb-challenge-layout">
          <section class="hb-random-graph-card">
            <div class="hb-card-heading">
              <div>
                <h3 id="hbChallengeTitle">Question</h3>
                <p id="hbChallengePrompt">Select the frontier node with minimum f(n).</p>
              </div>
              <button id="hbNewQuestion" type="button">New random graph</button>
            </div>
            <div id="hbRandomGraph" class="hb-random-graph"></div>
            <div class="hb-legend"><span><i class="start"></i>Start</span><span><i class="frontier"></i>Frontier</span><span><i class="goal"></i>Goal</span></div>
          </section>

          <aside class="hb-challenge-panel">
            <h3>Calculate before choosing</h3>
            <div id="hbChallengeTable" class="heuristic-frontier-table"></div>
            <div id="hbChallengeChoices" class="hb-choice-grid"></div>
            <button id="hbCheckAnswer" class="primary-button" type="button">Check my answer</button>
            <button id="hbRevealCalculation" type="button">Show calculation</button>
            <div id="hbChallengeFeedback" class="heuristic-teaching-note">First calculate f(n)=g(n)+h(n) for each frontier node.</div>
          </aside>
        </div>
      </section>`;

    setupWorkedExample(root);
    setupRandomChallenge(root);
  }

  function setupWorkedExample(root) {
    const canvas = root.querySelector('#hbExampleCanvas');
    const summary = root.querySelector('#hbExampleSummary');
    const button = root.querySelector('#hbAnimateExample');

    const nodes = {
      S: { x: 60, y: 150, label: 'S', kind: 'start' },
      A: { x: 210, y: 75, label: 'A', kind: 'path' },
      B: { x: 210, y: 225, label: 'B', kind: 'frontier', g: 5, h: 6 },
      C: { x: 380, y: 75, label: 'C', kind: 'frontier', g: 5, h: 4 },
      D: { x: 380, y: 225, label: 'D', kind: 'frontier', g: 7, h: 1 },
      G: { x: 570, y: 150, label: 'G', kind: 'goal' }
    };
    const edges = [
      ['S', 'A', 2], ['A', 'C', 3], ['S', 'B', 5], ['B', 'D', 2],
      ['C', 'G', 5], ['D', 'G', 4]
    ];

    const svg = el('svg', { viewBox: '0 0 630 300', role: 'img', 'aria-label': 'A star worked example graph' });
    edges.forEach(([from, to, cost]) => {
      const a = nodes[from]; const b = nodes[to];
      svg.appendChild(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'hb-edge' }));
      const tx = (a.x + b.x) / 2; const ty = (a.y + b.y) / 2 - 8;
      const label = el('text', { x: tx, y: ty, class: 'hb-edge-label' });
      label.textContent = cost;
      svg.appendChild(label);
    });

    Object.entries(nodes).forEach(([id, n]) => {
      const group = el('g', { class: `hb-node-group ${n.kind}`, 'data-node': id, tabindex: n.g != null ? '0' : '-1' });
      group.appendChild(el('circle', { cx: n.x, cy: n.y, r: 27, class: 'hb-node-circle' }));
      const label = el('text', { x: n.x, y: n.y + 5, class: 'hb-node-label' });
      label.textContent = n.label;
      group.appendChild(label);
      if (n.g != null) {
        const values = el('text', { x: n.x, y: n.y + 49, class: 'hb-node-values' });
        values.textContent = `g=${n.g}, h=${n.h}, f=${n.g + n.h}`;
        group.appendChild(values);
        const select = () => explainNode(id, n);
        group.addEventListener('click', select);
        group.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') select(); });
      }
      svg.appendChild(group);
    });
    canvas.appendChild(svg);

    function explainNode(id, n) {
      svg.querySelectorAll('.hb-node-group').forEach((g) => g.classList.remove('active'));
      svg.querySelector(`[data-node="${id}"]`).classList.add('active');
      summary.innerHTML = `<strong>Node ${id}:</strong> the exact path cost is g(${id})=${n.g}; the estimated remaining cost is h(${id})=${n.h}; therefore f(${id})=${n.g}+${n.h}=<strong>${n.g + n.h}</strong>.`;
    }

    const steps = [
      ['B', 'First inspect B. The path S→B costs 5, so g(B)=5. Its estimate is h(B)=6. Therefore f(B)=11.'],
      ['C', 'For C, the path S→A→C costs 2+3=5, so g(C)=5. With h(C)=4, f(C)=9.'],
      ['D', 'For D, the path S→B→D costs 5+2=7. With h(D)=1, f(D)=8.'],
      ['D', 'A* chooses D because f(D)=8 is the smallest frontier value—even though D has the largest g-value.']
    ];
    let step = 0;
    button.addEventListener('click', () => {
      const [id, text] = steps[step];
      svg.querySelectorAll('.hb-node-group').forEach((g) => g.classList.remove('active', 'winner'));
      const target = svg.querySelector(`[data-node="${id}"]`);
      target.classList.add('active');
      if (step === steps.length - 1) target.classList.add('winner');
      summary.innerHTML = `<strong>Step ${step + 1}:</strong> ${text}`;
      step = (step + 1) % steps.length;
      button.textContent = step === 0 ? 'Explain again' : 'Next step';
    });
  }

  function setupRandomChallenge(root) {
    const graph = root.querySelector('#hbRandomGraph');
    const table = root.querySelector('#hbChallengeTable');
    const choices = root.querySelector('#hbChallengeChoices');
    const feedback = root.querySelector('#hbChallengeFeedback');
    const title = root.querySelector('#hbChallengeTitle');
    let current = null;
    let selected = null;
    let revealed = false;
    let questionNo = 0;

    function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    function makeQuestion() {
      questionNo += 1;
      selected = null;
      revealed = false;
      const names = ['A', 'B', 'C'];
      const rows = names.map((name, index) => ({
        name,
        x: 245 + index * 155,
        y: [75, 170, 265][index],
        edge1: rand(1, 5),
        edge2: rand(1, 5),
        h: rand(0, 9)
      }));
      rows.forEach((row) => { row.g = row.edge1 + row.edge2; row.f = row.g + row.h; });
      const minF = Math.min(...rows.map((row) => row.f));
      let tied = rows.filter((row) => row.f === minF);
      while (tied.length > 1) {
        rows.forEach((row) => { row.h = rand(0, 9); row.f = row.g + row.h; });
        const nextMin = Math.min(...rows.map((row) => row.f));
        tied = rows.filter((row) => row.f === nextMin);
      }
      current = { rows, answer: rows.reduce((best, row) => row.f < best.f ? row : best) };
      title.textContent = `Question ${questionNo}`;
      feedback.textContent = 'First calculate f(n)=g(n)+h(n) for each frontier node.';
      renderGraph();
      renderTable(false);
      renderChoices();
    }

    function renderGraph() {
      graph.innerHTML = '';
      const svg = el('svg', { viewBox: '0 0 700 340', role: 'img', 'aria-label': 'Random frontier graph' });
      const start = { x: 55, y: 170 };
      const junctions = current.rows.map((row) => ({ x: 145, y: row.y }));
      const goal = { x: 645, y: 170 };

      current.rows.forEach((row, index) => {
        const j = junctions[index];
        svg.appendChild(el('line', { x1: start.x, y1: start.y, x2: j.x, y2: j.y, class: 'hb-edge' }));
        svg.appendChild(el('line', { x1: j.x, y1: j.y, x2: row.x, y2: row.y, class: 'hb-edge' }));
        svg.appendChild(el('line', { x1: row.x, y1: row.y, x2: goal.x, y2: goal.y, class: 'hb-edge hb-estimate-edge' }));
        addText(svg, (start.x + j.x) / 2 - 5, (start.y + j.y) / 2 - 8, `${row.edge1}`, 'hb-edge-label');
        addText(svg, (j.x + row.x) / 2, row.y - 10, `${row.edge2}`, 'hb-edge-label');
        addText(svg, (row.x + goal.x) / 2, (row.y + goal.y) / 2 - 10, `h=${row.h}`, 'hb-h-label');
        const jGroup = el('g', { class: 'hb-node-group path' });
        jGroup.appendChild(el('circle', { cx: j.x, cy: j.y, r: 13, class: 'hb-node-circle' }));
        svg.appendChild(jGroup);
        const group = el('g', { class: 'hb-node-group frontier', 'data-random-node': row.name });
        group.appendChild(el('circle', { cx: row.x, cy: row.y, r: 26, class: 'hb-node-circle' }));
        addText(group, row.x, row.y + 5, row.name, 'hb-node-label');
        svg.appendChild(group);
      });
      const sGroup = el('g', { class: 'hb-node-group start' });
      sGroup.appendChild(el('circle', { cx: start.x, cy: start.y, r: 27, class: 'hb-node-circle' }));
      addText(sGroup, start.x, start.y + 5, 'S', 'hb-node-label');
      svg.appendChild(sGroup);
      const gGroup = el('g', { class: 'hb-node-group goal' });
      gGroup.appendChild(el('circle', { cx: goal.x, cy: goal.y, r: 27, class: 'hb-node-circle' }));
      addText(gGroup, goal.x, goal.y + 5, 'G', 'hb-node-label');
      svg.appendChild(gGroup);
      graph.appendChild(svg);
    }

    function addText(parent, x, y, value, className) {
      const text = el('text', { x, y, class: className });
      text.textContent = value;
      parent.appendChild(text);
    }

    function renderTable(showValues) {
      table.innerHTML = `
        <div class="hft-row hft-header"><span>Node</span><span>g(n)</span><span>h(n)</span><span>f(n)</span></div>
        ${current.rows.map((row) => `<div class="hft-row ${revealed && row.name === current.answer.name ? 'selected' : ''}"><strong>${row.name}</strong><span>${showValues ? row.g : '?'}</span><span>${row.h}</span><strong>${showValues ? row.f : '?'}</strong></div>`).join('')}`;
    }

    function renderChoices() {
      choices.innerHTML = current.rows.map((row) => `<button type="button" data-choice="${row.name}">Expand ${row.name}</button>`).join('');
      choices.querySelectorAll('[data-choice]').forEach((button) => button.addEventListener('click', () => {
        selected = button.dataset.choice;
        choices.querySelectorAll('button').forEach((item) => item.classList.toggle('selected', item === button));
        feedback.textContent = `You selected node ${selected}. Press “Check my answer”.`;
      }));
    }

    root.querySelector('#hbCheckAnswer').addEventListener('click', () => {
      if (!selected) {
        feedback.textContent = 'Choose one frontier node first.';
        return;
      }
      revealed = true;
      renderTable(true);
      graph.querySelectorAll('[data-random-node]').forEach((node) => {
        node.classList.toggle('winner', node.getAttribute('data-random-node') === current.answer.name);
      });
      const a = current.answer;
      feedback.innerHTML = selected === a.name
        ? `<strong>Correct.</strong> ${a.name} has the minimum value: f(${a.name})=${a.g}+${a.h}=${a.f}. A* expands ${a.name} next.`
        : `<strong>Not this time.</strong> ${selected} is not minimum. ${a.name} wins because f(${a.name})=${a.g}+${a.h}=${a.f}.`;
    });

    root.querySelector('#hbRevealCalculation').addEventListener('click', () => {
      renderTable(true);
      const calculations = current.rows.map((row) => `f(${row.name})=${row.g}+${row.h}=${row.f}`).join('; ');
      feedback.innerHTML = `<strong>Calculations:</strong> ${calculations}. Now choose the smallest f-value.`;
    });
    root.querySelector('#hbNewQuestion').addEventListener('click', makeQuestion);
    makeQuestion();
  }

  window.addEventListener('heuristiclab:ready', init);
  if (document.readyState !== 'loading') init();
})();
