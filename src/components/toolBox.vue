<template>
  <div
    class="box-container"
    @mouseenter="changeShowState(true)"
    @mouseleave="changeShowState(false)"
  >
    <div class="arrow-block">
      <icon-toolkit />
    </div>
    <div
      class="item"
      v-for="(item, index) in toolList"
      :key="index"
      :class="item.selected ? 'selected' : ''"
      @click="selectTool(item, index)"
    >
      <ElTooltip :content="item.name" placement="right">
        <div class="icon-wrapper">
          <component :is="item.icon" size="20" />
        </div>
      </ElTooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { IAnyObject } from "@/interface/IAnyObject";
import type { ITool } from "@/interface/ITool";
import { ElTooltip } from "element-plus";
import { ref } from "vue";
import IconLine from "./icons/IconLine.vue";
import IconFill from "./icons/IconFill.vue";
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["on-tool-change", "update:modelValue"]);

const toolList = ref<ITool[]>([
  { icon: "icon-pencil", key: "pencil", name: "铅笔", selected: true },
  { icon: "icon-clear-format", key: "eraser", name: "橡皮", selected: false },
  { icon: "icon-rectangle", key: "shapes", name: "形状", selected: false },
  { icon: IconLine, key: "line", name: "直线", selected: false },
  { icon: IconFill, key: "fill", name: "填充", selected: false },
]);
// 计时器，主要用于组件展开收起操作优化
let timer = 0;
const changeShowState = (state: boolean) => {
  // 鼠标移出时开始计时，500ms后改变显示状态。如果期间鼠标再次移入，则清空计时器，再次离开时重新计时
  if (!state) {
    timer = setTimeout(() => {
      showState.value = state;
      emit("update:modelValue", showState.value);
    }, 500);
  } else {
    clearTimeout(timer);
    showState.value = state;
    emit("update:modelValue", showState.value);
  }
};
const showState = ref<boolean>(false);
const selectTool = (tool: IAnyObject, index: number) => {
  for (let item of toolList.value) {
    item.selected = false;
  }
  toolList.value[index].selected = true;
  emit("on-tool-change", tool);
};
</script>
<style scoped lang="less">
.box-container {
  padding: 6px;
  width: 53px;
  height: 100%;
  border: 3px solid #3c3c3c;
  border-left: none;
  background: #f4f4f4;
  border-bottom-right-radius: 10px;
  border-top-right-radius: 10px;
  position: relative;
  z-index: 0;
  .arrow-block {
    position: absolute;
    width: 29px;
    height: 60px;
    right: -29px;
    top: 50%;
    transform: translateY(-50%);
    border: 1px solid red;
    background: #f4f4f4;
    border: 3px solid #3c3c3c;
    border-left: none;
    border-bottom-right-radius: 8px;
    border-top-right-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;
  }
  .item {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    margin-bottom: 6px;
    .icon-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
  .item:hover {
    transition: all 0.2s;
    background: #666;
    color: #fff;
  }
  .selected {
    background: #666;
    color: #fff;
  }
}
</style>
