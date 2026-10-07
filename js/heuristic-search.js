(() => {
  'use strict';

  const MODULE_ID = 'heuristicView';

  function injectModuleCard() {
    const grid = document.querySelector('.module-grid');
    if (!grid || document.querySelector(`[data-view="${MODULE_ID}"]`)) return;

    const planningCard = [...grid.children].find((item) => item.textContent.includes('Planning'));
    const card = document.createElement('button');
    card.className = 'module-card live-module';
    card.type = 'button';
    card.dataset.view = MODULE_ID;
    card.innerHTML = `
      <span class="module-number">04</span>
      <span class="module-icon" aria-hidden="true">🎯</span>
      <span class="module-status live">Live</span>
      <strong>Heuristic Search Lab</strong>
      <span class="module-description">Compare heuristics, inspect g(n), h(n), and f(n), and discover when A* is efficient and optimal.</span>
      <span class="module-link">Open heuristic lab →</span>`;

    if (planningCard) grid.insertBefore(card, planningCard);
    else grid.append(card);

    [...grid.querySelectorAll('.module-number')].forEach((number, index) => {
      number.textContent = String(index + 1).padStart(2, '0');
    });

    card.addEventListener('click', () => showHeuristicView());
  }

  function injectModuleView() {
    const main = document.querySelector('main');
    if (!main || document.getElementById(MODULE_ID)) return;

    const section = document.createElement('section');
    section.id = MODULE_ID;
    section.className = 'module-view hidden heuristic-module';
    section.innerHTML = `
      <div class="module-page-header">
        <div>
          <p class="eyebrow">Module 04</p>
          <h1>Heuristic Search Lab</h1>
          <p class="subtitle">A heuristic is problem knowledge expressed as an estimate. Test how the choice of h(n) changes the behaviour of A*.</p>
        </div>
        <button class="secondary-button heuristic-home-button" type="button">All modules</button>
      </div>

      <div class="heuristic-tabs" role="tablist" aria-label="Heuristic search activities">
        <button class="heuristic-tab active" data-heuristic-tab="basics" type="button" role="tab" aria-selected="true">🧠 Heuristic Basics</button>
        <button class="heuristic-tab" data-heuristic-tab="puzzle" type="button" role="tab" aria-selected="false">🧩 8-Puzzle Lab</button>
        <button class="heuristic-tab" data-heuristic-tab="grid" type="button" role="tab" aria-selected="false">🗺️ Grid Heuristics</button>
        <button class="heuristic-tab" data-heuristic-tab="race" type="button" role="tab" aria-selected="false">🏁 Heuristic Race</button>
      </div>

      <section class="heuristic-panel active" data-heuristic-panel="basics">
        <div id="heuristicBasicsRoot"></div>
      </section>
      <section class="heuristic-panel" data-heuristic-panel="puzzle">
        <div id="heuristicPuzzleRoot"></div>
      </section>
      <section class="heuristic-panel" data-heuristic-panel="grid">
        <div id="heuristicGridRoot"></div>
      </section>
      <section class="heuristic-panel" data-heuristic-panel="race">
        <div id="heuristicRaceRoot"></div>
      </section>`;

    main.append(section);
    section.querySelector('.heuristic-home-button').addEventListener('click', showHomeView);
    section.querySelectorAll('.heuristic-tab').forEach((tab) => {
      tab.addEventListener('click', () => activateTab(tab.dataset.heuristicTab));
    });
  }

  function activateTab(name) {
    const section = document.getElementById(MODULE_ID);
    if (!section) return;
    section.querySelectorAll('.heuristic-tab').forEach((tab) => {
      const active = tab.dataset.heuristicTab === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    section.querySelectorAll('.heuristic-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.heuristicPanel === name);
    });
  }

  function hideAllViews() {
    document.querySelectorAll('#homeView, .module-view').forEach((view) => {
      view.classList.add('hidden');
      view.classList.remove('view-active');
    });
  }

  function showHeuristicView() {
    hideAllViews();
    const section = document.getElementById(MODULE_ID);
    if (!section) return;
    section.classList.remove('hidden');
    section.classList.add('view-active');
    document.querySelector('#homeButton')?.classList.remove('hidden');
    document.title = 'Heuristic Search Lab | AI Course (IIT BBSR)';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showHomeView() {
    hideAllViews();
    const home = document.getElementById('homeView');
    home?.classList.remove('hidden');
    home?.classList.add('view-active');
    document.querySelector('#homeButton')?.classList.add('hidden');
    document.title = 'AI Course (IIT BBSR)';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function protectExistingHomeNavigation() {
    document.querySelector('#homeButton')?.addEventListener('click', () => {
      document.getElementById(MODULE_ID)?.classList.add('hidden');
    });
    document.querySelector('#brandButton')?.addEventListener('click', () => {
      document.getElementById(MODULE_ID)?.classList.add('hidden');
    });
  }

  function initialise() {
    injectModuleCard();
    injectModuleView();
    protectExistingHomeNavigation();
    window.HeuristicLab = window.HeuristicLab || {};
    window.HeuristicLab.activateTab = activateTab;
    window.dispatchEvent(new CustomEvent('heuristiclab:ready'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise);
  else initialise();
})();
