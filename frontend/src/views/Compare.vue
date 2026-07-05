<template>
  <div class="compare-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <h2 class="page-title">名单对比</h2>
      </div>
      <div class="header-actions">
        <button v-if="showResult" class="btn btn-success" @click="saveResult">
          <el-icon><Check /></el-icon>
          保存结果
        </button>
        <button class="btn btn-secondary" @click="clearAll">
          <el-icon><Delete /></el-icon>
          清空
        </button>
        <button class="btn btn-primary" @click="exportResult" :disabled="compareResult.matched.length === 0 && compareResult.missing.length === 0 && compareResult.extra.length === 0">
          <el-icon><Download /></el-icon>
          导出结果
        </button>
      </div>
    </div>

    <!-- 对比区域 -->
    <div class="compare-section">
      <div class="compare-grid">
        <!-- 识别名单 -->
        <div class="list-card">
          <div class="card-header">
            <h3 class="card-title">识别名单</h3>
            <span class="card-count">{{ recognizedList.length }} 人</span>
          </div>
          <div class="card-body">
            <div class="source-options">
              <label class="radio-label">
                <input type="radio" v-model="recognizedSource" value="saved" />
                <span>使用已识别数据 ({{ savedResultsCount }} 人)</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="recognizedSource" value="upload" />
                <span>上传 Excel 文件</span>
              </label>
            </div>
            <div v-if="recognizedSource === 'upload'" class="upload-box">
              <el-upload
                drag
                :auto-upload="false"
                accept=".xlsx,.xls"
                :on-change="handleRecognizedUpload"
                :show-file-list="false"
              >
                <el-icon class="upload-icon"><Upload /></el-icon>
                <div class="upload-text">点击或拖拽上传</div>
              </el-upload>
              <div v-if="recognizedFile" class="selected-file">
                <el-icon><Document /></el-icon>
                <span>{{ recognizedFile.name }}</span>
                <el-icon class="remove-icon" @click="clearRecognized"><Close /></el-icon>
              </div>
            </div>
            <div v-else class="info-box">
              <el-icon><Check /></el-icon>
              <span>将使用证件识别模块中的 {{ savedResultsCount }} 条数据</span>
            </div>
          </div>
        </div>

        <!-- 参考名单 -->
        <div class="list-card">
          <div class="card-header">
            <h3 class="card-title">参考名单</h3>
            <span class="card-count">{{ referenceList.length }} 人</span>
          </div>
          <div class="card-body">
            <div class="upload-box">
              <el-upload
                drag
                :auto-upload="false"
                accept=".xlsx,.xls"
                :on-change="handleReferenceUpload"
                :show-file-list="false"
              >
                <el-icon class="upload-icon"><Upload /></el-icon>
                <div class="upload-text">点击或拖拽上传</div>
              </el-upload>
              <div v-if="referenceFile" class="selected-file">
                <el-icon><Document /></el-icon>
                <span>{{ referenceFile.name }}</span>
                <el-icon class="remove-icon" @click="clearReference"><Close /></el-icon>
              </div>
            </div>
            <div class="upload-tip">上传包含姓名和证件号的 Excel 文件</div>
          </div>
        </div>
      </div>

      <!-- 开始对比按钮 -->
      <div class="action-bar">
        <button class="btn btn-primary btn-large" @click="startCompare" :disabled="!canCompare">
          <el-icon><Sort /></el-icon>
          开始对比
        </button>
      </div>
    </div>

    <!-- 对比结果 -->
    <div v-if="showResult" class="result-section">
      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-card stat-success">
          <div class="stat-value">{{ compareResult.matched.length }}</div>
          <div class="stat-label">匹配成功</div>
        </div>
        <div class="stat-card stat-danger">
          <div class="stat-value">{{ compareResult.missing.length }}</div>
          <div class="stat-label">缺少</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-value">{{ compareResult.extra.length }}</div>
          <div class="stat-label">多余</div>
        </div>
      </div>

      <!-- 缺少的人 -->
      <div v-if="compareResult.missing.length > 0" class="result-card">
        <div class="result-header">
          <h3 class="result-title">
            <span class="dot dot-danger"></span>
            参考名单有但识别名单没有（{{ compareResult.missing.length }} 人）
          </h3>
          <div class="result-actions">
            <span class="result-desc">这些人需要补充识别</span>
            <button class="btn btn-sm btn-secondary" @click="exportMissing">
              <el-icon><Download /></el-icon>
              导出
            </button>
          </div>
        </div>
        <div class="result-table">
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>姓名</th>
                <th>证件号码</th>
                <th>性别</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in compareResult.missing" :key="'missing-' + index">
                <td>{{ index + 1 }}</td>
                <td>{{ item.name || '-' }}</td>
                <td>{{ item.id_number || '-' }}</td>
                <td>{{ item.gender || '-' }}</td>
                <td>{{ item.notes || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 多余的人 -->
      <div v-if="compareResult.extra.length > 0" class="result-card">
        <div class="result-header">
          <h3 class="result-title">
            <span class="dot dot-warning"></span>
            识别名单有但参考名单没有（{{ compareResult.extra.length }} 人）
          </h3>
          <div class="result-actions">
            <span class="result-desc">这些人可能是多余的或需要核实</span>
            <button class="btn btn-sm btn-secondary" @click="exportExtra">
              <el-icon><Download /></el-icon>
              导出
            </button>
          </div>
        </div>
        <div class="result-table">
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>姓名</th>
                <th>证件号码</th>
                <th>性别</th>
                <th>来源文件</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in compareResult.extra" :key="'extra-' + index">
                <td>{{ index + 1 }}</td>
                <td>{{ item.name || '-' }}</td>
                <td>{{ item.id_number || '-' }}</td>
                <td>{{ item.gender || '-' }}</td>
                <td>{{ item.source_file || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 匹配成功 -->
      <div v-if="compareResult.matched.length > 0" class="result-card">
        <div class="result-header">
          <h3 class="result-title">
            <span class="dot dot-success"></span>
            两边都有（{{ compareResult.matched.length }} 人）
          </h3>
          <div class="result-actions">
            <button class="btn btn-sm btn-secondary" @click="exportMatched">
              <el-icon><Download /></el-icon>
              导出
            </button>
            <button class="btn-toggle" @click="showMatched = !showMatched">
              {{ showMatched ? '收起' : '展开' }}
            </button>
          </div>
        </div>
        <div v-if="showMatched" class="result-table">
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>姓名</th>
                <th>证件号码</th>
                <th>匹配方式</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in compareResult.matched" :key="'matched-' + index">
                <td>{{ index + 1 }}</td>
                <td>{{ item.name || '-' }}</td>
                <td>{{ item.id_number || '-' }}</td>
                <td>{{ item.matchType || '完全匹配' }}</td>
                <td>
                  <button class="btn-icon" @click="editMatchedItem(item, index)">
                    <el-icon><Edit /></el-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑信息" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="证件号码">
          <el-input v-model="editForm.id_number" placeholder="请输入证件号码" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn btn-secondary" @click="showEditDialog = false">取消</button>
        <button class="btn btn-primary" @click="saveEdit">保存</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Delete, Download, Upload, Document, Close,
  Check, Sort, Edit
} from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { cleanStr, isSamePerson, findFieldValue, extractPersonInfo } from '@/utils/match'

const router = useRouter()

const recognizedSource = ref('saved')
const recognizedFile = ref(null)
const recognizedList = ref([])
const referenceFile = ref(null)
const referenceList = ref([])
const showResult = ref(false)
const showMatched = ref(false)
const savedResultsCount = ref(0)

// 编辑相关
const showEditDialog = ref(false)
const editForm = ref({})
const editIndex = ref(-1)

const compareResult = ref({
  matched: [],
  missing: [],
  extra: []
})

// 是否可以对比
const canCompare = computed(() => {
  if (recognizedSource.value === 'saved') {
    return savedResultsCount.value > 0 && referenceList.value.length > 0
  } else {
    return recognizedList.value.length > 0 && referenceList.value.length > 0
  }
})

// 返回
const goBack = () => {
  router.push('/')
}

// 清空
const clearAll = () => {
  recognizedFile.value = null
  recognizedList.value = []
  referenceFile.value = null
  referenceList.value = []
  showResult.value = false
  compareResult.value = { matched: [], missing: [], extra: [] }
}

// 清空识别名单
const clearRecognized = () => {
  recognizedFile.value = null
  recognizedList.value = []
}

// 清空参考名单
const clearReference = () => {
  referenceFile.value = null
  referenceList.value = []
}

// 解析 Excel
const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        resolve(jsonData)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// 处理识别名单上传
const handleRecognizedUpload = async (file) => {
  recognizedFile.value = file.raw
  try {
    const data = await parseExcel(file.raw)
    recognizedList.value = extractPersonInfo(data)
    ElMessage.success(`成功导入 ${recognizedList.value.length} 条数据`)
  } catch (err) {
    ElMessage.error('文件解析失败')
  }
}

// 处理参考名单上传
const handleReferenceUpload = async (file) => {
  referenceFile.value = file.raw
  try {
    const data = await parseExcel(file.raw)
    referenceList.value = extractPersonInfo(data)
    console.log('[参考名单上传成功]', referenceList.value)
    ElMessage.success(`成功导入 ${referenceList.value.length} 条数据`)
  } catch (err) {
    console.error('[参考名单上传失败]', err)
    ElMessage.error('文件解析失败')
  }
}

// 开始对比
const startCompare = () => {
  // 获取识别名单
  let list1 = []
  if (recognizedSource.value === 'saved') {
    const saved = localStorage.getItem('ocr_results')
    if (saved) {
      const data = JSON.parse(saved)
      // 可能的姓名字段名
      const nameKeys = ['name', 'name_cn', '姓名']
      // 可能的证件号码字段名
      const idKeys = ['id_number', 'passport_number', '证件号码', '证件号', '护照号码']

      list1 = data.map(p => {
        const name = findFieldValue(p, nameKeys)
        const idNumber = findFieldValue(p, idKeys)
        console.log('[识别名单]', { 姓名: name, 证件号: idNumber, 原始: p })
        return {
          name: name,
          id_number: idNumber.toUpperCase(),
          gender: p.gender || '',
          source_file: p.source_file || ''
        }
      })
    }
  } else {
    list1 = [...recognizedList.value]
  }

  const list2 = [...referenceList.value]

  console.log('[对比开始]', { 识别名单数量: list1.length, 参考名单数量: list2.length })
  console.log('[识别名单详情]', list1)
  console.log('[参考名单详情]', list2)

  const matched = []
  const missing = []
  const extra = []

  // 已匹配的索引
  const matched1 = new Set()
  const matched2 = new Set()

  // 遍历：识别名单的每一行 vs 参考名单的每一行
  console.log('========== 开始遍历对比 ==========')
  for (let i = 0; i < list1.length; i++) {
    if (matched1.has(i)) continue

    console.log(`\n[识别名单第${i + 1}人] 姓名: "${list1[i].name}", 证件号: "${list1[i].id_number}"`)

    for (let j = 0; j < list2.length; j++) {
      if (matched2.has(j)) continue

      console.log(`  → 对比参考名单第${j + 1}人: 姓名: "${list2[j].name}", 证件号: "${list2[j].id_number}"`)

      const result = isSamePerson(list1[i], list2[j])
      if (result.match) {
        console.log(`  ✓ 匹配成功！类型: ${result.type}`)
        matched.push({
          ...list1[i],
          matchType: result.type
        })
        matched1.add(i)
        matched2.add(j)
        break
      }
    }
  }
  console.log('========== 遍历结束 ==========\n')

  // 未匹配的识别名单 = 多余
  for (let i = 0; i < list1.length; i++) {
    if (!matched1.has(i)) {
      extra.push(list1[i])
    }
  }

  // 未匹配的参考名单 = 缺少
  for (let j = 0; j < list2.length; j++) {
    if (!matched2.has(j)) {
      missing.push(list2[j])
    }
  }

  compareResult.value = { matched, missing, extra }
  showResult.value = true

  ElMessage.success(`对比完成：匹配 ${matched.length} 人，缺少 ${missing.length} 人，多余 ${extra.length} 人`)
}

// 导出缺少的人
const exportMissing = () => {
  if (compareResult.value.missing.length === 0) return
  const ws = XLSX.utils.json_to_sheet(compareResult.value.missing.map((p, i) => ({
    '序号': i + 1,
    '姓名': p.name,
    '证件号码': p.id_number,
    '性别': p.gender,
    '备注': p.notes
  })))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '缺少的人')
  const fileName = `缺少的人_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
  ElMessage.success('导出成功')
}

// 导出多余的人
const exportExtra = () => {
  if (compareResult.value.extra.length === 0) return
  const ws = XLSX.utils.json_to_sheet(compareResult.value.extra.map((p, i) => ({
    '序号': i + 1,
    '姓名': p.name,
    '证件号码': p.id_number,
    '性别': p.gender,
    '来源文件': p.source_file
  })))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '多余的人')
  const fileName = `多余的人_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
  ElMessage.success('导出成功')
}

// 导出匹配成功的人
const exportMatched = () => {
  if (compareResult.value.matched.length === 0) return
  const ws = XLSX.utils.json_to_sheet(compareResult.value.matched.map((p, i) => ({
    '序号': i + 1,
    '姓名': p.name,
    '证件号码': p.id_number,
    '匹配方式': p.matchType
  })))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '匹配成功')
  const fileName = `匹配成功_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
  ElMessage.success('导出成功')
}

// 导出全部结果
const exportResult = () => {
  const wb = XLSX.utils.book_new()

  // 缺少的人
  if (compareResult.value.missing.length > 0) {
    const ws1 = XLSX.utils.json_to_sheet(compareResult.value.missing.map((p, i) => ({
      '序号': i + 1,
      '姓名': p.name,
      '证件号码': p.id_number,
      '性别': p.gender,
      '备注': p.notes
    })))
    XLSX.utils.book_append_sheet(wb, ws1, '缺少的人')
  }

  // 多余的人
  if (compareResult.value.extra.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(compareResult.value.extra.map((p, i) => ({
      '序号': i + 1,
      '姓名': p.name,
      '证件号码': p.id_number,
      '性别': p.gender,
      '来源文件': p.source_file
    })))
    XLSX.utils.book_append_sheet(wb, ws2, '多余的人')
  }

  // 匹配成功
  if (compareResult.value.matched.length > 0) {
    const ws3 = XLSX.utils.json_to_sheet(compareResult.value.matched.map((p, i) => ({
      '序号': i + 1,
      '姓名': p.name,
      '证件号码': p.id_number,
      '匹配方式': p.matchType
    })))
    XLSX.utils.book_append_sheet(wb, ws3, '匹配成功')
  }

  // 导出
  const fileName = `名单对比结果_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
  ElMessage.success('导出成功')
}

// 保存对比结果
const saveResult = () => {
  const resultData = {
    timestamp: new Date().toISOString(),
    recognizedSource: recognizedSource.value,
    matched: compareResult.value.matched,
    missing: compareResult.value.missing,
    extra: compareResult.value.extra
  }
  localStorage.setItem('compare_result', JSON.stringify(resultData))
  ElMessage.success('结果已保存')
}

// 编辑匹配成功的人
const editMatchedItem = (item, index) => {
  editForm.value = { ...item }
  editIndex.value = index
  showEditDialog.value = true
}

// 保存编辑
const saveEdit = () => {
  if (editIndex.value >= 0) {
    compareResult.value.matched[editIndex.value] = { ...editForm.value }
    // 同步更新 localStorage
    saveResult()
  }
  showEditDialog.value = false
  ElMessage.success('保存成功')
}

// 加载已识别数据数量和上次对比结果
onMounted(() => {
  // 加载识别数据数量
  const saved = localStorage.getItem('ocr_results')
  if (saved) {
    const data = JSON.parse(saved)
    savedResultsCount.value = data.length
  }

  // 加载上次对比结果
  const savedResult = localStorage.getItem('compare_result')
  if (savedResult) {
    try {
      const data = JSON.parse(savedResult)
      compareResult.value = {
        matched: data.matched || [],
        missing: data.missing || [],
        extra: data.extra || []
      }
      showResult.value = true
      console.log('[恢复对比结果]', data)
    } catch (e) {
      console.error('加载对比结果失败', e)
    }
  }
})
</script>

<style scoped>
.compare-page {
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

.btn-success {
  background: #16a34a;
  color: white;
}

.btn-success:hover {
  background: #15803d;
}

.btn-primary:disabled, .btn-success:disabled {
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

.btn-large {
  padding: 14px 32px;
  font-size: 16px;
}

.btn-toggle {
  background: none;
  border: none;
  color: #0d9488;
  cursor: pointer;
  font-size: 13px;
}

.btn-toggle:hover {
  text-decoration: underline;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #6b7280;
}

.btn-icon:hover {
  background: #f0fdfa;
  color: #0d9488;
}

/* 对比区域 */
.compare-section {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.08);
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .compare-grid {
    grid-template-columns: 1fr;
  }
}

.list-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.card-count {
  background: #0d9488;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.source-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.radio-label input {
  accent-color: #0d9488;
}

.upload-box :deep(.el-upload-dragger) {
  background: #ffffff;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 30px;
}

.upload-icon {
  font-size: 32px;
  color: #0d9488;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #6b7280;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #ffffff;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
}

.remove-icon {
  margin-left: auto;
  cursor: pointer;
  color: #9ca3af;
}

.remove-icon:hover {
  color: #ef4444;
}

.info-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #dcfce7;
  border-radius: 8px;
  font-size: 13px;
  color: #16a34a;
}

.upload-tip {
  font-size: 12px;
  color: #9ca3af;
}

.action-bar {
  display: flex;
  justify-content: center;
}

/* 结果区域 */
.result-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.stat-success .stat-value {
  color: #16a34a;
}

.stat-danger .stat-value {
  color: #dc2626;
}

.stat-warning .stat-value {
  color: #d97706;
}

.result-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-success {
  background: #16a34a;
}

.dot-danger {
  background: #dc2626;
}

.dot-warning {
  background: #d97706;
}

.result-desc {
  font-size: 13px;
  color: #9ca3af;
}

.result-table {
  overflow-x: auto;
}

.result-table table {
  width: 100%;
  border-collapse: collapse;
}

.result-table th,
.result-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.result-table th {
  background: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.result-table td {
  font-size: 14px;
  color: #374151;
}

.result-table tr:hover td {
  background: #f0fdfa;
}
</style>
