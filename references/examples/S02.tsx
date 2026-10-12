import {AbsoluteFill,Easing,useCurrentFrame} from 'remotion';
import {cueFrame,segment} from '../kit/timing';
import {V} from '../kit/brand';
import {Stage,TornBlue,lerp,rand} from '../kit/ink';
import {Yazai,useFace,useHop} from '../kit/Yazai';
import {Bubble,Burst,Machine,PaperBall,Pit,Scenery,Sheet,Wand} from '../kit/props';

/** s02 芽仔场景：挥魔杖（神力）→ 把模糊指令揉成团扔进 AI 机器 → 机器秒出一摞文章 → 地面裂开，掉进效率陷阱。 */
export const s02=segment('s02');
export const GROUND=800;
// 跨段共用的站位：s03 从这里接着演。
export const S02_END={yazaiX:560,machineX:1300,pitX:560,h:420};
export const MS=1.35,PIT={rx:260,ry:48};
/** “效率陷阱”立在坑正上方（掉坑后那里是空的），不压底部字幕。 */
export const TRAP_LABEL={x:S02_END.pitX-165,y:GROUND-210,size:72};
const H=S02_END.h,q=H/300;
/** 掉进坑里只剩嫩芽露出时，靴底比地面低多少。 */
export const sunk=(h:number)=>h*.869+10;

/** 秒出的纸堆：from 起每 3 帧飞出一张，8 帧落到堆上。drop 让整堆下沉淡出（s03 开场收场用）。 */
export const Pile=({from,drop=0}:{from:number;drop?:number})=>{
 const f=useCurrentFrame();
 return <g opacity={1-drop} transform={`translate(0 ${drop*60})`}>{Array.from({length:13},(_,i)=>{
  const at=from+i*3,t=lerp(f,at,at+8,0,1,Easing.out(Easing.quad));
  if(f<at)return null;
  const sx=S02_END.machineX+178*MS,sy=GROUND-86*MS,px=1690+(rand(i*3.3)-.5)*16,py=GROUND-75-i*17;
  return <Sheet key={i} x={sx+(px-sx)*t} y={sy+(py-sy)*t-Math.sin(Math.PI*t)*90} rot={(rand(i*5.1)-.5)*16+(1-t)*40} label={i%2?'方案':'文章'} seed={i*7} scale={1.25}/>;
 })}</g>;
};

export const S02=()=>{
 const f=useCurrentFrame();
 const power=cueFrame(s02,'神力'),vague=cueFrame(s02,'模糊的指令'),instant=cueFrame(s02,'秒出'),trap=cueFrame(s02,'效率陷阱');
 const honest=158,crackAt=176,openAt=188,fallAt=194;
 const X=S02_END.yazaiX;

 // 芽仔：神力时浮起，秒出时跳两下，掉坑时下沉到只剩嫩芽。
 const float=lerp(f,power,power+10,0,-60,Easing.out(Easing.quad))+lerp(f,power+26,power+34,0,60,Easing.in(Easing.quad));
 // 只在“秒出”时兴奋地跳两下，其余时间站定，不做待机小跳。
 const fast=useHop(instant+2,14,8,22);
 const hopDy=f>=instant&&f<instant+30?fast.dy:0;
 const fall=lerp(f,fallAt,fallAt+12,0,sunk(H),Easing.in(Easing.quad));
 const y=GROUND+(f>=crackAt?0:hopDy)+float+fall;
 // 表情只出两次：“神力”得意，地面裂开时惊讶；其余保持普通脸。
 const {face,since}=useFace([[power,'star',28],[crackAt+2,'surprise',40]],[70]);

 // 机器 48 帧从上方落下，58 帧落地。纸团 76 起揉、82 扔、98 进槽。
 const mY=GROUND+lerp(f,48,58,-900,0,Easing.in(Easing.quad));
 const thump=lerp(f,58,64,1,0);
 const busy=f>=98&&f<instant+40;
 const shake=f>=98&&f<104?1:busy?.35:thump*.8;
 const noteP=lerp(f,vague-6,vague,0,1,Easing.out(Easing.back(2))),crumple=lerp(f,76,82,0,1);
 const throwT=lerp(f,82,98,0,1);
 const hand={x:X+78*q,y:y-81*q};
 const bx=lerp(throwT,0,1,hand.x+90,S02_END.machineX),by=lerp(throwT,0,1,hand.y-190,GROUND-302*MS)-Math.sin(Math.PI*throwT)*200;

 const sheets=<Pile from={instant}/>;

 const crack=lerp(f,crackAt,crackAt+10,0,1),open=lerp(f,openAt,openAt+8,0,1,Easing.out(Easing.back(1.6)));
 const wand=lerp(f,power-8,power-2,0,1,Easing.out(Easing.back(2)))*lerp(f,power+30,power+36,1,0);

 return <AbsoluteFill>
  <Scenery ground={GROUND}/>
  <Stage>
   <Pit cx={X} cy={GROUND} {...PIT} open={open} crack={crack} part="back"/>
   {f>=power&&<ellipse cx={X} cy={GROUND+4} rx={190} ry={26} fill="none" stroke={V.blue} strokeWidth={4} strokeDasharray="10 14" strokeDashoffset={-f*2} opacity={lerp(f,power,power+6,0,1)*lerp(f,power+28,power+34,1,0)}/>}
   {f>=48&&<Machine x={S02_END.machineX} y={mY} s={MS} shake={shake} busy={busy}/>}
   {f>=58&&f<70&&[[-1],[1]].map(([d],i)=><path key={i} d={`M${S02_END.machineX+d*190} ${GROUND-6} l${d*44} -16 M${S02_END.machineX+d*200} ${GROUND-30} l${d*36} -26`} stroke={V.ink} strokeWidth={3} strokeLinecap="round" opacity={thump}/>)}
   {sheets}
   <Burst x={hand.x+70} y={hand.y-190+float} at={power} n={9} r0={70} r1={210} seed={3}/>
   <Burst x={1690} y={GROUND-260} at={instant+30} n={6} r0={60} r1={150} seed={11}/>
   <Wand x={hand.x} y={hand.y+float} p={wand} rot={28} s={1.5}/>
   {throwT>0&&throwT<1&&<PaperBall x={bx} y={by} r={40} rot={f*14}/>}
   {crumple>0&&throwT<=0&&<PaperBall x={hand.x+90} y={hand.y-190} r={40*crumple+8} rot={f*6}/>}
  </Stage>
  {noteP>0&&crumple<1&&<div style={{position:'absolute',left:hand.x+10,top:hand.y-300,width:340,padding:'16px 22px',whiteSpace:'nowrap',background:'#fff',border:`3px solid ${V.ink}`,borderRadius:10,transform:`scale(${noteP*(1-crumple)}) rotate(${-4+crumple*30}deg)`,transformOrigin:'130px 100px',fontFamily:'"Xiaolai", sans-serif',fontSize:42,color:V.ink,filter:'blur(1.4px)',lineHeight:1.2}}>帮我写个爆款<br/><span style={{color:V.muted,fontSize:32}}>随便…都行…</span></div>}

  <div style={{position:'absolute',inset:0,clipPath:f>=fallAt?`inset(0 0 ${1080-GROUND}px 0)`:undefined}}>
   <Yazai x={X} y={y} h={H} face={face} faceSince={since} headRot={f>=honest&&f<crackAt?-4:0} sprout={Math.sin(f/30*Math.PI*2/1.6)*3} shadow={f>=openAt?0:1-Math.max(0,-hopDy-float)/110}/>
  </div>
  <Stage><Pit cx={X} cy={GROUND} {...PIT} open={open} crack={crack} part="front"/></Stage>
  <Bubble x={X+130} y={GROUND-H-120} p={lerp(f,honest,honest+5,0,1,Easing.out(Easing.back(2)))*lerp(f,crackAt-2,crackAt+2,1,0)} text="…"/>
  {f>=trap-3&&<div style={{position:'absolute',left:TRAP_LABEL.x,top:TRAP_LABEL.y}}><TornBlue text="效率陷阱" at={trap-3} size={TRAP_LABEL.size}/></div>}
 </AbsoluteFill>;
};
