import {useCurrentFrame} from 'remotion';
import {G,HAND,V} from './brand';
import {timeline} from './timing';

const HOLD_GAP=9,FADE=3;
/** 句间空档 ≤ 9 帧时保留上一句，更长时 3 帧淡出、3 帧淡入；没有字幕时不显示空条。 */
export const captionState=(frame:number)=>{
 const cs=timeline.captions;
 const i=cs.findIndex((c,k)=>frame>=c.startFrame&&(k===cs.length-1||frame<cs[k+1].startFrame));
 if(i<0)return null;
 const line=cs[i],prev=cs[i-1],next=cs[i+1];
 if(frame<line.endFrame){
  const fadeIn=prev!==undefined&&line.startFrame-prev.endFrame>HOLD_GAP;
  return {text:line.text,opacity:fadeIn?Math.min(1,(frame-line.startFrame+1)/FADE):1};
 }
 if(next&&next.startFrame-line.endFrame<=HOLD_GAP)return {text:line.text,opacity:1};
 const opacity=Math.max(0,1-(frame-line.endFrame+1)/FADE);
 return opacity>0?{text:line.text,opacity}:null;
};

const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const KW=[...timeline.keywords].sort((a,b)=>b.length-a.length);
const SPLIT=KW.length?new RegExp(`(${KW.map(escape).join('|')})`):null;

/** 字幕：深色胶囊 + 手写字，关键词亮芽仔面罩的薄荷色。整片只画一次，放最上层。 */
export const Caption=()=>{
 const line=captionState(useCurrentFrame());
 if(!line)return null;
 const parts=SPLIT?line.text.split(SPLIT):[line.text];
 const {top,size,maxWidth}=G.caption;
 return <div style={{position:'absolute',left:0,right:0,top,display:'flex',justifyContent:'center',opacity:line.opacity}}>
  <div style={{maxWidth,padding:`${size*.26}px ${size*.87}px ${size*.3}px`,borderRadius:size*.48,background:'rgba(16,30,74,.86)',fontFamily:HAND,fontSize:size,lineHeight:1.15,color:'#fff',letterSpacing:1,whiteSpace:'nowrap'}}>
   {parts.map((p,i)=>KW.includes(p)?<span key={i} style={{color:V.mint}}>{p}</span>:<span key={i}>{p}</span>)}
  </div>
 </div>;
};
