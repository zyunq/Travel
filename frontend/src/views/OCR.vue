<template>
  <div class="ocr-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <h2 class="page-title">证件识别</h2>
      </div>
      <div class="header-actions">
        <button v-if="failedList.length > 0" class="btn btn-warning" @click="showFailedDialog = true">
          <el-icon><Warning /></el-icon>
          识别失败 ({{ failedList.length }})
        </button>
        <button class="btn btn-success" @click="showAutoFillDialog = true" :disabled="savedResults.length === 0">
          <el-icon><MagicStick /></el-icon>
          智能补全
        </button>
        <button class="btn btn-secondary" @click="clearAll">
          <el-icon><Delete /></el-icon>
          清空全部
        </button>
        <button class="btn btn-primary" @click="exportExcel" :disabled="savedResults.length === 0">
          <el-icon><Download /></el-icon>
          导出 Excel ({{ savedResults.length }} 条)
        </button>
      </div>
    </div>

    <!-- 上传区域 -->
    <UploadSection ref="uploadRef" @start="startRecognition" />

    <!-- 已保存的识别结果 -->
    <ResultTable
      :results="savedResults"
      @edit="editItem"
      @delete="removeItem"
      @deleteSelected="clearSelected"
    />

    <!-- 编辑对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑信息" width="550px">
      <el-form :model="editForm" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="editForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-radio-group v-model="editForm.gender">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="证件类型">
          <el-select v-model="editForm.doc_type" style="width: 100%">
            <el-option label="身份证" value="id_card" />
            <el-option label="港澳通行证" value="hk_macao_pass" />
            <el-option label="护照" value="passport" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="证件号码">
          <el-input v-model="editForm.id_number" placeholder="请输入证件号码" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="出生日期">
              <el-date-picker v-model="editForm.birth_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" placeholder="选择日期" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="民族">
              <el-input v-model="editForm.nation" placeholder="如：汉族" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址">
          <el-input v-model="editForm.address" type="textarea" :rows="2" placeholder="请输入地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn btn-secondary" @click="showEditDialog = false">取消</button>
        <button class="btn btn-primary" @click="saveEdit">保存</button>
      </template>
    </el-dialog>

    <!-- 识别失败列表对话框 -->
    <FailedListDialog
      v-model="showFailedDialog"
      :failedList="failedList"
      @clear="clearFailedList"
      @export="exportFailedList"
    />

    <!-- 智能补全对话框 -->
    <AutoFillDialog
      v-model="showAutoFillDialog"
      :savedResults="savedResults"
      @confirm="handleAutoFillConfirm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Delete, Download, Warning, MagicStick
} from '@element-plus/icons-vue'
import axios from 'axios'
import UploadSection from '@/components/ocr/UploadSection.vue'
import ResultTable from '@/components/ocr/ResultTable.vue'
import FailedListDialog from '@/components/ocr/FailedListDialog.vue'
import AutoFillDialog from '@/components/ocr/AutoFillDialog.vue'
import { BASE_URL } from '@/config'

const router = useRouter()

const uploadRef = ref(null)
const savedResults = ref([])
const failedList = ref([])
const showFailedDialog = ref(false)
const showEditDialog = ref(false)
const showAutoFillDialog = ref(false)
const editForm = ref({})
const selectedItems = ref([])

// 本地存储 Key
const STORAGE_KEY = 'ocr_results'
const FAILED_KEY = 'ocr_failed_results'

// 返回
const goBack = () => {
  router.push('/')
}

// 从本地存储加载数据
const loadFromStorage = () => {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    savedResults.value = JSON.parse(data)
  }
  const failed = localStorage.getItem(FAILED_KEY)
  if (failed) {
    failedList.value = JSON.parse(failed)
  }
}

// 保存到本地存储
const saveToStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedResults.value))
}

// 保存失败列表
const saveFailedToStorage = () => {
  localStorage.setItem(FAILED_KEY, JSON.stringify(failedList.value))
}

// 清空全部
const clearAll = async () => {
  if (savedResults.value.length === 0 && failedList.value.length === 0) return

  try {
    await ElMessageBox.confirm('确定清空所有识别数据？此操作不可恢复！', '警告', {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'warning'
    })
    savedResults.value = []
    failedList.value = []
    saveToStorage()
    saveFailedToStorage()
    ElMessage.success('已清空所有数据')
  } catch {}
}

// 清空选中
const clearSelected = async () => {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedItems.value.length} 条数据？`, '提示', {
      type: 'warning'
    })
    savedResults.value = savedResults.value.filter(r => !selectedItems.value.includes(r.id))
    selectedItems.value = []
    saveToStorage()
    ElMessage.success('删除成功')
  } catch {}
}

// 生成唯一 ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 开始识别
const startRecognition = async (data) => {
  const newResults = []

  try {
    if (data.mode === 'files') {
      // 多文件识别
      for (const file of data.files) {
        const formData = new FormData()
        formData.append('file', file.raw)
        try {
          const { data: result } = await axios.post(`${BASE_URL}/ocr/recognize`, formData)
          if (result.success) {
            newResults.push({
              id: generateId(),
              doc_type: result.doc_type,
              source_file: file.name,
              created_at: new Date().toISOString(),
              ...result.data
            })
          }
        } catch (err) {
          ElMessage.error(`${file.name} 识别失败`)
        }
      }
    } else if (data.mode === 'zip') {
      // 压缩包识别
      const formData = new FormData()
      formData.append('file', data.zipFile)
      const { data: result } = await axios.post(`${BASE_URL}/ocr/batch`, formData)
      if (result.results) {
        result.results.forEach(r => {
          newResults.push({
            id: generateId(),
            created_at: new Date().toISOString(),
            ...r
          })
        })
      }
      // 保存失败列表
      if (result.failed && result.failed.length > 0) {
        failedList.value = result.failed.map(f => ({
          ...f,
          id: generateId(),
          created_at: new Date().toISOString()
        }))
        saveFailedToStorage()
      }
    } else {
      // Excel + 图片识别
      const formData = new FormData()
      formData.append('excel', data.excelFile)
      data.imageFiles.forEach(img => {
        formData.append('images', img)
      })
      const { data: result } = await axios.post(`${BASE_URL}/ocr/excel`, formData)
      if (result.results) {
        result.results.forEach(r => {
          newResults.push({
            id: generateId(),
            created_at: new Date().toISOString(),
            ...r
          })
        })
      }
    }

    // 添加到已保存结果
    savedResults.value.push(...newResults)
    saveToStorage()

    // 显示结果消息
    const successMsg = `识别完成，成功 ${newResults.length} 条`
    const failedMsg = failedList.value.length > 0 ? `，失败 ${failedList.value.length} 条` : ''
    ElMessage.success(successMsg + failedMsg)

    // 通知上传组件完成
    uploadRef.value?.finishRecognition()

  } catch (err) {
    ElMessage.error('识别失败：' + (err.response?.data?.error || err.message))
  }
}

// 导出 Excel
const exportExcel = async () => {
  if (savedResults.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  try {
    const { data } = await axios.post(`${BASE_URL}/ocr/export`, {
      results: savedResults.value
    }, { responseType: 'blob' })

    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `证件识别结果_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (err) {
    ElMessage.error('导出失败')
  }
}

// 导出失败列表
const exportFailedList = () => {
  if (failedList.value.length === 0) return

  const content = '文件名\t失败原因\t识别到的文字\n' +
    failedList.value.map(f =>
      `${f.filename}\t${f.reason}\t${(f.ocr_texts || []).join(', ')}`
    ).join('\n')

  const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `识别失败列表_${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)

  ElMessage.success('导出成功')
}

// 清空失败列表
const clearFailedList = () => {
  failedList.value = []
  saveFailedToStorage()
}

// 编辑
const editItem = (item) => {
  editForm.value = { ...item }
  showEditDialog.value = true
}

// 保存编辑
const saveEdit = () => {
  const index = savedResults.value.findIndex(r => r.id === editForm.value.id)
  if (index !== -1) {
    savedResults.value[index] = { ...editForm.value }
    saveToStorage()
  }
  showEditDialog.value = false
  ElMessage.success('保存成功')
}

// 删除单条
const removeItem = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该条数据？', '提示', { type: 'warning' })
    savedResults.value = savedResults.value.filter(r => r.id !== id)
    selectedItems.value = selectedItems.value.filter(i => i !== id)
    saveToStorage()
    ElMessage.success('删除成功')
  } catch {}
}

// 处理智能补全确认
const handleAutoFillConfirm = ({ results, filledCount }) => {
  // 更新 savedResults
  for (const updated of results) {
    const index = savedResults.value.findIndex(r => r.id === updated.id)
    if (index !== -1) {
      savedResults.value[index] = updated
    }
  }
  saveToStorage()
}

// 页面加载时读取本地存储
onMounted(() => {
  loadFromStorage()
})
</script>

<style scoped>
.ocr-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #ffffff;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.back-btn:hover {
  background: #f0fdfa;
  color: #0d9488;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
}

.header-actions {
  display: flex;
  gap: 10px;
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

.btn-secondary {
  background: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f0fdfa;
}

.btn-warning {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fcd34d;
}

.btn-warning:hover {
  background: #fde68a;
}

.btn-success {
  background: #dcfce7;
  color: #16a34a;
  border: 1px solid #86efac;
}

.btn-success:hover {
  background: #bbf7d0;
}

.btn-success:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 对话框 */
:deep(.el-dialog) {
  border-radius: 16px;
}

:deep(.el-dialog__header) {
  padding: 20px 20px 10px;
}

:deep(.el-dialog__body) {
  padding: 10px 20px;
}

:deep(.el-dialog__footer) {
  padding: 10px 20px 20px;
}

/* 响应式 */
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
