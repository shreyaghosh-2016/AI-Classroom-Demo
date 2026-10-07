/* Original classroom implementation of the Berkeley-style BookGrid rules. */
(function(root){
'use strict';
const ACTIONS=['North','East','South','West','Exit'],ARROWS=['↑','→','↓','←','↗'];
const TERMINAL=-1;
const MAPS={
 grid:{id:'grid',name:'Gridworld',width:4,height:3,start:0,walls:[5],exits:{11:1,7:-1}},
 cliff:{id:'cliff',name:'Cliff crossing',width:7,height:3,start:8,walls:[0,6,14,20],exits:{1:-100,2:-100,3:-100,4:-100,5:-100,7:-100,13:10,15:-100,16:-100,17:-100,18:-100,19:-100}}
};
const WALL=5,START=0,EXITS=MAPS.grid.exits;
const actions=(s,m=MAPS.grid)=>s===TERMINAL||m.walls.includes(s)?[]:(s in m.exits?[4]:[0,1,2,3]);
const label=(s,m=MAPS.grid)=>s===TERMINAL?'TERMINAL':`(${s%m.width}, ${Math.floor(s/m.width)})`;
function move(s,a,m=MAPS.grid){const [dx,dy]=[[0,1],[1,0],[0,-1],[-1,0]][a],x=s%m.width+dx,y=Math.floor(s/m.width)+dy;const n=y*m.width+x;return x<0||x>=m.width||y<0||y>=m.height||m.walls.includes(n)?s:n;}
class Lab{
 constructor(seed=42,mapId='grid'){this.map=MAPS[mapId];if(!this.map)throw Error('Unknown map');this.seed=seed>>>0;this.randomState=this.seed;this.q=Array.from({length:this.map.width*this.map.height},()=>Array(5).fill(0));this.s=this.map.start;this.episode=1;this.completed=0;this.steps=0;this.updates=0;this.total=0;this.wins=0;this.losses=0;this.truncated=0;this.last=null;this.over=false;this.log=[];this.history=[];}
 random(){let t=this.randomState=(this.randomState+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
 actions(s){return actions(s,this.map);}
 label(s){return label(s,this.map);}
 maximum(s){const aa=this.actions(s);return aa.length?Math.max(...aa.map(a=>this.q[s][a])):0;}
 snapshot(){return {q:this.q.map(r=>r.slice()),s:this.s,episode:this.episode,completed:this.completed,steps:this.steps,updates:this.updates,total:this.total,wins:this.wins,losses:this.losses,truncated:this.truncated,last:this.last?{...this.last}:null,over:this.over,randomState:this.randomState,logLength:this.log.length};}
 remember(){this.history.push(this.snapshot());if(this.history.length>3000)this.history.shift();}
 undo(){const x=this.history.pop();if(!x)return false;this.log.length=x.logLength;delete x.logLength;Object.assign(this,x);return true;}
 act(cfg,manual=null){if(this.over)throw Error('Start the next episode first.');const c={alpha:.5,gamma:.9,epsilon:.3,living:0,learning:true,...cfg};const legal=this.actions(this.s);if(manual!==null&&!legal.includes(manual))throw Error('Invalid action here.');this.remember();let a=manual,reason='Manual action';if(a===null){if(legal.length===1){a=legal[0];reason='Only legal action';}else if(this.random()<c.epsilon){a=legal[Math.floor(this.random()*legal.length)];reason='Explore · random action';}else{const m=this.maximum(this.s),ties=legal.filter(i=>this.q[this.s][i]===m);a=ties[Math.floor(this.random()*ties.length)];reason='Exploit · highest Q (random tie-break)';}}
 let actual=a,next=TERMINAL,reward=this.s in this.map.exits?this.map.exits[this.s]:c.living;
 if(a!==4)next=move(this.s,a,this.map);
 const old=this.q[this.s][a],boot=this.maximum(next),target=reward+c.gamma*boot,value=old+c.alpha*(target-old);
 const bestNext=this.actions(next).filter(a=>this.q[next][a]===boot);
 const p={s:this.s,a,actual,next,bestNext,reward,old,boot,target,value,alpha:c.alpha,gamma:c.gamma,learning:c.learning,reason,episode:this.episode,move:this.steps+1};this.s=next;if(p.learning){this.q[p.s][p.a]=p.value;this.updates++;}this.steps++;this.total+=p.reward;this.last={...p};this.log.push({...p});
 if(p.next===TERMINAL){this.completed++;this.over=true;if(p.reward>0)this.wins++;else this.losses++;}
 else if(this.steps>=500){this.over=true;this.truncated++;}return p;
 }
 nextEpisode(){if(!this.over)throw Error('Finish the current episode first.');this.remember();this.s=this.map.start;this.episode++;this.steps=0;this.total=0;this.last=null;this.over=false;}
 tick(cfg){if(this.over)return this.nextEpisode();return this.act(cfg);}
}
const api={MAPS,ACTIONS,ARROWS,WALL,START,TERMINAL,EXITS,actions,label,move,Lab};root.GridLab=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
