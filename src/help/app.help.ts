import type { IAnyObject } from "@/interface/IAnyObject";

// hex颜色转rgba数组
const hexToRgba = (hex: string): [number, number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, 255];
};

// 颜色匹配（使用容差）
const colorMatch = (
  c1: number[],
  c2: number[],
  tolerance: number
): boolean => {
  return (
    Math.abs(c1[0] - c2[0]) <= tolerance &&
    Math.abs(c1[1] - c2[1]) <= tolerance &&
    Math.abs(c1[2] - c2[2]) <= tolerance
  );
};

// 扫描线填充算法
const floodFill = (
  imageData: ImageData,
  startX: number,
  startY: number,
  fillColor: [number, number, number, number],
  tolerance: number
): void => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // 边界检查
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

  const startIdx = (startY * width + startX) * 4;
  const startColor = [
    data[startIdx],
    data[startIdx + 1],
    data[startIdx + 2],
    data[startIdx + 3],
  ];

  // 如果点击的颜色和填充颜色相同，跳过
  if (colorMatch(startColor, fillColor, tolerance)) return;

  const visited = new Set<string>();
  const stack: [number, number][] = [[startX, startY]];

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const key = `${x},${y}`;
    if (visited.has(key)) continue;

    const idx = (y * width + x) * 4;
    const currentColor = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];

    if (!colorMatch(currentColor, startColor, tolerance)) continue;

    visited.add(key);
    data[idx] = fillColor[0];
    data[idx + 1] = fillColor[1];
    data[idx + 2] = fillColor[2];
    data[idx + 3] = fillColor[3];

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
};

// 填充工具入口函数
const fill = (
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  tolerance: number
): void => {
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const fillColor = hexToRgba(color);
  floodFill(imageData, Math.floor(x), Math.floor(y), fillColor, tolerance);
  context.putImageData(imageData, 0, 0);
};

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

// 绘制矩形
const drawRectangle = (
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fillMode: string = "fill"
) => {
  context.beginPath();
  if (fillMode === "fill") {
    context.fillRect(x1, y1, x2 - x1, y2 - y1);
  } else {
    context.strokeRect(x1, y1, x2 - x1, y2 - y1);
  }
  context.closePath();
};

// 绘制圆形（以起点为圆心，拖动距离为半径）
const drawCircleShape = (
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fillMode: string = "fill"
) => {
  const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  context.beginPath();
  context.arc(x1, y1, radius, 0, Math.PI * 2);
  if (fillMode === "fill") {
    context.fill();
  } else {
    context.stroke();
  }
  context.closePath();
};

// 绘制椭圆（以起点为中心，宽高由拖动距离决定）
const drawEllipse = (
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fillMode: string = "fill"
) => {
  const radiusX = Math.abs(x2 - x1);
  const radiusY = Math.abs(y2 - y1);
  context.beginPath();
  context.ellipse(x1, y1, radiusX, radiusY, 0, 0, Math.PI * 2);
  if (fillMode === "fill") {
    context.fill();
  } else {
    context.stroke();
  }
  context.closePath();
};

// 绘制等边三角形（以拖动框为中心区域）
const drawTriangle = (
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fillMode: string = "fill"
) => {
  const centerX = (x1 + x2) / 2;
  const topY = Math.min(y1, y2);
  const bottomY = Math.max(y1, y2);
  const leftX = Math.min(x1, x2);
  const rightX = Math.max(x1, x2);
  
  // 等边三角形三个顶点：顶点在上边中点，左下和右下在底部
  context.beginPath();
  context.moveTo(centerX, topY);
  context.lineTo(leftX, bottomY);
  context.lineTo(rightX, bottomY);
  context.closePath();
  
  if (fillMode === "fill") {
    context.fill();
  } else {
    context.stroke();
  }
};

// 绘制菱形（以拖动框为中心，四个顶点）
const drawDiamond = (
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fillMode: string = "fill"
) => {
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;
  const leftX = Math.min(x1, x2);
  const rightX = Math.max(x1, x2);
  const topY = Math.min(y1, y2);
  const bottomY = Math.max(y1, y2);
  
  // 菱形四个顶点：上、右、下、左
  context.beginPath();
  context.moveTo(centerX, topY);    // 上
  context.lineTo(rightX, centerY);  // 右
  context.lineTo(centerX, bottomY); // 下
  context.lineTo(leftX, centerY);   // 左
  context.closePath();
  
  if (fillMode === "fill") {
    context.fill();
  } else {
    context.stroke();
  }
};

// 形状工具统一入口函数
const drawShape = (
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  shapeType: string,
  fillMode: string = "fill"
) => {
  switch (shapeType) {
    case "rectangle":
      drawRectangle(context, x1, y1, x2, y2, fillMode);
      break;
    case "circle":
      drawCircleShape(context, x1, y1, x2, y2, fillMode);
      break;
    case "ellipse":
      drawEllipse(context, x1, y1, x2, y2, fillMode);
      break;
    case "triangle":
      drawTriangle(context, x1, y1, x2, y2, fillMode);
      break;
    case "diamond":
      drawDiamond(context, x1, y1, x2, y2, fillMode);
      break;
    default:
      drawRectangle(context, x1, y1, x2, y2, fillMode);
  }
};

// 绘制直线（用于直线工具，支持预览）
const drawLineShape = (
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
  context.closePath();
};

export const tools: IAnyObject = {
  pencil: draw,
  eraser: draw,
  shapes: drawShape,
  line: drawLineShape,
  fill: fill,
};
