import {Composition} from 'remotion';
import {Explainer} from './Explainer';
import {timeline} from './kit/timing';

/** 唯一的成片入口。尺寸、帧率、时长都来自 timeline.json（npm run timeline 生成）。 */
export const Root=()=> <Composition id="Explainer" component={Explainer} width={timeline.width} height={timeline.height} fps={timeline.fps} durationInFrames={timeline.durationInFrames}/>;
