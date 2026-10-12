import {timeline} from './timing';

/** 纸蓝 Vox 品牌色。实蓝 blue 每屏只给一个焦点；sticker 是淡蓝不透明贴纸底；mint 呼应芽仔面罩，只用于字幕关键词和少量点缀。 */
export const V={blue:'#0138C4',ink:'#1B1E24',muted:'#6F7682',faint:'#B8BEC8',sticker:'#E2EBFF',tint:'#ECF2FF',mint:'#8FF5D6',red:'#E03A3E',window:'#FFFEFC'};
export const HAND='"Xiaolai", "Excalifont", "PingFang SC", sans-serif';
export const SANS='"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

type Box={x:number;y:number;w:number;h:number};
type Geometry={
 /** 白窗（画布坐标）。 */
 window:Box&{r:number};
 /** 白窗顶栏下沿；内容不要高过它。 */
 headerBottom:number;
 /** 口播窗：x/y 为左上角，w 为宽，高按裁切比例算。 */
 presenter:{x:number;y:number;w:number};
 /** 字幕胶囊顶边与字号。 */
 caption:{top:number;size:number;maxWidth:number};
 /** 图解可用区：有口播窗时 / 口播窗隐藏时。字幕上方为下界。 */
 art:{withPresenter:Box;full:Box};
 /** 背景：frame 图已画好外围渐变和白窗（竖版）；否则用 paper-blue 铺底再画白窗（横版）。 */
 frameImage?:string;
};

/** 横版 h（1920×1080）作为默认横版布局；竖版 v（1080×1440）沿用 frame-v.png 的白窗，首次使用时先出静帧检查。 */
export const FORMATS:Record<'h'|'v',Geometry>={
 h:{
  window:{x:56,y:44,w:1808,h:992,r:44},headerBottom:110,
  presenter:{x:1296,y:168,w:500},
  caption:{top:902,size:46,maxWidth:1500},
  art:{withPresenter:{x:110,y:130,w:1110,h:740},full:{x:110,y:130,w:1700,h:740}},
 },
 v:{
  window:{x:90,y:113,w:901,h:1171,r:40},headerBottom:184,
  presenter:{x:676,y:224,w:270},
  caption:{top:1180,size:44,maxWidth:860},
  art:{withPresenter:{x:130,y:210,w:510,h:940},full:{x:130,y:210,w:820,h:940}},
  frameImage:'brand/frame-v.png',
 },
};
export const G=FORMATS[timeline.format];
