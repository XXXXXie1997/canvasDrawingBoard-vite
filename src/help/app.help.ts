import type { IAnyObject } from "@/interface/IAnyObject";

// 绘制圆点
const drawCircle = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) => {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.closePath();
};
// 绘制线条
const drawLine = (
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
};
// 使用铅笔
const draw = (
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  drawCircle(context, x1, y1, context ? context.lineWidth / 2 : 1);
  drawLine(context, x1, y1, x2, y2);
};

export const tools: IAnyObject = {
  pencil: draw,
  eraser: draw,
};
