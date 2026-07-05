<template>
  <div class="upload-section">
    <div class="upload-tabs">
      <div
        class="tab-item"
        :class="{ active: uploadMode === 'files' }"
        @click="uploadMode = 'files'"
      >
        <el-icon><Picture /></el-icon>
        <span>多文件上传</span>
      </div>
      <div
        class="tab-item"
        :class="{ active: uploadMode === 'zip' }"
        @click="uploadMode = 'zip'"
      >
        <el-icon><FolderOpened /></el-icon>
        <span>压缩包上传</span>
      </div>
      <div
        class="tab-item"
        :class="{ active: uploadMode === 'excel' }"
        @click="uploadMode = 'excel'"
      >
        <el-icon><Document /></el-icon>
        <span>Excel+图片</span>
      </div>
    </div>

    <!-- 多文件上传 -->
    <div v-if="uploadMode === 'files'" class="upload-area upload-files-mode">
      <el-upload
        multiple
        drag
        :auto-upload="false"
        accept="image/*"
        :on-change="handleFilesChange"
        :file-list="fileList"
        :show-file-list="false"
        class="upload-dragger-wrapper"
      >
        <el-icon class="upload-icon"><Plus /></el-icon>
        <div class="upload-text">拖拽或点击上传多张证件图片</div>
        <div class="upload-tip">支持 JPG、PNG 格式，可一次上传多张</div>
      </el-upload>
      <!-- 已选择的文件列表 -->
      <div v-if="fileList.length > 0" class="file-list">
        <div class="file-list-header">
          <span>已选择 {{ fileList.length }} 个文件</span>
          <button class="btn-clear" @click="fileList = []">清空</button>
        </div>
        <div class="file-list-items">
          <div v-for="(file, index) in fileList" :key="index" class="file-item">
            <span class="file-name">{{ file.name }}</span>
            <el-icon class="file-remove" @click="removeFile(index)"><Close /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 压缩包上传 -->
    <div v-if="uploadMode === 'zip'" class="upload-area">
      <el-upload
        drag
        :auto-upload="false"
        accept=".zip,.rar"
        :on-change="handleZipChange"
        :show-file-list="false"
      >
        <el-icon class="upload-icon"><FolderOpened /></el-icon>
        <div class="upload-text">上传压缩包（ZIP）</div>
        <div class="upload-tip">压缩包内的图片将自动解压并识别</div>
      </el-upload>
      <div v-if="zipFile" class="selected-file">
        <el-icon><Document /></el-icon>
        <span>{{ zipFile.name }}</span>
        <el-icon class="remove-icon" @click="zipFile = null"><Close /></el-icon>
      </div>
    </div>

    <!-- Excel+图片上传 -->
    <div v-if="uploadMode === 'excel'" class="upload-area excel-mode">
      <div class="excel-upload">
        <el-upload
          drag
          :auto-upload="false"
          accept=".xlsx,.xls"
          :on-change="handleExcelChange"
          :show-file-list="false"
        >
          <el-icon class="upload-icon"><Document /></el-icon>
          <div class="upload-text">上传 Excel 文件</div>
          <div class="upload-tip">Excel 中包含姓名和图片文件名</div>
        </el-upload>
        <div v-if="excelFile" class="selected-file">
          <el-icon><Document /></el-icon>
          <span>{{ excelFile.name }}</span>
          <el-icon class="remove-icon" @click="excelFile = null"><Close /></el-icon>
        </div>
      </div>
      <div class="images-upload">
        <el-upload
          multiple
          drag
          :auto-upload="false"
          accept="image/*"
          :on-change="handleImagesChange"
        >
          <el-icon class="upload-icon"><Picture /></el-icon>
          <div class="upload-text">上传图片文件夹</div>
          <div class="upload-tip">图片文件名需与 Excel 中对应</div>
        </el-upload>
      </div>
    </div>

    <!-- 开始识别按钮 -->
    <div class="action-bar">
      <button class="btn btn-primary btn-large" @click="startRecognition" :disabled="!canStart || recognizing">
        <el-icon v-if="recognizing"><Loading class="is-loading" /></el-icon>
        <el-icon v-else><Camera /></el-icon>
        {{ recognizing ? '识别中...' : '开始识别' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Picture, FolderOpened, Document, Plus, Close, Camera, Loading } from '@element-plus/icons-vue'

const emit = defineEmits(['start'])

const uploadMode = ref('files')
const fileList = ref([])
const zipFile = ref(null)
const excelFile = ref(null)
const imageFiles = ref([])
const recognizing = ref(false)

// 是否可以开始识别
const canStart = computed(() => {
  if (uploadMode.value === 'files') {
    return fileList.value.length > 0
  } else if (uploadMode.value === 'zip') {
    return zipFile.value !== null
  } else {
    return excelFile.value !== null && imageFiles.value.length > 0
  }
})

// 处理文件变化
const handleFilesChange = (file, files) => {
  fileList.value = files
}

// 删除单个文件
const removeFile = (index) => {
  fileList.value.splice(index, 1)
}

const handleZipChange = (file) => {
  zipFile.value = file.raw
}

const handleExcelChange = (file) => {
  excelFile.value = file.raw
}

const handleImagesChange = (file, files) => {
  imageFiles.value = files.map(f => f.raw)
}

// 开始识别
const startRecognition = () => {
  recognizing.value = true
  emit('start', {
    mode: uploadMode.value,
    files: fileList.value,
    zipFile: zipFile.value,
    excelFile: excelFile.value,
    imageFiles: imageFiles.value
  })
}

// 识别完成
const finishRecognition = () => {
  recognizing.value = false
  fileList.value = []
  zipFile.value = null
  excelFile.value = null
  imageFiles.value = []
}

// 暴露方法
defineExpose({
  finishRecognition
})
</script>

<style scoped>
/* 样式保留原 OCR.vue 中的上传区域样式 */
.upload-section {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.08);
}

.upload-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  transition: all 0.2s;
}

.tab-item:hover {
  background: #f0fdfa;
  border-color: #99f6e4;
}

.tab-item.active {
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
  border-color: #0d9488;
  color: #0d9488;
  font-weight: 500;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-area :deep(.el-upload-dragger) {
  background: #f0fdfa;
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-dragger-wrapper {
  width: 100%;
}

.upload-icon {
  font-size: 48px;
  color: #0d9488;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 15px;
  color: #374151;
  margin-bottom: 6px;
}

.upload-tip {
  font-size: 13px;
  color: #9ca3af;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f0fdfa;
  border-radius: 10px;
  margin-top: 12px;
  color: #374151;
  font-size: 14px;
}

.remove-icon {
  margin-left: auto;
  cursor: pointer;
  color: #9ca3af;
}

.remove-icon:hover {
  color: #ef4444;
}

/* 文件列表 */
.upload-files-mode {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-list {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  color: #6b7280;
}

.btn-clear {
  background: none;
  border: none;
  color: #0d9488;
  cursor: pointer;
  font-size: 13px;
}

.btn-clear:hover {
  text-decoration: underline;
}

.file-list-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #ffffff;
  border-radius: 6px;
  font-size: 12px;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.file-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-remove {
  cursor: pointer;
  color: #9ca3af;
  font-size: 14px;
}

.file-remove:hover {
  color: #ef4444;
}

/* Excel模式 */
.excel-mode {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.excel-upload,
.images-upload {
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .excel-mode {
    grid-template-columns: 1fr;
  }
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

.btn-primary {
  background: #0d9488;
  color: white;
}

.btn-primary:hover {
  background: #0f766e;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-large {
  padding: 14px 32px;
  font-size: 16px;
}

.action-bar {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}
</style>
