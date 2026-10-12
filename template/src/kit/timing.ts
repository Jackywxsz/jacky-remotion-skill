import data from '../data/timeline.json';

/** timeline.json 由 scripts/build-timeline.mjs 从 ../plan.json 和逐字时间生成，不手改。帧区间左闭右开。 */
export type Cue={say:string;action:string;frame:number;localFrame:number};
export type Segment={id:string;type:'aroll'|'broll'|'screen';presenter:'window'|'hidden';clip:string|null;presenterDelay:number;tag:string;narration:string;intent:string;startFrame:number;endFrame:number;cues:Cue[];assets:string[]};
export type PresenterClip={src:string;srcFrames:number;srcW:number;srcH:number;crop:{x:number;y:number;w:number;h:number}};
export type Timeline={
 format:'h'|'v';width:number;height:number;fps:number;durationInFrames:number;
 column:string;keywords:string[];glyphs:string;
 audio:{narration:string|null;music:{src:string;db:number}|null;presenterAudio:boolean;sfx?:Record<string,number>};
 presenter:{clips:Record<string,PresenterClip>;defaultClip:string;name:string}|null;
 segments:Segment[];
 captions:{text:string;startFrame:number;endFrame:number}[];
 /** 逐字开口帧（绝对帧），给需要逐字同步的动画用。 */
 chars:{c:string;f:number}[];
};
export const timeline=data as unknown as Timeline;

export const segment=(id:string)=>{
 const s=timeline.segments.find(x=>x.id===id);
 if(!s)throw new Error(`plan 里没有段 ${id}`);
 return s;
};
/** 段内帧：口播说出 say 的那一帧（相对段起点）。say 必须是 plan 里登记过的 cue。 */
export const cueFrame=(s:Segment,say:string)=>{
 const c=s.cues.find(x=>x.say===say);
 if(!c)throw new Error(`段 ${s.id} 没有登记 cue「${say}」，先写进 plan.json 再重跑 npm run timeline`);
 return c.localFrame;
};
