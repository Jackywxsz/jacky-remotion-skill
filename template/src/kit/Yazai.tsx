import React from 'react';
import {interpolate,useCurrentFrame} from 'remotion';
import traced from './yazai-traced.json';
import {cleanPath} from './clean-path';

/** 芽仔：移植自 Opus 动画引擎 yazai.ts 的干净版（clean）。整张图不变形，靠位移、小跳和面罩像素表情表演。
 * 局部坐标原点在两只靴底中点，向上为负，总高约 480。 */
const INK='#1B1E24',WHITE='#fffaf2',LEAF='#8fd14f',LED='#8ff5d6',LED_PINK='#ff8fab',LED_BLUE='#8cc8ff';

// 14×10 像素屏：e=眼 m=嘴 p=粉（腮红/爱心）b=汗滴 d=加载点（依次亮）。
export const FACES={
 idle:['..............','..............','..............','..ee......ee..','..ee......ee..','..ee......ee..','..............','.....mmmm.....','..............','..............'],
 blink:['..............','..............','..............','..............','..............','..ee......ee..','..............','.....mmmm.....','..............','..............'],
 happy:['..............','..............','...e......e...','..e.e....e.e..','.e...e..e...e.','..............','.pp.m....m.pp.','.....mmmm.....','..............','..............'],
 surprise:['..............','..eee....eee..','..e.e....e.e..','..e.e....e.e..','..eee....eee..','..............','......mm......','......mm......','..............','..............'],
 star:['...e......e...','..eee....eee..','.eeeee..eeeee.','..eee....eee..','..e.e....e.e..','..............','.pp.m....m.pp.','.....mmmm.....','..............','..............'],
 love:['..............','.pp.pp..pp.pp.','.ppppp..ppppp.','..ppp....ppp..','...p......p...','..............','.....m..m.....','......mm......','..............','..............'],
 awkward:['...........b..','..........bbb.','..........bbb.','..eee..eee....','..............','..............','....m.mm.m....','.....m..m.....','..............','..............'],
 doubt:['...........ee.','..........e..e','.............e','..eee.......e.','......ee..e...','...........e..','.....mmm......','...........e..','..............','..............'],
 loading:['..............','..............','..............','..............','..dd..dd..dd..','..dd..dd..dd..','..............','..............','..............','..............'],
} as const;
export type Face=keyof typeof FACES;

const VI=traced.visor,VX=(VI.x0+VI.x1)/2,VY=(VI.y0+VI.y1)/2,CELL=11,GX=VX-77,GY=VY-57;
type Group='body'|'armL'|'armR'|'head'|'sprout';
// 原描图在鞋底、手套和叶片下沿留下的细碎片，干净版不画（同引擎 clean 模式）。
const SKIP=[0,1,8,10,11,24,25,29,30];
const PARTS=[...traced.parts.entries()].filter(([i])=>!SKIP.includes(i)).sort(([a],[b])=>a===19?-1:b===19?1:a-b).map(([i,p])=>({
 group:p.group as Group,
 d:i===19?'M-73,-239 Q0,-245 77,-239 L82,-133 Q2,-121 -77,-133 Z':cleanPath(p.d),
 fill:p.fill==='white'?WHITE:p.fill==='leaf'?LEAF:p.fill,
}));
const VISOR=cleanPath(VI.d);
const CELLS=Object.fromEntries((Object.keys(FACES) as Face[]).map(f=>[f,FACES[f].flatMap((row,r)=>[...row].map((ch,c)=>({r,c,ch})).filter(x=>x.ch!=='.'))])) as Record<Face,{r:number;c:number;ch:string}[]>;

const Parts=({group}:{group:Group})=> <>{PARTS.filter(p=>p.group===group).map((p,i)=><path key={i} d={p.d} fill={p.fill} fillRule="evenodd" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"/>)}</>;

export type YazaiProps={x:number;y:number;h:number;face?:Face;faceSince?:number;headRot?:number;sprout?:number;flip?:boolean;rot?:number;shadow?:number;seed?:number;style?:React.CSSProperties};
/** x/y 为靴底中点的舞台坐标，h 为角色高度（像素），rot 绕靴底整体旋转。face 切换后按 faceSince 逐行亮起（4 帧）。 */
export const Yazai:React.FC<YazaiProps>=({x,y,h,face='idle',faceSince=-99,headRot=0,sprout=0,flip,rot=0,shadow=1,seed=1,style})=>{
 const frame=useCurrentFrame();const k=h/480,id=`yz${seed}`;
 const scan=interpolate(frame-faceSince,[0,4],[0,11],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const dot=Math.floor(frame/13)%3;
 return <svg width={320*k} height={520*k} viewBox="-160 -495 320 520" style={{position:'absolute',left:x-160*k,top:y-495*k,overflow:'visible',transform:rot?`rotate(${rot}deg)`:undefined,transformOrigin:`${160*k}px ${495*k}px`,...style}}>
  <defs>
   <radialGradient id={`${id}v`} cx={.42} cy={.38} r={.75}><stop offset={0} stopColor="#2b2d33"/><stop offset={.6} stopColor="#15161a"/><stop offset={1} stopColor="#0a0b0d"/></radialGradient>
   <filter id={`${id}g`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation={2.6} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <ellipse cx={0} cy={6} rx={118} ry={13} fill={INK} opacity={.1*shadow}/>
  <g transform={flip?'scale(-1 1)':undefined}>
   <Parts group="armL"/><Parts group="armR"/><Parts group="body"/>
   <g transform={`rotate(${Math.max(-6,Math.min(6,headRot))} 0 -214)`}>
    <g transform={`rotate(${sprout} 0 -412)`}><Parts group="sprout"/></g>
    <Parts group="head"/>
    <path d={VISOR} fill={`url(#${id}v)`} fillRule="evenodd"/>
    <g filter={`url(#${id}g)`} transform={flip?`translate(${2*VX} 0) scale(-1 1)`:undefined}>
     {CELLS[face].map(({r,c,ch},i)=>{
      let o=Math.max(0,Math.min(1,scan-r));
      if(ch==='d')o*=Math.floor(c/4)===dot?1:.25;
      if(ch==='b')o*=.55+.45*Math.cos(frame/30*5);
      return <rect key={i} x={GX+c*CELL+1} y={GY+r*CELL+1} width={CELL-2} height={CELL-2} rx={1.6} opacity={o} fill={ch==='p'?LED_PINK:ch==='b'?LED_BLUE:LED}/>;
     })}
    </g>
   </g>
  </g>
 </svg>;
};

/** 表情排期：[起始帧, 表情, 持续帧]。空档回到 idle，并按 blinks 眨眼 3 帧。 */
export const useFace=(cues:[number,Face,number][],blinks:number[]=[])=>{
 const frame=useCurrentFrame();
 const hit=[...cues].reverse().find(([at,,dur])=>frame>=at&&frame<at+dur);
 if(hit)return {face:hit[1],since:hit[0]};
 const last=cues.filter(([at,,dur])=>frame>=at+dur).map(([at,,dur])=>at+dur).sort((a,b)=>b-a)[0]??-99;
 if(blinks.some(b=>frame>=b&&frame<b+3))return {face:'blink' as Face,since:-99};
 return {face:'idle' as Face,since:last};
};

/** 原地小跳：每 period 帧跳一次，腾空 air 帧。返回向上位移与影子缩放。 */
export const useHop=(from:number,period=36,air=10,amp=12)=>{
 const frame=useCurrentFrame();if(frame<from)return {dy:0,shadow:1};
 const t=(frame-from)%period;const lift=t<air?Math.sin(Math.PI*t/air)*amp:0;
 return {dy:-lift,shadow:1-lift/amp*.45};
};
