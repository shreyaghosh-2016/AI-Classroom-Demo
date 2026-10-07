(() => {
  'use strict';

  const scenarios = [
    {
      id:'route', title:'Road-route planning', icon:'🗺️',
      problem:'Find the minimum driving time from the start city to the destination.',
      state:'Current road intersection or city', cost:'Travel time already spent', goal:'Destination city',
      image:'route', prompt:'Which heuristic best estimates the remaining travel time while preserving A* optimality?',
      candidates:[
        {name:'Straight-line distance ÷ maximum legal speed', quality:'good', why:'It estimates a lower bound on remaining time. The car cannot reach the goal faster than travelling the straight-line distance at the maximum possible speed.'},
        {name:'Predicted remaining time from live traffic', quality:'risky', why:'It may be more realistic, but a prediction can overestimate. It is useful in practical routing, but does not automatically preserve optimality.'},
        {name:'Number of roads already travelled', quality:'bad', why:'This describes the past and belongs to g(n). It does not estimate what remains.'},
        {name:'Exact shortest remaining route', quality:'poortradeoff', why:'It is a perfect heuristic, but computing it solves the original problem again at every state.'}
      ], best:0,
      lesson:'The heuristic must use the same unit as the objective. Since g(n) is measured in time, h(n) should also estimate time—not raw distance unless it is safely converted.'
    },
    {
      id:'puzzle', title:'8-puzzle', icon:'🧩',
      problem:'Slide tiles until the current board matches the goal board.', state:'Current tile arrangement', cost:'Moves already made', goal:'Goal arrangement',
      image:'puzzle', prompt:'Which common heuristic gives the strongest safe guidance among these choices?',
      candidates:[
        {name:'Number of misplaced tiles', quality:'good', why:'Every misplaced tile must move at least once. It is safe but ignores how far tiles are displaced.'},
        {name:'Sum of Manhattan distances', quality:'best', why:'It counts the minimum horizontal and vertical displacement of each tile while ignoring blocking. It dominates misplaced tiles.'},
        {name:'Sum of tile numbers in wrong positions', quality:'bad', why:'Tile numbers are identities, not movement costs. A tile labelled 8 is not necessarily eight times harder to fix.'},
        {name:'Twice the Manhattan distance', quality:'risky', why:'Multiplying by two may overestimate the remaining moves, so A* can lose its optimality guarantee.'}
      ], best:1,
      lesson:'A useful heuristic often solves a relaxed problem. Manhattan distance imagines that every tile can move toward its goal without other tiles blocking it.'
    },
    {
      id:'robot', title:'Warehouse robot', icon:'🤖',
      problem:'Reach a shelf while minimizing energy and avoiding walls.', state:'Position, orientation and carried load', cost:'Energy already used', goal:'Target shelf',
      image:'warehouse', prompt:'Which heuristic uses important state information while remaining a plausible lower bound?',
      candidates:[
        {name:'Straight-line distance only', quality:'good', why:'Cheap and optimistic, but it ignores turning energy and the robot orientation.'},
        {name:'Distance energy + minimum unavoidable turning energy', quality:'best', why:'Both terms can be lower bounds. Their sum uses position and orientation and is more informative.'},
        {name:'Distance from the starting dock', quality:'bad', why:'It measures progress already made, not energy still needed.'},
        {name:'Run a complete obstacle-aware search from every state', quality:'poortradeoff', why:'Very accurate, but repeatedly solving a full pathfinding problem can cost more than the search it guides.'}
      ], best:1,
      lesson:'A stronger heuristic should exploit relevant parts of the state, but each added term must still be justified as unavoidable remaining cost.'
    },
    {
      id:'schedule', title:'Job-shop scheduling', icon:'🏭',
      problem:'Finish all remaining jobs as early as possible using limited machines.', state:'Finished operations, machine availability and precedence constraints', cost:'Elapsed schedule time', goal:'All jobs complete',
      image:'schedule', prompt:'Which candidate is the strongest admissible lower bound?',
      candidates:[
        {name:'Longest remaining precedence chain', quality:'good', why:'The schedule cannot finish before its longest dependent chain finishes.'},
        {name:'Remaining work ÷ number of machines', quality:'good', why:'Even with perfect balancing, the machines require at least this much additional time.'},
        {name:'Maximum of the two lower bounds', quality:'best', why:'The maximum of admissible heuristics stays admissible and dominates either component alone.'},
        {name:'Total remaining processing time', quality:'risky', why:'It assumes all work must execute sequentially and may overestimate when machines operate in parallel.'}
      ], best:2,
      lesson:'For difficult problems, multiple independent lower bounds can be combined. Taking their maximum is often safer than adding them.'
    },
    {
      id:'delivery', title:'Package delivery', icon:'🚚',
      problem:'Deliver all packages with minimum total travel cost.', state:'Vehicle position, undelivered packages and remaining capacity', cost:'Distance or fuel already used', goal:'All packages delivered',
      image:'delivery', prompt:'Which estimate is most useful as a lower bound for the remaining tour?',
      candidates:[
        {name:'Distance to the nearest undelivered package', quality:'good', why:'At least this travel is necessary, but it ignores all later deliveries.'},
        {name:'Minimum spanning tree over current position and remaining stops', quality:'best', why:'Any complete delivery tour must connect the remaining locations. The MST cost is a strong lower bound that ignores route-order constraints.'},
        {name:'Number of packages already delivered', quality:'bad', why:'It records completed work rather than the travel still required.'},
        {name:'Greedy nearest-neighbour tour length', quality:'risky', why:'It provides an upper bound from a feasible tour, not necessarily a lower bound. It can overestimate optimal remaining cost.'}
      ], best:1,
      lesson:'Lower bounds and feasible solutions play different roles. A feasible tour gives an upper bound; A* needs a lower-bound estimate when optimality matters.'
    },
    {
      id:'word', title:'Word ladder', icon:'🔤',
      problem:'Change one letter at a time to transform the start word into the goal word.', state:'Current valid word', cost:'Letter changes already made', goal:'Target word',
      image:'word', prompt:'Which heuristic directly estimates the minimum number of remaining actions?',
      candidates:[
        {name:'Hamming distance from the goal word', quality:'best', why:'Each differing position must be changed at least once, so the number of different letters is a lower bound.'},
        {name:'Alphabetical difference of all letters', quality:'bad', why:'Changing C to Z still takes one legal action, not 23 actions.'},
        {name:'Word frequency in a corpus', quality:'bad', why:'Frequency may help order natural words but does not estimate remaining ladder length.'},
        {name:'Exact shortest ladder from a dictionary search', quality:'poortradeoff', why:'This is perfect but is exactly the original search problem.'}
      ], best:0,
      lesson:'The heuristic should reflect the legal action. Since one action changes one position, counting differing positions is meaningful.'
    },
    {
      id:'chess', title:'Game: Chess', icon:'♟️',
      problem:'Choose moves that maximize the chance of winning.', state:'Board position, player to move, castling and other rights', cost:'Not normally a shortest-path cost', goal:'Checkmate or high utility',
      image:'chess', prompt:'Which evaluation function is likely to judge non-terminal positions most effectively?',
      candidates:[
        {name:'Material value only', quality:'good', why:'Fast and useful, but misses positional advantages and king danger.'},
        {name:'Material + mobility + king safety + pawn structure', quality:'best', why:'It evaluates several strategically relevant features and distinguishes positions with equal material.'},
        {name:'Distance of the king from the top-left corner', quality:'bad', why:'That corner has no general relationship to winning.'},
        {name:'Search the entire game tree to checkmate', quality:'poortradeoff', why:'It would be exact, but the game tree is far too large. The evaluation function exists because full search is infeasible.'}
      ], best:1,
      lesson:'In adversarial search, the heuristic is usually an evaluation of expected utility, not a lower bound on path cost. Admissibility is not the central criterion.'
    },
    {
      id:'ttt', title:'Game: Tic-tac-toe', icon:'⭕',
      problem:'Select a move that leads to a win and blocks the opponent.', state:'Current 3×3 board and player to move', cost:'Usually depth or no explicit cost', goal:'Three marks in a line',
      image:'ttt', prompt:'For a depth-limited search, which simple evaluation best reflects winning potential?',
      candidates:[
        {name:'My open winning lines − opponent open winning lines', quality:'best', why:'It rewards lines still available to the player and penalizes threats available to the opponent.'},
        {name:'Number of my marks', quality:'good', why:'It captures some progress but ignores whether marks form useful lines or whether the opponent is about to win.'},
        {name:'Sum of occupied square indices', quality:'bad', why:'Square numbers are arbitrary labels and do not represent strategic value.'},
        {name:'Distance from the most recent mark to the centre', quality:'bad', why:'Centre control can matter, but this single feature misses immediate wins and blocks.'}
      ], best:0,
      lesson:'Even in a small game, a feature should connect to the actual winning condition. Open lines are directly related to completing three in a row.'
    },
    {
      id:'connect4', title:'Game: Connect Four', icon:'🔴',
      problem:'Drop discs to create four in a row while preventing the opponent.', state:'Current board and player to move', cost:'Search depth', goal:'Four connected discs',
      image:'connect4', prompt:'Which evaluation is most informative for positions where no player has yet won?',
      candidates:[
        {name:'Count my discs only', quality:'bad', why:'Having more discs is automatic over time and does not indicate whether they form threats.'},
        {name:'Weighted open groups of 2 and 3, centre control, minus opponent threats', quality:'best', why:'It scores patterns close to winning, values the strategically strong centre, and accounts for opponent danger.'},
        {name:'Prefer the leftmost available column', quality:'bad', why:'Column order is arbitrary and unrelated to winning quality.'},
        {name:'Number of empty cells', quality:'bad', why:'All moves reduce empty cells equally; it cannot distinguish good and bad positions.'}
      ], best:1,
      lesson:'Good game heuristics evaluate threats and opportunities for both players, not merely the amount of activity on the board.'
    },
    {
      id:'pacman', title:'Game: Pac-Man', icon:'🟡',
      problem:'Collect food efficiently while avoiding ghosts.', state:'Pac-Man, food and ghost positions plus power state', cost:'Steps, risk or negative score', goal:'Collect food and survive',
      image:'pacman', prompt:'Which evaluation best balances progress and danger?',
      candidates:[
        {name:'Negative distance to nearest food only', quality:'good', why:'It encourages progress, but may send Pac-Man directly toward a dangerous ghost.'},
        {name:'Food distance and remaining food, with strong ghost-risk penalty and capsule bonus', quality:'best', why:'It combines goal progress, unfinished work, immediate danger and opportunities to become safe.'},
        {name:'Distance from the starting cell', quality:'bad', why:'Moving far from the start is not the objective.'},
        {name:'Choose the move with most legal successors', quality:'bad', why:'Mobility alone can prefer safe-looking regions without collecting food or avoiding future traps.'}
      ], best:1,
      lesson:'Multi-objective evaluations often use weighted features. The weights express priorities such as survival being more important than one nearby food pellet.'
    },
    {
      id:'proof', title:'Automated theorem proving', icon:'∴',
      problem:'Apply inference rules until the target statement is proved.', state:'Current set of derived clauses or subgoals', cost:'Inference steps already applied', goal:'Target theorem or contradiction',
      image:'proof', prompt:'Which heuristic is most closely connected to remaining proof effort?',
      candidates:[
        {name:'Number and complexity of unresolved subgoals', quality:'best', why:'It estimates how much proof obligation remains, especially when complexity reflects required inference structure.'},
        {name:'Number of statements already derived', quality:'bad', why:'A large proof history may contain irrelevant facts and describes past work.'},
        {name:'Alphabetical order of predicate names', quality:'bad', why:'Names have no logical relationship to proof distance.'},
        {name:'Exact minimum proof length', quality:'poortradeoff', why:'Computing it would require finding the optimal proof—the original problem.'}
      ], best:0,
      lesson:'In symbolic reasoning, structural relevance matters more than surface text. A heuristic should estimate unresolved logical work.'
    }
  ];

  const labels={best:'Excellent choice',good:'Reasonable but weaker',bad:'Poor or irrelevant',risky:'Useful, but unsafe for optimal A*',poortradeoff:'Accurate but impractical'};
  const feedbackTitles={best:'Correct — strongest choice',good:'Partly correct — useful, but not strongest',bad:'Incorrect — weak connection to remaining cost',risky:'Not safe when optimality is required',poortradeoff:'Correct in theory, poor in practice'};

  function illustration(type){
    const common='viewBox="0 0 520 270" role="img" aria-label="Problem illustration"';
    const node=(x,y,t,cls='')=>`<g class="hr-svg-node ${cls}"><circle cx="${x}" cy="${y}" r="25"></circle><text x="${x}" y="${y+6}">${t}</text></g>`;
    if(type==='route') return `<svg ${common}><path class="hr-road" d="M55 205 C145 50 205 235 305 105 S430 70 475 42"/><path class="hr-road alt" d="M55 205 C165 180 270 210 475 42"/>${node(55,205,'S','start')}${node(475,42,'G','goal')}<circle class="hr-landmark" cx="220" cy="178" r="9"/><circle class="hr-landmark" cx="335" cy="88" r="9"/><text class="hr-svg-caption" x="260" y="252">Road cost may be time, not geometric distance</text></svg>`;
    if(type==='puzzle') return `<svg ${common}><g transform="translate(92 25)">${[1,2,3,4,5,6,7,0,8].map((v,i)=>`<rect class="hr-tile ${v===0?'blank':''}" x="${(i%3)*64}" y="${Math.floor(i/3)*64}" width="58" height="58" rx="8"/>${v?`<text class="hr-tile-text" x="${(i%3)*64+29}" y="${Math.floor(i/3)*64+37}">${v}</text>`:''}`).join('')}</g><path class="hr-arrow" d="M310 120h70"/><text class="hr-arrow-text" x="345" y="105">goal</text><g transform="translate(392 72)"><rect class="hr-mini-tile" width="42" height="42" rx="6"/><text class="hr-tile-text" x="21" y="28">8</text></g><text class="hr-svg-caption" x="260" y="250">Estimate how many legal slides remain</text></svg>`;
    if(type==='warehouse') return `<svg ${common}><g class="hr-shelves">${[65,150,330,415].map(x=>`<rect x="${x}" y="35" width="55" height="145" rx="6"/>`).join('')}</g><path class="hr-dash-path" d="M55 225 L210 225 L210 105 L300 105 L300 215 L455 215"/>${node(55,225,'R','start')}${node(455,215,'T','goal')}<text class="hr-svg-caption" x="260" y="255">Orientation, obstacles and turning energy matter</text></svg>`;
    if(type==='schedule') return `<svg ${common}><text class="hr-machine-label" x="20" y="65">M1</text><text class="hr-machine-label" x="20" y="130">M2</text><text class="hr-machine-label" x="20" y="195">M3</text><g class="hr-gantt"><rect x="70" y="38" width="115" height="38"/><rect x="190" y="38" width="170" height="38"/><rect x="70" y="103" width="180" height="38"/><rect x="255" y="103" width="105" height="38"/><rect x="70" y="168" width="80" height="38"/><rect x="155" y="168" width="205" height="38"/></g><line class="hr-deadline" x1="390" y1="25" x2="390" y2="220"/><text class="hr-svg-caption" x="260" y="250">Find an unavoidable lower bound on completion time</text></svg>`;
    if(type==='delivery') return `<svg ${common}><path class="hr-tour" d="M65 210 L145 60 L270 90 L440 45 L390 210 L225 205 Z"/>${node(65,210,'V','start')}${[[145,60],[270,90],[440,45],[390,210],[225,205]].map((p,i)=>node(p[0],p[1],String(i+1),'goal')).join('')}<text class="hr-svg-caption" x="260" y="255">Every remaining stop must somehow be connected</text></svg>`;
    if(type==='word') return `<svg ${common}><g class="hr-word-chain"><text x="55" y="90">COLD</text><text x="175" y="90">CORD</text><text x="295" y="90">CARD</text><text x="415" y="90">WARD</text><text x="415" y="185">WARM</text></g><path class="hr-arrow" d="M100 83h45 M220 83h45 M340 83h45 M430 105v45"/><text class="hr-svg-caption" x="260" y="245">One action changes exactly one letter</text></svg>`;
    if(type==='chess') return boardSvg('♜','♞','♚','♙','♕','♔','Position features should estimate winning utility');
    if(type==='ttt') return `<svg ${common}><g class="hr-board-lines"><path d="M205 35v180M315 35v180M150 95h220M150 155h220"/></g><g class="hr-game-marks"><text x="175" y="86">X</text><text x="255" y="145">O</text><text x="335" y="205">X</text><text x="335" y="86">O</text></g><text class="hr-svg-caption" x="260" y="250">Count opportunities and threats in open lines</text></svg>`;
    if(type==='connect4') return `<svg ${common}><rect class="hr-connect-board" x="95" y="30" width="330" height="200" rx="14"/>${Array.from({length:6},(_,r)=>Array.from({length:7},(_,c)=>`<circle class="hr-slot ${(r+c)%4===0?'p1':(r===4&&c>1&&c<5?'p2':'')}" cx="${125+c*45}" cy="${55+r*32}" r="12"/>`).join('')).join('')}<text class="hr-svg-caption" x="260" y="257">Evaluate near-complete groups and opponent threats</text></svg>`;
    if(type==='pacman') return `<svg ${common}><g class="hr-maze"><path d="M45 40h430v185H45z M130 40v80h80v105 M300 40v70h90v115 M45 150h85 M210 120h90 M390 145h85"/></g><circle class="hr-pac" cx="85" cy="190" r="22"/><path class="hr-pac-mouth" d="M85 190 L108 176 L108 204 Z"/><g class="hr-food">${[[145,190],[250,145],[345,80],[445,185]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5"/>`).join('')}</g><g class="hr-ghost"><path d="M325 190q0-25 22-25t22 25v22l-8-7-8 7-8-7-8 7z"/></g><text class="hr-svg-caption" x="260" y="255">Progress must be balanced against immediate danger</text></svg>`;
    return `<svg ${common}><g class="hr-proof"><rect x="45" y="45" width="120" height="50" rx="10"/><rect x="200" y="45" width="120" height="50" rx="10"/><rect x="355" y="45" width="120" height="50" rx="10"/><rect x="200" y="165" width="120" height="50" rx="10"/><text x="105" y="76">A → B</text><text x="260" y="76">A</text><text x="415" y="76">B → C</text><text x="260" y="196">Goal: C</text><path class="hr-arrow" d="M165 70h30 M320 70h30 M415 100 C415 150 330 180 325 180"/></g><text class="hr-svg-caption" x="260" y="250">Estimate unresolved logical work, not proof history</text></svg>`;
  }

  function boardSvg(...args){const caption=args.pop(); const pieces=args; return `<svg viewBox="0 0 520 270" role="img" aria-label="Chess position illustration"><g transform="translate(155 20)">${Array.from({length:6},(_,r)=>Array.from({length:6},(_,c)=>`<rect class="hr-chess-square ${(r+c)%2?'dark':''}" x="${c*36}" y="${r*36}" width="36" height="36"/>`).join('')).join('')}${pieces.map((p,i)=>`<text class="hr-chess-piece" x="${25+(i%3)*72}" y="${48+Math.floor(i/3)*110}">${p}</text>`).join('')}</g><text class="hr-svg-caption" x="260" y="255">${caption}</text></svg>`;}

  function init(){
    const root=document.getElementById('heuristicRaceRoot'); if(!root||root.dataset.ready)return; root.dataset.ready='true';
    root.innerHTML=`
      <section class="hr-design-hero"><p class="eyebrow">Interactive heuristic design lab</p><h2>Choose first. Then defend the heuristic.</h2><p>For each problem, inspect the state, objective and legal actions. Select the heuristic you believe is most appropriate. The explanation appears only after your choice, so the activity can be used as a live classroom question.</p></section>
      <section class="hr-principles"><article><h3>Match the objective</h3><p>Estimate the remaining quantity optimized by the problem: distance, time, energy, moves, completion time or utility.</p></article><article><h3>Respect legal actions</h3><p>A distance is meaningful only when it reflects what one action can actually accomplish.</p></article><article><h3>Consider total computation</h3><p>A heuristic should reduce enough search to justify the cost of evaluating it repeatedly.</p></article></section>
      <div class="hr-scenario-layout"><aside class="heuristic-control-card"><p class="eyebrow">Choose a problem</p><label>Problem domain<select id="hrScenario">${scenarios.map((s,i)=>`<option value="${i}">${s.icon} ${s.title}</option>`).join('')}</select></label><div id="hrProblemSummary"></div><div class="heuristic-teaching-note"><strong>Before selecting:</strong> ask what h(n) should estimate, which constraints may be relaxed, and whether optimality is required.</div></aside><section><div id="hrVisual" class="hr-problem-visual"></div><article class="hr-question-box"><p class="eyebrow">Student question</p><h3 id="hrPrompt"></h3><p>Select one option. Its evaluation will be revealed afterwards.</p></article><div id="hrCandidateGrid" class="hr-candidate-grid interactive"></div><div id="hrFeedback" class="hr-feedback" aria-live="polite"></div><article class="heuristic-explanation-box"><h3>Problem-level design lesson</h3><p id="hrLesson"></p></article></section></div>
      <section class="hr-game-note"><h2>How game heuristics differ from A* heuristics</h2><p>Chess, tic-tac-toe, Connect Four and Pac-Man use evaluation functions to estimate how desirable a state is. They are not normally required to be admissible lower bounds. Instead, they should correlate with winning, survival or score and be fast enough to evaluate at many leaves of the game tree.</p></section>
      <section class="hr-comparison-section"><h2>Discussion prompts after every answer</h2><div class="hr-mistake-grid"><article><h3>Relevance</h3><p>Does the feature actually describe the remaining problem, or is it merely easy to measure?</p></article><article><h3>Safety</h3><p>Could the estimate exceed the true remaining cost and remove the optimality guarantee?</p></article><article><h3>Information</h3><p>Among safe estimates, does it distinguish promising states better than a weaker heuristic?</p></article><article><h3>Cost</h3><p>Will computing the heuristic at thousands of nodes save time overall?</p></article></div></section>`;

    const select=root.querySelector('#hrScenario'), summary=root.querySelector('#hrProblemSummary'), grid=root.querySelector('#hrCandidateGrid'), lesson=root.querySelector('#hrLesson'), visual=root.querySelector('#hrVisual'), prompt=root.querySelector('#hrPrompt'), feedback=root.querySelector('#hrFeedback');
    let selected=null;
    function render(){
      selected=null; const s=scenarios[Number(select.value)];
      summary.innerHTML=`<h3>${s.icon} ${s.title}</h3><p>${s.problem}</p><dl class="hr-state-model"><div><dt>State</dt><dd>${s.state}</dd></div><div><dt>g(n) / accumulated value</dt><dd>${s.cost}</dd></div><div><dt>Goal</dt><dd>${s.goal}</dd></div></dl>`;
      visual.innerHTML=illustration(s.image); prompt.textContent=s.prompt; lesson.textContent=s.lesson; feedback.innerHTML='';
      grid.innerHTML=s.candidates.map((c,i)=>`<button type="button" class="hr-option" data-index="${i}"><span class="hr-option-letter">${String.fromCharCode(65+i)}</span><span><strong>${c.name}</strong><small>Click to evaluate this choice</small></span></button>`).join('');
      grid.querySelectorAll('.hr-option').forEach(btn=>btn.addEventListener('click',()=>choose(Number(btn.dataset.index))));
    }
    function choose(index){
      const s=scenarios[Number(select.value)], c=s.candidates[index]; selected=index;
      grid.querySelectorAll('.hr-option').forEach((btn,i)=>{btn.classList.toggle('selected',i===index);btn.classList.toggle('correct',i===s.best);btn.classList.toggle('dimmed',i!==index&&i!==s.best);});
      const isBest=index===s.best;
      feedback.innerHTML=`<article class="hr-feedback-card ${c.quality}"><p class="eyebrow">${feedbackTitles[c.quality]}</p><h3>${c.name}</h3><p>${c.why}</p>${!isBest?`<div class="hr-best-answer"><strong>Best option here:</strong> ${s.candidates[s.best].name}<br>${s.candidates[s.best].why}</div>`:`<div class="hr-best-answer"><strong>Why it wins:</strong> It offers the best balance of relevance, information, safety and computation among the listed choices.</div>`}</article>`;
    }
    select.addEventListener('change',render); render();
  }
  window.addEventListener('heuristiclab:ready',init); if(document.readyState!=='loading')init();
})();
