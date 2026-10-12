import {useCurrentFrame, interpolate} from 'remotion';
import {HAND, V} from '../kit/brand';
import {Yazai} from '../kit/Yazai';

/** 无声入门示例：手工编排时间，不伪称 TTS/真人逐字时间。 */
export const S01 = () => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, 30], [70, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <>
    <Yazai x={440 - shift} y={790} h={470} face="happy" seed={1}/>
    <div style={{position: 'absolute', left: 730, top: 265, width: 940, fontFamily: HAND, color: V.ink}}>
      <div style={{fontSize: 94, lineHeight: 1.25, color: V.blue}}>把想法讲清楚</div>
      <div style={{marginTop: 38, fontSize: 44, lineHeight: 1.6}}>一段话，一个画面<br/>让角色把关系演出来</div>
      <div style={{marginTop: 44, padding: '22px 30px', borderRadius: 20, background: V.sticker, fontSize: 36}}>从这里开始，换成你的 IP</div>
    </div>
  </>;
};
