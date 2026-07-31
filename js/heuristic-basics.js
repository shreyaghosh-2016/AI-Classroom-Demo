(() => {
  'use strict';

  function init() {
    const root = document.getElementById('heuristicBasicsRoot');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = 'true';
    root.innerHTML = `
      <div class="heuristic-intro-grid">
        <article class="heuristic-concept-card">
          <span class="concept-symbol">g(n)</span>
          <h2>Cost so far</h2>
          <p>The exact path cost from the start state to node n.</p>
        </article>
        <article class="heuristic-concept-card">
          <span class="concept-symbol">h(n)</span>
          <h2>Estimated cost remaining</h2>
          <p>Problem-specific knowledge estimating how far n is from a goal.</p>
        </article>
        <article class="heuristic-concept-card featured">
          <span class="concept-symbol">f(n)=g(n)+h(n)</span>
          <h2>A* priority</h2>
          <p>A* expands the frontier node with the smallest estimated total solution cost.</p>
        </article>
      </div>

      <div class="heuristic-demo-layout">
        <aside class="heuristic-control-card">
          <p class="eyebrow">Interactive decision</p>
          <h2>Which node should A* expand?</h2>
          <label>Heuristic scenario
            <select id="hbScenario">
              <option value="good">Informative heuristic</option>
              <option value="zero">Zero heuristic</option>
              <option value="over">Overestimating heuristic</option>
              <option value="misleading">Misleading heuristic</option>
            </select>
          </label>
          <button id="hbReveal" class="primary-button" type="button">Reveal A* choice</button>
          <button id="hbReset" type="button">Try again</button>
          <div class="heuristic-teaching-note" id="hbNote">Select a scenario and predict which frontier node has the smallest f(n).</div>
        </aside>
        <section>
          <div class="heuristic-frontier-table" id="hbTable" aria-live="polite"></div>
          <article class="heuristic-explanation-box">
            <h3>Classroom question</h3>
            <p id="hbQuestion">A node can have a low h(n) but a high g(n). Why should A* consider both?</p>
          </article>
        </section>
      </div>

      <div class="heuristic-properties-grid">
        <article><strong>Admissible</strong><p>h(n) never overestimates the true remaining cost.</p></article>
        <article><strong>Consistent</strong><p>h(n) ≤ cost(n,n′)+h(n′) for every edge.</p></article>
        <article><strong>Dominance</strong><p>Among admissible heuristics, a larger estimate is usually more informative.</p></article>
        <article><strong>h(n)=0</strong><p>A* becomes Uniform-Cost Search and uses no goal-directed knowledge.</p></article>
      </div>`;

    const scenarios = {
      good: {
        rows: [['A', 3, 7], ['B', 5, 3], ['C', 7, 2]],
        answer: 'B',
        note: 'B is selected because f(B)=5+3=8, the smallest estimated total cost.',
        question: 'The heuristic helps A* prefer B without ignoring the five units already spent reaching it.'
      },
      zero: {
        rows: [['A', 3, 0], ['B', 5, 0], ['C', 7, 0]],
        answer: 'A',
        note: 'With h(n)=0, A* selects the smallest g(n). It is behaving exactly like UCS.',
        question: 'A zero heuristic is safe but provides no information about the direction of the goal.'
      },
      over: {
        rows: [['A', 3, 12], ['B', 5, 3], ['C', 7, 2]],
        answer: 'B',
        note: 'B is selected now, but the estimate for A may exceed its true remaining cost. Optimality is no longer guaranteed.',
        question: 'An overestimate can make A* postpone a node that actually belongs to the cheapest solution.'
      },
      misleading: {
        rows: [['A', 3, 1], ['B', 5, 6], ['C', 7, 2]],
        answer: 'A',
        note: 'A looks closest according to h(n), so A* selects it. A poor heuristic can guide search into an unhelpful region.',
        question: 'A* remains systematic, but its efficiency depends strongly on the quality of h(n).'
      }
    };

    const scenario = root.querySelector('#hbScenario');
    const table = root.querySelector('#hbTable');
    const note = root.querySelector('#hbNote');
    const question = root.querySelector('#hbQuestion');

    function render(reveal = false) {
      const data = scenarios[scenario.value];
      table.innerHTML = `
        <div class="hft-row hft-header"><span>Node</span><span>g(n)</span><span>h(n)</span><span>f(n)</span></div>
        ${data.rows.map(([node, g, h]) => `<button class="hft-row ${reveal && node === data.answer ? 'selected' : ''}" type="button" data-node="${node}"><strong>${node}</strong><span>${g}</span><span>${h}</span><strong>${g + h}</strong></button>`).join('')}`;
      note.textContent = reveal ? data.note : 'Predict the next expansion, then press “Reveal A* choice”.';
      question.textContent = reveal ? data.question : 'A node can have a low h(n) but a high g(n). Why should A* consider both?';
      table.querySelectorAll('[data-node]').forEach((button) => button.addEventListener('click', () => {
        table.querySelectorAll('[data-node]').forEach((item) => item.classList.remove('student-choice'));
        button.classList.add('student-choice');
        note.textContent = `You predicted node ${button.dataset.node}. Now reveal the A* choice.`;
      }));
    }

    scenario.addEventListener('change', () => render(false));
    root.querySelector('#hbReveal').addEventListener('click', () => render(true));
    root.querySelector('#hbReset').addEventListener('click', () => render(false));
    render(false);
  }

  window.addEventListener('heuristiclab:ready', init);
  if (document.readyState !== 'loading') init();
})();
