"use strict";
(() => {
  const grid = document.querySelector('#mdpGrid');
  if (!grid) return;
  const els = {
    step: document.querySelector('#mdpStep'), reward: document.querySelector('#mdpReward'), ret: document.querySelector('#mdpReturn'), state: document.querySelector('#mdpState'),
    log: document.querySelector('#mdpLog'), status: document.querySelector('#mdpStatus'), reset: document.querySelector('#mdpReset'), noise: document.querySelector('#mdpNoise'),
    discount: document.querySelector('#mdpDiscount'), living: document.querySelector('#mdpLiving'), noiseLabel: document.querySelector('#mdpNoiseLabel'), discountLabel: document.querySelector('#mdpDiscountLabel'),
    livingLabel: document.querySelector('#mdpLivingLabel'), intendedPct: document.querySelector('#mdpIntendedPct'), slipPct: document.querySelector('#mdpSlipPct'), probBar: document.querySelector('#mdpProbBar'),
    chosen: document.querySelector('#mdpChosenAction'), actual: document.querySelector('#mdpActualAction'), teaching: document.querySelector('#mdpTeaching')
  };
  const rows=3, cols=4, wall='2,2', terminals={'4,3':1,'4,2':-1};
  const delta={up:[0,1],down:[0,-1],left:[-1,0],right:[1,0]};
  const perpendicular={up:['left','right'],down:['right','left'],left:['down','up'],right:['up','down']};
  const pretty={up:'↑ Up',down:'↓ Down',left:'← Left',right:'→ Right'};
  let pos={x:1,y:1}, step=0, total=0, ended=false;
  function key(x,y){return `${x},${y}`}
  function render(){
    grid.innerHTML='';
    for(let y=rows;y>=1;y--) for(let x=1;x<=cols;x++){
      const k=key(x,y), cell=document.createElement('div'); cell.className='mdp-cell';
      if(k===wall) cell.classList.add('wall');
      if(terminals[k]===1) cell.classList.add('positive');
      if(terminals[k]===-1) cell.classList.add('negative');
      if(terminals[k]!=null){const t=document.createElement('span');t.className='mdp-terminal';t.textContent=terminals[k]>0?'+1':'−1';cell.append(t)}
      if(pos.x===x&&pos.y===y&&!ended){const a=document.createElement('div');a.className='mdp-agent';cell.append(a)}
      const c=document.createElement('span');c.className='mdp-coord';c.textContent=`(${x},${y})`;cell.append(c);grid.append(cell);
    }
    els.step.textContent=step; els.ret.textContent=total.toFixed(3); els.state.textContent=`(${pos.x},${pos.y})`;
  }
  function addLog(html){const line=document.createElement('div');line.className='mdp-log-line';line.innerHTML=html;els.log.prepend(line)}
  function reset(){pos={x:1,y:1};step=0;total=0;ended=false;els.reward.textContent='0.00';els.chosen.textContent='—';els.actual.textContent='—';els.teaching.textContent='Choose a direction to begin.';els.status.textContent='READY';els.log.innerHTML='';addLog('Episode reset. Agent starts at <b>(1,1)</b>.');render();setTimeout(()=>grid.focus(),0)}
  function sampleAction(action){const n=Number(els.noise.value), r=Math.random(); if(r<1-n)return action; return r<1-n+n/2?perpendicular[action][0]:perpendicular[action][1]}
  function move(action){
    if(ended)return;
    const actual=sampleAction(action), [dx,dy]=delta[actual], nx=pos.x+dx, ny=pos.y+dy; let blocked=nx<1||nx>cols||ny<1||ny>rows||key(nx,ny)===wall;
    if(!blocked){pos={x:nx,y:ny}}
    step++; const terminal=terminals[key(pos.x,pos.y)]; const reward=terminal??Number(els.living.value); total += Math.pow(Number(els.discount.value),step-1)*reward;
    els.reward.textContent=(reward>=0?'+':'')+reward.toFixed(2); els.reward.style.color=reward<0?'#fb7185':reward>0?'#4ade80':''; els.chosen.textContent=pretty[action]; els.actual.textContent=(blocked ? pretty[actual]+' → blocked, stayed put' : pretty[actual]);
    const slipped=actual!==action; els.teaching.textContent=terminal!=null?'Terminal state reached. Episode finished.':slipped?'You chose '+pretty[action]+', but noise made the agent drift '+pretty[actual]+'.':'The agent moved exactly as you chose.';
    addLog(`<b>Step ${step}</b> • Chosen: <b>${pretty[action]}</b><br>Actual: ${slipped?`<span class="slip">${pretty[actual]} (noise caused a sideways drift)</span>`:pretty[actual]}${blocked?' → blocked, so the agent stayed in the same cell':''}<br>Reward: <span class="${reward<0?'rminus':'rplus'}"><b>${reward.toFixed(2)}</b></span> • Discounted return: <b>${total.toFixed(3)}</b>`);
    if(terminal!=null){ended=true;els.status.textContent=terminal>0?'TERMINAL +1':'TERMINAL −1';addLog(`<b>Episode ended</b> at ${key(pos.x,pos.y)}.`)} else els.status.textContent=slipped?'DRIFTED SIDEWAYS':'MOVED AS CHOSEN'; render();
  }
  document.querySelectorAll('[data-mdp-action]').forEach(b=>b.addEventListener('click',()=>{move(b.dataset.mdpAction);grid.focus()}));
  grid.addEventListener('keydown',e=>{const m={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};if(m[e.key]){e.preventDefault();move(m[e.key])}});
  els.reset.addEventListener('click',reset);
  function updateSettings(){const n=Number(els.noise.value), intended=Math.round((1-n)*100), side=Math.round(n*50);els.noiseLabel.textContent=n.toFixed(2);els.discountLabel.textContent=Number(els.discount.value).toFixed(2);els.livingLabel.textContent=Number(els.living.value).toFixed(2);els.intendedPct.textContent=`${intended}%`;els.slipPct.textContent=`${side}% one side + ${side}% other side`;els.probBar.style.width=`${(1-n)*100}%`;const explain=document.querySelector('.mdp-model-explain');if(explain)explain.innerHTML=`With <strong>noise = ${n.toFixed(2)}</strong>, the action you choose happens <strong>${intended}% of the time</strong>. In the remaining <strong>${Math.round(n*100)}%</strong>, the agent may move to either side instead: <strong>${side}% one side + ${side}% the other side</strong>.`;}
  [els.noise,els.discount,els.living].forEach(x=>x.addEventListener('input',updateSettings)); updateSettings(); reset();
})();

// Explicit optimal-policy comparison tab
(() => {
  const tabs = document.querySelectorAll('.mdp-subtab');
  const panels = {
    playground: document.querySelector('#mdpPlaygroundPanel'),
    policy: document.querySelector('#mdpPolicyPanel'),
    values: document.querySelector('#mdpValuesPanel')
  };
  if (!tabs.length || !panels.playground || !panels.policy || !panels.values) return;

  tabs.forEach(btn => btn.addEventListener('click', () => {
    const target = btn.dataset.mdpTab;
    tabs.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
    Object.entries(panels).forEach(([key,panel]) => {
      const active = key === target;
      panel.classList.toggle('hidden', !active);
      panel.classList.toggle('active', active);
    });
  }));

  const policies = {
    r001: [
      ['right','right','right','+1'],
      ['up','wall','left','-1'],
      ['up','left','left','down']
    ],
    r003: [
      ['right','right','right','+1'],
      ['up','wall','up','-1'],
      ['up','left','left','left']
    ],
    r04: [
      ['right','right','right','+1'],
      ['up','wall','up','-1'],
      ['up','right','up','left']
    ],
    r20: [
      ['right','right','right','+1'],
      ['up','wall','right','-1'],
      ['right','right','right','up']
    ]
  };
  const arrow = { up:'↑', down:'↓', left:'←', right:'→' };
  document.querySelectorAll('.policy-grid').forEach(grid => {
    const policy = policies[grid.dataset.policy];
    grid.innerHTML = '';
    policy.flat().forEach(item => {
      const cell = document.createElement('div');
      cell.className = 'policy-cell';
      if (item === 'wall') cell.classList.add('policy-wall');
      else if (item === '+1' || item === '-1') {
        cell.classList.add(item === '+1' ? 'policy-positive' : 'policy-negative');
        const t = document.createElement('span');
        t.className = 'policy-terminal';
        t.textContent = item === '+1' ? '+1' : '−1';
        cell.append(t);
      } else {
        const a = document.createElement('span');
        a.className = 'policy-arrow';
        a.textContent = arrow[item];
        a.setAttribute('aria-label', item);
        cell.append(a);
      }
      grid.append(cell);
    });
  });

  document.querySelectorAll('[data-reveal-policy]').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    const key = button.dataset.revealPolicy;
    const answer = document.querySelector(`[data-policy-answer="${key}"]`);
    if (!answer) return;
    const isHidden = answer.classList.contains('hidden');
    answer.classList.toggle('hidden', !isHidden);
    button.textContent = isHidden ? 'Hide explicit policy' : `Show explicit policy when R(s) = ${button.closest('.policy-card').dataset.policyR.replace('-', '−')}`;
    button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    button.closest('.policy-card').classList.toggle('selected', isHidden);
  }));

  document.querySelectorAll('.policy-reveal-button').forEach(button => button.setAttribute('aria-expanded', 'false'));
})();

// V(s) and Q(s,a) value-iteration visualizer
(() => {
  const vGrid = document.querySelector('#mdpVGrid');
  const qGrid = document.querySelector('#mdpQGrid');
  const slider = document.querySelector('#mdpIterationSlider');
  const kLabel = document.querySelector('#mdpIterationNumber');
  if (!vGrid || !qGrid || !slider || !kLabel) return;

  const rows = 3, cols = 4;
  const wall = '2,2';
  const terminals = {'4,3': 1, '4,2': -1};
  const actions = ['up','down','left','right'];
  const delta = {up:[0,1], down:[0,-1], left:[-1,0], right:[1,0]};
  const side = {up:['left','right'], down:['right','left'], left:['down','up'], right:['up','down']};
  const arrow = {up:'↑', down:'↓', left:'←', right:'→'};
  const noise = 0.2, gamma = 0.9, living = 0;
  const stateKey = (x,y) => `${x},${y}`;
  const states = [];
  for (let y=1; y<=rows; y++) for (let x=1; x<=cols; x++) if (stateKey(x,y)!==wall) states.push(stateKey(x,y));

  function transitions(s,a){
    if (terminals[s] != null) return [[1,s]];
    const [x,y] = s.split(',').map(Number);
    const choices = [[1-noise,a],[noise/2,side[a][0]],[noise/2,side[a][1]]];
    const probs = new Map();
    choices.forEach(([p,actual]) => {
      const [dx,dy] = delta[actual];
      let nx=x+dx, ny=y+dy;
      if (nx<1 || nx>cols || ny<1 || ny>rows || stateKey(nx,ny)===wall) { nx=x; ny=y; }
      const ns=stateKey(nx,ny);
      probs.set(ns,(probs.get(ns)||0)+p);
    });
    return [...probs.entries()].map(([ns,p])=>[p,ns]);
  }

  const cache = [];
  const qCache = [];
  const v0 = {};
  states.forEach(s => v0[s] = 0);
  cache.push(v0);
  qCache.push(computeQ(v0));
  function computeQ(V){
    const Q={};
    states.forEach(s => {
      if (terminals[s] != null) { Q[s] = {exit: terminals[s]}; return; }
      Q[s]={};
      actions.forEach(a => Q[s][a] = transitions(s,a).reduce((sum,[p,ns]) => sum + p*(living + gamma*V[ns]),0));
    });
    return Q;
  }
  function ensure(k){
    while(cache.length<=k){
      const prev=cache[cache.length-1], Q=computeQ(prev), next={};
      states.forEach(s => next[s] = terminals[s] != null ? Q[s].exit : Math.max(...actions.map(a=>Q[s][a])));
      cache.push(next);
      qCache.push(computeQ(next));
    }
  }
  function fmt(n){ return (Math.round(n*100)/100).toFixed(2); }
  function bestActions(q){
    if(!q) return [];
    const max=Math.max(...actions.map(a=>q[a]));
    return actions.filter(a=>Math.abs(q[a]-max)<1e-9);
  }

  function baseCell(s, type){
    const cell=document.createElement('div');
    cell.className=type==='v'?'value-cell':'qvalue-cell';
    cell.dataset.state=s;
    if(s===wall) cell.classList.add('value-wall');
    if(terminals[s]===1) cell.classList.add('value-positive');
    if(terminals[s]===-1) cell.classList.add('value-negative');
    return cell;
  }

  let previousK = null;
  function render(k){
    ensure(k);
    const V=cache[k], Q=qCache[k];
    const previousV = previousK === null ? null : cache[previousK];
    const previousQ = previousK === null ? null : qCache[previousK];
    kLabel.textContent=k;
    vGrid.innerHTML=''; qGrid.innerHTML='';
    for(let y=rows;y>=1;y--) for(let x=1;x<=cols;x++){
      const s=stateKey(x,y);
      if(s===wall){ vGrid.append(baseCell(s,'v')); qGrid.append(baseCell(s,'q')); continue; }
      const vc=baseCell(s,'v');
      if(previousV && Math.abs(V[s]-previousV[s])>1e-10) vc.classList.add('value-updated');
      const vn=document.createElement('span'); vn.className='value-number'; vn.textContent=fmt(V[s]); vc.append(vn);
      if(terminals[s]==null){
        const q=Q[s], best=bestActions(q)[0];
        const ar=document.createElement('span'); ar.className='value-best-arrow'; ar.textContent=arrow[best]; vc.append(ar);
      }
      const co=document.createElement('span'); co.className='value-coord'; co.textContent=`(${x},${y})`; vc.append(co);
      vGrid.append(vc);

      const qc=baseCell(s,'q');
      if(previousQ && terminals[s]==null && actions.some(a => Math.abs(Q[s][a]-previousQ[s][a])>1e-10)) qc.classList.add('qvalue-updated');
      if(terminals[s]!=null){
        const t=document.createElement('span');t.className='q-terminal-number';t.textContent=fmt(Q[s].exit);qc.append(t);
      }else{
        const q=Q[s], best=bestActions(q);
        [['up','q-top'],['left','q-left'],['right','q-right'],['down','q-bottom']].forEach(([a,cls])=>{
          const sp=document.createElement('span');sp.className=`q-tri ${cls}${best.includes(a)?' q-best':''}`;sp.textContent=fmt(q[a]);sp.title=`${a}: ${fmt(q[a])}`;qc.append(sp);
        });
      }
      qGrid.append(qc);
    }
    document.querySelectorAll('[data-value-k]').forEach(b=>b.classList.toggle('active',Number(b.dataset.valueK)===k));
    previousK = k;
  }

  function inspect(s){
    if(s===wall || terminals[s]!=null) return;
    const k=Number(slider.value); ensure(k); const q=qCache[k][s], best=bestActions(q), v=cache[k][s];
    const title=document.querySelector('#valueInspectorTitle'), text=document.querySelector('#valueInspectorText');
    if(title) title.textContent=`State s = (${s}) at k = ${k}`;
    if(text) text.innerHTML=`Q↑=${fmt(q.up)}, Q↓=${fmt(q.down)}, Q←=${fmt(q.left)}, Q→=${fmt(q.right)}. Therefore <code>V(s) = max Q = ${fmt(v)}</code> and the greedy action is <strong>${best.map(a=>arrow[a]+' '+a).join(' / ')}</strong>.`;
  }
  [vGrid,qGrid].forEach(g=>g.addEventListener('click',e=>{const c=e.target.closest('[data-state]');if(c)inspect(c.dataset.state)}));
  slider.addEventListener('input',()=>render(Number(slider.value)));
  document.querySelectorAll('[data-value-k]').forEach(b=>b.addEventListener('click',()=>{slider.value=b.dataset.valueK;render(Number(slider.value))}));
  render(0);
})();
