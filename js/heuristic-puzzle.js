(() => {
  'use strict';
  const GOAL = [1,2,3,4,5,6,7,8,0];
  const presets = {
    easy: [1,2,3,4,5,6,0,7,8],
    medium: [1,2,3,5,0,6,4,7,8],
    hard: [7,2,4,5,0,6,8,3,1]
  };

  const key = (state) => state.join('');
  function misplaced(state) { return state.reduce((sum, tile, i) => sum + (tile && tile !== GOAL[i] ? 1 : 0), 0); }
  function manhattan(state) {
    return state.reduce((sum, tile, i) => {
      if (!tile) return sum;
      const gi = tile - 1;
      return sum + Math.abs(Math.floor(i / 3) - Math.floor(gi / 3)) + Math.abs(i % 3 - gi % 3);
    }, 0);
  }
  function linearConflict(state) {
    let conflicts = 0;
    for (let row = 0; row < 3; row++) {
      const tiles = state.slice(row * 3, row * 3 + 3);
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        const a = tiles[i], b = tiles[j];
        if (a && b && Math.floor((a - 1) / 3) === row && Math.floor((b - 1) / 3) === row && a > b) conflicts++;
      }
    }
    for (let col = 0; col < 3; col++) {
      const tiles = [state[col], state[col + 3], state[col + 6]];
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        const a = tiles[i], b = tiles[j];
        if (a && b && (a - 1) % 3 === col && (b - 1) % 3 === col && a > b) conflicts++;
      }
    }
    return manhattan(state) + 2 * conflicts;
  }
  function heuristic(state, type) {
    if (type === 'zero') return 0;
    if (type === 'misplaced') return misplaced(state);
    if (type === 'linear') return linearConflict(state);
    if (type === 'weighted') return 1.5 * manhattan(state);
    return manhattan(state);
  }
  function neighbors(state) {
    const blank = state.indexOf(0), row = Math.floor(blank / 3), col = blank % 3;
    const moves = [[-1,0,'Down'],[1,0,'Up'],[0,-1,'Right'],[0,1,'Left']];
    return moves.flatMap(([dr,dc,label]) => {
      const nr = row + dr, nc = col + dc;
      if (nr < 0 || nr > 2 || nc < 0 || nc > 2) return [];
      const ni = nr * 3 + nc, copy = [...state], moved = copy[ni];
      [copy[blank], copy[ni]] = [copy[ni], copy[blank]];
      return [{ state: copy, move: `Move ${moved} ${label}` }];
    });
  }
  function solve(start, type, expansionLimit = 50000) {
    const frontier = [{ state:start, g:0, h:heuristic(start,type), parent:null, move:'Start' }];
    const best = new Map([[key(start),0]]); let expanded = 0, maxFrontier = 1;
    while (frontier.length && expanded < expansionLimit) {
      frontier.sort((a,b) => (a.g+a.h)-(b.g+b.h) || a.h-b.h);
      const node = frontier.shift();
      if (node.g !== best.get(key(node.state))) continue;
      expanded++;
      if (key(node.state) === key(GOAL)) {
        const path=[]; let cur=node;
        while(cur){ path.unshift(cur); cur=cur.parent; }
        return { found:true, path, expanded, maxFrontier, cost:node.g };
      }
      for (const next of neighbors(node.state)) {
        const g=node.g+1, k=key(next.state);
        if (g < (best.get(k) ?? Infinity)) {
          best.set(k,g);
          frontier.push({state:next.state,g,h:heuristic(next.state,type),parent:node,move:next.move});
        }
      }
      maxFrontier=Math.max(maxFrontier,frontier.length);
    }
    return { found:false, path:[], expanded, maxFrontier, cost:null };
  }

  function init() {
    const root=document.getElementById('heuristicPuzzleRoot');
    if(!root||root.dataset.ready)return; root.dataset.ready='true';
    root.innerHTML=`
      <div class="heuristic-lab-layout">
        <aside class="heuristic-control-card">
          <p class="eyebrow">8-Puzzle experiment</p><h2>Choose the knowledge given to A*</h2>
          <label>Starting puzzle<select id="hpPreset"><option value="easy">Easy</option><option value="medium" selected>Medium</option><option value="hard">Hard</option></select></label>
          <label>Heuristic<select id="hpHeuristic"><option value="zero">h₀: Zero (UCS)</option><option value="misplaced">h₁: Misplaced tiles</option><option value="manhattan" selected>h₂: Manhattan distance</option><option value="linear">h₃: Manhattan + linear conflict</option><option value="weighted">Weighted Manhattan (inadmissible)</option></select></label>
          <div class="button-grid"><button id="hpRun" class="primary-button" type="button">Run A*</button><button id="hpCompare" type="button">Compare all</button><button id="hpStep" type="button">Next path step</button><button id="hpReset" type="button">Reset</button></div>
          <div class="heuristic-teaching-note" id="hpMessage">Run A* and compare how much search each heuristic performs.</div>
        </aside>
        <section>
          <div class="puzzle-comparison-stage">
            <div><span class="stage-label">Current state</span><div id="hpBoard" class="heuristic-puzzle-board"></div></div>
            <div class="puzzle-arrow">→</div>
            <div><span class="stage-label">Goal state</span><div id="hpGoal" class="heuristic-puzzle-board goal-board"></div></div>
          </div>
          <div class="metrics-grid heuristic-metrics">
            <article class="metric-card"><span>Path cost</span><strong id="hpCost">—</strong></article>
            <article class="metric-card"><span>Nodes expanded</span><strong id="hpExpanded">—</strong></article>
            <article class="metric-card"><span>Maximum frontier</span><strong id="hpFrontier">—</strong></article>
            <article class="metric-card"><span>Current g / h / f</span><strong id="hpScores">—</strong></article>
          </div>
          <div id="hpComparison" class="heuristic-comparison-table hidden"></div>
          <article class="heuristic-explanation-box"><h3>What does this teach?</h3><p id="hpExplanation">A heuristic that is closer to the true remaining distance usually expands fewer states.</p></article>
        </section>
      </div>`;

    const el={preset:root.querySelector('#hpPreset'),heuristic:root.querySelector('#hpHeuristic'),board:root.querySelector('#hpBoard'),goal:root.querySelector('#hpGoal'),cost:root.querySelector('#hpCost'),expanded:root.querySelector('#hpExpanded'),frontier:root.querySelector('#hpFrontier'),scores:root.querySelector('#hpScores'),message:root.querySelector('#hpMessage'),comparison:root.querySelector('#hpComparison'),explanation:root.querySelector('#hpExplanation')};
    let result=null,index=0;
    function draw(container,state){container.innerHTML=state.map(v=>`<div class="puzzle-tile ${v===0?'blank':''}">${v||''}</div>`).join('');}
    function reset(){result=null;index=0;draw(el.board,presets[el.preset.value]);draw(el.goal,GOAL);el.cost.textContent=el.expanded.textContent=el.frontier.textContent=el.scores.textContent='—';el.comparison.classList.add('hidden');el.message.textContent='Run A* and compare how much search each heuristic performs.';el.explanation.textContent='A heuristic that is closer to the true remaining distance usually expands fewer states.';}
    function renderStep(){if(!result?.found)return;const node=result.path[index];draw(el.board,node.state);el.scores.textContent=`${node.g} / ${node.h} / ${node.g+node.h}`;el.message.textContent=`Step ${index} of ${result.path.length-1}: ${node.move}`;index=Math.min(index+1,result.path.length-1);}
    root.querySelector('#hpRun').addEventListener('click',()=>{const type=el.heuristic.value;result=solve(presets[el.preset.value],type);index=0;if(result.found){el.cost.textContent=result.cost;el.expanded.textContent=result.expanded;el.frontier.textContent=result.maxFrontier;renderStep();el.explanation.textContent=type==='weighted'?'Weighted Manhattan may expand fewer nodes, but because it can overestimate, optimality is not guaranteed in general.':'This heuristic is admissible for the standard 8-puzzle. A* therefore returns an optimal solution.';}else el.message.textContent='Search limit reached.';});
    root.querySelector('#hpStep').addEventListener('click',renderStep);
    root.querySelector('#hpReset').addEventListener('click',reset);
    root.querySelector('#hpCompare').addEventListener('click',()=>{const types=[['zero','Zero'],['misplaced','Misplaced'],['manhattan','Manhattan'],['linear','Linear conflict'],['weighted','Weighted']];const rows=types.map(([t,n])=>[n,solve(presets[el.preset.value],t)]);el.comparison.innerHTML=`<div class="comparison-row header"><span>Heuristic</span><span>Cost</span><span>Expanded</span><span>Max frontier</span><span>Guarantee</span></div>${rows.map(([n,r],i)=>`<div class="comparison-row ${i===3?'best-row':''}"><strong>${n}</strong><span>${r.cost??'—'}</span><span>${r.expanded}</span><span>${r.maxFrontier}</span><span>${n==='Weighted'?'Not guaranteed':'Optimal'}</span></div>`).join('')}`;el.comparison.classList.remove('hidden');el.message.textContent='Compare search effort, not only the final path length.';});
    el.preset.addEventListener('change',reset);el.heuristic.addEventListener('change',reset);reset();
  }
  window.addEventListener('heuristiclab:ready',init); if(document.readyState!=='loading')init();
})();
