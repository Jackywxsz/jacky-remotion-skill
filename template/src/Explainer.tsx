import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {G,HAND,V} from './kit/brand';
import {BrandFrame} from './kit/Frame';
import {Caption} from './kit/Caption';
import {Presenter} from './kit/Presenter';
import {Music,Narration,Sfx} from './kit/Sound';
import {TagSticker,lerp,rand} from './kit/ink';
import {timeline,type Segment} from './kit/timing';
import {scenes} from './scenes';

/** 还没写的段：把分镜意图摆出来，提醒这段待做，渲染不会因此中断。 */
const Todo=({s}:{s:Segment})=>{
 const a=s.presenter==='window'?G.art.withPresenter:G.art.full;
 return <div style={{position:'absolute',left:a.x,top:a.y,width:a.w,height:a.h,border:`4px dashed ${V.faint}`,borderRadius:28,padding:48,fontFamily:HAND,color:V.muted,fontSize:40,lineHeight:1.5}}>
  <div style={{color:V.blue,fontSize:56}}>{s.id} 待做</div><div>{s.intent}</div>
 </div>;
};

/** 段落切换时的淡蓝撕纸带从左扫到右，盖住换场那一刻：类型变化（口播图解 ↔ 芽仔演示）才用，同类相接直接切。 */
const Wipe=({at}:{at:number})=>{
 const f=useCurrentFrame();const w=G.window;
 const t=lerp(f,at-8,at+8,0,1);if(t<=0||t>=1)return null;
 const band=w.w*.9,x=w.x-band+t*(w.w+band);
 const edge=(side:number)=>Array.from({length:Math.ceil(w.h/24)+1},(_,i)=>`${side+(rand(at+i*3.7+side)-.5)*36},${Math.min(w.h,i*24)}`);
 const pts=[...edge(0),...edge(band).reverse()].join(' ');
 return <svg width={band} height={w.h} viewBox={`-20 0 ${band+40} ${w.h}`} style={{position:'absolute',left:x,top:w.y,overflow:'visible'}}><polygon points={pts} fill={V.sticker}/></svg>;
};

export const Explainer=()=>{
 const w=G.window;const {width,height}=useVideoConfig();
 const changes=timeline.segments.slice(1).filter((s,i)=>s.type!==timeline.segments[i].type).map(s=>s.startFrame);
 return <AbsoluteFill style={{background:'#DCE6F5'}}>
  <Narration/>
  <Music/>
  <BrandFrame/>
  <div style={{position:'absolute',left:w.x,top:G.headerBottom,width:w.w,height:w.y+w.h-G.headerBottom,overflow:'hidden',borderRadius:`0 0 ${w.r}px ${w.r}px`}}>
   <div style={{position:'absolute',left:-w.x,top:-G.headerBottom,width,height}}>
    {timeline.segments.map((s,i)=>{
     const Scene=scenes[s.id] as React.FC|undefined;
     return <Sequence key={s.id} name={`${s.id} ${s.type}`} from={s.startFrame} durationInFrames={s.endFrame-s.startFrame} premountFor={30}>
      <AbsoluteFill>
       {s.tag&&<TagSticker text={s.tag} x={w.x+64} y={G.headerBottom+26} at={timeline.segments[i-1]?.tag===s.tag?-99:0}/>}
       {Scene?<Scene/>:<Todo s={s}/>}
      </AbsoluteFill>
     </Sequence>;
    })}
    {changes.map(at=><React.Fragment key={at}><Wipe at={at}/><Sfx name="whoosh" at={at-8} volume={.6}/></React.Fragment>)}
   </div>
  </div>
  <Presenter/>
  <Caption/>
 </AbsoluteFill>;
};
