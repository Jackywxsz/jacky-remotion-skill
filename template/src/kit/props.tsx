import React from 'react';
import {interpolate,useCurrentFrame} from 'remotion';
import {G,HAND,V} from './brand';
import {Stage,rand,roughPath,roughRect,useBoil} from './ink';

/** 场景道具：都按画布绝对坐标摆放，放在 <Stage> 里；线条同一支墨笔、3 帧一抖。新道具照这个写法加在这里。 */
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const RED=V.red,MINT=V.mint;

/** AI 机器：x/y 为底边中点。shake 0–1 抖动，busy 时顶灯闪、屏幕跑点。screen 换屏幕上的字，screenAt 起弹一下。label 像铭牌挂在两腿之间。 */
export const Machine:React.FC<{x:number;y:number;s?:number;shake?:number;busy?:boolean;label?:string;labelIn?:number;opacity?:number;screen?:string;screenAt?:number}>=({x,y,s=1,shake=0,busy,label,labelIn=1,opacity=1,screen='AI',screenAt=-99})=>{
 const frame=useCurrentFrame(),b=useBoil();
 const jx=shake*(rand(frame*1.7)-.5)*10,jy=shake*(rand(frame*2.3)-.5)*6;
 const dots=Math.floor(frame/4)%4;
 return <g transform={`translate(${x+jx} ${y+jy}) scale(${s})`} opacity={opacity} stroke={V.ink} strokeLinecap="round" strokeLinejoin="round">
  <path d={roughPath([[-92,-62],[-96,0]],b+1,.8)} strokeWidth={7} fill="none"/>
  <path d={roughPath([[92,-62],[96,0]],b+2,.8)} strokeWidth={7} fill="none"/>
  <path d={roughPath([[0,-300],[0,-326]],b+3,.6)} strokeWidth={4} fill="none"/>
  <circle cx={0} cy={-334} r={10} fill={busy&&frame%8<4?MINT:'#fff'} strokeWidth={3}/>
  <g transform="translate(-130 -296)"><path d={roughRect(260,236,4+b*7,1.4)} fill={V.sticker} strokeWidth={3.4}/></g>
  <path d="M-54 -302 L54 -302" strokeWidth={12}/>
  <path d={roughPath([[130,-128],[178,-104],[178,-66],[130,-76]],b*5+9,1,true)} fill="#fff" strokeWidth={3}/>
  <g transform="translate(-96 -270)"><path d={roughRect(192,112,11+b*3,1)} fill={V.blue} strokeWidth={3}/></g>
  {busy?<text x={0} y={-200} textAnchor="middle" fontFamily={HAND} fontSize={56} fill="#fff" stroke="none">{'•'.repeat(dots)}</text>
   :<text x={0} y={-192} textAnchor="middle" fontFamily={HAND} fontSize={64} fill="#fff" stroke="none" transform={`translate(0 -214) scale(${1+.25*Math.sin(Math.PI*interpolate(frame,[screenAt,screenAt+6],[0,1],clamp))}) translate(0 214)`}>{screen}</text>}
  <circle cx={-56} cy={-118} r={14} fill="#fff" strokeWidth={3}/><circle cx={-12} cy={-118} r={14} fill="#fff" strokeWidth={3}/>
  <circle cx={52} cy={-118} r={17} fill={RED} strokeWidth={3}/>
  <path d={roughPath([[-56,-118],[-50,-128]],b+4,.4)} strokeWidth={3}/><path d={roughPath([[-12,-118],[-4,-112]],b+6,.4)} strokeWidth={3}/>
  {label&&labelIn>0&&<g transform={`translate(0 -26) rotate(-3) scale(${labelIn})`}>
   <rect x={-104} y={-28} width={208} height={56} rx={14} fill="#fff" stroke="none"/>
   <text x={0} y={14} textAnchor="middle" fontFamily={HAND} fontSize={40} fill={V.blue} stroke="none">{label}</text>
  </g>}
 </g>;
};

/** 四角星闪光：at 起弹出再淡出。 */
export const Sparkle:React.FC<{x:number;y:number;at:number;size?:number;color?:string;life?:number}>=({x,y,at,size=24,color=V.blue,life=16})=>{
 const frame=useCurrentFrame();const t=frame-at;if(t<0||t>life)return null;
 const k=Math.sin(Math.PI*t/life),r=size*k,w=r*.28;
 return <path d={`M${x} ${y-r} Q${x+w} ${y-w} ${x+r} ${y} Q${x+w} ${y+w} ${x} ${y+r} Q${x-w} ${y+w} ${x-r} ${y} Q${x-w} ${y-w} ${x} ${y-r}Z`} fill={color} transform={`rotate(${t*3} ${x} ${y})`}/>;
};
/** 一圈闪光。 */
export const Burst:React.FC<{x:number;y:number;at:number;n?:number;r0?:number;r1?:number;seed?:number;color?:string}>=({x,y,at,n=7,r0=60,r1=150,seed=1,color})=> <>
 {Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2+rand(seed+i)*.6,r=r0+rand(seed+i*3)*(r1-r0);
  return <Sparkle key={i} x={x+Math.cos(a)*r} y={y+Math.sin(a)*r} at={at+Math.floor(rand(seed+i*7)*8)} size={14+rand(seed+i*5)*18} color={color??(i%3===0?MINT:V.blue)}/>;})}
</>;

/** 纸张：白纸墨框，三道潦草的线；label 写在顶部。 */
export const Sheet:React.FC<{x:number;y:number;rot?:number;label?:string;w?:number;h?:number;seed?:number;scale?:number}>=({x,y,rot=0,label,w=84,h=108,seed=1,scale=1})=>{
 const b=useBoil();
 return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} stroke={V.ink} strokeLinecap="round" fill="none">
  <g transform={`translate(${-w/2} ${-h/2})`}><path d={roughRect(w,h,seed+b*5,1)} fill="#fff" strokeWidth={2.6}/></g>
  {label&&<text x={0} y={-h/2+32} textAnchor="middle" fontFamily={HAND} fontSize={24} fill={V.ink} stroke="none">{label}</text>}
  {[0,1,2].map(i=><path key={i} d={roughPath([[-w/2+14,-h/2+52+i*16],[w/2-14-(i===2?20:0),-h/2+52+i*16]],seed+i*3+b,1.4)} strokeWidth={2} stroke={V.faint}/>)}
 </g>;
};

/** 揉成团的纸。 */
export const PaperBall:React.FC<{x:number;y:number;r?:number;rot?:number}>=({x,y,r=26,rot=0})=>{
 const b=useBoil();
 const pts=Array.from({length:11},(_,i)=>{const a=i/11*Math.PI*2,k=.82+rand(i*4.1)*.3;return [Math.cos(a)*r*k,Math.sin(a)*r*k] as [number,number];});
 return <g transform={`translate(${x} ${y}) rotate(${rot})`} stroke={V.ink} strokeLinecap="round" fill="none">
  <path d={roughPath(pts,b*3+2,.8,true)} fill="#fff" strokeWidth={2.8}/>
  <path d={roughPath([[-r*.5,-r*.2],[0,r*.1],[r*.4,-r*.3]],b+5,.8)} strokeWidth={2}/>
  <path d={roughPath([[-r*.2,r*.5],[r*.1,r*.15],[r*.5,r*.35]],b+8,.8)} strokeWidth={2}/>
 </g>;
};

/** 地面裂开的坑：open 0–1 张开，crack 0–1 先出现裂纹。back 画坑洞，front 画前沿（盖在掉进去的角色上）。 */
export const Pit:React.FC<{cx:number;cy:number;rx:number;ry:number;open:number;crack:number;part:'back'|'front'}>=({cx,cy,rx,ry,open,crack,part})=>{
 const b=useBoil();
 if(part==='front'){
  if(open<=0)return null;
  const pts=Array.from({length:13},(_,i)=>{const a=i/12*Math.PI;return [cx+Math.cos(a)*rx*open,cy+Math.sin(a)*ry*open] as [number,number];});
  return <path d={roughPath(pts,b*7+1,1.2)} fill="none" stroke={V.ink} strokeWidth={4} strokeLinecap="round"/>;
 }
 const cracks:[number,number][][]=[[[cx-20,cy],[cx-60,cy+10],[cx-110,cy-4],[cx-170,cy+8]],[[cx+10,cy],[cx+70,cy+12],[cx+120,cy-2],[cx+190,cy+10]],[[cx-30,cy],[cx-50,cy+26]],[[cx+40,cy+4],[cx+58,cy+30]]];
 return <g>
  {crack>0&&open<1&&cracks.map((c,i)=><path key={i} d={roughPath(c,i*9+b*4,1)} fill="none" stroke={V.ink} strokeWidth={3.4} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1-crack}/>)}
  {open>0&&<ellipse cx={cx} cy={cy} rx={rx*open} ry={ry*open} fill={V.ink}/>}
 </g>;
};

/** 魔杖：从手里伸出，杖头一颗蓝星。 */
export const Wand:React.FC<{x:number;y:number;p:number;rot?:number;s?:number}>=({x,y,p,rot=-30,s=1})=>{
 const b=useBoil();if(p<=0)return null;const L=96*s*p;
 const tx=x+Math.sin(rot*Math.PI/180)*L,ty=y-Math.cos(rot*Math.PI/180)*L;
 const r=22*s*p,w=r*.32;
 return <g stroke={V.ink} strokeLinecap="round">
  <path d={roughPath([[x,y],[tx,ty]],b+2,.5)} strokeWidth={6*s} fill="none"/>
  <path d={`M${tx} ${ty-r} Q${tx+w} ${ty-w} ${tx+r} ${ty} Q${tx+w} ${ty+w} ${tx} ${ty+r} Q${tx-w} ${ty+w} ${tx-r} ${ty} Q${tx-w} ${ty-w} ${tx} ${ty-r}Z`} fill={V.blue} strokeWidth={2.4}/>
 </g>;
};

/** 地平线：一支铅笔横穿窗内，下方淡纸色。 */
export const Ground:React.FC<{y:number;x0?:number;x1?:number}>=({y,x0=96,x1=1824})=>{
 const b=useBoil();
 const pts=Array.from({length:18},(_,i)=>[x0+(x1-x0)*i/17,y] as [number,number]);
 return <path d={roughPath(pts,b*13+5,1.2)} fill="none" stroke={V.ink} strokeWidth={2.6} strokeLinecap="round" opacity={.75}/>;
};

/** 手绘云：白底墨线，x/y 为底边中点。 */
export const Cloud:React.FC<{x:number;y:number;s?:number;seed?:number}>=({x,y,s=1,seed=1})=>{
 const b=useBoil();
 const bumps:[number,number,number][]=[[-70,-10,34],[-28,-38,44],[26,-44,50],[74,-16,34]];
 const pts:[number,number][]=[[-100,0]];
 bumps.forEach(([cx,cy,r])=>{for(let i=0;i<=4;i++){const a=Math.PI+i/4*Math.PI;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}});
 pts.push([104,0]);
 return <g transform={`translate(${x} ${y}) scale(${s})`}><path d={roughPath(pts,seed+b*9,1.2,true)} fill="#fff" stroke={V.ink} strokeWidth={2.4/s} strokeLinejoin="round"/></g>;
};

/** 思考气泡。 */
export const Bubble:React.FC<{x:number;y:number;p:number;text:string}>=({x,y,p,text})=>{
 if(p<=0)return null;
 return <div style={{position:'absolute',left:x,top:y,transform:`scale(${p})`,transformOrigin:'0 100%',padding:'10px 26px 14px',borderRadius:30,background:'#fff',border:`3px solid ${V.ink}`,fontFamily:HAND,fontSize:44,color:V.ink,lineHeight:1}}>{text}</div>;
};


/** 户外场景底：白窗内的淡纸蓝天空 + 远山 + 两朵慢飘的云 + 地平线和米色地面。只在剧情需要“地面”时用（掉坑、走路、种树），
 * 口播图解段不要机械沿用。p 0–1 控制整体淡入淡出；ground 为地平线 y。放在场景最底层，Stage 之外。 */
export const Scenery:React.FC<{p?:number;ground:number}>=({p=1,ground})=>{
 const frame=useCurrentFrame(),b=useBoil();const w=G.window;
 if(p<=0)return null;
 const x0=w.x+40,x1=w.x+w.w-40;
 const hill=Array.from({length:16},(_,i)=>[x0+i*(x1-x0)/15,ground-40-Math.sin(i*.9)*34-Math.sin(i*2.3)*14] as [number,number]);
 return <div style={{position:'absolute',inset:0,opacity:p}}>
  <div style={{position:'absolute',left:w.x,top:w.y,width:w.w,height:ground-w.y,borderRadius:`${w.r}px ${w.r}px 0 0`,background:'linear-gradient(180deg,#D9E5FF 0%,#EDF2FF 70%,#F6F8FF 100%)'}}/>
  <div style={{position:'absolute',left:w.x,top:ground,width:w.w,height:w.y+w.h-ground,borderRadius:`0 0 ${w.r}px ${w.r}px`,background:'#F7F4EC'}}/>
  <Stage>
   <path d={roughPath([[x0,ground],...hill,[x1,ground]],b*5+3,1.4)+' Z'} fill="#E2EAFB" stroke="#9FB4DD" strokeWidth={2}/>
   <Cloud x={w.x+w.w*.4+frame*.35} y={w.y+216} s={1.1} seed={2}/><Cloud x={w.x+w.w*.63+frame*.22} y={w.y+146} s={.8} seed={6}/>
   <Ground y={ground} x0={x0} x1={x1}/>
  </Stage>
 </div>;
};
