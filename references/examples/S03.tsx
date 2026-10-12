import {AbsoluteFill,Easing,useCurrentFrame} from 'remotion';
import {cueFrame,segment} from '../kit/timing';
import {HAND,V} from '../kit/brand';
import {HandWrite,Stage,TornBlue,lerp,useRamp} from '../kit/ink';
import {Yazai,useFace} from '../kit/Yazai';
import {Machine,Pit} from '../kit/props';
import {GROUND,MS,PIT,Pile,S02_END,TRAP_LABEL,sunk} from './S02';

/** s03 口播（左侧 2/3，右侧是口播窗）。一屏只讲一件事：从左往右读是 芽仔（你）→ 机器（AI 算力）→ 机器吐出的“惊艳产出”卡，
 * 卡和芽仔之间隔着机器，本身就在说“跟你没关系”；
 * “算力”时机器屏幕换字，“表面创造力”时卡上画线，“没有半毛钱”时卡掉到地上、芽仔尴尬。元素只按口播替换，不往上堆。 */
const s03=segment('s03');
// 芽仔从坑里往左跳、机器从右往中间走，两条路径不交叉。
const H=300,X=320,MX=720,MS3=1;
const TITLE={x:120,y1:214,y2:330,size:96};
// 卡片停在机器出口右侧，离标题和口播窗都留空。
// 口播段没有地面：站位整体下移，脚下只留影子。
const BASE=GROUND+28;
const CARD={x:1046,y:BASE-200},LAND={x:1070,y:BASE-66};

export const S03=()=>{
 const f=useCurrentFrame();
 const compute=cueFrame(s03,'算力'),surface=cueFrame(s03,'表面创造力'),cut=cueFrame(s03,'没有半毛钱');
 const wow=18,self=131;

 // 开场收拾 s02：坑合上、纸堆沉下去、机器走到中间，芽仔从坑里往左跳出来。
 const jump=lerp(f,0,12,0,1);
 const jx=S02_END.pitX+(X-S02_END.pitX)*jump,jy=lerp(jump,0,1,GROUND+sunk(S02_END.h),BASE)-Math.sin(Math.PI*jump)*220;
 const h=lerp(jump,0,1,S02_END.h,H);
 const pitOpen=lerp(f,6,12,1,0,Easing.in(Easing.quad));
 const walk=lerp(f,2,20,0,1,Easing.inOut(Easing.cubic));
 const mx=S02_END.machineX+(MX-S02_END.machineX)*walk,mBob=walk>0&&walk<1?-Math.abs(Math.sin(f*.9))*16:0,ms=MS+(MS3-MS)*walk;

 // 芽仔站定不跳；只在“没有半毛钱”惊一下，换尴尬脸并停住到段尾。
 const shock=lerp(f,cut,cut+5,0,-36)+lerp(f,cut+5,cut+11,0,36);
 const y=(f<12?jy:BASE)+shock;
 const {face,since}=useFace([[cut,'awkward',999]],[84]);

 // 惊艳产出卡：wow 时从机器出口吐出来停在右侧；cut 时摔到地上。
 const fly=lerp(f,wow,wow+12,0,1,Easing.out(Easing.quad));
 const from={x:MX+178*MS3,y:BASE-86*MS3};
 const fallT=lerp(f,cut+2,cut+14,0,1,Easing.in(Easing.quad)),bounce=lerp(f,cut+14,cut+18,0,1);
 const held=f<cut+2;
 const cardX=held?from.x+(CARD.x-from.x)*fly:CARD.x+(LAND.x-CARD.x)*fallT;
 const cardY=held?from.y+(CARD.y-from.y)*fly-Math.sin(Math.PI*fly)*120:CARD.y+(LAND.y-CARD.y)*fallT-Math.sin(Math.PI*bounce)*16;
 const cardRot=held?(1-fly)*-30-3*fly:-3+fallT*10;
 const cardS=held?.35+.65*fly:1-.1*fallT;
 const note=useRamp(surface-3,6),underline=useRamp(surface+2,8);

 return <AbsoluteFill style={{fontFamily:HAND,color:V.ink}}>
  <div style={{position:'absolute',left:TITLE.x,top:TITLE.y1,whiteSpace:'nowrap',lineHeight:1}}><HandWrite text="看似惊艳的产出，" at={4} size={TITLE.size}/></div>
  <div style={{position:'absolute',left:TITLE.x,top:TITLE.y2,whiteSpace:'nowrap',lineHeight:1,display:'flex',alignItems:'center'}}>
   <HandWrite text="跟你" at={self-4} size={TITLE.size}/>{f>=cut-3&&<TornBlue text="没关系" at={cut-3} size={TITLE.size} inline/>}
  </div>
  {f<4&&<div style={{position:'absolute',left:TRAP_LABEL.x,top:TRAP_LABEL.y,opacity:lerp(f,0,3,1,0)}}><TornBlue text="效率陷阱" at={-99} size={TRAP_LABEL.size}/></div>}

  <Stage>
   <Pile from={-999} drop={lerp(f,0,8,0,1)}/>
   <Pit cx={S02_END.pitX} cy={GROUND} {...PIT} open={pitOpen} crack={0} part="back"/>
   <ellipse cx={mx} cy={BASE+4} rx={118} ry={12} fill={V.ink} opacity={.08*walk}/>
   <Machine x={mx} y={GROUND+(BASE-GROUND)*walk+mBob} s={ms} shake={f>=wow-6&&f<wow?1:0} busy={f>=wow-6&&f<wow+4} screen={f>=compute?'算力':'AI'} screenAt={compute}/>
  </Stage>

  <div style={{position:'absolute',inset:0,clipPath:f<10?`inset(0 0 ${1080-GROUND}px 0)`:undefined}}>
   <Yazai x={f<12?jx:X} y={y} h={h} face={face} faceSince={since} sprout={Math.sin(f/30*Math.PI*2/1.6)*3}/>
  </div>
  <Stage><Pit cx={S02_END.pitX} cy={GROUND} {...PIT} open={pitOpen} crack={0} part="front"/></Stage>

  {f>=wow&&<div style={{position:'absolute',left:cardX-170,top:cardY-82,width:340,height:164,borderRadius:26,background:V.sticker,boxShadow:'0 10px 22px rgba(1,56,196,.10)',
   transform:`rotate(${cardRot}deg) scale(${cardS})`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
   <div style={{fontSize:60}}>惊艳产出</div>
   <div style={{position:'relative',fontSize:40,color:V.blue,marginTop:6,opacity:note}}>表面创造力
    <svg width={216} height={14} style={{position:'absolute',left:-8,top:46,overflow:'visible'}}><path d="M2 6 Q60 2 120 6 T178 5" fill="none" stroke={V.blue} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1-underline}/></svg>
   </div>
  </div>}
 </AbsoluteFill>;
};
