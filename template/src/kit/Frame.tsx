import {AbsoluteFill,Img,staticFile,useVideoConfig} from 'remotion';
import {G,SANS,V} from './brand';
import {timeline} from './timing';

/** 品牌底：外围暖纸渐变蓝 + 白内框（带淡淡纸纹和阴影）+ 窗口红黄绿 + 右上栏目名。白窗要白，方便演示。 */
export const BrandFrame=()=>{
 const {width,height}=useVideoConfig();const w=G.window;
 return <AbsoluteFill>
  {G.frameImage?<Img src={staticFile(G.frameImage)} style={{position:'absolute',width,height}}/>:<>
   <Img src={staticFile('brand/paper-blue.png')} style={{position:'absolute',width,height,objectFit:'cover'}}/>
   <div style={{position:'absolute',left:w.x,top:w.y,width:w.w,height:w.h,borderRadius:w.r,background:'#FAF8F3',boxShadow:'0 14px 38px rgba(37,58,88,.14)',overflow:'hidden'}}>
    <PaperGrain w={w.w} h={w.h}/>
   </div>
   <div style={{position:'absolute',left:w.x+40,top:w.y+26,display:'flex',gap:16}}>{['#FF615D','#FFC22C','#2DCB51'].map(c=><div key={c} style={{width:22,height:22,borderRadius:'50%',background:c}}/>)}</div>
   <div style={{position:'absolute',left:w.x,top:G.headerBottom,width:w.w,height:1.5,background:'#DCE2EC'}}/>
  </>}
  {timeline.column&&<div style={{position:'absolute',right:width-(w.x+w.w)+44,top:G.headerBottom-46,fontFamily:SANS,fontSize:G.caption.size*.48,letterSpacing:2,color:'#6D7480'}}>{timeline.column}</div>}
 </AbsoluteFill>;
};

/** 很淡的纸纹：分形噪声压到几乎看不见，只让白窗不像纯色块。 */
const PaperGrain=({w,h}:{w:number;h:number})=> <svg width={w} height={h} style={{position:'absolute',inset:0}}>
 <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves={3} seed={7}/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .42  0 0 0 0 .36  0 0 0 .22 0"/></filter>
 <rect width={w} height={h} filter="url(#grain)" opacity={.55}/>
 <rect width={w} height={h} fill={V.window} opacity={.35}/>
</svg>;
