<template>
  <el-dialog v-model="visible" title="批量导入人员" width="500px">
    <div class="template-download">
      <el-button type="primary" link @click="downloadTemplate">
        <el-icon><Download /></el-icon>
        下载导入模板
      </el-button>
    </div>

    <el-upload
      drag
      :auto-upload="false"
      :limit="1"
      accept=".xlsx,.xls"
      :on-change="handleFileChange"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将 Excel 文件拖到此处，或<em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">只能上传 xlsx/xls 文件，请先下载模板查看格式</div>
      </template>
    </el-upload>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleImport" :loading="loading">导入</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { UploadFilled, Download } from '@element-plus/icons-vue'
import { memberApi } from '../api'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'import'])

const visible = ref(props.modelValue)
const selectedFile = ref(null)
const loading = ref(false)

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const handleImport = async () => {
  if (!selectedFile.value) {
    return
  }
  loading.value = true
  emit('import', selectedFile.value, () => {
    loading.value = false
    visible.value = false
    selectedFile.value = null
  })
}

const downloadTemplate = async () => {
  const response = await memberApi.downloadTemplate()
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'import_template.xlsx')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
</script>

<style scoped>
.template-download {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}
</style>
