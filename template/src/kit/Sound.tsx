import {Audio} from '@remotion/media';
import {Sequence,interpolate,staticFile} from 'remotion';
import {timeline} from './timing';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const db=(x:number)=>Math.pow(10,x/20);

/** 旁白：TTS 的 narration.wav，或真人底片原声（presenterAudio）。从第 0 帧连续到最后，放在所有 Sequence 外。 */
export const Narration=()=>{
 const {audio,presenter}=timeline;
 if(audio.narration)return <Audio name="旁白" src={staticFile(audio.narration)}/>;
 if(audio.presenterAudio&&presenter)return <Audio name="底片原声" src={staticFile(presenter.clips[presenter.defaultClip].src)}/>;
 return null;
};

/** 配乐：循环铺底，增益 m.db 由 build-timeline 算好；句间空档抬 3dB；开头 0.5 秒淡入，结尾 1.5 秒淡出。 */
export const Music=()=>{
 const m=timeline.audio.music;if(!m)return null;
 const end=timeline.durationInFrames,cs=timeline.captions;
 const volume=(f:number)=>{
  const talking=cs.some(c=>f>=c.startFrame-6&&f<c.endFrame+6);
  const fade=interpolate(f,[0,15,end-45,end-1],[0,1,1,0],clamp);
  return db(m.db+(talking?0:3))*fade;
 };
 return <Audio name="配乐" src={staticFile(m.src)} loop loopVolumeCurveBehavior="extend" volume={volume}/>;
};

export type SfxName='pop'|'whoosh'|'tick'|'ding'|'thud'|'swish';
/** 音效：at 为当前 Sequence 内的帧。电平由 build-timeline 校好（比人声低约 14 LU，压在配乐上面），volume=1 是标准档，次要动作 0.5–0.7。
 * 只给段落的主动作配（盖章、揭示、反转、转场），一段 1–2 个；逐项出现、小弹出、位移都不配，不然抢人声。 */
export const Sfx=({name,at,volume=1}:{name:SfxName;at:number;volume?:number})=>
 <Sequence from={at} durationInFrames={45} layout="none" name={`音效 ${name}`}><Audio src={staticFile(`sfx/${name}.wav`)} volume={volume*db(timeline.audio.sfx?.[name]??-12)}/></Sequence>;
