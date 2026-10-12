import type React from 'react';
import {S01} from './S01';

/** 段 id → 场景组件；新片请替换为自己的场景与分镜。 */
export const scenes: Record<string, React.FC> = {s01: S01};
