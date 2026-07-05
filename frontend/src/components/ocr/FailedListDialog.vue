<template>
  <el-dialog v-model="visible" title="识别失败的图片" width="700px" @close="$emit('update:modelValue', false)">
    <div class="failed-header">
      <span>共 {{ failedList.length }} 张图片识别失败</span>
      <button class="btn btn-sm btn-secondary" @click="exportFailedList">
        <el-icon><Download /></el-icon>
        导出列表
      </button>
    </div>
    <div class="failed-list">
      <div v-for="(item, index) in failedList" :key="item.id" class="failed-item">
        <div class="failed-index">{{ index + 1 }}</div>
        <div class="failed-info">
          <div class="failed-filename">{{ item.filename }}</div>
          <div class="failed-reason">
            <span class="reason-label">原因：</span>
            <span class="reason-text">{{ item.reason }}</span>
          </div>
          <div v-if="item.ocr_texts && item.ocr_texts.length > 0" class="failed-ocr">
            <span class="ocr-label">识别到的文字：</span>
            <span class="ocr-text">{{ item.ocr_texts.join(', ') }}</span>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <button class="btn btn-secondary" @click="visible = false">关闭</button>
      <button class="btn btn-danger" @click="clearFailedList">清空失败列表</button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  failedList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'clear', 'export'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 导出失败列表
const exportFailedList = () => {
  emit('export')
}

// 清空失败列表
const clearFailedList = async () => {
  try {
    await ElMessageBox.confirm('确定清空失败列表？', '提示', { type: 'warning' })
    emit('clear')
    visible.value = false
    ElMessage.success('已清空')
  } catch {}
}
</script>

<style scoped>
.failed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.failed-list {
  max-height: 400px;
  overflow-y: auto;
}

.failed-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 8px;
}

.failed-index {
  width: 24px;
  height: 24px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.failed-info {
  flex: 1;
  min-width: 0;
}

.failed-filename {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  word-break: break-all;
  margin-bottom: 4px;
}

.failed-reason {
  font-size: 13px;
  color: #dc2626;
  margin-bottom: 4px;
}

.reason-label {
  color: #6b7280;
}

.failed-ocr {
  font-size: 12px;
  color: #6b7280;
}

.ocr-label {
  color: #9ca3af;
}

.ocr-text {
  color: #374151;
}

/* 按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  white-space: nowrap;
}

.btn-secondary {
  background: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f0fdfa;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-danger {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-danger:hover {
  background: #fecaca;
}

:deep(.el-dialog) {
  border-radius: 16px;
}
</style>
