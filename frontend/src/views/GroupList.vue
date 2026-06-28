<template>
  <div class="group-list">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <div class="search-input">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索团名..."
          class="input-field"
        >
      </div>
      <div class="action-buttons">
        <button class="btn btn-secondary" @click="showMergeDialog = true" :disabled="selectedGroupNames.length === 0">
          <el-icon><FolderAdd /></el-icon>
          合并 ({{ selectedGroupNames.length }})
        </button>
        <button class="btn btn-primary" @click="showImportDialog = true">
          <el-icon><Upload /></el-icon>
          导入 Excel
        </button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon stat-icon-primary">
          <el-icon><Folder /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ categories.length }}</span>
          <span class="stat-label">分类数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-success">
          <el-icon><List /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ groupedGroups.length }}</span>
          <span class="stat-label">旅游团</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-info">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ todayTrips }}</span>
          <span class="stat-label">今日出发</span>
        </div>
      </div>
    </div>

    <!-- 分类区域 -->
    <template v-if="!currentCategory && categories.length > 0">
      <div class="section-header">
        <h3 class="section-title">
          <el-icon><Folder /></el-icon>
          分类管理
        </h3>
      </div>
      <div class="category-grid">
        <div
          v-for="category in categories"
          :key="category"
          class="category-card"
          @click="selectCategory(category)"
        >
          <div class="category-header">
            <el-icon class="category-icon"><Folder /></el-icon>
            <button class="delete-btn" @click.stop="deleteCategory(category)">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
          <div class="category-body">
            <span class="category-name">{{ category }}</span>
            <span class="category-count">{{ getCategoryGroupCount(category) }} 个团</span>
          </div>
        </div>
      </div>
      <div class="section-divider">
        <span>未分类的团</span>
      </div>
    </template>

    <!-- 返回按钮 -->
    <template v-if="currentCategory">
      <div class="breadcrumb">
        <button class="back-btn" @click="currentCategory = ''">
          <el-icon><ArrowLeft /></el-icon>
          返回全部
        </button>
        <span class="current-category">{{ currentCategory }}</span>
      </div>
    </template>

    <!-- 加载状态 -->
    <div v-loading="loading" class="loading-container"></div>

    <!-- 空状态 -->
    <div v-if="!loading && displayGroups.length === 0" class="empty-state">
      <el-icon :size="64"><FolderOpened /></el-icon>
      <p>暂无旅游团</p>
      <p class="empty-tip">点击上方"导入 Excel"按钮添加数据</p>
    </div>

    <!-- 团列表 -->
    <div v-for="groupItem in displayGroups" :key="groupItem.groupName" class="group-section">
      <div class="group-header">
        <label class="checkbox-label">
          <input type="checkbox" :value="groupItem.groupName" v-model="selectedGroupNames">
          <span class="checkmark"></span>
          <h3 class="group-name">{{ groupItem.groupName }}</h3>
        </label>
        <span class="trip-count">{{ groupItem.trips.length }} 个行程</span>
      </div>

      <div class="trip-grid">
        <div
          v-for="trip in groupItem.trips"
          :key="trip.id"
          class="trip-card"
          @click="goDetail(trip.groupName)"
        >
          <div class="trip-top">
            <span class="trip-type" :class="trip.tripType === '去程' ? 'type-go' : 'type-back'">
              {{ trip.tripType }}
            </span>
            <button class="delete-btn" @click.stop="deleteTrip(trip.id)">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
          <div class="trip-info">
            <div class="info-item">
              <el-icon><Van /></el-icon>
              <span>{{ trip.trainNo }}</span>
            </div>
            <div class="info-item">
              <el-icon><Location /></el-icon>
              <span>{{ trip.route }}</span>
            </div>
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ trip.departDate }}</span>
            </div>
            <div class="info-item">
              <el-icon><User /></el-icon>
              <span>{{ trip._count?.members || 0 }} 人</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 合并对话框 -->
    <el-dialog v-model="showMergeDialog" title="合并团" width="420px" class="soft-dialog">
      <div class="dialog-section">
        <label class="dialog-label">分类名称</label>
        <input type="text" v-model="mergeCategory" placeholder="如：2026年春季度" class="dialog-input">
      </div>
      <div class="dialog-section">
        <p class="dialog-tip">将合并以下团：</p>
        <div class="tag-list">
          <span v-for="name in selectedGroupNames" :key="name" class="tag">{{ name }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showMergeDialog = false">取消</button>
        <button class="btn btn-primary" @click="handleMerge">确认合并</button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="showImportDialog" title="导入 Excel 创建旅游团" width="500px" class="soft-dialog">
      <div class="template-link" @click="downloadTemplate">
        <el-icon><Download /></el-icon>
        <span>下载导入模板</span>
      </div>

      <div class="dialog-section">
        <label class="dialog-label">团名 <span class="required">*</span></label>
        <input type="text" v-model="importForm.groupName" placeholder="输入旅游团名称" class="dialog-input">
      </div>

      <div class="dialog-section">
        <label class="dialog-label">行程类型</label>
        <div class="trip-type-switch">
          <div
            class="type-btn"
            :class="{ active: importForm.tripType === '去程' }"
            @click="importForm.tripType = '去程'"
          >
            <span class="type-icon">🚀</span>
            <span class="type-text">去程</span>
          </div>
          <div
            class="type-btn"
            :class="{ active: importForm.tripType === '返程' }"
            @click="importForm.tripType = '返程'"
          >
            <span class="type-icon">🏠</span>
            <span class="type-text">返程</span>
          </div>
        </div>
      </div>

      <el-upload
        drag
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleFileChange"
        class="upload-area"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-text">将 Excel 文件拖到此处，或<em>点击上传</em></div>
        <div class="upload-tip">系统将自动识别车次、行程、日期、票价和人员信息</div>
      </el-upload>

      <template #footer>
        <button class="btn btn-secondary" @click="showImportDialog = false">取消</button>
        <button class="btn btn-primary" @click="handleImport" :disabled="importing">
          {{ importing ? '导入中...' : '导入' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Upload, Download, UploadFilled, FolderAdd, Folder, ArrowLeft, Delete,
  List, User, Calendar, Location, Van, FolderOpened
} from '@element-plus/icons-vue'
import { groupApi, memberApi } from '../api'

const router = useRouter()
const groups = ref([])
const loading = ref(false)
const showImportDialog = ref(false)
const showMergeDialog = ref(false)
const selectedFile = ref(null)
const importing = ref(false)
const searchKeyword = ref('')
const selectedGroupNames = ref([])
const mergeCategory = ref('')
const currentCategory = ref('')

const importForm = reactive({
  groupName: '',
  tripType: '去程'
})

// 统计数据
const totalMembers = computed(() => {
  return groups.value.reduce((sum, g) => sum + (g._count?.members || 0), 0)
})

const todayTrips = computed(() => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/')
  return groups.value.filter(g => g.departDate === today).length
})

// 获取所有分类
const categories = computed(() => {
  const cats = new Set()
  for (const g of groups.value) {
    if (g.category) {
      cats.add(g.category)
    }
  }
  return Array.from(cats)
})

// 按团名分组
const groupedGroups = computed(() => {
  const grouped = {}
  for (const trip of groups.value) {
    if (currentCategory.value && trip.category !== currentCategory.value) {
      continue
    }
    if (!currentCategory.value && trip.category) {
      continue
    }
    const name = trip.groupName
    if (!grouped[name]) {
      grouped[name] = { groupName: name, trips: [] }
    }
    grouped[name].trips.push(trip)
  }
  return Object.values(grouped)
})

// 搜索过滤
const displayGroups = computed(() => {
  if (!searchKeyword.value.trim()) {
    return groupedGroups.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return groupedGroups.value.filter(group =>
    group.groupName.toLowerCase().includes(keyword)
  )
})

const getCategoryGroupCount = (category) => {
  const groupNames = new Set()
  for (const g of groups.value) {
    if (g.category === category) {
      groupNames.add(g.groupName)
    }
  }
  return groupNames.size
}

const selectCategory = (category) => {
  currentCategory.value = category
}

const loadGroups = async () => {
  loading.value = true
  try {
    const { data } = await groupApi.getList()
    groups.value = data || []
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载旅游团列表失败')
    groups.value = []
  } finally {
    loading.value = false
  }
}

const goDetail = (groupName) => {
  router.push(`/group/${encodeURIComponent(groupName)}`)
}

const deleteTrip = async (id) => {
  await ElMessageBox.confirm('确定删除该行程？', '提示', { type: 'warning' })
  await groupApi.delete(id)
  ElMessage.success('删除成功')
  loadGroups()
}

const handleFileChange = (file) => {
  selectedFile.value = file.raw
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

const handleImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择 Excel 文件')
    return
  }
  if (!importForm.groupName) {
    ElMessage.warning('请输入团名')
    return
  }

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('groupName', importForm.groupName)
    formData.append('tripType', importForm.tripType)

    const { data } = await groupApi.importWithMembers(formData)
    ElMessage.success(`导入成功！${data.tripType || '去程'} 共 ${data.memberCount} 人`)

    showImportDialog.value = false
    selectedFile.value = null
    importForm.groupName = ''
    importForm.tripType = '去程'

    loadGroups()

    if (data.groupName) {
      router.push(`/group/${encodeURIComponent(data.groupName)}`)
    }
  } catch (error) {
    ElMessage.error('导入失败：' + (error.response?.data?.error || error.message))
  } finally {
    importing.value = false
  }
}

const handleMerge = async () => {
  if (!mergeCategory.value.trim()) {
    ElMessage.warning('请填写分类名称')
    return
  }
  if (selectedGroupNames.value.length === 0) {
    ElMessage.warning('请选择要合并的团')
    return
  }

  try {
    await groupApi.merge({
      category: mergeCategory.value,
      groupNames: selectedGroupNames.value
    })
    ElMessage.success('合并成功')
    showMergeDialog.value = false
    mergeCategory.value = ''
    selectedGroupNames.value = []
    loadGroups()
  } catch (error) {
    ElMessage.error('合并失败：' + (error.response?.data?.error || error.message))
  }
}

const deleteCategory = async (category) => {
  await ElMessageBox.confirm(`确定删除分类"${category}"？团将变为未分类状态。`, '提示', { type: 'warning' })
  try {
    await groupApi.deleteCategory(category)
    ElMessage.success('删除成功')
    loadGroups()
  } catch (error) {
    ElMessage.error('删除失败：' + (error.response?.data?.error || error.message))
  }
}

onMounted(loadGroups)
</script>

<style scoped>
.group-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #374151;
}

/* 搜索栏 */
.search-bar {
  background: #ffffff;
  border-radius: 20px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.search-input {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.input-field {
  width: 100%;
  padding: 10px 14px 10px 40px;
  background: #f0fdfa;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  color: #374151;
  outline: none;
}

.input-field:focus {
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

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
  background: #f0fdfa;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #e0f2fe;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.08);
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-icon-primary { background: #ccfbf1; color: #0d9488; }
.stat-icon-success { background: #dcfce7; color: #16a34a; }
.stat-icon-warning { background: #fef3c7; color: #d97706; }
.stat-icon-info { background: #e0f2fe; color: #0284c7; }

.stat-info { display: flex; flex-direction: column; min-width: 0; }
.stat-value { font-size: 24px; font-weight: 700; color: #374151; line-height: 1.2; }
.stat-label { font-size: 12px; color: #6b7280; white-space: nowrap; }

/* 分类区域 */
.section-header { display: flex; align-items: center; gap: 8px; }
.section-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #374151; }

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}

.category-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.08);
  cursor: pointer;
  transition: all 0.2s;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(13, 148, 136, 0.12);
}

.category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.category-icon { font-size: 22px; color: #f59e0b; }

.delete-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.delete-btn:hover { background: #fee2e2; color: #ef4444; }

.category-body { display: flex; flex-direction: column; gap: 4px; }
.category-name { font-size: 14px; font-weight: 600; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.category-count { font-size: 12px; color: #6b7280; }

.section-divider { display: flex; align-items: center; gap: 12px; color: #6b7280; font-size: 13px; }
.section-divider::before, .section-divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }

/* 面包屑 */
.breadcrumb { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  color: #0d9488;
  cursor: pointer;
}

.back-btn:hover { background: #f0fdfa; }
.current-category { font-size: 15px; font-weight: 600; color: #0d9488; }

/* 空状态 */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: #9ca3af; }
.empty-state p { margin-top: 14px; font-size: 15px; }
.empty-tip { font-size: 13px !important; color: #d1d5db; }

/* 团列表 */
.group-section { display: flex; flex-direction: column; gap: 12px; }
.group-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.checkbox-label input { display: none; }
.checkmark { width: 18px; height: 18px; border: 2px solid #d1d5db; border-radius: 5px; transition: all 0.2s; flex-shrink: 0; }
.checkbox-label input:checked + .checkmark { background: #0d9488; border-color: #0d9488; }

.group-name { font-size: 15px; font-weight: 600; color: #374151; }
.trip-count { padding: 3px 10px; background: #f0fdfa; border-radius: 6px; font-size: 12px; color: #6b7280; }

.trip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }

.trip-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.08);
  cursor: pointer;
  transition: all 0.2s;
}

.trip-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(13, 148, 136, 0.12); }

.trip-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.trip-type { padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.type-go { background: #dbeafe; color: #2563eb; }
.type-back { background: #dcfce7; color: #16a34a; }

.trip-info { display: flex; flex-direction: column; gap: 8px; }
.info-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6b7280; }
.info-item .el-icon { color: #0d9488; flex-shrink: 0; }

/* 对话框 */
.dialog-section { margin-bottom: 16px; }
.dialog-label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px; }
.required { color: #ef4444; }
.dialog-input { width: 100%; padding: 10px 14px; background: #f0fdfa; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 14px; color: #374151; outline: none; }
.dialog-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1); }
.dialog-tip { font-size: 13px; color: #6b7280; margin-bottom: 10px; }
.tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { padding: 5px 12px; background: #f0fdfa; border-radius: 6px; font-size: 12px; color: #374151; }

.template-link { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; color: #0d9488; font-size: 13px; cursor: pointer; margin-bottom: 16px; border-radius: 8px; }
.template-link:hover { background: #f0fdfa; }

/* 行程类型切换按钮 */
.trip-type-switch {
  display: flex;
  gap: 12px;
}

.type-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.type-btn:hover {
  background: #f0fdfa;
  border-color: #99f6e4;
}

.type-btn.active {
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
  border-color: #0d9488;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15);
}

.type-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.type-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.type-btn.active .type-text {
  color: #0d9488;
  font-weight: 600;
}

.upload-area :deep(.el-upload-dragger) { background: #f0fdfa; border: 2px dashed #d1d5db; border-radius: 12px; padding: 30px; }
.upload-icon { font-size: 40px; color: #0d9488; margin-bottom: 12px; }
.upload-text { font-size: 13px; color: #6b7280; }
.upload-text em { color: #0d9488; font-style: normal; }
.upload-tip { font-size: 12px; color: #9ca3af; margin-top: 6px; }

/* 响应式 */
@media (max-width: 1199px) { .stats-row { grid-template-columns: repeat(3, 1fr); } }

@media (max-width: 640px) {
  .search-bar { flex-direction: column; align-items: stretch; gap: 12px; }
  .search-input { max-width: none; }
  .action-buttons { justify-content: center; }
  .btn { flex: 1; justify-content: center; min-width: 120px; }
  .stats-row { grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .stat-card { padding: 14px; gap: 10px; }
  .stat-icon { width: 40px; height: 40px; font-size: 18px; }
  .stat-value { font-size: 20px; }
  .category-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .category-card { padding: 12px; }
  .trip-grid { grid-template-columns: 1fr; gap: 10px; }
  .trip-card { padding: 14px; }
}

@media (max-width: 400px) {
  .stats-row { grid-template-columns: 1fr; }
  .stat-card { padding: 12px; }
  .category-grid { grid-template-columns: 1fr; }
  .action-buttons { flex-direction: column; }
  .btn { width: 100%; }
}
</style>
