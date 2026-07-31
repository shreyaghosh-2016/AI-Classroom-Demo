(() => {
  'use strict';
  function init(){const root=document.getElementById('heuristicRaceRoot');if(!root||root.dataset.ready)return;root.dataset.ready='true';root.innerHTML=`
    <div class="race-intro"><div><p class="eyebrow">Classroom challenge</p><h2>Which search strategy wins?</h2><p>All methods solve the same weighted map. “Winning” may mean fewer expansions, lower path cost, or both.</p></div><button id="hrRun" class="primary-button" type="button">Start race</button></div>
    <div class="race-question"><strong>Ask students before running:</strong> Will Greedy be fastest? Will it also find the cheapest path?</div>
    <div class="heuristic-race-grid" id="hrCards"></div>
    <article class="heuristic-explanation-box"><h3 id="hrVerdict">Ready for predictions</h3><p id="hrExplanation">UCS ignores the goal direction, Greedy ignores cost-so-far, and A* balances both.</p></article>`;
    const algorithms=[
      {name:'Uniform-Cost Search',formula:'f(n)=g(n)',expanded:42,cost:18,frontier:17,note:'Optimal, but explores broadly.'},
      {name:'Greedy Best-First',formula:'f(n)=h(n)',expanded:11,cost:25,frontier:8,note:'Fast here, but takes an expensive shortcut.'},
      {name:'A* + weak h',formula:'f(n)=g(n)+h₁(n)',expanded:28,cost:18,frontier:14,note:'Optimal with moderate guidance.'},
      {name:'A* + strong h',formula:'f(n)=g(n)+h₂(n)',expanded:15,cost:18,frontier:9,note:'Optimal and more focused.'}
    ];const cards=root.querySelector('#hrCards'),verdict=root.querySelector('#hrVerdict'),explanation=root.querySelector('#hrExplanation');
    function reset(){cards.innerHTML=algorithms.map((a,i)=>`<article class="race-card" data-i="${i}"><span class="race-rank">?</span><h3>${a.name}</h3><code>${a.formula}</code><div class="race-bar"><span></span></div><dl><div><dt>Expanded</dt><dd>—</dd></div><div><dt>Path cost</dt><dd>—</dd></div><div><dt>Max frontier</dt><dd>—</dd></div></dl><p>Waiting to run…</p></article>`).join('');verdict.textContent='Ready for predictions';explanation.textContent='UCS ignores the goal direction, Greedy ignores cost-so-far, and A* balances both.';}
    root.querySelector('#hrRun').addEventListener('click',()=>{reset();const order=[1,3,2,0];order.forEach((idx,rank)=>{setTimeout(()=>{const card=cards.querySelector(`[data-i="${idx}"]`),a=algorithms[idx];card.classList.add('finished');card.querySelector('.race-rank').textContent=String(rank+1);card.querySelector('.race-bar span').style.width=`${Math.max(8,100-a.expanded*1.7)}%`;const dds=card.querySelectorAll('dd');dds[0].textContent=a.expanded;dds[1].textContent=a.cost;dds[2].textContent=a.frontier;card.querySelector('p').textContent=a.note;if(rank===order.length-1){verdict.textContent='Fastest is not the same as best';explanation.textContent='Greedy expanded the fewest nodes but returned a more expensive route. A* with the stronger admissible heuristic preserved optimality while reducing search effort.';}},rank*700);});});reset();
  }
  window.addEventListener('heuristiclab:ready',init);if(document.readyState!=='loading')init();
})();
