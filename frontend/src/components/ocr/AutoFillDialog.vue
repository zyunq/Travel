<template>
  <el-dialog v-model="visible" title="智能补全" width="800px" @close="handleClose">
    <div class="autofill-section">
      <div class="autofill-upload">
        <div class="upload-label">上传完整名单表（Excel）</div>
        <el-upload
          drag
          :auto-upload="false"
          accept=".xlsx,.xls"
          :on-change="handleAutoFillFile"
          :show-file-list="false"
        >
          <el-icon class="upload-icon"><Upload /></el-icon>
          <div class="upload-text">拖拽或点击上传</div>
          <div class="upload-tip">需包含：姓名、证件号、性别、出生日期</div>
        </el-upload>
        <div v-if="autoFillFile" class="selected-file">
          <el-icon><Document /></el-icon>
          <span>{{ autoFillFile.name }}</span>
          <span class="file-count">{{ autoFillData.length }} 人</span>
        </div>
      </div>

      <!-- 匹配结果预览 -->
      <div v-if="autoFillPreview" class="autofill-preview">
        <div class="preview-header">
          <h4>匹配结果预览</h4>
        </div>
        <div class="preview-stats">
          <div class="stat-item stat-success">
            <span class="stat-num">{{ autoFillPreview.matched.filter(m => m.hasDiff).length }}</span>
            <span class="stat-label">可补全</span>
          </div>
          <div class="stat-item stat-info">
            <span class="stat-num">{{ autoFillPreview.matched.filter(m => !m.hasDiff).length }}</span>
            <span class="stat-label">已完整</span>
          </div>
          <div class="stat-item stat-warning">
            <span class="stat-num">{{ autoFillPreview.uncertain.length }}</span>
            <span class="stat-label">需确认</span>
          </div>
          <div class="stat-item stat-danger">
            <span class="stat-num">{{ autoFillPreview.unmatched.length }}</span>
            <span class="stat-label">无法匹配</span>
          </div>
        </div>

        <!-- 匹配设置 -->
        <div class="autofill-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="matchOptions.fuzzyMatch" @change="doMatch" />
            <span>允许模糊匹配姓名（拼音/相似度）</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="matchOptions.overwrite" @change="doMatch" />
            <span>补全时覆盖已有数据</span>
          </label>
        </div>

        <!-- 详情预览 -->
        <div class="preview-details">
          <!-- 自动匹配 -->
          <div v-if="autoFillPreview.matched && autoFillPreview.matched.length > 0" class="detail-section">
            <div class="detail-header" @click="toggleSection('matched')">
              <span class="detail-title">
                <span class="dot dot-success"></span>
                自动匹配（{{ autoFillPreview.matched.length }} 人）
              </span>
              <span class="detail-toggle">{{ expandedSections.matched ? '收起' : '展开' }}</span>
            </div>
            <div v-show="expandedSections.matched" class="detail-content">
              <div v-for="(item, index) in autoFillPreview.matched.slice(0, 10)" :key="index" class="match-item">
                <div class="match-name">
                  {{ item.name || '(无名)' }}
                  <span v-if="!item.hasDiff" class="no-diff-tag">已完整</span>
                </div>
                <div v-if="item.hasDiff" class="match-diff">
                  <template v-for="(diff, key) in item.diff" :key="key">
                    <span v-if="diff && diff.new" class="diff-item">
                      {{ getFieldLabel(key) }}:
                      <span class="diff-old">{{ diff.old || '空' }}</span>
                      →
                      <span class="diff-new">{{ diff.new }}</span>
                    </span>
                  </template>
                </div>
              </div>
              <div v-if="autoFillPreview.matched.length > 10" class="more-tip">
                还有 {{ autoFillPreview.matched.length - 10 }} 人...
              </div>
            </div>
          </div>

          <!-- 需确认 -->
          <div v-if="autoFillPreview.uncertain && autoFillPreview.uncertain.length > 0" class="detail-section">
            <div class="detail-header" @click="toggleSection('uncertain')">
              <span class="detail-title">
                <span class="dot dot-warning"></span>
                需确认（{{ autoFillPreview.uncertain.length }} 人）
              </span>
              <span class="detail-toggle">{{ expandedSections.uncertain ? '收起' : '展开' }}</span>
            </div>
            <div v-show="expandedSections.uncertain" class="detail-content">
              <div v-for="(item, index) in autoFillPreview.uncertain" :key="index" class="match-item uncertain-item">
                <div class="uncertain-match">
                  <span class="match-label">识别：</span>
                  <span class="match-value">{{ item.recognized.name }} ({{ item.recognized.id_number || '无证件号' }})</span>
                </div>
                <div class="uncertain-match">
                  <span class="match-label">参考：</span>
                  <span class="match-value">{{ item.reference.name }} ({{ item.reference.id_number }})</span>
                </div>
                <div class="uncertain-reason">{{ item.matchType }}</div>
                <div class="uncertain-actions">
                  <button class="btn btn-sm btn-primary" @click="confirmUncertain(index, true)">确认匹配</button>
                  <button class="btn btn-sm btn-secondary" @click="confirmUncertain(index, false)">跳过</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 无法匹配 -->
          <div v-if="autoFillPreview.unmatched && autoFillPreview.unmatched.length > 0" class="detail-section">
            <div class="detail-header" @click="toggleSection('unmatched')">
              <span class="detail-title">
                <span class="dot dot-danger"></span>
                无法匹配（{{ autoFillPreview.unmatched.length }} 人）
              </span>
              <span class="detail-toggle">{{ expandedSections.unmatched ? '收起' : '展开' }}</span>
            </div>
            <div v-show="expandedSections.unmatched" class="detail-content">
              <div v-for="(item, index) in autoFillPreview.unmatched.slice(0, 10)" :key="index" class="unmatched-item">
                {{ item.name || '(无名)' }} - {{ item.id_number || '无证件号' }}
              </div>
              <div v-if="autoFillPreview.unmatched.length > 10" class="more-tip">
                还有 {{ autoFillPreview.unmatched.length - 10 }} 人...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <button class="btn btn-secondary" @click="handleClose">取消</button>
      <button
        class="btn btn-primary"
        @click="executeAutoFill"
        :disabled="!autoFillPreview || (autoFillPreview.matched.length === 0 && autoFillPreview.uncertain.length === 0)"
      >
        执行补全
      </button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Document } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { cleanStr, isNameSimilar, calculateDiff, findFieldValue } from '@/utils/match'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  savedResults: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const autoFillFile = ref(null)
const autoFillData = ref([])
const autoFillPreview = ref(null)
const matchOptions = reactive({
  fuzzyMatch: true,
  overwrite: false
})
const expandedSections = reactive({
  matched: true,
  uncertain: true,
  unmatched: false
})

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

// 处理上传
const handleAutoFillFile = async (file) => {
  autoFillFile.value = file.raw
  try {
    const data = await parseExcel(file.raw)

    const cleanStrLocal = (s) => {
      if (!s) return ''
      return String(s).replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '').trim()
    }

    autoFillData.value = data.map(row => ({
      name: cleanStrLocal(row['姓名'] || row['name'] || ''),
      id_number: cleanStrLocal(row['证件号码'] || row['证件号'] || row['身份证号'] || row['id_number'] || '').toUpperCase(),
      gender: cleanStrLocal(row['性别'] || row['gender'] || ''),
      birth_date: cleanStrLocal(row['出生日期'] || row['出生'] || row['birth_date'] || ''),
      nation: cleanStrLocal(row['民族'] || '')
    })).filter(p => p.name || p.id_number)

    ElMessage.success(`成功加载 ${autoFillData.value.length} 条参考数据`)
    doMatch()
  } catch (err) {
    ElMessage.error('文件解析失败')
  }
}

// 执行匹配
const doMatch = () => {
  const matched = []
  const uncertain = []
  const unmatched = []
  const usedRef = new Set()

  for (const recognized of props.savedResults) {
    let bestMatch = null
    let matchType = ''

    const recName = cleanStr(recognized.name)
    const recIdNumber = cleanStr(recognized.id_number)

    // 1. 证件号匹配
    if (recIdNumber) {
      for (let i = 0; i < autoFillData.value.length; i++) {
        if (usedRef.has(i)) continue
        const ref = autoFillData.value[i]
        if (ref.id_number && ref.id_number === recIdNumber) {
          bestMatch = { ref, index: i }
          matchType = '证件号匹配'
          break
        }
      }
    }

    // 2. 姓名匹配
    if (!bestMatch && recName) {
      for (let i = 0; i < autoFillData.value.length; i++) {
        if (usedRef.has(i)) continue
        const ref = autoFillData.value[i]
        if (ref.name && ref.name === recName) {
          bestMatch = { ref, index: i }
          matchType = '姓名匹配'
          break
        }
      }
    }

    // 3. 模糊匹配
    if (!bestMatch && matchOptions.fuzzyMatch && recName) {
      for (let i = 0; i < autoFillData.value.length; i++) {
        if (usedRef.has(i)) continue
        const ref = autoFillData.value[i]
        if (ref.name && isNameSimilar(recName, ref.name)) {
          bestMatch = { ref, index: i }
          matchType = '姓名相似（需确认）'
          break
        }
      }
    }

    // 处理结果
    if (bestMatch) {
      const diff = calculateDiff(recognized, bestMatch.ref, matchOptions.overwrite)
      const hasDiff = Object.keys(diff).length > 0

      if (matchType.includes('需确认')) {
        uncertain.push({
          recognized,
          reference: bestMatch.ref,
          refIndex: bestMatch.index,
          matchType,
          diff,
          hasDiff,
          name: recName || bestMatch.ref.name
        })
      } else {
        matched.push({
          recognized,
          reference: bestMatch.ref,
          refIndex: bestMatch.index,
          matchType,
          diff,
          hasDiff,
          name: recName || bestMatch.ref.name
        })
        usedRef.add(bestMatch.index)
      }
    } else {
      unmatched.push(recognized)
    }
  }

  autoFillPreview.value = { matched, uncertain, unmatched }
}

// 确认/跳过不确定的匹配
const confirmUncertain = (index, confirm) => {
  const item = autoFillPreview.value.uncertain[index]
  if (confirm) {
    autoFillPreview.value.matched.push({
      ...item,
      name: item.recognized.name || item.reference.name
    })
    autoFillPreview.value.uncertain.splice(index, 1)
  } else {
    autoFillPreview.value.unmatched.push(item.recognized)
    autoFillPreview.value.uncertain.splice(index, 1)
  }
}

// 切换展开
const toggleSection = (section) => {
  expandedSections[section] = !expandedSections[section]
}

// 获取字段标签
const getFieldLabel = (field) => {
  const map = {
    'name': '姓名',
    'id_number': '证件号',
    'gender': '性别',
    'birth_date': '出生日期',
    'nation': '民族'
  }
  return map[field] || field
}

// 关闭
const handleClose = () => {
  visible.value = false
  autoFillFile.value = null
  autoFillData.value = []
  autoFillPreview.value = null
}

// 执行补全
const executeAutoFill = () => {
  if (!autoFillPreview.value) return

  let filledCount = 0
  const results = []

  for (const item of autoFillPreview.value.matched) {
    const updated = { ...item.recognized }
    for (const [field, diff] of Object.entries(item.diff)) {
      if (diff.new) {
        updated[field] = diff.new
        filledCount++
      }
    }
    results.push(updated)
  }

  emit('confirm', { results, filledCount })
  handleClose()
  ElMessage.success(`补全完成，共填充 ${filledCount} 个字段`)
}
</script>

<style scoped>
.autofill-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.autofill-upload {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
}

.upload-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 12px;
}

.autofill-upload :deep(.el-upload-dragger) {
  background: #ffffff;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 24px;
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

.upload-tip {
  font-size: 12px;
  color: #9ca3af;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #ffffff;
  border-radius: 8px;
  margin-top: 12px;
  font-size: 14px;
  color: #374151;
}

.file-count {
  margin-left: auto;
  background: #dcfce7;
  color: #16a34a;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.autofill-preview {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.preview-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.preview-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: #f8fafc;
  border-radius: 10px;
  min-width: 80px;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.stat-item.stat-success .stat-num { color: #16a34a; }
.stat-item.stat-info .stat-num { color: #0d9488; }
.stat-item.stat-warning .stat-num { color: #d97706; }
.stat-item.stat-danger .stat-num { color: #dc2626; }

.autofill-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.checkbox-label input {
  accent-color: #0d9488;
}

.preview-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.detail-section {
  background: #f8fafc;
  border-radius: 10px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 10px 10px 0 0;
}

.detail-header:hover {
  background: #f0fdfa;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.detail-toggle {
  font-size: 12px;
  color: #0d9488;
}

.detail-content {
  padding: 12px 16px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-success { background: #16a34a; }
.dot-danger { background: #dc2626; }
.dot-warning { background: #d97706; }

.match-item {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.match-item:last-child {
  border-bottom: none;
}

.match-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-diff-tag {
  font-size: 11px;
  font-weight: normal;
  background: #e0f2fe;
  color: #0284c7;
  padding: 2px 6px;
  border-radius: 4px;
}

.match-diff {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
}

.diff-item { color: #6b7280; }
.diff-old { color: #9ca3af; text-decoration: line-through; }
.diff-new { color: #16a34a; font-weight: 500; }

.uncertain-item {
  padding: 12px;
  background: #ffffff;
  border-radius: 8px;
  margin-bottom: 8px;
}

.uncertain-match {
  font-size: 13px;
  color: #374151;
  margin-bottom: 4px;
}

.match-label { color: #6b7280; }
.match-value { font-weight: 500; }
.uncertain-reason { font-size: 12px; color: #d97706; margin: 8px 0; }

.uncertain-actions {
  display: flex;
  gap: 8px;
}

.unmatched-item {
  padding: 8px 0;
  font-size: 13px;
  color: #6b7280;
}

.more-tip {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  padding: 8px 0;
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

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

:deep(.el-dialog) {
  border-radius: 16px;
}
</style>
