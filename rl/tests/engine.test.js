const assert=require('node:assert/strict'),G=require('../src/engine');
const c={alpha:.5,gamma:.9,epsilon:.3,living:0,learning:true};
assert.equal(G.move(4,1),4);assert.equal(G.move(0,3),0);assert.deepEqual(G.actions(11),[4]);assert.deepEqual(G.actions(-1),[]);
// Every manual action is deterministic across seeds, even if a stale noise argument is supplied.
for(let seed=0;seed<10;seed++)for(let s=0;s<12;s++)for(const a of G.actions(s)){const l=new G.Lab(seed);l.s=s;const t=l.act({...c,noise:1},a);assert.equal(t.actual,a);assert.equal(t.next,a===4?-1:G.move(s,a));assert.equal(l.updates,1);assert.equal(l.steps,1);}
const l=new G.Lab(42),before=l.snapshot();l.act({...c,living:-.1},0);assert.equal(l.s,4);assert.equal(l.q[0][0],-.05);assert.equal(l.updates,1);assert.equal(l.history.length,1);l.undo();assert.deepEqual(l.snapshot(),before);
function path(){for(const a of [0,0,1,1,1])l.act(c,a);assert.equal(l.s,11);assert.equal(l.over,false);assert.equal(l.total,0);const t=l.act(c,4);assert.equal(t.boot,0);assert.equal(t.reward,1);assert.equal(l.over,true);}
path();assert.equal(l.q[11][4],.5);assert.equal(l.q[10][1],0);l.nextEpisode();path();assert.equal(l.q[11][4],.75);assert.equal(l.q[10][1],.225);
const n=new G.Lab();for(const a of [1,1,1,0,4])n.act(c,a);assert.equal(n.q[7][4],-.5);assert.equal(n.losses,1);
const frozen=JSON.stringify(l.q);l.nextEpisode();l.act({...c,learning:false},0);assert.equal(JSON.stringify(l.q),frozen);
const a=new G.Lab(17),b=new G.Lab(17);for(let i=0;i<200;i++){a.tick(c);b.tick(c);}assert.deepEqual(a.snapshot(),b.snapshot());const snap=a.snapshot();a.tick(c);const after=a.snapshot();a.undo();assert.deepEqual(a.snapshot(),snap);a.tick(c);assert.deepEqual(a.snapshot(),after);
console.log('PASS: deterministic actions, atomic Q updates, wall/border handling, terminal reward timing, reward propagation, frozen learning, and undo/RNG restoration.');
const cliff=new G.Lab(42,'cliff');assert.equal(cliff.s,8);assert.equal(cliff.q.length,21);assert.equal(cliff.label(13),'(6, 1)');for(let i=0;i<5;i++)cliff.act(c,1);assert.equal(cliff.s,13);assert.equal(cliff.over,false);cliff.act(c,4);assert.equal(cliff.last.reward,10);assert.equal(cliff.q[13][4],5);assert.equal(cliff.wins,1);
for(const direction of [0,2,3]){const ocean=new G.Lab(42,'cliff');ocean.act(c,direction);assert.equal(ocean.total,0);ocean.act(c,4);assert.equal(ocean.last.reward,-100);assert.equal(ocean.last.boot,0);assert.equal(ocean.losses,1);ocean.undo();assert.equal(ocean.over,false);}
for(const map of Object.values(G.MAPS))for(let s=0;s<map.width*map.height;s++)for(const a of G.actions(s,map)){const sim=new G.Lab(2,map.id);sim.s=s;const t=sim.act(c,a);assert.equal(t.next,a===4?-1:G.move(s,a,map));}
console.log('PASS cliff: 7x3 layout, +10 island, -100 surrounding ocean exits, deterministic movement, reward timing and undo.');
