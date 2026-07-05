<template>
  <div v-if="results.length > 0" class="results-section">
    <div class="section-header">
      <h3 class="section-title">已识别数据（{{ results.length }} 条）</h3>
      <div class="filter-bar">
        <select v-model="filterType" class="filter-select">
          <option value="">全部类型</option>
          <option value="id_card">身份证</option>
          <option value="hk_macao_pass">港澳通行证</option>
          <option value="passport">护照</option>
        </select>
        <button class="btn btn-sm btn-danger" @click="$emit('deleteSelected')" :disabled="selectedItems.length === 0">
          删除选中 ({{ selectedItems.length }})
        </button>
      </div>
    </div>

    <div class="results-table">
      <table>
        <thead>
          <tr>
            <th>
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
            </th>
            <th>序号</th>
            <th>姓名</th>
            <th>证件类型</th>
            <th>证件号码</th>
            <th>性别</th>
            <th>出生日期</th>
            <th>来源文件</th>
            <th>识别时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in filteredResults" :key="item.id">
            <td>
              <input type="checkbox" :value="item.id" v-model="selectedItems" />
            </td>
            <td>{{ index + 1 }}</td>
            <td>{{ item.name || '-' }}</td>
            <td>
              <span class="type-tag" :class="item.doc_type">{{ getTypeName(item.doc_type) }}</span>
            </td>
            <td>{{ item.id_number || item.passport_number || '-' }}</td>
            <td>{{ item.gender || '-' }}</td>
            <td>{{ item.birth_date || '-' }}</td>
            <td class="source-file">{{ item.source_file || '-' }}</td>
            <td class="time-cell">{{ formatTime(item.created_at) }}</td>
            <td>
              <button class="btn-icon" @click="$emit('edit', item)">
                <el-icon><Edit /></el-icon>
              </button>
              <button class="btn-icon btn-danger" @click="$emit('delete', item.id)">
                <el-icon><Delete /></el-icon>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['edit', 'delete', 'deleteSelected'])

const filterType = ref('')
const selectedItems = ref([])
const selectAll = ref(false)

// 过滤后的结果
const filteredResults = computed(() => {
  let results = props.results
  if (filterType.value) {
    results = results.filter(r => r.doc_type === filterType.value)
  }
  return [...results].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedItems.value = filteredResults.value.map(r => r.id)
  } else {
    selectedItems.value = []
  }
}

// 监听选中项变化
watch(selectedItems, (val) => {
  selectAll.value = val.length === filteredResults.value.length && val.length > 0
})

// 获取类型名称
const getTypeName = (type) => {
  const map = {
    'id_card': '身份证',
    'hk_macao_pass': '港澳通行证',
    'passport': '护照'
  }
  return map[type] || type
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.results-section {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.08);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.filter-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-select {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  background: #ffffff;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #0d9488;
}

/* 表格 */
.results-table {
  overflow-x: auto;
}

.results-table table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.results-table th,
.results-table td {
  padding: 12px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.results-table th {
  background: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.results-table td {
  font-size: 14px;
  color: #374151;
}

.results-table tr:hover td {
  background: #f0fdfa;
}

.results-table input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.type-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.type-tag.id_card {
  background: #dbeafe;
  color: #2563eb;
}

.type-tag.hk_macao_pass {
  background: #dcfce7;
  color: #16a34a;
}

.type-tag.passport {
  background: #fef3c7;
  color: #d97706;
}

.source-file {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #6b7280;
}

.time-cell {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
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

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.btn-icon.btn-danger:hover {
  background: #fee2e2;
  color: #ef4444;
}

@media (max-width: 640px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
