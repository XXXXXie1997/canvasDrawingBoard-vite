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
    fillStyle: options.value.color,
    strokeStyle: options.value.color,
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
  canvas.value.width = canvasWrapper.value.clientWidth;
  canvas.value.height = canvasWrapper.value.clientHeight;
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
// 初始化鼠标事件，目前只支持画线
const setTool = (toolKey: string) => {
  if (toolKey === "eraser") {
    context.value.fillStyle = defaultBoardColor;
    context.value.strokeStyle = defaultBoardColor;
  } else {
    context.value.fillStyle = options.value.color || "#000";
    context.value.strokeStyle = options.value.color || "#000";
  }
  canvas.value.onmousedown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    painting.value = true;
    lastPoint.value = { x: e.clientX, y: e.clientY };
  };
  canvas.value.onmousemove = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (painting.value === true) {
      // 根据当前工具key设置鼠标移动事件
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
onMounted(() => {
  init();
  setTool(currentTool.value.key);
  // 储存一张空白画布作为历史记录的第一张，否则画板无法撤回至完全空白
  canvasHistory.push(canvas.value.toDataURL());
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
