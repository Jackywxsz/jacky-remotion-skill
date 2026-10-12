// 保留描摹轮廓的位置与拓扑，去掉亚像素毛边，再用连续二次曲线连接。
// 从 Opus 动画引擎 src/components/clean-path.ts 原样移植（.at 改成下标，兼容 ES2018）。
type Point = [number, number];
const distance = (p: Point, a: Point, b: Point) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy);
};
function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points;
  let far = 0, index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = distance(points[i], points[0], points[points.length - 1]);
    if (d > far) { far = d; index = i; }
  }
  return far > tolerance ? [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)] : [points[0], points[points.length - 1]];
}
const f = (v: number) => v.toFixed(2);
export function cleanPath(path: string) {
  if (/[^MLZ\d\s.,+-]/i.test(path)) throw new Error('cleanPath 只接受描摹 M/L/Z 路径');
  return (path.match(/M[^M]+/gi) ?? []).map(part => {
    const numbers = part.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    const points: Point[] = [];
    for (let i = 0; i < numbers.length; i += 2) points.push([numbers[i], numbers[i + 1]]);
    const half = Math.floor(points.length / 2);
    const p = [...simplify(points.slice(0, half + 1), 1.15).slice(0, -1), ...simplify([...points.slice(half), points[0]], 1.15).slice(0, -1)];
    if (p.length < 3) return part;
    const midpoint = (a: Point, b: Point) => `${f((a[0] + b[0]) / 2)},${f((a[1] + b[1]) / 2)}`;
    return `M${midpoint(p[p.length - 1], p[0])} ` + p.map((a, i) => `Q${f(a[0])},${f(a[1])} ${midpoint(a, p[(i + 1) % p.length])}`).join(' ') + ' Z';
  }).join(' ');
}
