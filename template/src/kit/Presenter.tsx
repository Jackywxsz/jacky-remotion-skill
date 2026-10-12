import {Video} from '@remotion/media';
import {Easing,Sequence,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {G,HAND,V} from './brand';
import {roughRounded,useBoil} from './ink';
import {timeline} from './timing';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const IN=14,OUT=10;

/** 口播窗在第 f 帧的出场进度 0–1：段的 presenter 从 hidden 变 window 时在新段开头（+presenterDelay）滑入，反过来在旧段结尾滑出。
 * 上一段的道具还在收场、会和滑入的窗撞上时，用 plan 的 presenterDelay（秒）晚一点进。 */
export const presenterShown=(f:number)=>{
 const segs=timeline.segments;
 const i=segs.findIndex(s=>f>=s.startFrame&&f<s.endFrame);
 if(i<0)return 0;
 const s=segs[i],on=s.presenter==='window';
 if(!on)return 0;
 const prevOn=i>0&&segs[i-1].presenter==='window',nextOn=i<segs.length-1&&segs[i+1].presenter==='window';
 const in0=s.startFrame+s.presenterDelay;
 const enter=prevOn?1:interpolate(f,[in0,in0+IN],[0,1],{...clamp,easing:Easing.out(Easing.back(1.4))});
 const exit=nextOn||i===segs.length-1?1:interpolate(f,[s.endFrame-OUT,s.endFrame],[1,0],{...clamp,easing:Easing.in(Easing.cubic)});
 return Math.min(enter,exit);
};

/** 口播窗：竖版圆角矩形，白卡纸垫底 + 淡蓝错位影 + 手绘墨线描边 + 名字贴纸。底片只拿画面（静音），按 crop 裁出人像放大。
 * 每段用自己的 clip，从段开头播起，比段短时循环（TTS 配音时不对口型）。 */
export const Presenter=()=>{
 const f=useCurrentFrame(),b=useBoil();const p=timeline.presenter;
 const t=presenterShown(f);
 if(!p||t<=0)return null;
 const seg=timeline.segments.find(s=>f>=s.startFrame&&f<s.endFrame)!;
 const c=p.clips[seg.clip??p.defaultClip];
 const {x,y,w}=G.presenter;const K=w/c.crop.w,H=c.crop.h*K,r=w*.18,mat=12;
 return <div style={{position:'absolute',left:x,top:y,width:w,height:H,transform:`translateX(${(1-t)*(w+200)}px) rotate(${1.2+(1-t)*6}deg)`,transformOrigin:'50% 100%'}}>
  <div style={{position:'absolute',left:-mat+14,top:-mat+16,width:w+mat*2,height:H+mat*2,borderRadius:r+mat,background:'#C7D7FA'}}/>
  <div style={{position:'absolute',left:-mat,top:-mat,width:w+mat*2,height:H+mat*2,borderRadius:r+mat,background:'#fff'}}/>
  <div style={{position:'absolute',inset:0,borderRadius:r,overflow:'hidden',background:V.tint}}>
   <Sequence from={seg.startFrame} durationInFrames={seg.endFrame-seg.startFrame} layout="none">
    <Video src={staticFile(c.src)} muted loop={c.srcFrames<seg.endFrame-seg.startFrame} style={{position:'absolute',width:c.srcW*K,height:c.srcH*K,left:-c.crop.x*K,top:-c.crop.y*K,maxWidth:'none'}}/>
   </Sequence>
  </div>
  <svg width={w+mat*2+8} height={H+mat*2+8} style={{position:'absolute',left:-mat-4,top:-mat-4,overflow:'visible'}}>
   <g transform="translate(4 4)"><path d={roughRounded(w+mat*2,H+mat*2,r+mat,7+b*11)} fill="none" stroke={V.ink} strokeWidth={4} strokeLinejoin="round"/></g>
  </svg>
  {p.name&&<div style={{position:'absolute',left:-34,top:H-28,padding:'8px 26px 6px',borderRadius:16,background:V.blue,color:'#fff',fontFamily:HAND,fontSize:w*.072,letterSpacing:2,transform:'rotate(-4deg)',boxShadow:'0 6px 14px rgba(1,56,196,.18)'}}>{p.name}</div>}
 </div>;
};
