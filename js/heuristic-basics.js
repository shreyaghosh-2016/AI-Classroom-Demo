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

        <div class="hb-property-visual-list">
          <article class="hb-property-visual-card">
            <div class="hb-property-copy">
              <div class="hb-property-title"><span>✓</span><h3>Graph 1 · Admissibility: never overestimate</h3></div>
              <p><strong>Definition:</strong> a heuristic is admissible when <strong>h(n) ≤ h*(n)</strong> for every node, where h*(n) is the true cheapest remaining cost to a goal.</p>
              <div class="hb-equation">0 ≤ h(n) ≤ h*(n)</div>
              <p>In the graph, the true remaining cost from A is 2+3=5. Therefore h(A)=4 is safe, while h(A)=7 is an overestimate.</p>
              <div class="hb-importance"><strong>Why is it required?</strong> A* uses f(n)=g(n)+h(n). An exaggerated h-value can make a genuinely optimal route appear more expensive than a suboptimal route. Admissibility ensures the heuristic never makes the best possible completion look worse than it really is.</div>
              <div class="hb-consequence"><strong>Search consequence:</strong> with an admissible heuristic, A* tree search can still guarantee an optimal solution. With an inadmissible heuristic, A* may return a more expensive goal first.</div>
            </div>
            <div class="hb-property-graph" id="hbAdmissibleGraph" aria-label="Graph explaining admissible and inadmissible heuristic values"></div>
          </article>

          <article class="hb-property-visual-card">
            <div class="hb-property-copy">
              <div class="hb-property-title"><span>↘</span><h3>Graph 2 · Consistency: estimates must agree across every edge</h3></div>
              <p><strong>Definition:</strong> for every edge n→n′, the estimate at n must be no larger than the edge cost plus the estimate at n′.</p>
              <div class="hb-equation">h(n) ≤ c(n,n′)+h(n′)</div>
              <p>For edge A→B of cost 2, h(A)=5 and h(B)=3 satisfy 5≤2+3. But h(A)=7 and h(B)=3 violate the rule because 7&gt;5.</p>
              <div class="hb-importance"><strong>Why is it required?</strong> Consistency makes f-values non-decreasing along a path. Once standard A* graph search removes the lowest-f node and closes it, a cheaper route to that node will not unexpectedly appear later.</div>
              <div class="hb-consequence"><strong>Search consequence:</strong> without consistency, A* can still work, but it must be prepared to reopen an already closed node when a better g-value is discovered. Otherwise, optimality can be lost.</div>
            </div>
            <div class="hb-property-graph" id="hbConsistentGraph" aria-label="Graph explaining consistent and inconsistent heuristic values"></div>
          </article>

          <article class="hb-property-visual-card">
            <div class="hb-property-copy">
              <div class="hb-property-title"><span>↑</span><h3>Graph 3 · Dominance: prefer the safer heuristic with larger estimates</h3></div>
              <p><strong>Definition:</strong> if h₁ and h₂ are both admissible and h₂(n)≥h₁(n) for every node, then h₂ dominates h₁.</p>
              <div class="hb-equation">h₁(n) ≤ h₂(n) ≤ h*(n)</div>
              <p>The two heuristics in this graph are both safe. However, h₂ is closer to the true remaining costs, so its f-values separate promising and unpromising nodes more clearly.</p>
              <div class="hb-importance"><strong>Why is it required?</strong> Admissibility tells us whether a heuristic is safe; dominance helps us choose which safe heuristic is more useful. A stronger admissible heuristic usually reduces unnecessary expansion.</div>
              <div class="hb-consequence"><strong>Search consequence:</strong> A* using a dominating admissible heuristic generally expands no more nodes than A* using the weaker heuristic, apart from tie-breaking among equal f-values.</div>
            </div>
            <div class="hb-property-graph" id="hbDominanceGraph" aria-label="Graph comparing a weak and a dominating heuristic"></div>
          </article>
        </div>

        <article class="hb-relation-card">
          <h3>How the three ideas fit together</h3>
          <div class="hb-relation-flow"><span>Consistency</span><b>⇒</b><span>Admissibility</span><b>⇒</b><span>Optimal A* tree search</span></div>
          <p>When h(goal)=0, consistency implies admissibility. For standard graph-search A* that does not reopen closed nodes, consistency is the convenient stronger condition. Dominance is different: it compares two already-safe heuristics and identifies the one that gives better guidance.</p>
        </article>
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
    setupPropertyGraphs(root);
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


  function setupPropertyGraphs(root) {
    function addText(parent, x, y, value, className, anchor = 'middle') {
      const text = el('text', { x, y, class: className, 'text-anchor': anchor });
      text.textContent = value;
      parent.appendChild(text);
    }

    function line(svg, a, b, cost, extra = '') {
      svg.appendChild(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: `hb-edge ${extra}`.trim() }));
      addText(svg, (a.x + b.x) / 2, (a.y + b.y) / 2 - 9, String(cost), 'hb-edge-label');
    }

    function node(svg, p, label, kind, sublines = []) {
      const g = el('g', { class: `hb-node-group ${kind}` });
      g.appendChild(el('circle', { cx: p.x, cy: p.y, r: 27, class: 'hb-node-circle' }));
      addText(g, p.x, p.y + 5, label, 'hb-node-label');
      sublines.forEach((txt, i) => addText(g, p.x, p.y + 48 + i * 18, txt, 'hb-node-values'));
      svg.appendChild(g);
    }

    // Graph 1: admissibility and the danger of overestimation.
    {
      const host = root.querySelector('#hbAdmissibleGraph');
      const svg = el('svg', { viewBox: '0 0 680 300', role: 'img' });
      const S={x:55,y:150}, A={x:235,y:75}, B={x:235,y:225}, G={x:610,y:150};
      line(svg,S,A,2); line(svg,A,G,5); line(svg,S,B,1); line(svg,B,G,7);
      node(svg,S,'S','start'); node(svg,G,'G','goal');
      node(svg,A,'A','frontier',['true h*=5','safe h=4 / bad h=7']);
      node(svg,B,'B','frontier',['true h*=7','h=3']);
      addText(svg,340,32,'Optimal route cost via A = 2+5 = 7','hb-graph-caption');
      addText(svg,340,282,'Overestimating A can make the costlier route via B look preferable.','hb-graph-caption');
      host.appendChild(svg);
    }

    // Graph 2: consistency and monotone f-values.
    {
      const host = root.querySelector('#hbConsistentGraph');
      const svg = el('svg', { viewBox: '0 0 680 300', role: 'img' });
      const S={x:55,y:150}, A={x:220,y:150}, B={x:410,y:150}, G={x:610,y:150};
      line(svg,S,A,2); line(svg,A,B,2); line(svg,B,G,3);
      node(svg,S,'S','start',['g=0']);
      node(svg,A,'A','frontier',['g=2','consistent: h=5 → f=7','bad: h=7 → f=9']);
      node(svg,B,'B','frontier',['g=4','h=3 → f=7']);
      node(svg,G,'G','goal',['h=0']);
      addText(svg,315,45,'Consistent case: f(A)=7 and f(B)=7 — f never decreases','hb-graph-caption');
      addText(svg,315,275,'Inconsistent case: f falls from 9 at A to 7 at B','hb-graph-caption');
      host.appendChild(svg);
    }

    // Graph 3: dominance and fewer expansions.
    {
      const host = root.querySelector('#hbDominanceGraph');
      const svg = el('svg', { viewBox: '0 0 680 330', role: 'img' });
      const S={x:55,y:165}, A={x:225,y:70}, B={x:225,y:165}, C={x:225,y:260}, G={x:610,y:165};
      line(svg,S,A,2); line(svg,S,B,2); line(svg,S,C,2); line(svg,A,G,4); line(svg,B,G,7); line(svg,C,G,9);
      node(svg,S,'S','start'); node(svg,G,'G','goal');
      node(svg,A,'A','frontier',['h*=4','h₁=1, h₂=4']);
      node(svg,B,'B','frontier',['h*=7','h₁=1, h₂=6']);
      node(svg,C,'C','frontier',['h*=9','h₁=1, h₂=8']);
      addText(svg,430,48,'Weak h₁ gives f(A)=f(B)=f(C)=3 — poor guidance','hb-graph-caption');
      addText(svg,430,292,'Dominating h₂ gives f(A)=6, f(B)=8, f(C)=10','hb-graph-caption');
      host.appendChild(svg);
    }
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
