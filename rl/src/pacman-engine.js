/* Small deterministic Pac-Man MDP. State includes remaining food. */
(function(root){
'use strict';
const W=7,H=5,WALLS=[8,10,12,22,24,26],GHOSTS=[17,25],FOOD=[2,6,16,28,34],START=14;
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]],NAMES=['↑ North','→ East','↓ South','← West'];
class PacLab {
 constructor(seed=42){this.rng=seed>>>0;this.q={};this.visits=Array(35).fill(0);this.updates=0;this.explores=0;this.exploits=0;this.wins=0;this.losses=0;this.timeouts=0;this.records=[];this.episode=0;this.begin();}
 random(){let t=this.rng=(this.rng+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
 begin(){this.pos=START;this.mask=31;this.steps=0;this.total=0;this.over=false;this.last=null;this.path=[START];this.episode++;this.visits[START]++;}
 key(){return this.pos+':'+this.mask;}
 row(key=this.key()){return this.q[key]||(this.q[key]=[0,0,0,0]);}
 act(epsilon=.05,learn=true,manual=null){
 if(this.over){this.begin();return;}
 const state=this.key(),row=this.row(),explore=manual===null&&this.random()<epsilon;
 const best=Math.max(...row),ties=[0,1,2,3].filter(i=>row[i]===best);
 const action=manual!==null?manual:explore?Math.floor(this.random()*4):ties[Math.floor(this.random()*ties.length)];
 const reason=manual!==null?'Manual':explore?'Explore · random action':'Exploit · highest Q';
 if(manual===null){if(explore)this.explores++;else this.exploits++;}
 const from=this.pos,[dx,dy]=DIRS[action],x=from%W+dx,y=Math.floor(from/W)+dy,n=y*W+x;
 if(x>=0&&x<W&&y>=0&&y<H&&!WALLS.includes(n))this.pos=n;
 let reward=-1,event=this.pos===from?'Wall / border':'Move';
 if(GHOSTS.includes(this.pos)){reward=-30;this.over=true;this.losses++;event='Caught by ghost';}
 else {const fi=FOOD.indexOf(this.pos);if(fi>=0&&(this.mask&(1<<fi))){this.mask&=~(1<<fi);reward+=10;event='Food +10';if(this.mask===0){reward+=30;this.over=true;this.wins++;event='All food collected · bonus +30';}}}
 const old=row[action],boot=this.over?0:Math.max(...this.row()),target=reward+.95*boot,value=old+.5*(target-old);
 if(learn){row[action]=value;this.updates++;}
 this.steps++;this.total+=reward;this.visits[this.pos]++;this.path.push(this.pos);if(this.path.length>30)this.path.shift();
 const terminal=this.over;if(!this.over&&this.steps>=120){this.over=true;this.timeouts++;event='120-step truncation';}
 this.last={state,from,to:this.pos,action,reason,explore,reward,old,boot,target,value,learn,event,terminal};
 if(this.over)this.records.push({return:this.total,steps:this.steps,win:terminal&&this.mask===0});
 return this.last;
 }
}
const api={PacLab,W,H,WALLS,GHOSTS,FOOD,START,NAMES};root.PacmanLab=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
