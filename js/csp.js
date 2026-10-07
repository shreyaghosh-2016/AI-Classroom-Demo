(() => {
  const root = document.querySelector('#cspView');
  if (!root) return;
  const $ = s => root.querySelector(s);

  const ui = {
    tabs: [...root.querySelectorAll('.csp-tab')],
    title: $('#cspDemoTitle'), icon: $('#cspDemoIcon'), summary: $('#cspDemoSummary'),
    problemLabel: $('#cspProblemLabel'), problemTitle: $('#cspProblemTitle'), status: $('#cspStatus'),
    visual: $('#cspVisual'), prev: $('#cspPrev'), next: $('#cspNext'), play: $('#cspPlay'), reset: $('#cspReset'), speed: $('#cspSpeed'),
    stepLabel: $('#cspStepLabel'), progress: $('#cspProgressBar'), caption: $('#cspStepCaption'),
    explanation: $('#cspExplanation'), domains: $('#cspDomains'), teaching: $('#cspTeachingPoint'),
    assignments: $('#cspAssignments'), backtracks: $('#cspBacktracks'), pruned: $('#cspPruned'), conflicts: $('#cspConflicts'),
    problemSelect: $('#cspProblemSelect'), traversalWrap: $('#cspTraversalWrap')
  };

  const COLORS = ['R','G','B'];
  const colorName = {R:'Red', G:'Green', B:'Blue'};
  const fill = {R:'#ef4444', G:'#22c55e', B:'#4f46e5'};

  const problems = {
    australia: {
      label:'Australia CSP', title:'Constraint graph for Australia map coloring',
      vars:['WA','NT','Q','NSW','V','SA','T'], order:['WA','NT','Q','NSW','V','SA','T'],
      edges:[['WA','NT'],['WA','SA'],['NT','SA'],['NT','Q'],['SA','Q'],['SA','NSW'],['SA','V'],['Q','NSW'],['NSW','V']],
      pos:{WA:[80,185],NT:[230,85],SA:[245,225],Q:[405,100],NSW:[455,235],V:[390,345],T:[575,350]}
    },
    graph: {
      label:'Layered Graph CSP', title:'Three-coloring on the layered constraint graph',
      vars:['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R'],
      order:['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R'],
      edges:[
        ['A','B'],['A','G'],['A','J'],['A','Q'],
        ['B','C'],['B','D'],['C','D'],['C','E'],['D','E'],['D','H'],['E','F'],['E','I'],['F','I'],
        ['G','H'],['G','K'],['H','I'],['H','L'],['I','M'],['J','K'],['K','L'],['K','N'],['L','M'],['L','N'],['L','O'],
        ['M','P'],['N','O'],['N','Q'],['O','P'],['O','Q'],['P','R'],['Q','R']
      ],
      pos:{
        A:[65,85],B:[180,70],C:[300,70],E:[420,70],F:[540,70],D:[245,155],H:[365,155],I:[500,155],
        G:[125,245],J:[70,335],K:[205,335],L:[325,245],M:[470,245],N:[260,420],O:[390,420],P:[520,335],Q:[175,510],R:[420,510]
      }
    }
  };

  const meta = {
    bfs:{icon:'🌊',title:'Breadth-First Search (BFS)',summary:'Build the CSP search tree level by level. One variable is assigned at each level; BFS visits all nodes of a level before going deeper.'},
    dfs:{icon:'⬇️',title:'Depth-First Search (DFS)',summary:'Follow one assignment branch all the way down the search tree before returning to try sibling branches.'},
    backtracking:{icon:'↩️',title:'Backtracking Search',summary:'DFS for CSPs: use a fixed variable order and reject a value immediately when it violates a constraint.'},
    forward:{icon:'✂️',title:'Forward Checking',summary:'After assigning a variable, cross that color out from every unassigned neighboring variable.'},
    ac:{icon:'🔁',title:'Arc Consistency',summary:'Revise directed arcs. Remove a tail value if it has no supporting value in the head domain, then recheck affected neighbors.'},
    ordering:{icon:'🎯',title:'MRV + LCV Ordering',summary:'MRV chooses the variable with the fewest remaining legal values; LCV chooses the value that removes the fewest values from others.'}
  };

  let mode='bfs', problemKey='australia', stepIndex=0, steps=[], timer=null;
  const p = () => problems[problemKey];
  const blankDomains = () => Object.fromEntries(p().vars.map(v => [v,[...COLORS]]));
  const clone = x => JSON.parse(JSON.stringify(x));
  const neighbors = v => p().edges.flatMap(([a,b]) => a===v?[b]:b===v?[a]:[]);
  const adjacent = (a,b) => p().edges.some(([x,y]) => (x===a&&y===b)||(x===b&&y===a));
  const consistent = (assign,v,val) => neighbors(v).every(n => !assign[n] || assign[n]!==val);
  const conflictCount = assign => p().edges.filter(([a,b]) => assign[a] && assign[b] && assign[a]===assign[b]).length;

  function makeState(caption, x={}) {
    return {
      caption, assign:{}, domains:blankDomains(), current:null, candidateValue:null, probeAssignments:{}, activeEdge:null, arcQueue:[], tree:null,
      status:'Ready', explanation:'', teaching:'', metrics:{assignments:0,backtracks:0,pruned:0,conflicts:0},
      mrvScores:null, lcvScores:null, selectedVar:null, selectedValue:null, ...x
    };
  }

  function assignmentText(assign, upto=null) {
    const order=p().order;
    const ks=upto===null?order.filter(v=>assign[v]):order.slice(0,upto).filter(v=>assign[v]);
    return ks.length ? `{${ks.map(v=>`${v}=${assign[v]}`).join(', ')}}` : '{}';
  }

  // ---------- BFS / DFS search-tree demos ----------
  function searchTreeState(algorithm, depth, pathColors, visitNo, note) {
    const order=p().order;
    const assign={};
    pathColors.forEach((c,i)=>{ if(i<order.length) assign[order[i]]=c; });
    const domains=blankDomains(); // standard BFS/DFS: no filtering yet
    return makeState(note, {
      assign, domains, current: depth>0?order[Math.min(depth-1,order.length-1)]:null,
      status: depth===order.length?'Complete candidate':(depth===0?'Start':`Depth ${depth}`),
      tree:{algorithm,depth,pathColors:[...pathColors],order:[...order],visitNo},
      explanation: algorithm==='bfs'
        ? `Level ${depth} represents partial assignments to the first ${depth} variable${depth===1?'':'s'}. BFS completes this whole level before any node at level ${depth+1} is expanded.`
        : `DFS is following one branch. At level ${depth}, it assigns ${depth?order[depth-1]:'no variable yet'} and immediately continues to the next level on this branch.`,
      teaching: algorithm==='bfs'
        ? 'BFS explores by depth. In a CSP, complete solutions are at the bottom of the assignment tree.'
        : 'DFS reaches a complete assignment quickly, but plain DFS does not yet use CSP-specific early failure checking.',
      metrics:{assignments:Math.max(0,visitNo),backtracks:0,pruned:0,conflicts:conflictCount(assign)}
    });
  }

  function bfsSteps() {
    const order=p().order, out=[];
    // Full breadth-first expansion is shown for the first four assignment levels.
    // At every shown level, ALL nodes at that depth are expanded before moving deeper.
    const maxShown=Math.min(4, order.length);
    out.push(makeState('BFS starts at the root: the empty assignment {}.',{
      tree:{algorithm:'bfs',depth:0,order:[...order],levels:[['']],expandedDepth:-1},
      status:'Root',
      explanation:'The queue initially contains only the empty assignment.',
      teaching:'Breadth-first search expands every node at depth d before any node at depth d+1.',
      metrics:{assignments:0,backtracks:0,pruned:0,conflicts:0}
    }));

    const levels=[['']];
    for(let d=0; d<maxShown; d++) {
      const current=levels[d];
      const next=[];
      for(const path of current){
        for(const c of COLORS) next.push(path+c);
      }
      levels.push(next);
      const sample=next[0] || '';
      const assign={};
      sample.split('').forEach((c,i)=>{ if(i<order.length) assign[order[i]]=c; });
      out.push(makeState(`Expand ALL ${current.length.toLocaleString()} node${current.length===1?'':'s'} at level ${d}; generate ${next.length.toLocaleString()} node${next.length===1?'':'s'} at level ${d+1}.`,{
        assign,domains:blankDomains(),current:d<order.length?order[d]:null,candidateValue:sample[d]||null,status:`Level ${d} fully expanded`,
        tree:{algorithm:'bfs',depth:d+1,order:[...order],levels:levels.map(x=>[...x]),expandedDepth:d},
        explanation:`Every partial assignment at level ${d} is removed from the BFS queue and expanded before BFS proceeds to level ${d+1}. Each parent generates R, G and B for ${order[d]}.`,
        teaching:`This is why BFS and DFS must look different: BFS has a wide frontier (${next.length.toLocaleString()} nodes here), while DFS follows one branch downward.`,
        metrics:{assignments:next.length,backtracks:0,pruned:0,conflicts:conflictCount(assign)}
      }));
    }
    out.push(makeState(`BFS would continue in exactly the same way until depth ${order.length}.`,{
      tree:{algorithm:'bfs',depth:maxShown,order:[...order],levels:levels.map(x=>[...x]),expandedDepth:maxShown-1},
      status:'Continue level-by-level',
      explanation:`The next full level would contain ${Math.pow(3,maxShown+1).toLocaleString()} partial assignments. The demo stops drawing after level ${maxShown} only to keep the classroom visualization readable.`,
      teaching:'Conceptually, BFS still expands every node in each level. Complete CSP assignments occur only at the deepest level.',
      metrics:{assignments:Math.pow(3,maxShown),backtracks:0,pruned:0,conflicts:0}
    }));
    return out;
  }

  function dfsSteps() {
    const order=p().order, out=[];
    out.push(searchTreeState('dfs',0,[],0,'Root: the empty assignment {}.'));
    let path=[];
    for(let d=1; d<=order.length; d++) {
      path=[...path,'R'];
      out.push(searchTreeState('dfs',d,path,d,`DFS chooses ${order[d-1]} = Red and goes directly to the next level.`));
    }
    out.push(makeState('The all-red complete assignment violates constraints, so plain DFS must return and try a sibling.',{
      assign:Object.fromEntries(order.map(v=>[v,'R'])), domains:blankDomains(), current:order.at(-1), status:'Goal test fails',
      tree:{algorithm:'dfs',depth:order.length,pathColors:Array(order.length).fill('R'),order:[...order],visitNo:order.length+1,failed:true},
      explanation:'Only now, at the complete candidate, do we show the ordinary goal test failing. Backtracking will improve this by rejecting conflicts earlier.',
      teaching:'This distinction is important: backtracking is CSP-aware DFS, not just ordinary DFS.',
      metrics:{assignments:order.length,backtracks:1,pruned:0,conflicts:conflictCount(Object.fromEntries(order.map(v=>[v,'R'])))}
    }));
    // one explicit sibling step so students see the return
    if(order.length>=2){
      const arr=Array(order.length).fill('R'); arr[arr.length-1]='G';
      const a=Object.fromEntries(order.map((v,i)=>[v,arr[i]]));
      out.push(makeState(`DFS returns to level ${order.length} and tries ${order.at(-1)} = Green.`,{
        assign:a,domains:blankDomains(),current:order.at(-1),status:'Try sibling',tree:{algorithm:'dfs',depth:order.length,pathColors:arr,order:[...order],visitNo:order.length+2},
        explanation:'DFS changes the deepest choice first. If needed it will keep backtracking upward.',
        teaching:'Depth-first traversal controls which search-tree node is visited next; it does not itself perform domain filtering.',
        metrics:{assignments:order.length+1,backtracks:1,pruned:0,conflicts:conflictCount(a)}
      }));
    }
    return out;
  }

  // ---------- Backtracking ----------
  function backtrackingSteps() {
    const order=p().order, domains=blankDomains(), assign={}, out=[];
    let tried=0, backs=0;
    out.push(makeState('Start with {}. Backtracking will assign one variable at a time.',{
      explanation:'Use the fixed variable order shown above the search tree. For each variable, try values in Red → Green → Blue order.',
      teaching:'Backtracking = DFS + fixed variable ordering + fail immediately on constraint violation.'
    }));

    function dfs(k){
      if(k===order.length) return true;
      const v=order[k];
      for(const val of COLORS){
        tried++;
        const attempt={...assign,[v]:val};
        if(!consistent(assign,v,val)){
          const badN=neighbors(v).find(n=>assign[n]===val);
          out.push(makeState(`Try ${v} = ${colorName[val]} → violates ${v} ≠ ${badN}. Reject it now.`,{
            assign:attempt,domains:clone(domains),current:v,activeEdge:[v,badN],status:'Conflict → reject',
            explanation:`${badN} is already ${colorName[val]}, so ${v} cannot also be ${colorName[val]}. No child state is created below this inconsistent assignment.`,
            teaching:'This is the “fail-on-violation” improvement over plain DFS.',
            metrics:{assignments:tried,backtracks:backs,pruned:0,conflicts:conflictCount(attempt)}
          }));
          continue;
        }
        assign[v]=val; domains[v]=[val];
        out.push(makeState(`Assign ${v} = ${colorName[val]}. The partial assignment is consistent, so go deeper.`,{
          assign:clone(assign),domains:clone(domains),current:v,status:'Consistent',
          explanation:`All already-assigned neighbors of ${v} have different colors. Continue with the next variable.`,
          teaching:'Backtracking checks constraints incrementally after each assignment.',
          metrics:{assignments:tried,backtracks:backs,pruned:0,conflicts:0}
        }));
        if(dfs(k+1)) return true;
        delete assign[v]; domains[v]=[...COLORS]; backs++;
        out.push(makeState(`No value works below ${v}. Undo ${v} and backtrack.`,{
          assign:clone(assign),domains:clone(domains),current:v,status:'Backtrack',
          explanation:'Return to the previous choice point and try its next value.',teaching:'Backtracking undoes the most recent assignment only when the branch is exhausted.',
          metrics:{assignments:tried,backtracks:backs,pruned:0,conflicts:0}
        }));
      }
      return false;
    }
    dfs(0);
    out.push(makeState('Solution found: every variable is assigned and every edge has different endpoint colors.',{
      assign:clone(assign),domains:clone(domains),status:'Solved ✓',explanation:assignmentText(assign),teaching:'The path used to reach the solution is not important; the complete satisfying assignment is.',
      metrics:{assignments:tried,backtracks:backs,pruned:0,conflicts:0}
    }));
    return out;
  }

  // ---------- Forward checking ----------
  function forwardSteps() {
    const order=p().order, domains=blankDomains(), assign={}, out=[];
    let tried=0, pruned=0, backs=0;
    out.push(makeState('Start with all domains {R, G, B}.',{
      domains:clone(domains),explanation:'Forward checking maintains domains for every unassigned variable.',teaching:'After assigning X=v, remove v from each unassigned neighbor of X.'
    }));

    function save(){return {a:clone(assign),d:clone(domains),p:pruned};}
    function restore(s){Object.keys(assign).forEach(k=>delete assign[k]);Object.assign(assign,s.a);Object.keys(domains).forEach(k=>domains[k]=[...s.d[k]]);pruned=s.p;}

    function dfs(k){
      if(k===order.length) return true;
      const v=order[k];
      for(const val of COLORS.filter(c=>domains[v].includes(c))){
        tried++;
        if(!consistent(assign,v,val)) continue;
        const snap=save();
        assign[v]=val; domains[v]=[val];
        out.push(makeState(`Assign ${v} = ${colorName[val]}.`,{
          assign:clone(assign),domains:clone(domains),current:v,status:'Assigned',
          explanation:'Now forward checking looks only at unassigned neighbors of this newly assigned variable.',teaching:'Filtering happens immediately after the assignment.',
          metrics:{assignments:tried,backtracks:backs,pruned,conflicts:0}
        }));
        let fail=false;
        for(const n of neighbors(v)){
          if(assign[n] || !domains[n].includes(val)) continue;
          domains[n]=domains[n].filter(x=>x!==val); pruned++;
          out.push(makeState(`Forward check ${v} → ${n}: remove ${colorName[val]} from D(${n}).`,{
            assign:clone(assign),domains:clone(domains),current:n,candidateValue:val,activeEdge:[v,n],status:domains[n].length?'Prune domain':'Domain empty!',
            explanation:`Because ${v}=${colorName[val]} and ${v} ≠ ${n}, ${n} cannot use ${colorName[val]}.`,
            teaching:'Forward checking only propagates from the newly assigned variable to its unassigned neighbors.',
            metrics:{assignments:tried,backtracks:backs,pruned,conflicts:0}
          }));
          if(domains[n].length===0){fail=true;break;}
        }
        if(!fail && dfs(k+1)) return true;
        restore(snap); backs++;
        out.push(makeState(`Dead end detected. Restore domains and backtrack from ${v} = ${colorName[val]}.`,{
          assign:clone(assign),domains:clone(domains),current:v,status:'Backtrack + restore',
          explanation:'Forward checking stores enough information to restore the earlier domains when a branch fails.',teaching:'Filtering reduces the search tree but does not remove the need for backtracking.',
          metrics:{assignments:tried,backtracks:backs,pruned,conflicts:0}
        }));
      }
      return false;
    }
    dfs(0);
    out.push(makeState('Solution found with forward checking.',{assign:clone(assign),domains:clone(domains),status:'Solved ✓',explanation:assignmentText(assign),teaching:'Forward checking crossed off locally impossible values before trying them.',metrics:{assignments:tried,backtracks:backs,pruned,conflicts:0}}));
    return out;
  }

  // ---------- AC-3 ----------
  function ac3(domains, assign, out, metrics, context='') {
    const queue=[]; p().edges.forEach(([a,b])=>{queue.push([a,b],[b,a]);});
    let guard=0;
    while(queue.length && guard++<500){
      const [x,y]=queue.shift();
      const before=[...domains[x]];
      domains[x]=domains[x].filter(vx => domains[y].some(vy => vx!==vy));
      const removed=before.filter(v=>!domains[x].includes(v));
      // Visual probe: while checking X → Y, temporarily fill X with the value being
      // tested and Y with one supporting value (when one exists). This makes the
      // consistency test visible directly on the main CSP graph.
      const probeX = removed[0] || before[0] || null;
      const probeY = probeX ? (domains[y].find(vy => vy!==probeX) || domains[y][0] || null) : null;
      const probes = {};
      if(probeX && !assign[x]) probes[x]=probeX;
      if(probeY && !assign[y]) probes[y]=probeY;
      out.push(makeState(`${context} Check arc ${x} → ${y}${removed.length?`: remove ${removed.map(c=>colorName[c]).join(', ')} from D(${x})`:': no deletion'}.`,{
        assign:clone(assign),domains:clone(domains),current:x,candidateValue:probeX,probeAssignments:probes,activeEdge:[x,y],arcQueue:queue.slice(0,10).map(([a,b])=>`${a} → ${b}`),status:removed.length?'Revise tail':'Arc consistent',
        explanation:removed.length?`A value in D(${x}) had no different supporting value in D(${y}), so it is deleted from the tail ${x}.`:`Every value in D(${x}) has at least one supporting different value in D(${y}).`,
        teaching:removed.length?'If X loses a value, arcs from X’s other neighbors back toward X must be rechecked.':'Arc consistency reasons from domain to domain, not only from assigned variables.',
        metrics:{...metrics,pruned:metrics.pruned+removed.length,conflicts:0}
      }));
      if(removed.length){
        metrics.pruned += removed.length;
        if(domains[x].length===0) return false;
        neighbors(x).filter(z=>z!==y).forEach(z=>queue.push([z,x]));
      }
    }
    return true;
  }

  function arcConsistencySteps(){
    const domains=blankDomains(), assign={}, out=[]; const metrics={assignments:0,backtracks:0,pruned:0};
    out.push(makeState('Start with every variable domain = {R, G, B}.',{
      domains:clone(domains),status:'Initial domains',explanation:'We will make one assignment first, then enforce arc consistency over the entire CSP.',teaching:'A graph is arc consistent when every directed arc is consistent.'
    }));
    // Choose SA (Australia) / L (layered graph): high-degree node makes propagation visible.
    const seed=problemKey==='australia'?'SA':'L';
    assign[seed]='R'; domains[seed]=['R']; metrics.assignments++;
    out.push(makeState(`Assign ${seed} = Red, then place all directed arcs in the AC queue.`,{
      assign:clone(assign),domains:clone(domains),current:seed,status:'Run AC',
      explanation:'Unlike forward checking, arc consistency will continue propagating between unassigned variables whenever a domain changes.',
      teaching:'For X → Y, delete from X (the tail) any value that has no support in Y.',metrics:{...metrics,conflicts:0}
    }));
    ac3(domains,assign,out,metrics,'');
    out.push(makeState('Arc-consistency pass is complete.',{
      assign:clone(assign),domains:clone(domains),status:'Arc consistent ✓',explanation:'All directed arcs are currently consistent. Search may still be required to finish the CSP.',teaching:'Arc consistency is stronger filtering than forward checking, but it does not by itself guarantee a complete solution.',metrics:{...metrics,conflicts:0}
    }));
    return out;
  }

  // ---------- MRV + LCV, with AC maintained after assignments ----------
  function orderingSteps(){
    const domains=blankDomains(), assign={}, out=[]; const metrics={assignments:0,backtracks:0,pruned:0};
    out.push(makeState('Start: all domains are {R, G, B}. MRV is tied, so use degree as a simple tie-break.',{
      domains:clone(domains),status:'Choose variable',mrvScores:Object.fromEntries(p().vars.map(v=>[v,domains[v].length])),
      explanation:'MRV compares current domain sizes. Initially all are 3, so a tie-break is needed.',teaching:'MRV = choose the unassigned variable with the fewest legal values remaining.',metrics:{...metrics,conflicts:0}
    }));

    let guard=0;
    while(Object.keys(assign).length<p().vars.length && guard++<p().vars.length+3){
      const un=p().vars.filter(v=>!assign[v]);
      const sizes=Object.fromEntries(un.map(v=>[v,domains[v].length]));
      const min=Math.min(...Object.values(sizes));
      const tied=un.filter(v=>sizes[v]===min);
      tied.sort((a,b)=>neighbors(b).filter(n=>!assign[n]).length-neighbors(a).filter(n=>!assign[n]).length || p().order.indexOf(a)-p().order.indexOf(b));
      const v=tied[0];
      out.push(makeState(`MRV chooses ${v}: |D(${v})| = ${sizes[v]}${tied.length>1?' (tie broken by degree)':''}.`,{
        assign:clone(assign),domains:clone(domains),current:v,selectedVar:v,mrvScores:sizes,status:'MRV variable',
        explanation:`Among unassigned variables, the minimum remaining-domain size is ${min}.`,teaching:'MRV is “fail-fast”: work on the most constrained variable first.',metrics:{...metrics,conflicts:0}
      }));

      const scores={};
      for(const val of domains[v]){
        let removed=0;
        for(const n of neighbors(v)) if(!assign[n] && domains[n].includes(val)) removed++;
        scores[val]=removed;
      }
      const candidates=[...domains[v]].sort((a,b)=>scores[a]-scores[b] || COLORS.indexOf(a)-COLORS.indexOf(b));
      const val=candidates[0];
      out.push(makeState(`LCV scores for ${v}: ${candidates.map(c=>`${colorName[c]} → removes ${scores[c]}`).join(' · ')}. Choose ${colorName[val]}.`,{
        assign:clone(assign),domains:clone(domains),current:v,candidateValue:val,selectedVar:v,selectedValue:val,lcvScores:scores,status:'LCV value',
        explanation:'LCV estimates how much each candidate value restricts the remaining neighboring variables.',teaching:'LCV = choose the value that rules out the fewest values in the remaining variables.',metrics:{...metrics,conflicts:0}
      }));

      assign[v]=val; domains[v]=[val]; metrics.assignments++;
      out.push(makeState(`Assign ${v} = ${colorName[val]}, then enforce arc consistency again.`,{
        assign:clone(assign),domains:clone(domains),current:v,status:'Assign + AC',explanation:'The ordering heuristic chooses; propagation now updates remaining domains.',teaching:'This follows the lecture demo idea: backtracking + arc consistency + ordering.',metrics:{...metrics,conflicts:0}
      }));
      const ok=ac3(domains,assign,out,metrics,'After assignment:');
      if(!ok){metrics.backtracks++; break;}
    }
    if(Object.keys(assign).length===p().vars.length){
      out.push(makeState('Complete coloring found using MRV + LCV with arc-consistency filtering.',{assign:clone(assign),domains:clone(domains),status:'Solved ✓',explanation:assignmentText(assign),teaching:'Ordering changes which branch is explored first; filtering changes which values remain legal.',metrics:{...metrics,conflicts:0}}));
    }
    return out;
  }

  function buildSteps(){
    if(mode==='bfs') return bfsSteps();
    if(mode==='dfs') return dfsSteps();
    if(mode==='backtracking') return backtrackingSteps();
    if(mode==='forward') return forwardSteps();
    if(mode==='ac') return arcConsistencySteps();
    return orderingSteps();
  }

  // ---------- rendering ----------
  function edgeLine(a,b,active){
    const [x1,y1]=p().pos[a], [x2,y2]=p().pos[b];
    const isActive=active && ((active[0]===a&&active[1]===b)||(active[0]===b&&active[1]===a));
    return `<line class="csp-edge ${isActive?'active':''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  function nodeSvg(v,s){
    const [x,y]=p().pos[v], assigned=s.assign[v];
    const probe=(s.probeAssignments&&s.probeAssignments[v]) || (s.current===v?(s.candidateValue||s.selectedValue):null);
    const shown=assigned||probe, d=s.domains[v]||[];
    return `<g class="csp-node ${s.current===v?'current':''} ${assigned?'assigned':''} ${probe&&!assigned?'checking':''}" transform="translate(${x} ${y})">
      <circle r="40" style="fill:${shown?fill[shown]:'#fff'} !important"></circle>
      <text class="node-label" y="6" style="fill:${shown?'#fff':'#1f2940'} !important">${v}</text>
      ${COLORS.map((c,i)=>`<circle class="mini-domain ${c.toLowerCase()} ${d.includes(c)?'':'off'}" cx="${-20+i*20}" cy="55" r="7" fill="${fill[c]}"></circle>`).join('')}
    </g>`;
  }

  function graphSvg(s){
    return `<svg class="csp-graph" viewBox="0 0 650 570" role="img" aria-label="Constraint graph">
      ${p().edges.map(([a,b])=>edgeLine(a,b,s.activeEdge)).join('')}
      ${p().vars.map(v=>nodeSvg(v,s)).join('')}
    </svg>`;
  }

  function treeSvg(s){
    return s.tree.algorithm==='bfs' ? bfsTreeSvg(s) : dfsTreeSvg(s);
  }

  function bfsTreeSvg(s){
    const t=s.tree, levels=t.levels||[['']], order=t.order;
    const deepest=levels.length-1;
    const maxNodes=Math.max(...levels.map(x=>x.length));
    const gap=54, margin=80, W=Math.max(980, margin*2 + maxNodes*gap), H=115+deepest*105;
    let svg=`<svg class="search-tree-svg bfs-tree" viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W,14000)}px;height:${Math.max(430,H)}px" role="img" aria-label="BFS CSP search tree">`;
    const coords=[];
    for(let d=0; d<levels.length; d++){
      const arr=levels[d], y=70+d*105, span=(arr.length-1)*gap, start=(W-span)/2;
      coords[d]=arr.map((_,i)=>({x:start+i*gap,y}));
      svg+=`<text class="tree-level-label" x="38" y="${y+4}">L${d}${d?` · ${order[d-1]}`:' · {}'}</text>`;
      svg+=`<line class="tree-level-guide" x1="62" y1="${y+37}" x2="${W-20}" y2="${y+37}"/>`;
    }
    for(let d=1; d<levels.length; d++){
      levels[d].forEach((path,i)=>{
        const parentIndex=Math.floor(i/3), a=coords[d-1][parentIndex], b=coords[d][i];
        svg+=`<line class="tree-branch ${t.expandedDepth===d-1?'expanded':''}" x1="${a.x}" y1="${a.y+22}" x2="${b.x}" y2="${b.y-22}"/>`;
      });
    }
    for(let d=0; d<levels.length; d++){
      levels[d].forEach((path,i)=>{
        const pos=coords[d][i], val=d?path[path.length-1]:null;
        const label=d?`${order[d-1]}=${val}`:'{}';
        const expanded=d<=t.expandedDepth;
        const frontier=d===t.expandedDepth+1;
        svg+=treeNode(pos.x,pos.y,label,false,false,false,val,expanded,frontier);
      });
    }
    svg+='</svg>';
    return svg;
  }

  function dfsTreeSvg(s){
    const t=s.tree, order=t.order, maxDepth=order.length;
    const W=Math.max(980,180+maxDepth*135), H=470;
    const xStep=(W-180)/Math.max(1,maxDepth), y0=90;
    let svg=`<svg class="search-tree-svg dfs-tree" viewBox="0 0 ${W} ${H}" role="img" aria-label="DFS CSP search tree">`;
    for(let d=0; d<=maxDepth; d++){
      const x=90+d*xStep;
      svg+=`<line class="tree-level-guide" x1="${x}" y1="42" x2="${x}" y2="430"/>`;
      svg+=`<text class="tree-level-label" x="${x}" y="25">L${d}${d?` · ${order[d-1]}`:' · {}'}</text>`;
    }
    let prev={x:90,y:y0};
    svg+=treeNode(90,y0,'{}',0===t.depth,t.failed&&t.depth===0,false,null,false,false);
    for(let d=1; d<=maxDepth; d++){
      const x=90+d*xStep, chosen=t.pathColors[d-1]||null, ys=[120,235,350];
      COLORS.forEach((c,i)=>{
        const current=(d===t.depth && chosen===c), y=ys[i];
        const onPath=d<t.depth && chosen===c;
        svg+=`<line class="tree-branch ${current||onPath?'active':''}" x1="${prev.x}" y1="${prev.y}" x2="${x}" y2="${y}"/>`;
        svg+=treeNode(x,y,`${order[d-1]}=${c}`,current,t.failed&&current,onPath,c,false,false);
      });
      if(chosen) prev={x,y:ys[COLORS.indexOf(chosen)]}; else break;
    }
    svg+='</svg>';
    return svg;
  }

  function treeNode(x,y,label,current,failed,onPath,color,expanded,frontier){
    const style=color?`style="fill:${fill[color]}"`:'';
    return `<g class="tree-node ${current?'current':''} ${failed?'failed':''} ${onPath?'path':''} ${expanded?'expanded':''} ${frontier?'frontier':''}">
      <circle cx="${x}" cy="${y}" r="24" ${style}></circle><text x="${x}" y="${y+4}" class="${color?'on-color':''}">${label}</text></g>`;
  }

  function renderDomains(s){
    ui.domains.innerHTML=p().vars.map(v=>{
      const d=s.domains[v]||[];
      const assigned=s.assign[v];
      return `<div class="csp-domain-line ${s.current===v?'focus':''}"><strong>${v}</strong><span class="domain-set">${COLORS.map(c=>`<i class="domain-value ${c.toLowerCase()} ${d.includes(c)?'':'off'}">${c}</i>`).join('')}</span><small>${assigned?`assigned ${assigned}`:`D={${d.join(',')}}`}</small></div>`;
    }).join('');
  }

  function extraPanel(s){
    if(s.mrvScores){
      return `<div class="algo-score-panel"><h3>MRV domain sizes</h3>${Object.entries(s.mrvScores).map(([v,n])=>`<span class="score-chip ${s.selectedVar===v?'active':''}">${v}: ${n}</span>`).join('')}</div>`;
    }
    if(s.lcvScores){
      return `<div class="algo-score-panel"><h3>LCV impact</h3>${COLORS.filter(c=>s.lcvScores[c]!==undefined).map(c=>`<span class="score-chip ${s.selectedValue===c?'active':''}">${colorName[c]} removes ${s.lcvScores[c]}</span>`).join('')}</div>`;
    }
    if(s.arcQueue?.length){
      return `<div class="algo-score-panel"><h3>Arc queue</h3>${s.arcQueue.map((x,i)=>`<span class="score-chip ${i===0?'active':''}">${x}</span>`).join('')}</div>`;
    }
    return '';
  }

  function renderVisual(s){
    if(mode==='bfs'||mode==='dfs'){
      ui.visual.innerHTML=`<div class="search-teaching-layout">
        <section class="search-tree-card"><div class="tree-caption"><strong>${mode.toUpperCase()} search tree</strong><span>Variable order: ${p().order.join(' → ')}</span></div><div class="tree-scroll">${treeSvg(s)}</div></section>
        <section class="constraint-graph-card"><div class="tree-caption"><strong>Current CSP assignment</strong><span>Domains are unchanged in plain ${mode.toUpperCase()}</span></div>${graphSvg(s)}</section>
      </div>`;
    } else {
      ui.visual.innerHTML=`<div class="algorithm-teaching-layout"><section class="constraint-graph-card"><div class="tree-caption"><strong>Constraint graph</strong><span>Dots under each node = current domain</span></div>${graphSvg(s)}</section>${extraPanel(s)}</div>`;
    }
  }

  function render(){
    if(!steps.length) return;
    const s=steps[stepIndex], m=meta[mode];
    ui.icon.textContent=m.icon; ui.title.textContent=m.title; ui.summary.textContent=m.summary;
    ui.problemLabel.textContent=p().label; ui.problemTitle.textContent=p().title; ui.status.textContent=s.status;
    ui.caption.textContent=s.caption; ui.explanation.textContent=s.explanation; ui.teaching.textContent=s.teaching;
    ui.assignments.textContent=s.metrics.assignments; ui.backtracks.textContent=s.metrics.backtracks; ui.pruned.textContent=s.metrics.pruned; ui.conflicts.textContent=s.metrics.conflicts;
    ui.stepLabel.textContent=`Step ${stepIndex+1} / ${steps.length}`; ui.progress.style.width=`${((stepIndex+1)/steps.length)*100}%`;
    ui.prev.disabled=stepIndex===0; ui.next.disabled=stepIndex===steps.length-1;
    renderDomains(s); renderVisual(s);
  }

  function rebuild(){ stop(); stepIndex=0; steps=buildSteps(); render(); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} if(ui.play) ui.play.textContent='▶ Auto play'; }
  function play(){
    if(timer){stop();return;}
    if(stepIndex===steps.length-1) stepIndex=0;
    ui.play.textContent='⏸ Pause';
    const delay=Math.max(300,2200-Number(ui.speed.value||950));
    timer=setInterval(()=>{ if(stepIndex>=steps.length-1){stop();return;} stepIndex++; render(); },delay);
  }

  ui.tabs.forEach(btn=>btn.addEventListener('click',()=>{
    ui.tabs.forEach(b=>b.classList.remove('active')); btn.classList.add('active'); mode=btn.dataset.cspDemo; rebuild();
  }));
  ui.problemSelect.addEventListener('change',e=>{problemKey=e.target.value; rebuild();});
  if(ui.traversalWrap) ui.traversalWrap.classList.add('hidden');
  ui.prev.addEventListener('click',()=>{stop();if(stepIndex>0){stepIndex--;render();}});
  ui.next.addEventListener('click',()=>{stop();if(stepIndex<steps.length-1){stepIndex++;render();}});
  ui.play.addEventListener('click',play); ui.reset.addEventListener('click',rebuild); ui.speed.addEventListener('input',()=>{if(timer){stop();play();}});
  document.addEventListener('keydown',e=>{
    if(root.classList.contains('hidden')) return;
    if(e.key==='ArrowRight'){e.preventDefault();ui.next.click();}
    if(e.key==='ArrowLeft'){e.preventDefault();ui.prev.click();}
  });
  rebuild();
})();
