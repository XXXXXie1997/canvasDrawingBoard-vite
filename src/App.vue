<template>
  <div class="container">
    <div class="top-bar">
      <div class="title">
        <img src="./assets/title.png" height="28" />
      </div>
      <div class="menu">
        <div class="menu-item" @click="savePicture">
          <icon-download-four />保存为图片
        </div>
        <div class="menu-item" @click="cleanBoard">
          <icon-refresh />清空画板
        </div>
      </div>
      <div class="about">关于，但没什么好关于的</div>
    </div>
    <div class="tool-box"></div>

    <div
      class="tool-option"
      :class="showOption ? '' : 'move'"
      :style="showOption ? 'left: 0' : 'left: -360px'"
    >
      <ToolOption
        v-model="showOption"
        :current-tool="currentTool"
        @on-option-change="optionChange"
      ></ToolOption>
    </div>
    <div class="tool-box" :style="showBox ? 'left: 0' : 'left: -53px'">
      <ToolBox v-model="showBox" @on-tool-change="onToolChange"></ToolBox>
    </div>
    <div class="main">
      <div class="canvas-wrapper" ref="canvasWrapper">
        <canvas
          ref="canvas"
          :style="`background-color: ${defaultBoardColor}`"
        ></canvas>
        <canvas ref="cache" style="display: none"></canvas>
      </div>
    </div>
    <div class="button-group">
      <ElButtonGroup>
        <ElButton
          size="small"
          round
          @click="undo"
          :icon="ArrowLeftBold"
          :disabled="step < 1"
        />
        <ElButton
          size="small"
          round
          @click="redo"
          :icon="ArrowRightBold"
          :disabled="step >= canvasHistory.length - 1"
        />
      </ElButtonGroup>
    </div>
  </div>
</template>
<script lang="ts" setup>
import ToolOption from "@/components/toolOption.vue";
import ToolBox from "@/components/toolBox.vue";
import { ref, onMounted, computed, watch } from "vue";
import type { IAnyObject } from "@/interface/IAnyObject";
import { ArrowLeftBold, ArrowRightBold } from "@element-plus/icons-vue";
import { ElButton, ElButtonGroup } from "element-plus";
import { tools } from "./help/app.help";
import type { ITool } from "@/interface/ITool";
import { onKeyStroke } from "@vueuse/core";

const defaultBoardColor = "#fff";
// 画布ref
const canvas = ref();
// 画布包裹器ref
const canvasWrapper = ref();
const context = ref<CanvasRenderingContext2D | IAnyObject>({});
// 工具配置栏显示状态
const showOption = ref<boolean>(false);
// 工具栏显示状态
const showBox = ref<boolean>(false);
// 绘制状态
const painting = ref<boolean>(false);
// 最新位置坐标
const lastPoint = ref<{ x: number; y: number }>({ x: 0, y: 0 });
// canvas历史记录数组和当前步骤数，每画一笔都会记录，用于撤销前进功能
let canvasHistory: string[] = [];
const step = ref(0);

// 曲线工具状态
const curvePhase = ref<'draw' | 'adjust' | 'done'>('draw');
const curvePoints = ref<{
  start: { x: number; y: number };
  end: { x: number; y: number };
  control: { x: number; y: number };
} | null>(null);
const draggingControlPoint = ref<boolean>(false);
onKeyStroke(["Ctrl", "Z", "z"], (e) => {
  if (e.ctrlKey && (e.key === "z" || e.key === "Z")) {
    e.preventDefault();
    undo();
  }
});
onKeyStroke(["Ctrl", "Y", "y"], (e) => {
  if (e.ctrlKey && (e.key === "y" || e.key === "Y")) {
    e.preventDefault();
    redo();
  }
});
onKeyStroke(["Ctrl", "S", "s"], (e) => {
  if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
    e.preventDefault();
    savePicture();
  }
});
// 曲线工具：Enter确认，Esc取消
onKeyStroke("Enter", (e) => {
  if (currentTool.value.key === "curve" && curvePhase.value === 'adjust') {
    e.preventDefault();
    confirmCurve();
  }
});
onKeyStroke("Escape", (e) => {
  if (currentTool.value.key === "curve" && curvePhase.value === 'adjust') {
    e.preventDefault();
    cancelCurve();
  }
});

// 保存历史记录方法
const saveHistory = () => {
  step.value++;
  if (step.value < canvasHistory.length) {
    canvasHistory.length = step.value; // 截断数组
  }
  canvasHistory.push(canvas.value.toDataURL());
};
const computedOptions = computed(() => {
  return {
    lineWidth: options.value.lineWidth,
    fillStyle:
      currentTool.value.key === "eraser" ? "#fff" : options.value.color,
    strokeStyle:
      currentTool.value.key === "eraser" ? "#fff" : options.value.color,
  };
});
// 当前激活工具
const currentTool = ref<ITool>({
  icon: "icon-pencil",
  name: "铅笔",
  key: "pencil",
});
// 来自工具栏组件的配置信息
const options = ref<IAnyObject>({});
// 工具栏提供配置方法
const optionChange = (option: IAnyObject) => {
  options.value = option;
};
const onToolChange = (tool: ITool) => {
  currentTool.value = tool;
  setTool(currentTool.value.key);
};
// 缓存画布ref
const cache = ref();
const cacheContext = ref<CanvasRenderingContext2D>();
// 绘制缓存方法
const setCache = (imgSrc: HTMLImageElement) => {
  cache.value.width = canvas.value.width;
  cache.value.height = canvas.value.height;
  cacheContext.value = cache.value.getContext("2d");
  cacheContext.value?.drawImage(imgSrc, 0, 0);
};
// 撤销
const undo = () => {
  if (step.value > 0) {
    step.value--;
    let canvasPic = new Image();
    canvasPic.src = canvasHistory[step.value];
    canvasPic.onload = () => {
      // 设置缓存
      setCache(canvasPic);
      // 清理画布
      context.value?.clearRect(0, 0, canvas.value.width, canvas.value.height);
      // 将缓存复制到画布上，通过这种方式可以解决画面闪动的问题
      context.value?.drawImage(cache.value, 0, 0);
    };
  }
};
// 前进
const redo = () => {
  if (step.value < canvasHistory.length - 1) {
    step.value++;
    let canvasPic = new Image();
    canvasPic.src = canvasHistory[step.value];
    canvasPic.onload = () => {
      context.value?.clearRect(0, 0, canvas.value.width, canvas.value.height);
      context.value?.drawImage(canvasPic, 0, 0);
    };
  }
};
// 初始化画布
const init = () => {
  setSize();
  context.value = canvas.value.getContext("2d");
  context.value.fillStyle = defaultBoardColor;
  context.value.fillRect(0, 0, canvas.value.width, canvas.value.height);
  context.value.fillStyle = "#000";
  context.value.lineWidth = 2;
};
const savePicture = () => {
  let a: HTMLAnchorElement = document.createElement("a");
  a.href = canvas.value.toDataURL("image/png");
  a.download = "picture" + new Date().getTime();
  a.click();
};
const cleanBoard = () => {
  context.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
  // 将清空的画板保存为历史，否则无法撤回清空之前的一步
  saveHistory();
};
const setTool = (toolKey: string) => {
  // 切换工具时，如果正在调整曲线，先确认
  if (curvePhase.value === 'adjust') {
    confirmCurve();
  }
  
  if (toolKey === "eraser") {
    context.value.fillStyle = defaultBoardColor;
    context.value.strokeStyle = defaultBoardColor;
  } else {
    context.value.fillStyle = options.value.color || "#000";
    context.value.strokeStyle = options.value.color || "#000";
  }
  // 填充工具：点击即执行，不需要拖动
  if (toolKey === "fill") {
    canvas.value.onmousedown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const x = e.clientX - 70;
      const y = e.clientY - 70;
      // 边界检查
      if (x < 0 || x >= canvas.value.width || y < 0 || y >= canvas.value.height) return;
      // 执行填充
      tools[toolKey](
        canvas.value,
        context.value,
        x,
        y,
        options.value.color || "#000",
        options.value.tolerance ?? 32
      );
      // 保存历史记录
      saveHistory();
    };
    canvas.value.onmousemove = null;
    canvas.value.onmouseup = null;
    return;
  }
  // 曲线工具特殊处理：两阶段交互
  if (toolKey === "curve") {
    // 重置曲线状态
    curvePhase.value = 'draw';
    curvePoints.value = null;
    draggingControlPoint.value = false;

    canvas.value.onmousedown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      
      const x = e.clientX - 70;
      const y = e.clientY - 70;
      
      // 阶段2：拖动控制点
      if (curvePhase.value === 'adjust' && curvePoints.value) {
        const distToControl = Math.sqrt(
          Math.pow(x - curvePoints.value.control.x, 2) +
          Math.pow(y - curvePoints.value.control.y, 2)
        );
        // 如果点击控制点（半径10px内）
        if (distToControl <= 10) {
          draggingControlPoint.value = true;
          return;
        }
      }
      
      // 阶段1：绘制新曲线
      painting.value = true;
      lastPoint.value = { x: e.clientX, y: e.clientY };
      cache.value.width = canvas.value.width;
      cache.value.height = canvas.value.height;
      cacheContext.value = cache.value.getContext("2d");
      cacheContext.value?.drawImage(canvas.value, 0, 0);
    };
    
    canvas.value.onmousemove = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const x = e.clientX - 70;
      const y = e.clientY - 70;
      
      // 阶段2：拖动控制点
      if (draggingControlPoint.value && curvePoints.value) {
        curvePoints.value.control.x = x;
        curvePoints.value.control.y = y;
        
        // 重绘曲线和控制点
        context.value?.clearRect(0, 0, canvas.value.width, canvas.value.height);
        context.value?.drawImage(cache.value, 0, 0);
        tools.curve(
          context.value,
          curvePoints.value.start.x,
          curvePoints.value.start.y,
          curvePoints.value.end.x,
          curvePoints.value.end.y,
          curvePoints.value.control.x,
          curvePoints.value.control.y
        );
        // 绘制控制点标识
        drawControlPoint(context.value, curvePoints.value.control.x, curvePoints.value.control.y);
        return;
      }
      
      // 阶段1：预览曲线
      if (painting.value === true) {
        const x1 = lastPoint.value.x - 70;
        const y1 = lastPoint.value.y - 70;
        const x2 = x;
        const y2 = y;
        
        // 默认控制点在中点位置，向上偏移一段距离
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const cpx = midX;
        const cpy = midY - distance / 4;
        
        context.value?.clearRect(0, 0, canvas.value.width, canvas.value.height);
        context.value?.drawImage(cache.value, 0, 0);
        tools.curve(context.value, x1, y1, x2, y2, cpx, cpy);
      }
    };
    
    canvas.value.onmouseup = (e: MouseEvent) => {
      if (e.button !== 0) return;
      
      // 控制点拖动结束
      if (draggingControlPoint.value) {
        draggingControlPoint.value = false;
        return;
      }
      
      // 阶段1完成：进入阶段2
      if (painting.value === true) {
        painting.value = false;
        const x1 = lastPoint.value.x - 70;
        const y1 = lastPoint.value.y - 70;
        const x2 = e.clientX - 70;
        const y2 = e.clientY - 70;
        
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        curvePoints.value = {
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          control: { x: midX, y: midY - distance / 4 }
        };
        curvePhase.value = 'adjust';
        
        // 绘制控制点标识
        drawControlPoint(context.value, curvePoints.value.control.x, curvePoints.value.control.y);
      }
    };
    
    // 双击确认曲线
    canvas.value.ondblclick = (e: MouseEvent) => {
      if (curvePhase.value === 'adjust') {
        confirmCurve();
      }
    };
    
    return; // 曲线工具单独处理，不执行后续逻辑
  }

  canvas.value.onmousedown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    painting.value = true;
    lastPoint.value = { x: e.clientX, y: e.clientY };
    // 形状工具、直线工具需要保存当前画布状态用于预览
    if (toolKey === "shapes" || toolKey === "line") {
      cache.value.width = canvas.value.width;
      cache.value.height = canvas.value.height;
      cacheContext.value = cache.value.getContext("2d");
      cacheContext.value?.drawImage(canvas.value, 0, 0);
    }
  };
  canvas.value.onmousemove = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (painting.value === true) {
      if (toolKey === "shapes") {
        // 形状工具：使用缓存画布预览
        context.value?.clearRect(0, 0, canvas.value.width, canvas.value.height);
        context.value?.drawImage(cache.value, 0, 0);
        tools[toolKey](
          context.value,
          lastPoint.value.x - 70,
          lastPoint.value.y - 70,
          e.clientX - 70,
          e.clientY - 70,
          options.value.shapeType || "rectangle",
          options.value.fillMode || "fill"
        );
      } else if (toolKey === "line") {
        // 直线工具：使用缓存画布预览
        context.value?.clearRect(0, 0, canvas.value.width, canvas.value.height);
        context.value?.drawImage(cache.value, 0, 0);
        tools[toolKey](
          context.value,
          lastPoint.value.x - 70,
          lastPoint.value.y - 70,
          e.clientX - 70,
          e.clientY - 70
        );
      } else {
        // 其他工具：正常绘制
        tools[toolKey](
          canvas.value,
          context.value,
          lastPoint.value.x - 70,
          lastPoint.value.y - 70,
          e.clientX - 70,
          e.clientY - 70
        );
        lastPoint.value = { x: e.clientX, y: e.clientY };
      }
    }
  };
  canvas.value.onmouseup = (e: MouseEvent) => {
    if (e.button !== 0) return;
    saveHistory();
    painting.value = false;
  };
};
// 监听工具栏配置变化
watch(
  () => {
    return computedOptions.value;
  },
  () => {
    for (let key in computedOptions.value) {
      context.value[key] = computedOptions.value[key];
    }
  }
);

// 绘制控制点辅助函数
const drawControlPoint = (ctx: CanvasRenderingContext2D | IAnyObject, x: number, y: number) => {
  ctx.save();
  ctx.strokeStyle = "#0066ff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

// 曲线确认（Enter）
const confirmCurve = () => {
  if (curvePhase.value === 'adjust' && curvePoints.value) {
    // 清除控制点标识并重绘曲线
    context.value?.clearRect(0, 0, canvas.value.width, canvas.value.height);
    context.value?.drawImage(cache.value, 0, 0);
    tools.curve(
      context.value,
      curvePoints.value.start.x,
      curvePoints.value.start.y,
      curvePoints.value.end.x,
      curvePoints.value.end.y,
      curvePoints.value.control.x,
      curvePoints.value.control.y
    );
    saveHistory();
    curvePhase.value = 'done';
    curvePoints.value = null;
  }
};

// 曲线取消（Esc）
const cancelCurve = () => {
  if (curvePhase.value === 'adjust') {
    // 恢复到绘制前的状态
    context.value?.clearRect(0, 0, canvas.value.width, canvas.value.height);
    context.value?.drawImage(cache.value, 0, 0);
    curvePhase.value = 'draw';
    curvePoints.value = null;
    draggingControlPoint.value = false;
  }
};
const setSize = () => {
  canvas.value.width = canvasWrapper.value.clientWidth;
  canvas.value.height = canvasWrapper.value.clientHeight;
};

onMounted(() => {
  init();
  setTool(currentTool.value.key);
  // 储存一张空白画布作为历史记录的第一张，否则画板无法撤回至完全空白
  canvasHistory.push(canvas.value.toDataURL());
  // 监听窗口变化
  window.addEventListener("resize", () => {
    setSize();
  });
});
</script>
<style lang="less">
html,
body {
  height: 100%;
}

* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

#app {
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
<style lang="less" scoped>
@keyframes tip {
  0%,
  25% {
    -webkit-transform: translateX(-1);
    transform: translateX(-1);
  }
  5%,
  15% {
    -webkit-transform: translateX(-1px);
    transform: translateX(-1px);
  }
  10%,
  20% {
    -webkit-transform: translateX(3px);
    transform: translateX(3px);
  }
  30% {
    -webkit-transform: translateX(0);
    transform: translateX(0);
  }
}
.container {
  padding: 70px;
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
  background: #252526;
  background-image: linear-gradient(#252526 12px, transparent 0),
    linear-gradient(90deg, #ccc 1px, transparent 0);
  background-size: 13px 13px, 13px 13px;
  .tool-option {
    transition: all 0.4s;
    position: absolute;
    bottom: 30px;
    &.move {
      animation: tip 4s;
    }
  }
  .tool-box {
    height: 70%;
    transition: all 0.4s;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  .top-bar {
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
    height: 40px;
    background: #666;
    display: flex;
    .title {
      display: flex;
      justify-content: center;
      width: 110px;
      height: 40px;
      padding: 6px 16px;
      border-right: 2px solid #cccccc77;
    }
    .menu {
      padding: 0 20px;
      display: flex;
      align-items: center;
      width: calc(90% - 110px);
      border-right: 2px solid #cccccc77;
      color: #ccc;
      user-select: none;
      .menu-item {
        font-size: 14px;
        width: 120px;
        text-align: center;
        height: 30px;
        line-height: 30px;
        border-radius: 8px;
        &:hover {
          transition: all 0.2s;
          background: #fafafa;
          color: #333;
        }
        &:active {
          background: #ddd;
          color: #000;
        }
      }
    }
    .about {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 10%;
      color: #ccc;
    }
  }
  .main {
    height: 100%;
    width: 100%;
    .canvas-wrapper {
      width: 100%;
      height: 100%;
      border-radius: 12px;
      overflow: hidden;
    }
  }
  .button-group {
    position: absolute;
    left: 8px;
    top: 44px;
    .el-button {
      padding: 8px;
    }
    .el-button:hover {
      border: 1px solid #252526;
      color: #fff;
      background: #666666;
    }
  }
}
</style>
