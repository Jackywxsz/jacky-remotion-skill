import React from 'react';
import {continueRender,delayRender,interpolate,spring,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {HAND,V} from './brand';
import {timeline} from './timing';

/** 手绘基础件：抖动墨线、弹出、撕纸蓝、贴纸、手写字。坐标都是画布绝对像素。 */
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

// 字体：fonts.css 按 unicode-range 分片；timeline.glyphs 收录了口播和 src/ 里出现的全部字，加载完才放行渲染。
if(typeof document!=='undefined'&&!document.getElementById('vox-fonts')){
 const link=document.createElement('link');link.id='vox-fonts';link.rel='stylesheet';link.href=staticFile('fonts/fonts.css');
 const handle=delayRender('加载手写字体');
 const text=timeline.glyphs+'0123456789%…·Jacky';
 link.onload=()=>Promise.all([document.fonts.load(`80px "Xiaolai"`,text),document.fonts.load(`80px "Excalifont"`,'AIJacky·0123456789%')]).then(()=>continueRender(handle)).catch(()=>continueRender(handle));
 document.head.appendChild(link);
}

/** 确定性伪随机。 */
export const rand=(seed:number)=>{const x=Math.sin(seed*127.1+311.7)*43758.5453;return x-Math.floor(x);};
/** 抖动循环：每 3 帧换一组，三组轮换，像逐帧手绘重描。 */
export const useBoil=()=>Math.floor(useCurrentFrame()/3)%3;
export const lerp=(f:number,a:number,b:number,from:number,to:number,easing?:(t:number)=>number)=>interpolate(f,[a,b],[from,to],{...clamp,easing});

/** 把折线点加轻微手抖，并用二次曲线串起来。 */
export const roughPath=(pts:[number,number][],seed:number,amp=1.4,closed=false)=>{
 const p=pts.map(([x,y],i)=>[x+(rand(seed+i*2.3)-.5)*2*amp,y+(rand(seed+i*5.7)-.5)*2*amp] as [number,number]);
 const all=closed?[...p,p[0],p[1]]:p;
 const start=closed?[(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2]:all[0]; // 闭合路径从首段中点起笔，避免角上留线头
 let d=`M${start[0].toFixed(1)} ${start[1].toFixed(1)}`;
 for(let i=1;i<all.length-1;i++){const [x,y]=all[i],[nx,ny]=all[i+1];d+=` Q${x.toFixed(1)} ${y.toFixed(1)} ${((x+nx)/2).toFixed(1)} ${((y+ny)/2).toFixed(1)}`;}
 const last=all[all.length-1];return closed?d+' Z':d+` L${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
};
const seg=(a:[number,number],b:[number,number],n:number)=>Array.from({length:n},(_,i)=>[a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n] as [number,number]);
/** 不完全规整的手绘矩形轮廓（原点在左上角）。 */
export const roughRect=(w:number,h:number,seed:number,amp=1.6)=>{
 const c:[number,number][]=[[0,0],[w,0],[w,h],[0,h]];
 return roughPath([...seg(c[0],c[1],6),...seg(c[1],c[2],6),...seg(c[2],c[3],6),...seg(c[3],c[0],6)],seed,amp,true);
};
/** 手绘圆角矩形（口播窗描边等）。 */
export const roughRounded=(w:number,h:number,r:number,seed:number,amp=1.4)=>{
 const pts:[number,number][]=[];
 const arc=(cx:number,cy:number,a0:number)=>{for(let i=0;i<=4;i++){const a=a0+i/4*Math.PI/2;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}};
 arc(w-r,r,-Math.PI/2);arc(w-r,h-r,0);arc(r,h-r,Math.PI/2);arc(r,r,Math.PI);
 return roughPath(pts,seed,amp,true);
};

/** 带过冲的弹出进度，at 之前为 0。 */
export const usePop=(at:number,stiff=170)=>{const frame=useCurrentFrame();const {fps}=useVideoConfig();return frame<at?0:spring({frame:frame-at,fps,config:{damping:11,stiffness:stiff,mass:.8}});};
export const useRamp=(at:number,dur:number)=>interpolate(useCurrentFrame(),[at,at+dur],[0,1],clamp);
/** 慢漂浮，让静止元素不死板。幅度保持 2–3px，大了会晃眼。 */
export const useFloat=(phase:number,amp=3)=>Math.sin((useCurrentFrame()+phase*23)/30*Math.PI*2/2.8)*amp;

/** 全画布 SVG 层：墨线、道具都画在这里。 */
export const Stage:React.FC<React.PropsWithChildren<{style?:React.CSSProperties}>>=({children,style})=>{
 const {width,height}=useVideoConfig();
 return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position:'absolute',left:0,top:0,overflow:'visible',...style}}>{children}</svg>;
};

/** 手绘描线：at 起按 dur 描出；head 画箭头；dash 画虚线。放在 <Stage> 里。 */
export const InkLine:React.FC<{pts:[number,number][];at:number;dur?:number;color?:string;width?:number;seed?:number;dash?:boolean;head?:boolean;amp?:number}>=({pts,at,dur=10,color=V.ink,width=6,seed=1,dash,head,amp=1.6})=>{
 const p=useRamp(at,dur);const b=useBoil();if(p<=0)return null;
 const d=roughPath(pts,seed+b*17,amp);
 const [x1,y1]=pts[pts.length-2],[x2,y2]=pts[pts.length-1];const a=Math.atan2(y2-y1,x2-x1),k=26;
 return <g fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
  {dash?<path d={d} strokeDasharray="3 16" style={{clipPath:`inset(0 ${(1-p)*100}% 0 0)`}}/>:<path d={d} pathLength={1} strokeDasharray="1" strokeDashoffset={1-p}/>}
  {head&&p>=1&&<path d={roughPath([[x2-k*Math.cos(a-.5),y2-k*Math.sin(a-.5)],[x2,y2],[x2-k*Math.cos(a+.5),y2-k*Math.sin(a+.5)]],seed+b*5,1)}/>}
 </g>;
};
/** 手绘圈注。放在 <Stage> 里。 */
export const InkCircle:React.FC<{cx:number;cy:number;rx:number;ry:number;at:number;color?:string;seed?:number;width?:number}>=({cx,cy,rx,ry,at,color=V.blue,seed=9,width=5})=>{
 const n=22;const pts=Array.from({length:n+3},(_,i)=>{const a=-Math.PI*.7+i/n*Math.PI*2.08;const k=1+(rand(seed+i)-.5)*.08;return [cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k] as [number,number];});
 return <InkLine pts={pts} at={at} dur={9} color={color} width={width} seed={seed} amp={.8}/>;
};

/** 撕纸边缘多边形。 */
export const tornPolygon=(w:number,h:number,seed:number,jag=6)=>{
 const pts:string[]=[];const step=14;
 for(let x=0;x<=w;x+=step)pts.push(`${x},${(rand(seed+x)*jag).toFixed(1)}`);
 for(let y=step;y<=h;y+=step*1.5)pts.push(`${w-rand(seed+y*3)*jag*.7},${y}`);
 for(let x=w;x>=0;x-=step)pts.push(`${x},${(h-rand(seed+x*7)*jag).toFixed(1)}`);
 for(let y=h;y>=0;y-=step*1.5)pts.push(`${rand(seed+y*9)*jag*.7},${y}`);
 return pts.join(' ');
};
/** 撕纸蓝块：品牌签名，一屏只用一处。at 时从左往右撕开，字随后弹入；inline 用于标题行内。 */
export const TornBlue:React.FC<{text:string;at:number;size?:number;rot?:number;inline?:boolean}>=({text,at,size=76,rot=-2,inline})=>{
 const reveal=useRamp(at,7);const pop=usePop(at+3,220);const frame=useCurrentFrame();
 const w=Math.round(size*[...text].length*1.02+size*.5),h=Math.round(size*1.42),seed=text.length*31;
 const shown=frame>=at;
 return <span style={{position:inline?'relative':'absolute',display:'inline-block',width:w,height:h,verticalAlign:'middle',margin:inline?`0 0 0 ${size*.02}px`:0,transform:`rotate(${shown?rot:0}deg)`}}>
  {shown&&<svg width={w+16} height={h+16} viewBox={`-8 -8 ${w+16} ${h+16}`} style={{position:'absolute',left:-8,top:-8,clipPath:`inset(0 ${(1-reveal)*100}% 0 0)`}}>
   <polygon points={tornPolygon(w,h,seed+5,9)} fill="#FFFFFF" transform="translate(-3 -3) scale(1.01)"/>
   <polygon points={tornPolygon(w,h,seed,6)} fill={V.blue}/>
  </svg>}
  <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:HAND,fontSize:size,color:shown?'#fff':V.ink,lineHeight:1,transform:`scale(${shown?.6+.4*pop:1})`}}>{text}</span>
 </span>;
};

/** 逐字写出：每个字从左往右擦出，不位移不弹跳。标题、正文默认用它。 */
export const HandWrite:React.FC<{text:string;at:number;size:number;per?:number;color?:string}>=({text,at,size,per=2,color=V.ink})=>{
 const frame=useCurrentFrame();
 return <>{[...text].map((ch,i)=>{const t=interpolate(frame,[at+i*per,at+i*per+4],[0,1],clamp);
  return <span key={i} style={{display:'inline-block',fontSize:size,color,clipPath:`inset(-10% ${(1-t)*100}% -10% -10%)`,transform:`translateY(${(rand(i*3.1+text.length)-.5)*5}px) rotate(${(rand(i*7.7)-.5)*3}deg)`}}>{ch}</span>;})}</>;
};
/** 逐字落下：比 HandWrite 更活泼，用在短促的情绪词上。 */
export const HandDrop:React.FC<{text:string;at:number;size?:number;color?:string;per?:number}>=({text,at,size=76,color=V.ink,per=1.5})=>{
 const frame=useCurrentFrame();
 return <>{[...text].map((ch,i)=>{const t=interpolate(frame,[at+i*per,at+i*per+6],[0,1],clamp);
  return <span key={i} style={{display:'inline-block',opacity:t,color,fontSize:size,transform:`translateY(${(1-t)*-18+(rand(i*3.1+text.length)-.5)*5}px) rotate(${(rand(i*7.7)-.5)*4}deg)`}}>{ch}</span>;})}</>;
};

/** 栏目贴纸：淡蓝小签，放在白窗左上，告诉观众“这段在讲什么”。 */
/** 小赖体没有 ①–⑨ ✓ ✗ →：HandText 把它们换成手画的圈号、勾、叉、箭头，其余字照常。只用于 HTML 文字；SVG 里自己画。 */
const CIRCLED='①②③④⑤⑥⑦⑧⑨';
const MARKS:Record<string,string>={'✓':'M3 13 L9 19 L21 5','✗':'M5 5 L19 19 M19 5 L5 19','→':'M2 12 L20 12 M14 6 L20 12 L14 18'};
export const HandText:React.FC<{text:string}>=({text})=><>{[...text].map((ch,i)=>{
 const n=CIRCLED.indexOf(ch);
 if(n>=0)return <span key={i} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'1.05em',height:'1.05em',border:'.07em solid currentColor',borderRadius:'50%',verticalAlign:'-.12em',margin:'0 .06em',lineHeight:1}}><span style={{fontSize:'.7em'}}>{n+1}</span></span>;
 if(MARKS[ch])return <svg key={i} viewBox="0 0 24 24" style={{width:'.9em',height:'.9em',verticalAlign:'-.08em',margin:'0 .06em'}} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d={MARKS[ch]}/></svg>;
 return <React.Fragment key={i}>{ch}</React.Fragment>;
})}</>;

export const TagSticker:React.FC<{text:string;x:number;y:number;at?:number;size?:number}>=({text,x,y,at=0,size=40})=>{
 const p=usePop(at,240);
 return <div style={{position:'absolute',left:x,top:y,padding:`${size*.22}px ${size*.78}px ${size*.18}px`,borderRadius:size*.43,background:V.sticker,fontFamily:HAND,fontSize:size,color:V.blue,letterSpacing:4,whiteSpace:'nowrap',transform:`rotate(-2deg) scale(${p})`,transformOrigin:'left center'}}><HandText text={text}/></div>;
};

/** 淡蓝不透明贴纸卡：平涂、无墨框，只留很轻的落地影；拍上去时略过冲再回正。exitAt 起 8 帧淡出。 */
export const Sticker:React.FC<React.PropsWithChildren<{x:number;y:number;w:number;h:number;at:number;rot?:number;phase?:number;exitAt?:number;fill?:string;style?:React.CSSProperties}>>=({x,y,w,h,at,rot=0,phase=0,exitAt,fill=V.sticker,style,children})=>{
 const p=usePop(at,200);const exit=useRamp(exitAt??1e9,8);const float=useFloat(phase,2);
 if(p<=0.001||exit>=1)return null;
 return <div style={{position:'absolute',left:x,top:y,width:w,height:h,borderRadius:26,background:fill,boxShadow:'0 10px 22px rgba(1,56,196,.08), 0 2px 4px rgba(1,56,196,.06)',
  transform:`translateY(${(1-Math.min(1,p))*28+float}px) rotate(${rot*(2-Math.min(1,p))}deg) scale(${(.6+.4*p)*(1-exit*.1)})`,opacity:Math.min(1,p*3)*(1-exit),
  display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',fontFamily:HAND,color:V.ink,...style}}>{children}</div>;
};

/** 荧光笔：在文字后面从左往右刷一道。包住行内文字使用。 */
export const Highlight:React.FC<React.PropsWithChildren<{at:number;color?:string;dur?:number}>>=({at,color=V.mint,dur=8,children})=>{
 const p=useRamp(at,dur);
 return <span style={{position:'relative',display:'inline-block'}}>
  <span style={{position:'absolute',left:'-4%',right:'-4%',bottom:'6%',height:'42%',background:color,borderRadius:8,transform:`scaleX(${p}) rotate(-1deg)`,transformOrigin:'left center',opacity:.85}}/>
  <span style={{position:'relative'}}>{children}</span>
 </span>;
};

/** 盖章：从大到小砸下来并带一下震动，用在结论、判定（✓ / ✗ / 关键词）。 */
export const Stamp:React.FC<{text:string;x:number;y:number;at:number;size?:number;color?:string;rot?:number}>=({text,x,y,at,size=64,color=V.red,rot=-10})=>{
 const frame=useCurrentFrame();const t=frame-at;if(t<0)return null;
 const s=interpolate(t,[0,5,8],[1.9,.94,1],clamp),o=interpolate(t,[0,3],[0,1],clamp);
 return <div style={{position:'absolute',left:x,top:y,transform:`translate(-50%,-50%) rotate(${rot}deg) scale(${s})`,opacity:o,padding:`${size*.12}px ${size*.4}px`,border:`${size*.08}px solid ${color}`,borderRadius:size*.22,color,fontFamily:HAND,fontSize:size,lineHeight:1.1,whiteSpace:'nowrap',background:'rgba(255,255,255,.7)'}}>{text}</div>;
};

/** 数字滚动：from→to，at 起 dur 帧，结束时弹一下。 */
export const CountUp:React.FC<{from?:number;to:number;at:number;dur?:number;decimals?:number;suffix?:string;size?:number;color?:string}>=({from=0,to,at,dur=20,decimals=0,suffix='',size=120,color=V.blue})=>{
 const frame=useCurrentFrame();const t=interpolate(frame,[at,at+dur],[0,1],{...clamp,easing:x=>1-Math.pow(1-x,3)});
 const pop=frame>=at+dur?1+.12*Math.sin(Math.PI*interpolate(frame,[at+dur,at+dur+6],[0,1],clamp)):1;
 return <span style={{display:'inline-block',fontFamily:HAND,fontSize:size,color,transform:`scale(${pop})`,fontVariantNumeric:'tabular-nums'}}>{(from+(to-from)*t).toFixed(decimals)}{suffix}</span>;
};

/** 镜头：给图解层做推近 / 平移。keys 是 [帧, 中心x, 中心y, 缩放]，相邻关键帧之间缓动。一段里推一两次就够，多了晕。 */
export const Camera:React.FC<React.PropsWithChildren<{keys:[number,number,number,number][]}>>=({keys,children})=>{
 const frame=useCurrentFrame();const {width,height}=useVideoConfig();
 const fs=keys.map(k=>k[0]);const ease=(x:number)=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
 const pick=(i:number)=>keys.length===1?keys[0][i]:interpolate(frame,fs,keys.map(k=>k[i]),{...clamp,easing:ease});
 const cx=pick(1),cy=pick(2),s=pick(3);
 return <div style={{position:'absolute',inset:0,transform:`translate(${width/2-cx*s}px,${height/2-cy*s}px) scale(${s})`,transformOrigin:'0 0'}}>{children}</div>;
};
