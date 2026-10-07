const assert=require('node:assert/strict');
const {PacLab}=require('../src/pacman-engine');
let a=new PacLab();a.pos=1;a.act(0,true,1);assert.equal(a.last.reward,9);assert.equal(a.mask,30);a.act(0,true,3);a.act(0,true,1);assert.equal(a.last.reward,-1);
a.pos=16;a.act(0,true,1);assert.equal(a.over,true);assert.equal(a.last.boot,0);assert.equal(a.last.reward,-30);
a=new PacLab();a.pos=1;a.mask=1;a.act(0,true,1);assert.equal(a.last.reward,39);assert.equal(a.wins,1);assert.equal(a.last.boot,0);
a=new PacLab();a.steps=119;a.row('15:31')[0]=10;a.act(0,true,1);assert.equal(a.timeouts,1);assert.equal(a.last.boot,10);assert.equal(a.last.terminal,false);
a=new PacLab();a.act(1,false);assert.equal(a.explores,1);assert.equal(a.updates,0);assert.ok(Object.values(a.q).flat().every(v=>v===0));
const b=new PacLab();for(let i=0;i<100;i++)b.act(0);assert.equal(b.explores,0);
console.log('PASS Pac-Man: food collected once, full-state mask, terminal rewards, truncation bootstrap, frozen learning, epsilon branches.');
